import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendMonthlyConfirmation } from "../../../lib/donation-email";

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

    const { amount, paymentKey, name, email, street, city, state, zip, numPayments } = await req.json();

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
      country: "US",
    };

    // STEP 1 — Create the customer record.
    const custRes = await fetch(`${endpoint}/customers`, {
      method: "POST",
      headers: { Authorization: auth(), "Content-Type": "application/json" },
      body: JSON.stringify({
        firstname: firstName,
        lastname: lastName,
        company: name || `${firstName} ${lastName}`,
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
        description: totalPayments
          ? `Pledge payment 1 of ${totalPayments} to Tomchei Shabbos of Florida`
          : "Monthly donation to Tomchei Shabbos of Florida (first payment)",
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
            enabled: true,
            description: totalPayments
              ? `Pledge (${totalPayments} monthly payments) to Tomchei Shabbos of Florida`
              : "Monthly donation to Tomchei Shabbos of Florida",
            ...(remainingPayments ? { numleft: remainingPayments } : {}),
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
      await sendMonthlyConfirmation({
        origin: new URL(req.url).origin,
        custkey: String(custkey),
        email: email || "",
        name: name || "",
        amount: numericAmount,
      });
    } catch (emailErr: unknown) {
      console.error("Confirmation email threw:", emailErr instanceof Error ? emailErr.message : emailErr);
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
