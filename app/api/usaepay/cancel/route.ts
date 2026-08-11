import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyCustKey } from "../../../lib/donation-email";

// Cancels a monthly recurring donation. Two ways in:
//  1) One-click link from the confirmation email: { custkey, sig } — the HMAC
//     signature proves authenticity, so no further check is needed.
//  2) Manual form: { custkey (cancellation code) + email } — we disable only if
//     the email matches the record, so a guessed code alone can't cancel someone else's.
//
// IMPORTANT: "enabled" lives on the individual billing_schedule attached to the
// customer, NOT on the customer record itself — disabling the customer does
// nothing to the schedule. Console V1 merchants (this account) only allow one
// schedule per customer, so we just disable billing_schedules[0].
export async function POST(req: NextRequest) {
  try {
    const sourceKey = process.env.NEXT_PUBLIC_USAEPAY_SOURCE_KEY?.trim();
    const pin = process.env.USAEPAY_PIN?.trim();
    const endpoint = process.env.USAEPAY_ENDPOINT || "https://usaepay.com/api/v2";
    if (!sourceKey || !pin) return NextResponse.json({ error: "Service unavailable." }, { status: 500 });

    const { custkey, email, sig } = await req.json();
    if (!custkey) {
      return NextResponse.json({ error: "Missing your confirmation number." }, { status: 400 });
    }

    const auth = () => {
      const seed = crypto.randomBytes(16).toString("hex");
      const hash = crypto.createHash("sha256").update(sourceKey + seed + pin).digest("hex");
      return "Basic " + Buffer.from(`${sourceKey}:s2/${seed}/${hash}`).toString("base64");
    };

    const oneClickValid = sig && verifyCustKey(String(custkey), String(sig));

    // Always look up the customer — we need it to find the schedule key
    // regardless of which path (one-click link vs. manual form) is used.
    const lookup = await fetch(`${endpoint}/customers/${encodeURIComponent(custkey)}`, {
      headers: { Authorization: auth() },
    });
    const customer = await lookup.json();
    if (!lookup.ok || !customer) {
      return NextResponse.json(
        { error: "We couldn't find a donation with that confirmation number." },
        { status: 404 }
      );
    }

    // For the manual path, verify the email on the record matches.
    if (!oneClickValid) {
      if (!email) {
        return NextResponse.json({ error: "Please enter your email." }, { status: 400 });
      }
      const recordEmail = String(customer.email || "").trim().toLowerCase();
      if (!recordEmail || recordEmail !== String(email).trim().toLowerCase()) {
        return NextResponse.json(
          { error: "That email doesn't match this confirmation number." },
          { status: 403 }
        );
      }
    }

    const schedules = (customer.billing_schedules || []) as Array<{ key: string; enabled?: string }>;
    const activeSchedule = schedules.find((s) => s.enabled === "1") || schedules[0];

    if (!activeSchedule?.key) {
      // Nothing active to cancel — treat as already cancelled rather than an error.
      return NextResponse.json({ success: true, alreadyCancelled: true });
    }

    const disable = await fetch(
      `${endpoint}/customers/${encodeURIComponent(custkey)}/billing_schedules/${encodeURIComponent(activeSchedule.key)}`,
      {
        method: "PUT",
        headers: { Authorization: auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: false }),
      }
    );

    if (!disable.ok) {
      return NextResponse.json(
        { error: "We found your donation but couldn't cancel it. Please contact us." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("USAePay cancel error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Something went wrong. Please contact us." }, { status: 500 });
  }
}
