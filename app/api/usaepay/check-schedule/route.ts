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
