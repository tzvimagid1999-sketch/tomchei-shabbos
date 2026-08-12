import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// TEMP diagnostic: fetch the raw billing_schedules payload for a customer so we
// can see every field USAePay actually stores/returns (not just what our UI shows).
export async function GET(req: NextRequest) {
  const sourceKey = process.env.NEXT_PUBLIC_USAEPAY_SOURCE_KEY?.trim();
  const pin = process.env.USAEPAY_PIN?.trim();
  const endpoint = process.env.USAEPAY_ENDPOINT || "https://usaepay.com/api/v2";
  if (!sourceKey || !pin) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const custkey = req.nextUrl.searchParams.get("custkey");
  if (!custkey) return NextResponse.json({ error: "Missing custkey" }, { status: 400 });

  const auth = () => {
    const seed = crypto.randomBytes(16).toString("hex");
    const hash = crypto.createHash("sha256").update(sourceKey + seed + pin).digest("hex");
    return "Basic " + Buffer.from(`${sourceKey}:s2/${seed}/${hash}`).toString("base64");
  };

  const custRes = await fetch(`${endpoint}/customers/${encodeURIComponent(custkey)}`, {
    headers: { Authorization: auth() },
  });
  const customer = await custRes.json();

  const schedRes = await fetch(`${endpoint}/customers/${encodeURIComponent(custkey)}/billing_schedules`, {
    headers: { Authorization: auth() },
  });
  const schedRaw = await schedRes.text();
  let schedules: unknown = {};
  try { schedules = JSON.parse(schedRaw); } catch { schedules = schedRaw; }

  return NextResponse.json({
    customerBillingSchedules: customer.billing_schedules,
    scheduleEndpointResponse: schedules,
  });
}
