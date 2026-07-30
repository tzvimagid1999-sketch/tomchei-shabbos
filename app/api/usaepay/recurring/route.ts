import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendMonthlyConfirmation } from "../../../lib/donation-email";

// Sets up a MONTHLY recurring donation in USAePay by creating a customer
// record with a monthly billing schedule. USAePay then auto-charges the
// saved card every month until the schedule is disabled (see /api/usaepay/cancel).
//
// NOTE: This must be tested against a live account before launch — confirm the
// customer + schedule appear in the USAePay console and that the first charge runs.
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

    const { amount, paymentKey, name, email, street, city, state, zip } = await req.json();

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount < 1) {
      return NextResponse.json({ error: "Please enter a valid amount." }, { status: 400 });
    }
    if (!paymentKey) {
      return NextResponse.json({ error: "Missing card details." }, { status: 400 });
    }

    // USAePay v2 auth hash.
    const seed = crypto.randomBytes(16).toString("hex");
    const hash = crypto.createHash("sha256").update(sourceKey + seed + pin).digest("hex");
    const authHeader =
      "Basic " + Buffer.from(`${sourceKey}:s2/${seed}/${hash}`).toString("base64");

    // USAePay requires a non-blank first AND last name on the customer record.
    const nameParts = String(name || "").trim().split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || "Donor";
    const lastName = nameParts.slice(1).join(" ") || nameParts[0] || "Donor";

    // USAePay's tokenized payment_key never exposes the real card expiration back
    // to the merchant (PCI compliance), so billing against the saved cardref uses
    // a placeholder date a few years out instead of the donor's real one — the
    // stored card reference itself is what actually gets charged, not this field.
    // (A far-future year like 99 fails USAePay's sanity range check, so use +5y.)
    const future = new Date();
    future.setFullYear(future.getFullYear() + 5);
    const expiration = String(future.getMonth() + 1).padStart(2, "0") + String(future.getFullYear() % 100).padStart(2, "0");

    const billing = {
      firstname: firstName,
      lastname: lastName,
      street: street || undefined,
      city: city || undefined,
      state: state || undefined,
      postalcode: zip || undefined,
      country: "US",
    };

    // STEP 1 — Authorize (a HOLD, not a charge) with save_card to get a reusable
    // card reference, then immediately VOID the hold so the donor isn't charged.
    // (During setup this keeps testing free; the recurring schedule does the real charging.)
    const saveRes = await fetch(`${endpoint}/transactions`, {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({
        command: "cc:authonly",
        amount: numericAmount.toFixed(2),
        payment_key: paymentKey,
        save_card: true,
        email: email || undefined,
        description: "Card verification for monthly donation",
        billing_address: billing,
      }),
    });
    const saveRaw = await saveRes.text();
    let save: Record<string, unknown> = {};
    try { save = JSON.parse(saveRaw); } catch { /* non-JSON */ }

    const sc = (save.savedcard || {}) as Record<string, unknown>;
    const cardRef = sc.cardref ?? save.cardref ?? sc.key ?? (save.creditcard as Record<string, unknown>)?.cardref;
    const approved = save.result === "Approved" || save.result_code === "A";
    const authRefnum = save.refnum;

    if (!saveRes.ok || !approved || !cardRef) {
      return NextResponse.json(
        {
          error: (save.error as string) || "Could not verify your card. Please try again.",
          debug: { step: "authorize", httpStatus: saveRes.status, cardRefFound: cardRef || null, usaepayRaw: saveRaw.slice(0, 700) },
        },
        { status: 402 }
      );
    }

    // Release the authorization hold (best-effort — don't fail the flow if void errors).
    if (authRefnum) {
      try {
        await fetch(`${endpoint}/transactions`, {
          method: "POST",
          headers: { Authorization: authHeader, "Content-Type": "application/json" },
          body: JSON.stringify({ command: "cc:void", refnum: authRefnum }),
        });
      } catch { /* ignore */ }
    }

    // STEP 2 — Create the recurring customer using the stored card. The saved-card
    // token goes in the card NUMBER field, paired with the donor's real expiration.
    const nextBill = new Date().toISOString().slice(0, 10); // first scheduled charge: today

    const res = await fetch(`${endpoint}/customers`, {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
      body: JSON.stringify({
        enabled: true,
        schedule: "monthly",
        next: nextBill,
        amount: numericAmount.toFixed(2),
        description: "Monthly donation to Tomchei Shabbos of Florida",
        email: email || undefined,
        firstname: firstName,
        lastname: lastName,
        company: name || "Monthly Donor",
        payment_methods: [
          {
            method_name: "Card",
            pay_type: "cc",
            creditcard: { number: cardRef, expiration },
          },
        ],
        billing_address: billing,
      }),
    });

    const rawText = await res.text();
    let data: Record<string, unknown> = {};
    try { data = JSON.parse(rawText); } catch { /* non-JSON */ }

    const custnum = data.key ?? data.custkey ?? data.custnum ?? data.customer_id;

    if (res.ok && custnum) {
      await sendMonthlyConfirmation({
        origin: new URL(req.url).origin,
        custkey: String(custnum),
        email: email || "",
        name: name || "",
        amount: numericAmount,
      });
      return NextResponse.json({ success: true, custnum });
    }

    return NextResponse.json(
      {
        error: (data.error as string) || "Your monthly donation could not be set up. Please try again.",
        debug: { step: "create-customer", httpStatus: res.status, sentExpiration: expiration, usaepayRaw: rawText.slice(0, 1000) },
      },
      { status: 402 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("USAePay recurring error:", message);
    return NextResponse.json(
      { error: "Something went wrong setting up your monthly donation. Please try again." },
      { status: 500 }
    );
  }
}
