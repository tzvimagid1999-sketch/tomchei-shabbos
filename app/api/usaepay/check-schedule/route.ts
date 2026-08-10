import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// TEMP diagnostic route: given a custkey, show the customer record and any
// schedules attached to it, so we can confirm Step 3 actually succeeded.
export async function GET(req: NextRequest) {
  const custkey = req.nextUrl.searchParams.get("custkey");
  if (!custkey) return NextResponse.json({ error: "Missing custkey" }, { status: 400 });

  const sourceKey = process.env.NEXT_PUBLIC_USAEPAY_SOURCE_KEY?.trim();
  const pin = process.env.USAEPAY_PIN?.trim();
  const endpoint = process.env.USAEPAY_ENDPOINT || "https://usaepay.com/api/v2";
  if (!sourceKey || !pin) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const auth = () => {
    const seed = crypto.randomBytes(16).toString("hex");
    const hash = crypto.createHash("sha256").update(sourceKey + seed + pin).digest("hex");
    return "Basic " + Buffer.from(`${sourceKey}:s2/${seed}/${hash}`).toString("base64");
  };

  const [custRes, schedRes] = await Promise.all([
    fetch(`${endpoint}/customers/${custkey}`, { headers: { Authorization: auth() } }),
    fetch(`${endpoint}/customers/${custkey}/schedules`, { headers: { Authorization: auth() } }),
  ]);

  const customer = await custRes.text();
  const schedules = await schedRes.text();

  return NextResponse.json({
    customer: { status: custRes.status, body: JSON.parse(customer || "{}") },
    schedules: { status: schedRes.status, body: JSON.parse(schedules || "{}") },
  });
}

// TEMP: attempt to create a schedule on an existing customer to see the real error.
// Body and path are overridable via query params so we can try variations
// without redeploying: ?custkey=X&path=/customers/X/schedules&pmkey=Y
export async function POST(req: NextRequest) {
  const custkey = req.nextUrl.searchParams.get("custkey");
  if (!custkey) return NextResponse.json({ error: "Missing custkey" }, { status: 400 });

  const sourceKey = process.env.NEXT_PUBLIC_USAEPAY_SOURCE_KEY?.trim();
  const pin = process.env.USAEPAY_PIN?.trim();
  const endpoint = process.env.USAEPAY_ENDPOINT || "https://usaepay.com/api/v2";
  if (!sourceKey || !pin) return NextResponse.json({ error: "Not configured" }, { status: 500 });

  const seed = crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHash("sha256").update(sourceKey + seed + pin).digest("hex");
  const authHeader = "Basic " + Buffer.from(`${sourceKey}:s2/${seed}/${hash}`).toString("base64");

  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const nextBill = nextMonth.toISOString().slice(0, 10);

  const pmkey = req.nextUrl.searchParams.get("pmkey");
  const pathOverride = req.nextUrl.searchParams.get("path");
  const path = pathOverride || `/customers/${custkey}/schedules`;

  let bodyOverride: Record<string, unknown> | null = null;
  try {
    const text = await req.text();
    if (text) bodyOverride = JSON.parse(text);
  } catch { /* no body sent, use default */ }

  const body = bodyOverride || {
    amount: "1.00",
    frequency: "monthly",
    start_date: nextBill,
    description: "TEST schedule creation",
    ...(pmkey ? { payment_method: pmkey } : {}),
  };

  const res = await fetch(`${endpoint}${path}`, {
    method: "POST",
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => { headers[k] = v; });

  return NextResponse.json({ url: `${endpoint}${path}`, sentBody: body, status: res.status, headers, raw });
}
