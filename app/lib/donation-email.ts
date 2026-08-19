import crypto from "crypto";
import { sendMail } from "./mailer";

// A one-click cancel link is safe to email because it carries an HMAC signature
// of the customer key — it can't be forged without the server secret. We reuse
// USAEPAY_PIN as the signing secret so there's no extra env var to manage.
export function signCustKey(custkey: string): string {
  const secret = process.env.USAEPAY_PIN || "fallback-secret";
  return crypto.createHmac("sha256", secret).update(String(custkey)).digest("hex").slice(0, 24);
}

export function verifyCustKey(custkey: string, sig: string): boolean {
  const expected = signCustKey(custkey);
  // constant-time compare
  return (
    sig.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  );
}

// Sends the monthly-donation confirmation with a one-click cancel link.
// Best-effort: a failure here must NOT fail the donation itself.
export async function sendMonthlyConfirmation(opts: {
  origin: string;
  custkey: string;
  email: string;
  name: string;
  amount: number;
  refnum?: string;
  cardLast4?: string;
  honoreeType?: "honor" | "memory";
  honoreeName?: string;
}): Promise<void> {
  if (!process.env.GMAIL_APP_PASSWORD || !opts.email) return;

  const sig = signCustKey(opts.custkey);
  const cancelUrl = `${opts.origin}/manage-donation?c=${encodeURIComponent(opts.custkey)}&s=${sig}`;
  const fullName = opts.name || "Friend";
  const dedication = opts.honoreeType && opts.honoreeName
    ? ` (${opts.honoreeType === "memory" ? "In Memory of" : "In Honor of"} ${opts.honoreeName})`
    : "";

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#2F3A44">
    <p style="font-size:16px;line-height:1.7">
      Dear ${fullName},<br/><br/>
      Thank you for your generous pledge of <strong>$${opts.amount}/month</strong> to Tomchei Shabbos of Florida${dedication}.
      Your support means a great deal to us. Contributions like yours make it possible for Tomchei Shabbos of Florida
      to continue its mission. We are deeply grateful for your commitment.
    </p>
    <div style="background:#f5f5f5;border-radius:8px;padding:16px 20px;margin:20px 0;font-size:14px">
      ${opts.refnum ? `<p style="margin:0 0 6px"><strong>Reference #:</strong> ${opts.refnum}</p>` : ""}
      ${opts.cardLast4 ? `<p style="margin:0 0 6px"><strong>Card:</strong> xxxx xxxx xxxx ${opts.cardLast4}</p>` : ""}
      <p style="margin:0 0 6px"><strong>Amount:</strong> $${opts.amount}/month</p>
      <p style="margin:0 0 6px"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      ${dedication ? `<p style="margin:0 0 6px"><strong>Dedication:</strong> ${opts.honoreeType === "memory" ? "In Memory of" : "In Honor of"} ${opts.honoreeName}</p>` : ""}
      <p style="margin:0"><strong>Tax ID:</strong> ${process.env.NONPROFIT_TAX_ID}</p>
    </div>
    <div style="background:#FAF3E8;border:1px solid #E8D9C0;border-radius:12px;padding:20px;margin:20px 0">
      <p style="margin:0 0 12px;font-size:15px">You can cancel anytime — one click, no questions:</p>
      <a href="${cancelUrl}" style="display:inline-block;background:#F5A020;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold">Cancel my monthly donation</a>
      <p style="margin:14px 0 0;font-size:12px;color:#8B7355">
        Prefer to keep this handy? Your confirmation number is <strong>${opts.custkey}</strong> —
        enter it with your email at ${opts.origin}/manage-donation anytime.
      </p>
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
  </div>`;

  try {
    await sendMail({
      to: opts.email,
      subject: "Thank you for your generous pledge!",
      html,
    });
  } catch (err) {
    console.error("Confirmation email failed (non-fatal):", err instanceof Error ? err.message : err);
  }
}
