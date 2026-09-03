import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// TEMPORARY, read-only. Re-added to trace one specific $500 donation that
// shows in MerchPay but not on the campaign page. Gated behind DEBUG_TOKEN and
// deleted again once the question is answered — see the equivalent tool used
// earlier today for the schedule and pagination bugs, deleted at the user's
// request once those were resolved.
export async function GET(req: Request) {
  const token = process.env.DEBUG_TOKEN;
  const given = new URL(req.url).searchParams.get("token");
  const ok =
    !!token &&
    !!given &&
    token.length === given.length &&
    crypto.timingSafeEqual(Buffer.from(token), Buffer.from(given));
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });

  const sourceKey = process.env.NEXT_PUBLIC_USAEPAY_SOURCE_KEY?.trim();
  const pin = process.env.USAEPAY_PIN?.trim();
  const endpoint = process.env.USAEPAY_ENDPOINT || "https://usaepay.com/api/v2";
  if (!sourceKey || !pin) return NextResponse.json({ error: "no credentials" }, { status: 500 });

  const auth = () => {
    const seed = crypto.randomBytes(16).toString("hex");
    const hash = crypto.createHash("sha256").update(sourceKey + seed + pin).digest("hex");
    return "Basic " + Buffer.from(`${sourceKey}:s2/${seed}/${hash}`).toString("base64");
  };

  const sp = new URL(req.url).searchParams;
  const wantAmount = sp.get("amount"); // e.g. "500"

  const res = await fetch(`${endpoint}/transactions?limit=500&type=sale`, {
    headers: { Authorization: auth(), "Content-Type": "application/json" },
  });
  const data = await res.json();
  const txns = (data.transactions || data.data || []) as Array<Record<string, unknown>>;

  const matches = txns
    .filter((t) => {
      if (!wantAmount) return true;
      const amt = parseFloat(String(t.amount));
      return Math.abs(amt - parseFloat(wantAmount)) < 0.01;
    })
    .map((t) => ({
      when: t.created ?? t.datetime ?? t.date,
      amount: t.amount,
      result: t.result ?? t.result_code,
      trantype: t.trantype,
      source_name: t.source_name,
      description: t.description,
      hasCampaignTag: String(t.description ?? "").toLowerCase().includes("[team:merchant-funding]"),
    }));

  return NextResponse.json({ totalReturned: txns.length, matches });
}
