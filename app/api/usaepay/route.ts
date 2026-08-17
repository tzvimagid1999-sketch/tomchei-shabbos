import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";

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
      // Send confirmation email if Resend is configured
      if (process.env.RESEND_API_KEY && email) {
        try {
          // Mask email for privacy
          const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, "$1***$3");

          const resend = new Resend(process.env.RESEND_API_KEY);
          const from = process.env.RESEND_FROM || "Tomchei Shabbos <onboarding@resend.dev>";
          const first = (firstName || "Friend").toString();
          await resend.emails.send({
            from,
            to: email,
            subject: "Thank you for your donation 💙",
            html: `
              <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#2F3A44">
                <h2 style="color:#0F9FAE;margin:0 0 8px">Thank you, ${first}!</h2>
                <p style="font-size:16px;line-height:1.6">
                  Your <strong>$${numericAmount.toFixed(2)}</strong> donation to Tomchei Shabbos of Florida is confirmed.
                  You're helping a family celebrate Shabbos with dignity.
                </p>
                <div style="background:#FAF3E8;border:1px solid #E8D9C0;border-radius:12px;padding:20px;margin:20px 0">
                  <p style="margin:0 0 6px;font-size:14px"><strong>Confirmation Number:</strong> ${data.refnum || data.authcode}</p>
                  <p style="margin:0 0 6px;font-size:14px"><strong>Amount:</strong> $${numericAmount.toFixed(2)}</p>
                  <p style="margin:0 0 6px;font-size:14px"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                  <p style="margin:0 0 6px;font-size:14px"><strong>Email:</strong> ${maskedEmail}</p>
                  <p style="margin:0;font-size:14px"><strong>Tax ID:</strong> ${process.env.NONPROFIT_TAX_ID}</p>
                </div>
                <div style="margin-top:20px;padding:15px;background-color:#fafafa;border-radius:5px;font-size:11px;color:#888">
                  <p style="margin:0 0 6px"><strong>Tax Deduction Information:</strong></p>
                  <p style="margin:0">
                    Tomchei Shabbos of Florida is a 501(c)(3) nonprofit organization (Tax ID: ${process.env.NONPROFIT_TAX_ID}).
                    Your donation of $${numericAmount.toFixed(2)} is tax deductible to the extent allowed by law. No goods or
                    services were provided in exchange for this contribution. Please consult your tax advisor regarding the
                    deductibility of your contribution.
                  </p>
                </div>
                <p style="font-size:13px;color:#8B7355;margin-top:20px">With gratitude,<br/>Tomchei Shabbos of Florida</p>
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
