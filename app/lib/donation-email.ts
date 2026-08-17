import crypto from "crypto";
import { Resend } from "resend";

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
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !opts.email) return;

  const from = process.env.RESEND_FROM || "Tomchei Shabbos <onboarding@resend.dev>";
  const sig = signCustKey(opts.custkey);
  const cancelUrl = `${opts.origin}/manage-donation?c=${encodeURIComponent(opts.custkey)}&s=${sig}`;
  const first = (opts.name || "").split(/\s+/)[0] || "Friend";

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#2F3A44">
    <h2 style="color:#0F9FAE;margin:0 0 8px">Thank you, ${first}!</h2>
    <p style="font-size:16px;line-height:1.6">
      Your <strong>$${opts.amount}/month</strong> donation to Tomchei Shabbos of Florida is set up.
      Every month, you're helping a family celebrate Shabbos with dignity.
    </p>
    <div style="background:#f5f5f5;border-radius:8px;padding:16px 20px;margin:20px 0;font-size:14px">
      ${opts.refnum ? `<p style="margin:0 0 6px"><strong>Reference #:</strong> ${opts.refnum}</p>` : ""}
      ${opts.cardLast4 ? `<p style="margin:0 0 6px"><strong>Card:</strong> xxxx xxxx xxxx ${opts.cardLast4}</p>` : ""}
      <p style="margin:0 0 6px"><strong>Amount:</strong> $${opts.amount}/month</p>
      <p style="margin:0"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    </div>
    <div style="background:#FAF3E8;border:1px solid #E8D9C0;border-radius:12px;padding:20px;margin:20px 0">
      <p style="margin:0 0 12px;font-size:15px">You can cancel anytime — one click, no questions:</p>
      <a href="${cancelUrl}" style="display:inline-block;background:#F5A020;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold">Cancel my monthly donation</a>
      <p style="margin:14px 0 0;font-size:12px;color:#8B7355">
        Prefer to keep this handy? Your confirmation number is <strong>${opts.custkey}</strong> —
        enter it with your email at ${opts.origin}/manage-donation anytime.
      </p>
    </div>
    <div style="margin-top:20px;padding:15px;background-color:#fafafa;border-radius:5px;font-size:11px;color:#888">
      <p style="margin:0 0 6px"><strong>Tax Deduction Information:</strong></p>
      <p style="margin:0">
        Tomchei Shabbos of Florida is a 501(c)(3) nonprofit organization (Tax ID: ${process.env.NONPROFIT_TAX_ID}).
        Each monthly donation of $${opts.amount} is tax deductible to the extent allowed by law. No goods or
        services were provided in exchange for this contribution. Please consult your tax advisor regarding the
        deductibility of your contribution.
      </p>
    </div>
    <p style="font-size:13px;color:#8B7355;margin-top:20px">With gratitude,<br/>Tomchei Shabbos of Florida</p>
  </div>`;

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: opts.email,
      subject: "Your monthly donation is set up 💙",
      html,
    });
  } catch (err) {
    console.error("Confirmation email failed (non-fatal):", err instanceof Error ? err.message : err);
  }
}
