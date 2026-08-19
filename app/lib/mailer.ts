import nodemailer from "nodemailer";

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
