import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// Sends assistance applications by email instead of storing them — this
// nonprofit doesn't have a database, and staff already work out of email/Gmail.
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const required = ["email", "status", "firstName", "lastName", "spouseName", "street", "city", "zip", "phone", "spouseEmail", "numChildren", "childrenAges", "occupation", "spouseOccupation", "assistanceType", "rabbiName", "rabbiPhone", "rabbiCongregation", "otherOrgAssistance"];
    for (const field of required) {
      if (!String(data[field] || "").trim()) {
        return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
      }
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Applications are not configured yet. Please try again later." }, { status: 500 });
    }

    const row = (label: string, value: string) =>
      value ? `<tr><td style="padding:6px 12px 6px 0;color:#888;font-size:13px;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:6px 0;font-size:14px">${value}</td></tr>` : "";

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
          ${row("Address", `${data.street}${data.unit ? " " + data.unit : ""}, ${data.city}, FL ${data.zip}`)}
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

    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: process.env.RESEND_FROM || "Tomchei Shabbos <onboarding@resend.dev>",
      to: "admin@tomcheishabbosflorida.org",
      replyTo: data.email,
      subject: `Assistance Application — ${data.firstName} ${data.lastName}`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Application submission error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Something went wrong submitting your application. Please try again." }, { status: 500 });
  }
}
