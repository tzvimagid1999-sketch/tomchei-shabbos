import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendMonthlyConfirmation, sendScheduleFailureAlert } from "../../../lib/donation-email";
import { sendHonoreeNotification } from "../../../lib/mailer";
import { wallTag, pledgeTag, PLEDGED_TAG } from "../../../lib/donor-wall";

// Sets up a MONTHLY recurring donation. Per USAePay support, this is a 3-step
// flow (NOT a single "create customer with embedded payment method" call):
//   1. Create a Customer record.
//   2. Charge the first payment as a normal sale, tagged with save_customer_paymethod
//      so the card gets attached to that customer as a saved payment method.
//   3. Create a recurring Schedule on that customer for FUTURE payments — this
//      references the customer's already-saved payment method, no card data needed.
export async function POST(req: NextRequest) {
  try {
    const sourceKey = process.env.NEXT_PUBLIC_USAEPAY_SOURCE_KEY?.trim();
    const pin = process.env.USAEPAY_PIN?.trim();
    const endpoint = process.env.USAEPAY_ENDPOINT || "https://usaepay.com/api/v2";

    if (!sourceKey || !pin) {
      return NextResponse.json(
        { error: "Payment is not configured yet. Please try again later." },
        { status: 500 }
      );
    }

    const { amount, paymentKey, name, email, phone, street, city, state, zip, numPayments, honoreeType, honoreeName, honoreeEmail, campaign, subCampaign, company, displayName } = await req.json();

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount < 1) {
      return NextResponse.json({ error: "Please enter a valid amount." }, { status: 400 });
    }
    if (!paymentKey) {
      return NextResponse.json({ error: "Missing card details." }, { status: 400 });
    }
    // For a capped pledge (e.g. "$100k over 12 months"), Step 2 below already
    // charges payment #1 — the schedule only needs to cover the remaining ones.
    const totalPayments = numPayments ? Number(numPayments) : undefined;
    const remainingPayments = totalPayments && totalPayments > 1 ? totalPayments - 1 : undefined;

    // "Ongoing (until cancelled)" must still send an explicit numleft. Omitting
    // it makes USAePay store 0 — zero payments remaining — so the schedule looks
    // enabled but never charges again. Their docs say "*" means bill forever,
    // but the REST API silently ignores it, so we use a count that outlives any
    // donor (9999 months ≈ 833 years). Cancelling still works normally.
    const INDEFINITE_PAYMENTS = 9999;
    const scheduleNumLeft = remainingPayments ?? INDEFINITE_PAYMENTS;
    const dedication = honoreeType && honoreeName
      ? ` (${honoreeType === "memory" ? "In Memory of" : "In Honor of"} ${honoreeName})`
      : "";
    // subCampaign tags the donation for a campaign page's own total; the Rosh
    // Hashanah wording the main bar counts is unchanged.
    const subTag = subCampaign ? `[${subCampaign}] ` : "";
    const campaignTag = subTag + wallTag(displayName) + (campaign === "rosh-hashanah" ? "Rosh Hashanah Campaign " : "");

    // A billing schedule's description is capped at 120 characters and USAePay
    // rejects the whole schedule if it is longer:
    //   {"error":"The field 'description' is longer than 120","errorcode":51}
    //
    // That is exactly what broke monthly giving from the campaign page while
    // the main site kept working: the campaign page adds [team:...] and
    // [wall:...] tags, which pushed its descriptions to ~139 characters. The
    // donor was charged once and no schedule was ever created.
    //
    // So the description is assembled by priority rather than concatenated and
    // hoped for. The tags that decide whether money is counted come first; the
    // parts that only aid readability are dropped if they do not fit.
    const SCHEDULE_DESCRIPTION_LIMIT = 120;
    const fitScheduleDescription = (
      essential: string[],
      optional: string[]
    ): string => {
      const core = essential.join("");
      // Essentials alone should never approach the cap, but never emit an
      // over-length description even if a tag grows unexpectedly.
      if (core.length >= SCHEDULE_DESCRIPTION_LIMIT) {
        return core.slice(0, SCHEDULE_DESCRIPTION_LIMIT).trim();
      }
      // Optionals are listed most valuable first and added while they fit.
      let out = core;
      for (const part of optional) {
        if (part && out.length + part.length <= SCHEDULE_DESCRIPTION_LIMIT) out += part;
      }
      return out.trim();
    };

    const auth = () => {
      const seed = crypto.randomBytes(16).toString("hex");
      const hash = crypto.createHash("sha256").update(sourceKey + seed + pin).digest("hex");
      return "Basic " + Buffer.from(`${sourceKey}:s2/${seed}/${hash}`).toString("base64");
    };

    const nameParts = String(name || "").trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || "Donor";
    const lastName = nameParts.slice(1).join(" ") || nameParts[0] || "Donor";

    const billing = {
      firstname: firstName,
      lastname: lastName,
      street: street || undefined,
      city: city || undefined,
      state: state || undefined,
      postalcode: zip || undefined,
      phone: phone || undefined,
      company: company || undefined,
      country: "US",
    };

    // STEP 1 — Create the customer record.
    const custRes = await fetch(`${endpoint}/customers`, {
      method: "POST",
      headers: { Authorization: auth(), "Content-Type": "application/json" },
      body: JSON.stringify({
        firstname: firstName,
        lastname: lastName,
        company: company || name || `${firstName} ${lastName}`,
        email: email || undefined,
        billing_address: billing,
      }),
    });
    const custRaw = await custRes.text();
    let cust: Record<string, unknown> = {};
    try { cust = JSON.parse(custRaw); } catch { /* non-JSON */ }
    const custkey = cust.key ?? cust.custkey ?? cust.custnum ?? cust.customer_id;

    if (!custRes.ok || !custkey) {
      return NextResponse.json(
        {
          error: "Could not set up your donor profile. Please try again.",
          debug: { step: "create-customer", httpStatus: custRes.status, usaepayRaw: custRaw.slice(0, 700) },
        },
        { status: 402 }
      );
    }

    // STEP 2 — Charge the first payment for real, and save the card to the customer.
    const saleRes = await fetch(`${endpoint}/transactions`, {
      method: "POST",
      headers: { Authorization: auth(), "Content-Type": "application/json" },
      body: JSON.stringify({
        command: "cc:sale",
        amount: numericAmount.toFixed(2),
        payment_key: paymentKey,
        custkey: String(custkey),
        save_customer_paymethod: true,
        email: email || undefined,
        // Shows the donor's name in the "Customer" column of MerchPay's
        // Sales by Date report, which has no Description column.
        customerid: `${firstName} ${lastName}`.trim() || undefined,
        // Donor name leads the description so it appears in MerchPay's Sales by
        // Date report, which shows Description but not the billing name.
        // A fixed-term pledge counts its whole commitment on the campaign bar
        // from today, so the first charge carries [pledge:N] and the schedule
        // below is marked so its charges are not counted a second time.
        description: `${firstName} ${lastName} - ` + campaignTag + pledgeTag(totalPayments) + (totalPayments
          ? `Pledge payment 1 of ${totalPayments} to Tomchei Shabbos of Florida`
          : "Monthly donation to Tomchei Shabbos of Florida (first payment)") + dedication,
        billing_address: billing,
      }),
    });
    const saleRaw = await saleRes.text();
    let sale: Record<string, unknown> = {};
    try { sale = JSON.parse(saleRaw); } catch { /* non-JSON */ }
    const saleApproved = sale.result === "Approved" || sale.result_code === "A";

    if (!saleRes.ok || !saleApproved) {
      return NextResponse.json(
        {
          error: (sale.error as string) || "Your card was declined. Please try another card.",
          debug: { step: "first-charge", httpStatus: saleRes.status, usaepayRaw: saleRaw.slice(0, 700) },
        },
        { status: 402 }
      );
    }

    // STEP 3 — Create the recurring schedule for future payments (starts next month;
    // this month's payment was already charged in Step 2). Wrapped in its own
    // try/catch: the donor was already charged, so nothing here should ever be
    // able to block the confirmation email or turn this into an error response.
    let scheduleOk = false;
    let scheduleDebug: Record<string, unknown> = {};
    const skipSchedule = totalPayments === 1; // single-payment pledge — nothing further to schedule
    if (!skipSchedule) {
      try {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const nextBill = nextMonth.toISOString().slice(0, 10);

        const schedRes = await fetch(`${endpoint}/customers/${custkey}/billing_schedules`, {
          method: "POST",
          headers: { Authorization: auth(), "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: numericAmount.toFixed(2),
            frequency: "monthly",
            start_date: nextBill,
            next_date: nextBill,
            enabled: true,
            // Name leads here too, so every future auto-charge from this
            // schedule carries the donor's name into the reports as well.
            // Essentials are the tags that decide how money is counted:
            // [team:...] for the campaign bar, "Rosh Hashanah Campaign" for the
            // main bar, and [pledged] to stop a fixed-term pledge — already
            // counted in full on its first charge — being counted again here.
            // The donor's name and the prose are readability only.
            description: fitScheduleDescription(
              [
                subTag,
                campaign === "rosh-hashanah" ? "Rosh Hashanah Campaign " : "",
                totalPayments ? PLEDGED_TAG : "",
              ],
              [
                wallTag(displayName),
                `${firstName} ${lastName} `,
                totalPayments ? `(${totalPayments} monthly payments)` : "Monthly donation",
              ]
            ),
            numleft: scheduleNumLeft,
          }),
        });
        const schedRaw = await schedRes.text();
        scheduleOk = schedRes.ok;
        scheduleDebug = { httpStatus: schedRes.status, usaepayRaw: schedRaw.slice(0, 700) };

        if (!schedRes.ok) {
          console.error("Recurring schedule creation failed after successful first charge:", { custkey, ...scheduleDebug });
        }
      } catch (schedErr: unknown) {
        scheduleDebug = { threw: schedErr instanceof Error ? schedErr.message : String(schedErr) };
        console.error("Recurring schedule creation threw after successful first charge:", { custkey, ...scheduleDebug });
      }
    }

    try {
      const cardNumber = (sale.creditcard as Record<string, unknown> | undefined)?.number as string | undefined;
      await sendMonthlyConfirmation({
        origin: new URL(req.url).origin,
        custkey: String(custkey),
        email: email || "",
        name: name || "",
        amount: numericAmount,
        refnum: (sale.refnum as string) || (sale.authcode as string) || undefined,
        cardLast4: cardNumber ? cardNumber.slice(-4) : undefined,
        honoreeType: honoreeType || undefined,
        honoreeName: honoreeName || undefined,
        scheduleCreated: skipSchedule ? undefined : scheduleOk,
      });
    } catch (emailErr: unknown) {
      console.error("Confirmation email threw:", emailErr instanceof Error ? emailErr.message : emailErr);
    }

    // The donor has been charged for month one and no schedule exists, so every
    // later payment they were told about will silently never happen. Tell the
    // office while the donation is fresh enough to fix by hand.
    if (!skipSchedule && !scheduleOk) {
      await sendScheduleFailureAlert({
        name: name || "",
        email: email || "",
        amount: numericAmount,
        months: totalPayments,
        custkey: String(custkey),
        reason: JSON.stringify(scheduleDebug).slice(0, 400),
      });
    }

    if (honoreeType === "honor" && honoreeEmail && honoreeName) {
      await sendHonoreeNotification({
        to: honoreeEmail,
        honoreeName,
        donorName: name || "A donor",
        amount: numericAmount,
      });
    }

    return NextResponse.json({ success: true, custnum: custkey, scheduleOk, debug: scheduleDebug });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("USAePay recurring error:", message);
    return NextResponse.json(
      { error: "Something went wrong setting up your monthly donation. Please try again." },
      { status: 500 }
    );
  }
}
