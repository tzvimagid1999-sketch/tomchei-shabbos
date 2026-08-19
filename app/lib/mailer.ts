import nodemailer from "nodemailer";

// Escapes user-supplied text before it's interpolated into an HTML email, so
// someone typing "<script>" or "&" into a form field can't break the email's
// layout or inject markup.
export function escapeHtml(input: unknown): string {
  return String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Sends email via Gmail/Google Workspace SMTP using an app password, instead
// of a third-party email API. Free — uses the org's own Gmail account.
let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter;
}

// Best-effort notification to someone a donation was made in honor of.
// Never blocks or fails the donation itself.
export async function sendHonoreeNotification(opts: {
  to: string;
  honoreeName: string;
  donorName: string;
  amount: number;
}): Promise<void> {
  try {
    await sendMail({
      to: opts.to,
      subject: `A gift was made in your honor!`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#2F3A44">
          <p style="font-size:16px;line-height:1.7">
            Dear ${escapeHtml(opts.honoreeName)},<br/><br/>
            We wanted to let you know that ${escapeHtml(opts.donorName)} made a generous donation of
            <strong>$${opts.amount}</strong> to Tomchei Shabbos of Florida in your honor.
            Their gift will help families in our community celebrate Shabbos with dignity.
          </p>
          <p style="font-size:16px;line-height:1.7">Warm regards,<br/>Tomchei Shabbos of Florida</p>
        </div>`,
    });
  } catch (err) {
    console.error("Honoree notification email failed (non-fatal):", err instanceof Error ? err.message : err);
  }
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}): Promise<void> {
  const t = getTransporter();
  if (!t) return;
  const fromAddress = process.env.GMAIL_USER!;
  await t.sendMail({
    from: opts.from || `Tomchei Shabbos of Florida <${fromAddress}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    replyTo: opts.replyTo,
  });
}
