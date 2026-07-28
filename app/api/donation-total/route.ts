import { NextResponse } from "next/server";
import crypto from "crypto";

// Fetch total donations from USAePay for the campaign progress bar
export async function GET() {
  try {
    const sourceKey = process.env.NEXT_PUBLIC_USAEPAY_SOURCE_KEY?.trim();
    const pin = process.env.USAEPAY_PIN?.trim();
    const endpoint = process.env.USAEPAY_ENDPOINT || "https://usaepay.com/api/v2";

    if (!sourceKey || !pin) {
      return NextResponse.json({ total: 0 });
    }

    const seed = crypto.randomBytes(16).toString("hex");
    const hash = crypto.createHash("sha256").update(sourceKey + seed + pin).digest("hex");
    const authHeader =
      "Basic " + Buffer.from(`${sourceKey}:s2/${seed}/${hash}`).toString("base64");

    // Fetch all transactions for one-time + recurring donations
    const res = await fetch(`${endpoint}/transactions?limit=500&type=sale`, {
      headers: { Authorization: authHeader },
    });

    if (!res.ok) {
      return NextResponse.json({ total: 0 });
    }

    const data = await res.json();
    const transactions = (data.transactions || data.data || []) as Array<{
      result_code?: string;
      result?: string;
      amount?: number;
      total?: number;
    }>;

    // Sum only approved charges (result_code "A" or result "Approved")
    const total = transactions
      .filter((t) => t.result_code === "A" || t.result === "Approved")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return NextResponse.json({ total: Math.round(total) });
  } catch (err) {
    console.error("Failed to fetch donation total:", err);
    return NextResponse.json({ total: 0 });
  }
}
