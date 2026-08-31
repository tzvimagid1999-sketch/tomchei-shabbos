import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendMail, sendHonoreeNotification, escapeHtml } from "../../lib/mailer";
import { wallTag } from "../../lib/donor-wall";

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

    const { amount, paymentKey, firstName, lastName, name, email, phone, street, city, state, zip, campaign, subCampaign, company, displayName, honoreeType, honoreeName, honoreeEmail } = await req.json();

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount < 1) {
      return NextResponse.json({ error: "Please enter a valid amount." }, { status: 400 });
    }
    if (!paymentKey) {
      return NextResponse.json({ error: "Missing card details." }, { status: 400 });
    }

    // The Donate page sends a single `name` field; the Rosh Hashanah page sends
    // firstName/lastName separately — support both.
    let resolvedFirst = firstName;
    let resolvedLast = lastName;
    if (!resolvedFirst && name) {
      const parts = String(name).trim().split(/\s+/);
      resolvedFirst = parts[0];
      resolvedLast = parts.slice(1).join(" ") || parts[0];
    }

    const dedication = honoreeType && honoreeName
      ? ` (${honoreeType === "memory" ? "In Memory of" : "In Honor of"} ${escapeHtml(honoreeName)})`
      : "";

    // Build the USAePay v2 auth hash: s2/<seed>/<sha256(sourceKey + seed + pin)>
    const seed = crypto.randomBytes(16).toString("hex");
    const prehash = sourceKey + seed + pin;
    const hash = crypto.createHash("sha256").update(prehash).digest("hex");
    const apiHash = `s2/${seed}/${hash}`;
    const authHeader =
      "Basic " + Buffer.from(`${sourceKey}:${apiHash}`).toString("base64");

    const donorName = [resolvedFirst, resolvedLast].filter(Boolean).join(" ");
    const billing = {
      firstname: resolvedFirst || undefined,
      lastname: resolvedLast || undefined,
      street: street || undefined,
      city: city || undefined,
      state: state || undefined,
      postalcode: zip || undefined,
      phone: phone || undefined,
      company: company || undefined,
      country: "US",
    };

    // One-time donations deliberately do NOT create or link a customer record.
    //
    // Per USAePay support (Ben, 2026-08-24): when a sale carries a custkey, the
    // Sales by Date report's Customer column renders the linked customer profile
    // and IGNORES the cardholder field entirely. The profiles we were creating
    // came back with only `company` populated — first/last were empty — so that
    // column showed nothing.
    //
    // Dropping custkey lets `cardholder` populate the column instead, and stops
    // this route from creating a customer profile for every single donation.
    // Less donor data stored, and one less call in the charge path.
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
        // Populates the Customer column on the Sales by Date report. pay.js
        // never captures a cardholder name (its form is only number/expiry/CVV),
        // so we supply it here. Only honoured because no custkey is sent.
        ...(donorName ? { creditcard: { cardholder: donorName } } : {}),
        email: email || undefined,
        customerid: donorName || undefined,
        // Name also leads the description, so it shows in exports and detail
        // views regardless of which report is used.
        // subCampaign adds a machine-readable tag so a campaign page can total
        // its own donations. The Rosh Hashanah wording the main bar counts is
        // unchanged, so a tagged donation still lands on that bar too.
        description:
          donorName +
          " - " +
          (subCampaign ? `[${subCampaign}] ` : "") +
          // Present only when the donor asked to be named publicly.
          wallTag(displayName) +
          (campaign === "rosh-hashanah"
            ? "Rosh Hashanah Campaign donation to Tomchei Shabbos of Florida"
            : "Donation to Tomchei Shabbos of Florida") +
          dedication,
        billing_address: billing,
      }),
    });

    const data = await res.json();

    if (data.result === "Approved" || data.result_code === "A") {
      // Send confirmation email if Gmail SMTP is configured
      if (process.env.GMAIL_APP_PASSWORD && email) {
        try {
          const fullName = [resolvedFirst, resolvedLast].filter(Boolean).join(" ") || "Friend";
          const donationDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
          await sendMail({
            to: email,
            subject: "Your donation receipt",
            html: `
              <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#2F3A44">
                <p style="font-size:16px;line-height:1.7">
                  Dear ${escapeHtml(fullName)},<br/><br/>
                  Thank you for your donation! This email serves as your official receipt for a tax-deductible contribution of
                  <strong>$${numericAmount.toFixed(2)}</strong> received on ${donationDate}${dedication}.
                  No goods or services were provided in exchange for this contribution.
                </p>
                <p style="font-size:16px;line-height:1.7">
                  Tomchei Shabbos of Florida<br/>
                  194 NE 186th Terrace<br/>
                  North Miami Beach, FL 33179
                </p>
                <p style="font-size:13px;line-height:1.7;color:#8B7355">
                  Tomchei Shabbos of Florida is a tax-exempt organization under Section 501(c)(3) of the Internal Revenue Code.
                  Tax ID # ${process.env.NONPROFIT_TAX_ID}. No goods or services were provided in exchange for this contribution.
                  This receipt may serve as your official tax record. Please consult your tax advisor regarding the
                  deductibility of your donation.
                </p>
              </div>
            `,
          });
        } catch (emailError) {
          console.error("Failed to send confirmation email:", emailError);
          // Don't fail the payment if email fails
        }
      }

      if (honoreeType === "honor" && honoreeEmail && honoreeName) {
        await sendHonoreeNotification({
          to: honoreeEmail,
          honoreeName,
          donorName: [resolvedFirst, resolvedLast].filter(Boolean).join(" ") || "A donor",
          amount: numericAmount,
        });
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
