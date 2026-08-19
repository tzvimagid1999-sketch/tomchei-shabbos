import { NextResponse } from "next/server";
import { sendMail } from "../../lib/mailer";

// TEMP: verify Gmail SMTP is working end-to-end before relying on it.
export async function GET() {
  try {
    await sendMail({
      to: process.env.GMAIL_USER!,
      subject: "Test email from website (Gmail SMTP)",
      html: "<p>If you're reading this, Gmail SMTP sending is working correctly.</p>",
    });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
