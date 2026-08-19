import { NextResponse } from "next/server";
import { sendMail } from "../../lib/mailer";

// TEMP: re-verify Gmail SMTP is still working.
export async function GET() {
  try {
    await sendMail({
      to: process.env.GMAIL_USER!,
      subject: "Test email from website (Gmail SMTP) #2",
      html: "<p>If you're reading this, Gmail SMTP sending is working correctly.</p>",
    });
    return NextResponse.json({ success: true, from: process.env.GMAIL_USER, hasPassword: !!process.env.GMAIL_APP_PASSWORD });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err), from: process.env.GMAIL_USER, hasPassword: !!process.env.GMAIL_APP_PASSWORD },
      { status: 500 }
    );
  }
}
