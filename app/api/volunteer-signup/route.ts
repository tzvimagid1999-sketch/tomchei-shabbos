import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Routes each volunteer signup to the staff address for their selected
// interest(s) — a signup can match more than one (e.g. Pack + Deliver).
const INTEREST_EMAILS: Record<string, string> = {
  Deliver: "deliver@tomcheishabbosflorida.org",
  Pack: "volunteer@tomcheishabbosflorida.org",
  Fundraise: "raise@tomcheishabbosflorida.org",
};

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, phone, message, interests } = await req.json();

    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
    }

    const interestList: string[] = Array.isArray(interests)
      ? interests
      : String(interests || "").split(",").map((s) => s.trim()).filter(Boolean);

    const recipients = [...new Set(interestList.map((i) => INTEREST_EMAILS[i]).filter(Boolean))];
    if (recipients.length === 0) {
      return NextResponse.json({ error: "Please select at least one way to help." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Signups are not configured yet. Please try again later." }, { status: 500 });
    }

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1AABAB">New Volunteer Signup</h2>
        <p><strong>Interested in:</strong> ${interestList.join(", ")}</p>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ""}
      </div>`;

    // Send a separate email per matching team, so e.g. Deliver never sees
    // Fundraise's address (and vice versa) in an all-recipients "To" field.
    const resend = new Resend(apiKey);
    await Promise.all(
      recipients.map((to) =>
        resend.emails.send({
          from: process.env.RESEND_FROM || "Tomchei Shabbos <onboarding@resend.dev>",
          to,
          replyTo: email,
          subject: `Volunteer Signup — ${firstName} ${lastName} (${interestList.join(", ")})`,
          html,
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Volunteer signup error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Something went wrong submitting your signup. Please try again." }, { status: 500 });
  }
}
