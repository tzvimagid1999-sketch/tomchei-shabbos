import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// TEMP diagnostic/repair: set numleft="*" (USAePay's value for "bill forever")
// on a customer's active billing schedule, then read it back to confirm the
// gateway accepted it. Schedules created without numleft default to "0", which
// means zero payments remaining — they never charge again.
export async function GET(req: NextRequest) {
  const sourceKey = process.env.NEXT_PUBLIC_USAEPAY_SOURCE_KEY?.trim();
  const pin = process.env.USAEPAY_PIN?.trim();
  const endpoint = process.env.USAEPAY_ENDPOINT || "https://usaepay.com/api/v2";
  if (!sourceKey || !pin) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const custkey = req.nextUrl.searchParams.get("custkey");
  const apply = req.nextUrl.searchParams.get("apply") === "1";
  const scan = req.nextUrl.searchParams.get("scan") === "1";

  const auth = () => {
    const seed = crypto.randomBytes(16).toString("hex");
    const hash = crypto.createHash("sha256").update(sourceKey + seed + pin).digest("hex");
    return "Basic " + Buffer.from(`${sourceKey}:s2/${seed}/${hash}`).toString("base64");
  };

  // Scan mode: find every enabled schedule stuck at numleft=0, and optionally
  // repair them all to the indefinite count.
  if (scan) {
    const custRes = await fetch(`${endpoint}/customers?limit=200`, { headers: { Authorization: auth() } });
    const custList = await custRes.json();
    const customers = (custList?.data || []) as Array<{
      custkey?: string; key?: string; email?: string;
      billing_schedules?: Array<{ key: string; numleft?: string; enabled?: string; description?: string }>;
    }>;

    const broken: Array<Record<string, unknown>> = [];
    for (const c of customers) {
      const ck = c.custkey || c.key;
      if (!ck) continue;
      for (const s of c.billing_schedules || []) {
        if (s.enabled === "1" && String(s.numleft) === "0") {
          let repaired: string | undefined;
          if (apply) {
            await fetch(`${endpoint}/customers/${encodeURIComponent(ck)}/billing_schedules/${encodeURIComponent(s.key)}`, {
              method: "PUT",
              headers: { Authorization: auth(), "Content-Type": "application/json" },
              body: JSON.stringify({ numleft: 9999 }),
            });
            const v = await fetch(`${endpoint}/customers/${encodeURIComponent(ck)}/billing_schedules`, {
              headers: { Authorization: auth() },
            });
            const after = await v.json();
            repaired = ((after?.data || []) as Array<{ key: string; numleft?: string }>)
              .find((x) => x.key === s.key)?.numleft;
          }
          broken.push({ custkey: ck, email: c.email, scheduleKey: s.key, description: s.description, numleftAfter: repaired });
        }
      }
    }
    return NextResponse.json({ customersChecked: customers.length, brokenCount: broken.length, applied: apply, broken });
  }

  if (!custkey) return NextResponse.json({ error: "Missing custkey" }, { status: 400 });

  const listRes = await fetch(`${endpoint}/customers/${encodeURIComponent(custkey)}/billing_schedules`, {
    headers: { Authorization: auth() },
  });
  const list = await listRes.json();
  const schedules = (list?.data || []) as Array<{ key: string; numleft?: string; enabled?: string }>;
  const active = schedules.find((s) => s.enabled === "1") || schedules[0];
  if (!active?.key) return NextResponse.json({ error: "no schedule found", list });

  if (!apply) {
    return NextResponse.json({ scheduleKey: active.key, currentNumleft: active.numleft, applied: false });
  }

  const putRes = await fetch(
    `${endpoint}/customers/${encodeURIComponent(custkey)}/billing_schedules/${encodeURIComponent(active.key)}`,
    {
      method: "PUT",
      headers: { Authorization: auth(), "Content-Type": "application/json" },
      body: JSON.stringify({ numleft: req.nextUrl.searchParams.get("value") ?? "*" }),
    }
  );
  const putRaw = await putRes.text();

  const afterRes = await fetch(`${endpoint}/customers/${encodeURIComponent(custkey)}/billing_schedules`, {
    headers: { Authorization: auth() },
  });
  const after = await afterRes.json();
  const updated = ((after?.data || []) as Array<{ key: string; numleft?: string }>).find((s) => s.key === active.key);

  return NextResponse.json({
    scheduleKey: active.key,
    before: active.numleft,
    putStatus: putRes.status,
    putResponse: putRaw.slice(0, 300),
    after: updated?.numleft,
  });
}
