import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// TEMP diagnostic: test disabling a specific billing schedule.
export async function POST(req: NextRequest) {
  const custkey = req.nextUrl.searchParams.get("custkey");
  const schedkey = req.nextUrl.searchParams.get("schedkey");
  const method = req.nextUrl.searchParams.get("method") || "PUT";
  if (!custkey || !schedkey) return NextResponse.json({ error: "Missing custkey or schedkey" }, { status: 400 });

  const sourceKey = process.env.NEXT_PUBLIC_USAEPAY_SOURCE_KEY?.trim();
  const pin = process.env.USAEPAY_PIN?.trim();
  const endpoint = process.env.USAEPAY_ENDPOINT || "https://usaepay.com/api/v2";
  if (!sourceKey || !pin) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const seed = crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHash("sha256").update(sourceKey + seed + pin).digest("hex");
  const authHeader = "Basic " + Buffer.from(`${sourceKey}:s2/${seed}/${hash}`).toString("base64");

  const url = `${endpoint}/customers/${custkey}/billing_schedules/${schedkey}`;
  const res = await fetch(url, {
    method,
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
    body: method === "DELETE" ? undefined : JSON.stringify({ enabled: false }),
  });
  const raw = await res.text();

  // Re-fetch the customer to confirm actual state.
  const custRes = await fetch(`${endpoint}/customers/${custkey}`, { headers: { Authorization: authHeader } });
  const custRaw = await custRes.text();

  return NextResponse.json({ url, method, status: res.status, raw, customerAfter: JSON.parse(custRaw || "{}") });
}
