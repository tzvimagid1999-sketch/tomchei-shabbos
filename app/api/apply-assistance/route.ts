import { NextRequest, NextResponse } from "next/server";
import { sendMail, escapeHtml } from "../../lib/mailer";

// Sends assistance applications by email instead of storing them — this
// nonprofit doesn't have a database, and staff already work out of email/Gmail.
//
// The page posts { groups, fields }: `groups` is the reviewed summary exactly as
// the applicant saw it (this is what goes in the email), `fields` is the same
// answers in structured form (used for validation and the sheet log).
type Kid = { name?: string; gender?: string; age?: string; school?: string };

const str = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const f = (body?.fields ?? {}) as Record<string, unknown>;
    const groups: unknown = body?.groups;

    // Required answers, matching the form's own required fields. The spouse
    // answers are only required when the applicant says they are married.
    const required = [
      "status", "firstName", "lastName", "email", "phone", "married",
      "street", "city", "state", "zip", "hEmployed", "hYearly",
      "snap", "otherAssist", "housingCost", "numKids", "shul", "rabbi", "rabbiPhone",
    ];
    if (f.married === "Yes") required.push("spFirst", "spLast", "spPhone", "wEmployed", "wYearly");
    for (const field of required) {
      if (!str(f[field])) {
        return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
      }
    }
    if (!emailOk(str(f.email))) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (f.snap === "Yes" && !str(f.snapAmt)) {
      return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
    }
    const kids: Kid[] = Array.isArray(f.kids) ? (f.kids as Kid[]) : [];
    if (kids.length !== Number(f.numKids) || kids.some((k) => !str(k?.name) || !str(k?.gender) || !str(k?.age))) {
      return NextResponse.json({ error: "Please fill in every child's name, gender and age." }, { status: 400 });
    }
    if (!Array.isArray(groups) || groups.length === 0) {
      return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
    }

    if (!process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json({ error: "Applications are not configured yet. Please try again later." }, { status: 500 });
    }

    const applicant = `${str(f.firstName)} ${str(f.lastName)}`;

    const sections = (groups as unknown[])
      .map((g) => {
        if (!Array.isArray(g)) return "";
        const [title, rows] = g as [unknown, unknown];
        if (!Array.isArray(rows)) return "";
        const trs = rows
          .map((r) =>
            Array.isArray(r)
              ? `<tr><td style="padding:6px 12px 6px 0;color:#888;font-size:13px;white-space:nowrap;vertical-align:top">${escapeHtml(str(r[0]))}</td><td style="padding:6px 0;font-size:14px">${escapeHtml(str(r[1]))}</td></tr>`
              : ""
          )
          .join("");
        return `<h3 style="color:#1AABAB;font-size:15px;margin:20px 0 4px">${escapeHtml(str(title))}</h3><table style="border-collapse:collapse;width:100%">${trs}</table>`;
      })
      .join("");

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1AABAB">New Assistance Application</h2>
        ${sections}
      </div>`;

    await sendMail({
      to: "chanies@tomcheishabbosflorida.org",
      replyTo: str(f.email),
      subject: `Assistance Application — ${applicant}`,
      html,
    });

    // Confirm to the applicant that their application was received —
    // best-effort, don't fail the whole submission if just this email fails.
    try {
      await sendMail({
        to: str(f.email),
        subject: "We received your application",
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#2F3A44">
            <h2 style="color:#1AABAB">Thank you, ${escapeHtml(str(f.firstName))}!</h2>
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
    // The sheet script was written for the previous form, so the old field names
    // are still filled in where the new form has an equivalent; the new answers
    // ride along under their own names.
    if (process.env.GOOGLE_SHEET_WEBHOOK_URL) {
      try {
        const sheetData = {
          ...f,
          kids: kids.map((k) => `${str(k.name)} (${str(k.gender)}, ${str(k.age)}${str(k.school) ? ", " + str(k.school) : ""})`).join("; "),
          assist: Array.isArray(f.assist) ? (f.assist as string[]).join(", ") : "",
          email: str(f.email),
          status: str(f.status),
          firstName: str(f.firstName),
          lastName: str(f.lastName),
          spouseName: `${str(f.spFirst)} ${str(f.spLast)}`.trim(),
          spouseEmail: str(f.spEmail),
          street: str(f.street),
          unit: str(f.apt),
          accessInstructions: "",
          city: str(f.city),
          state: str(f.state),
          zip: str(f.zip),
          phone: str(f.phone),
          numChildren: str(f.numKids),
          childrenAges: kids.map((k) => str(k.age)).join(", "),
          occupation: str(f.hPosition),
          spouseOccupation: str(f.wPosition),
          assistanceType: "",
          rabbiName: str(f.rabbi),
          rabbiPhone: str(f.rabbiPhone),
          rabbiCongregation: str(f.shul),
          otherOrgAssistance: "",
          otherOrgAssistanceDetails: "",
          additionalInfo: str(f.notes),
        };
        await fetch(`${process.env.GOOGLE_SHEET_WEBHOOK_URL}?secret=${process.env.GOOGLE_SHEET_SECRET}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sheetData),
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
