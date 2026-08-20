import { NextRequest, NextResponse } from "next/server";
import { sendMail, escapeHtml } from "../../lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Please fill in all fields." }, { status: 400 });
    }

    if (!process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json({ error: "Contact form is not configured yet. Please try again later." }, { status: 500 });
    }

    await sendMail({
      to: "admin@tomcheishabbosflorida.org",
      replyTo: email,
      subject: `Website Contact Form — ${name}`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#1AABAB">New Contact Form Message</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Message:</strong></p>
          <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
        </div>`,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Contact form error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
