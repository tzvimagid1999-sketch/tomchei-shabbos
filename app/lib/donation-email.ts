import crypto from "crypto";
import { sendMail, escapeHtml } from "./mailer";

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
// Where failures are reported. A monthly sign-up whose schedule did not get
// created is money the organisation is owed and would otherwise never hear
// about — the donor is charged once, told it will repeat, and nobody knows.
const OFFICE_EMAIL = process.env.OFFICE_ALERT_EMAIL || "info@tomcheishabbosflorida.org";

/**
 * Tells the office that a monthly donation was charged but its recurring
 * schedule was NOT created, so someone can set it up by hand or call the donor.
 *
 * Never throws: the donor has already been charged by the time this runs, and
 * a failed alert must not turn a successful donation into an error.
 */
export async function sendScheduleFailureAlert(opts: {
  name: string;
  email: string;
  amount: number;
  months?: number;
  custkey: string;
  reason?: string;
}): Promise<void> {
  const term = opts.months && opts.months > 1 ? `${opts.months} monthly payments` : "ongoing monthly";
  const owed = opts.months && opts.months > 1 ? ` Remaining commitment: $${opts.amount * (opts.months - 1)}.` : "";

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;color:#2F3A44">
    <h2 style="color:#B4231F;font-size:18px">Monthly donation set-up did not complete</h2>
    <p style="font-size:15px;line-height:1.7">
      The first payment was charged successfully, but the recurring schedule was
      <strong>not</strong> created. Without it this donor will never be charged again.${owed}
    </p>
    <table style="font-size:15px;line-height:1.9;border-collapse:collapse">
      <tr><td style="padding-right:14px;color:#6b6b6b">Donor</td><td><strong>${escapeHtml(opts.name || "(no name)")}</strong></td></tr>
      <tr><td style="padding-right:14px;color:#6b6b6b">Email</td><td>${escapeHtml(opts.email || "(none)")}</td></tr>
      <tr><td style="padding-right:14px;color:#6b6b6b">Amount</td><td>$${opts.amount} — ${term}</td></tr>
      <tr><td style="padding-right:14px;color:#6b6b6b">Customer ID</td><td>${escapeHtml(opts.custkey)}</td></tr>
      <tr><td style="padding-right:14px;color:#6b6b6b">Reason</td><td>${escapeHtml(opts.reason || "unknown")}</td></tr>
    </table>
    <p style="font-size:15px;line-height:1.7">
      What to do: open this customer in MerchPay and add the monthly billing
      schedule by hand, or call the donor. Their card is already saved on the
      customer record, so it does not need re-entering.
    </p>
    <p style="font-size:13px;color:#8B7355">
      The donor was told their first gift went through and that someone would be in
      touch. They were NOT promised ongoing monthly payments.
    </p>
  </div>`;

  try {
    await sendMail({ to: OFFICE_EMAIL, subject: "ACTION NEEDED: monthly donation schedule failed", html });
  } catch (err) {
    console.error("Schedule failure alert could not be sent:", err instanceof Error ? err.message : err);
  }
}

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
  // False when the recurring schedule could not be created. The receipt then
  // promises nothing beyond the payment that actually happened.
  scheduleCreated?: boolean;
}): Promise<void> {
  if (!process.env.GMAIL_APP_PASSWORD || !opts.email) return;

  const sig = signCustKey(opts.custkey);
  const cancelUrl = `${opts.origin}/manage-donation?c=${encodeURIComponent(opts.custkey)}&s=${sig}`;
  const fullName = opts.name || "Friend";
  const dedication = opts.honoreeType && opts.honoreeName
    ? ` (${opts.honoreeType === "memory" ? "In Memory of" : "In Honor of"} ${escapeHtml(opts.honoreeName)})`
    : "";

  const donationDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#2F3A44">
    <p style="font-size:16px;line-height:1.7">
      Dear ${escapeHtml(fullName)},<br/><br/>
      Thank you for your donation! This email serves as your official receipt for a tax-deductible contribution of
      <strong>$${opts.amount}</strong> received on ${donationDate}${dedication}.
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
    ${opts.scheduleCreated === false
      ? `<div style="background:#FAF3E8;border:1px solid #E8D9C0;border-radius:12px;padding:20px;margin:20px 0">
      <p style="margin:0;font-size:15px">
        We had a problem setting up the monthly part of your gift, so only the payment above
        has been taken. Nothing further will be charged. Someone from our office will be in
        touch shortly to finish setting it up — there is nothing you need to do.
      </p>
    </div>`
      : `<div style="background:#FAF3E8;border:1px solid #E8D9C0;border-radius:12px;padding:20px;margin:20px 0">
      <p style="margin:0 0 12px;font-size:15px">This is a recurring monthly gift. You can cancel anytime — one click, no questions:</p>
      <a href="${cancelUrl}" style="display:inline-block;background:#F5A020;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold">Cancel my monthly donation</a>
      <p style="margin:14px 0 0;font-size:12px;color:#8B7355">
        Prefer to keep this handy? Your confirmation number is <strong>${opts.custkey}</strong> —
        enter it with your email at ${opts.origin}/manage-donation anytime.
      </p>
    </div>`}
  </div>`;

  try {
    await sendMail({
      to: opts.email,
      subject: "Your donation receipt",
      html,
    });
  } catch (err) {
    console.error("Confirmation email failed (non-fatal):", err instanceof Error ? err.message : err);
  }
}
