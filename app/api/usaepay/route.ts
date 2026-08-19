import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendMail } from "../../lib/mailer";

// Charges a donation through the USAePay gateway using a payment token
// (payment_key) that was generated in the donor's browser by pay.js.
// The raw card number never reaches this server — only the token does.
export async function POST(req: NextRequest) {
  try {
    const sourceKey = process.env.NEXT_PUBLIC_USAEPAY_SOURCE_KEY?.trim();
    const pin = process.env.USAEPAY_PIN?.trim();
    const endpoint = process.env.USAEPAY_ENDPOINT || "https://usaepay.com/api/v2";

    if (!sourceKey || !pin) {
      return NextResponse.json(
        { error: "Payment is not configured yet. Please try again later." },
        { status: 500 }
      );
    }

    const { amount, paymentKey, firstName, lastName, email, street, city, state, zip, campaign } = await req.json();

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount < 1) {
      return NextResponse.json({ error: "Please enter a valid amount." }, { status: 400 });
    }
    if (!paymentKey) {
      return NextResponse.json({ error: "Missing card details." }, { status: 400 });
    }

    // Build the USAePay v2 auth hash: s2/<seed>/<sha256(sourceKey + seed + pin)>
    const seed = crypto.randomBytes(16).toString("hex");
    const prehash = sourceKey + seed + pin;
    const hash = crypto.createHash("sha256").update(prehash).digest("hex");
    const apiHash = `s2/${seed}/${hash}`;
    const authHeader =
      "Basic " + Buffer.from(`${sourceKey}:${apiHash}`).toString("base64");

    const res = await fetch(`${endpoint}/transactions`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        command: "cc:sale",
        amount: numericAmount.toFixed(2),
        payment_key: paymentKey,
        email: email || undefined,
        description: campaign === "rosh-hashanah"
          ? "Rosh Hashanah Campaign donation to Tomchei Shabbos of Florida"
          : "Donation to Tomchei Shabbos of Florida",
        billing_address: {
          firstname: firstName || undefined,
          lastname: lastName || undefined,
          street: street || undefined,
          city: city || undefined,
          state: state || undefined,
          postalcode: zip || undefined,
          country: "US",
        },
      }),
    });

    const data = await res.json();

    if (data.result === "Approved" || data.result_code === "A") {
      // Send confirmation email if Gmail SMTP is configured
      if (process.env.GMAIL_APP_PASSWORD && email) {
        try {
          // Mask email for privacy
          const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, "$1***$3");

          const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Friend";
          await sendMail({
            to: email,
            subject: "Thank you for your generous donation!",
            html: `
              <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#2F3A44">
                <p style="font-size:16px;line-height:1.7">
                  Dear ${fullName},<br/><br/>
                  Thank you for your generous donation of <strong>$${numericAmount.toFixed(2)}</strong> to Tomchei Shabbos of Florida.
                  Your support means a great deal to us. Contributions like yours make it possible for Tomchei Shabbos of Florida
                  to continue its mission. We are deeply grateful for your commitment.
                </p>
                <div style="background:#FAF3E8;border:1px solid #E8D9C0;border-radius:12px;padding:20px;margin:20px 0">
                  <p style="margin:0 0 6px;font-size:14px"><strong>Confirmation Number:</strong> ${data.refnum || data.authcode}</p>
                  <p style="margin:0 0 6px;font-size:14px"><strong>Amount:</strong> $${numericAmount.toFixed(2)}</p>
                  <p style="margin:0 0 6px;font-size:14px"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                  <p style="margin:0 0 6px;font-size:14px"><strong>Email:</strong> ${maskedEmail}</p>
                  <p style="margin:0;font-size:14px"><strong>Tax ID:</strong> ${process.env.NONPROFIT_TAX_ID}</p>
                </div>
                <p style="font-size:16px;line-height:1.7">Warm regards,<br/>Tomchei Shabbos of Florida</p>
                <div style="margin-top:20px;padding:15px;background-color:#fafafa;border-radius:5px;font-size:11px;color:#888;text-align:center">
                  <p style="margin:0 0 8px">Tomchei Shabbos of Florida<br/>194 NE 186th Terrace, North Miami Beach, FL 33179</p>
                  <p style="margin:0">
                    Tomchei Shabbos of Florida is a tax-exempt organization under Section 501(c)(3) of the Internal Revenue Code.
                    Tax ID # ${process.env.NONPROFIT_TAX_ID}. No goods or services were provided in exchange for this contribution.
                    This receipt may serve as your official tax record. Please consult your tax advisor regarding the
                    deductibility of your donation.
                  </p>
                </div>
              </div>
            `,
          });
        } catch (emailError) {
          console.error("Failed to send confirmation email:", emailError);
          // Don't fail the payment if email fails
        }
      }

      return NextResponse.json({
        success: true,
        refnum: data.refnum,
        authcode: data.authcode,
      });
    }

    return NextResponse.json(
      { error: data.error || "Your card was declined. Please try another card." },
      { status: 402 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("USAePay error:", message);
    return NextResponse.json(
      { error: "Something went wrong processing your donation. Please try again." },
      { status: 500 }
    );
  }
}
