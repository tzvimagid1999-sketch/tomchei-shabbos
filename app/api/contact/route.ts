import { NextRequest, NextResponse } from "next/server";
import { sendMail, escapeHtml } from "../../lib/mailer";
import { CONTACT_EMAIL } from "../../lib/contact-info";

export async function POST(req: NextRequest) {
  try {
    const { name, email, message, website } = await req.json();

    // Honeypot: a field hidden from people but filled in by most bots. Anything
    // that fills it gets a success response and goes nowhere, so the bot has no
    // signal to retry.
    if (website) return NextResponse.json({ success: true });

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Please fill in your name, email and message." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "That email address doesn't look right." }, { status: 400 });
    }
    if (message.length > 5000) {
      return NextResponse.json({ error: "That message is too long. Please shorten it." }, { status: 400 });
    }

    await sendMail({
      to: CONTACT_EMAIL,
      subject: `Website message from ${name.trim()}`,
      // replyTo means hitting Reply in Gmail answers the sender directly,
      // rather than the site's own mailbox.
      replyTo: email.trim(),
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;color:#2F3A44">
          <p style="font-size:15px;line-height:1.7">
            <strong>From:</strong> ${escapeHtml(name)}<br/>
            <strong>Email:</strong> ${escapeHtml(email)}
          </p>
          <p style="font-size:15px;line-height:1.7;white-space:pre-wrap;border-left:3px solid #C8A75B;padding-left:14px">${escapeHtml(message)}</p>
          <p style="font-size:12px;color:#8B7355">Sent from the contact form on tomcheishabbosflorida.org</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Your message couldn't be sent. Please email us directly." },
      { status: 500 }
    );
  }
}
