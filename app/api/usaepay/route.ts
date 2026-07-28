import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Charges a donation through the USAePay gateway using a payment token
// (payment_key) that was generated in the donor's browser by pay.js.
// The raw card number never reaches this server — only the token does.
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

    // Build the USAePay v2 auth hash: s2/<seed>/<sha256(sourceKey + seed + pin)>
    const seed = crypto.randomBytes(16).toString("hex");
    const prehash = sourceKey + seed + pin;
    const hash = crypto.createHash("sha256").update(prehash).digest("hex");
    const apiHash = `s2/${seed}/${hash}`;
    const authHeader =
      "Basic " + Buffer.from(`${sourceKey}:${apiHash}`).toString("base64");

    const res = await fetch(`${endpoint}/transactions`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        command: "cc:sale",
        amount: numericAmount.toFixed(2),
        payment_key: paymentKey,
        email: email || undefined,
        description: "Donation to Tomchei Shabbos of Florida",
        billing_address: {
          firstname: name || undefined,
          street: street || undefined,
          city: city || undefined,
          state: state || undefined,
          postalcode: zip || undefined,
          country: "US",
        },
      }),
    });

    const data = await res.json();

    if (data.result === "Approved" || data.result_code === "A") {
      return NextResponse.json({
        success: true,
        refnum: data.refnum,
        authcode: data.authcode,
      });
    }

    return NextResponse.json(
      { error: data.error || "Your card was declined. Please try another card." },
      { status: 402 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("USAePay error:", message);
    return NextResponse.json(
      { error: "Something went wrong processing your donation. Please try again." },
      { status: 500 }
    );
  }
}
