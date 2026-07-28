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

    const { amount, paymentKey, firstName, lastName, email, street, city, state, zip } = await req.json();

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
        description: "Donation to Tomchei Shabbos of Florida",
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
          // Mask email and address for privacy
          const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, "$1***$3");
          const maskedStreet = street ? street.substring(0, 3) + "***" : "***";
          const maskedCity = city ? city.substring(0, 2) + "***" : "***";
          const maskedZip = zip ? zip.substring(0, 2) + "***" : "***";

          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: "Tomchei Shabbos <donations@tomchei-shabbos.com>",
            to: email,
            subject: "Donation Confirmation - Tomchei Shabbos of Florida",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #C9A961;">Thank You for Your Donation!</h2>
                <p>Dear ${firstName},</p>
                <p>We have received your generous donation of <strong>$${(numericAmount / 100).toFixed(2)}</strong> to Tomchei Shabbos of Florida for our Rosh Hashanah campaign.</p>

                <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #C9A961; margin: 20px 0;">
                  <p><strong>Confirmation Number:</strong> ${data.refnum || data.authcode}</p>
                  <p><strong>Amount:</strong> $${(numericAmount / 100).toFixed(2)}</p>
                  <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                  <p><strong>Email:</strong> ${maskedEmail}</p>
                  <p><strong>Address:</strong> ${maskedStreet}, ${maskedCity}, ${state} ${maskedZip}</p>
                </div>

                <p>Your donation will help us ensure every family in our community has a meaningful Rosh Hashanah celebration.</p>

                <p>Thank you for your support and may you have a sweet and blessed new year!</p>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #888; background-color: #fafafa; padding: 15px; border-radius: 5px;">
                  <p><strong>Tax Deduction Information:</strong></p>
                  <p>Tomchei Shabbos of Florida is a 501(c)(3) nonprofit organization (Tax ID: ${process.env.NONPROFIT_TAX_ID}). Your donation of $${(numericAmount / 100).toFixed(2)} is tax deductible to the extent allowed by law. No goods or services were provided in exchange for this contribution. Please consult your tax advisor regarding the deductibility of your contribution.</p>
                </div>

                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
                  <p>Tomchei Shabbos of Florida<br/>
                  Serving our community with dignity and care</p>
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
