import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// TEMP diagnostic: verify the field name for limiting a schedule to N payments.
export async function POST(req: NextRequest) {
  const sourceKey = process.env.NEXT_PUBLIC_USAEPAY_SOURCE_KEY?.trim();
  const pin = process.env.USAEPAY_PIN?.trim();
  const endpoint = process.env.USAEPAY_ENDPOINT || "https://usaepay.com/api/v2";
  if (!sourceKey || !pin) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const auth = () => {
    const seed = crypto.randomBytes(16).toString("hex");
    const hash = crypto.createHash("sha256").update(sourceKey + seed + pin).digest("hex");
    return "Basic " + Buffer.from(`${sourceKey}:s2/${seed}/${hash}`).toString("base64");
  };

  // Create a throwaway test customer
  const custRes = await fetch(`${endpoint}/customers`, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify({ firstname: "Pledge", lastname: "Test", company: "Pledge Test" }),
  });
  const cust = JSON.parse(await custRes.text());
  const custkey = cust.key;

  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const startDate = nextMonth.toISOString().slice(0, 10);

  // Try numleft to cap at 12 payments
  const schedRes = await fetch(`${endpoint}/customers/${custkey}/billing_schedules`, {
    method: "POST",
    headers: { Authorization: auth(), "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: "8333.33",
      frequency: "monthly",
      start_date: startDate,
      numleft: 12,
      enabled: true,
      description: "TEST pledge over 12 months",
    }),
  });
  const schedRaw = await schedRes.text();

  return NextResponse.json({ custkey, status: schedRes.status, raw: schedRaw });
}
