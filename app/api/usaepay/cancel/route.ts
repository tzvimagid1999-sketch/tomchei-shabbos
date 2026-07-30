import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { verifyCustKey } from "../../../lib/donation-email";

// Cancels a monthly recurring donation. Two ways in:
//  1) One-click link from the confirmation email: { custkey, sig } — the HMAC
//     signature proves authenticity, so no further check is needed.
//  2) Manual form: { custkey (cancellation code) + email } — we disable only if
//     the email matches the record, so a guessed code alone can't cancel someone else's.
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

    // For the manual path, verify the email on the record matches.
    if (!oneClickValid) {
      if (!email) {
        return NextResponse.json({ error: "Please enter your email." }, { status: 400 });
      }
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
      const recordEmail = String(customer.email || "").trim().toLowerCase();
      if (!recordEmail || recordEmail !== String(email).trim().toLowerCase()) {
        return NextResponse.json(
          { error: "That email doesn't match this confirmation number." },
          { status: 403 }
        );
      }
    }

    // Disable the recurring schedule (stops future charges, keeps the record).
    const disable = await fetch(`${endpoint}/customers/${encodeURIComponent(custkey)}`, {
      method: "POST",
      headers: { Authorization: auth(), "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: false }),
    });

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
