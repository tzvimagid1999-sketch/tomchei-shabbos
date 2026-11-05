import { sendMail, escapeHtml } from "./mailer";
import { CONTACT_EMAIL } from "./contact-info";

// Donations don't email the organization, so a donor's text-message consent
// would otherwise be lost. This leaves a record in the inbox for each donor who
// ticked the box. Best-effort: a failed notice never fails the donation.
export async function notifySmsOptIn(opts: { name: string; phone: string; source: string }) {
  try {
    await sendMail({
      to: CONTACT_EMAIL,
      subject: `Text opt-in: ${opts.name || "donor"}`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;color:#2F3A44">
          <p style="font-size:15px;line-height:1.7">
            <strong>${escapeHtml(opts.name || "A donor")}</strong> ticked the box agreeing to receive text messages.<br/>
            <strong>Phone:</strong> ${escapeHtml(opts.phone)}<br/>
            <strong>Where:</strong> ${escapeHtml(opts.source)}
          </p>
          <p style="font-size:12px;color:#8B7355">Keep this email as the record of consent.</p>
        </div>`,
    });
  } catch (err) {
    console.error("SMS opt-in notice failed (non-fatal):", err instanceof Error ? err.message : err);
  }
}
