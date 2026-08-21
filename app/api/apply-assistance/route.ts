import { NextRequest, NextResponse } from "next/server";
import { sendMail, escapeHtml } from "../../lib/mailer";

// Sends assistance applications by email instead of storing them — this
// nonprofit doesn't have a database, and staff already work out of email/Gmail.
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const required = ["email", "status", "firstName", "lastName", "spouseName", "street", "city", "state", "zip", "phone", "spouseEmail", "numChildren", "childrenAges", "occupation", "spouseOccupation", "assistanceType", "rabbiName", "rabbiPhone", "rabbiCongregation", "otherOrgAssistance"];
    for (const field of required) {
      if (!String(data[field] || "").trim()) {
        return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
      }
    }
    if (data.unit && !String(data.accessInstructions || "").trim()) {
      return NextResponse.json({ error: "Please provide building/gate access instructions." }, { status: 400 });
    }

    if (!process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json({ error: "Applications are not configured yet. Please try again later." }, { status: 500 });
    }

    const row = (label: string, value: string) =>
      value ? `<tr><td style="padding:6px 12px 6px 0;color:#888;font-size:13px;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px 0;font-size:14px">${escapeHtml(value)}</td></tr>` : "";

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1AABAB">New Assistance Application</h2>
        <table style="border-collapse:collapse;width:100%">
          ${row("Status", data.status)}
          ${row("Applicant", `${data.firstName} ${data.lastName}`)}
          ${row("Applicant Email", data.email)}
          ${row("Spouse's Name", data.spouseName)}
          ${row("Spouse's Email", data.spouseEmail)}
          ${row("Phone", data.phone)}
          ${row("Address", `${data.street}${data.unit ? " " + data.unit : ""}, ${data.city}, ${data.state} ${data.zip}`)}
          ${row("Building/Gate Access", data.accessInstructions || "")}
          ${row("Children at Home", data.numChildren)}
          ${row("Ages of Children", data.childrenAges)}
          ${row("Occupation", data.occupation)}
          ${row("Spouse's Occupation", data.spouseOccupation)}
          ${row("Assistance Requested", data.assistanceType)}
          ${row("Local Rabbi", data.rabbiName)}
          ${row("Rabbi's Phone", data.rabbiPhone)}
          ${row("Rabbi's Congregation", data.rabbiCongregation)}
          ${row("Receiving Assistance from Other Organization(s)", data.otherOrgAssistance)}
          ${row("Which Organization(s)", data.otherOrgAssistanceDetails || "")}
          ${row("Additional Info", data.additionalInfo || "")}
        </table>
      </div>`;

    await sendMail({
      to: "chanies@tomcheishabbosflorida.org",
      replyTo: data.email,
      subject: `Assistance Application — ${data.firstName} ${data.lastName}`,
      html,
    });

    // Confirm to the applicant that their application was received —
    // best-effort, don't fail the whole submission if just this email fails.
    try {
      await sendMail({
        to: data.email,
        subject: "We received your application",
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#2F3A44">
            <h2 style="color:#1AABAB">Thank you, ${escapeHtml(data.firstName)}!</h2>
            <p style="font-size:16px;line-height:1.7">
              We've received your application for assistance from Tomchei Shabbos of Florida.
              Our team will review it and reach out to you soon.
            </p>
            <p style="font-size:13px;color:#8B7355">With gratitude,<br/>Tomchei Shabbos of Florida</p>
          </div>`,
      });
    } catch (confirmErr: unknown) {
      console.error("Applicant confirmation email failed (non-fatal):", confirmErr instanceof Error ? confirmErr.message : confirmErr);
    }

    // Also log the application to the Google Sheet — best-effort, never blocks
    // the email above or fails the submission if the sheet is unreachable.
    if (process.env.GOOGLE_SHEET_WEBHOOK_URL) {
      try {
        await fetch(`${process.env.GOOGLE_SHEET_WEBHOOK_URL}?secret=${process.env.GOOGLE_SHEET_SECRET}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
      } catch (sheetErr: unknown) {
        console.error("Failed to log application to Google Sheet (non-fatal):", sheetErr instanceof Error ? sheetErr.message : sheetErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Application submission error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Something went wrong submitting your application. Please try again." }, { status: 500 });
  }
}
