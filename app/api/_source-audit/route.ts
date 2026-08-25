import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// TEMPORARY, PREVIEW-ONLY DIAGNOSTIC — DELETE AFTER USE.
//
// Answers one question: which "source" labels appear on this merchant account,
// so the progress bar can be widened to include the telemarketer's donations.
//
// Returns AGGREGATES ONLY — a source label, how many transactions carry it, the
// summed amount, and a date range. It never returns descriptions, names, emails,
// addresses or card data. Nothing here can expose a donor.
export async function GET() {
  const sourceKey = process.env.NEXT_PUBLIC_USAEPAY_SOURCE_KEY?.trim();
  const pin = process.env.USAEPAY_PIN?.trim();
  const endpoint = process.env.USAEPAY_ENDPOINT || "https://usaepay.com/api/v2";
  if (!sourceKey || !pin) return NextResponse.json({ error: "not configured" }, { status: 500 });

  const seed = crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHash("sha256").update(sourceKey + seed + pin).digest("hex");
  const authHeader = "Basic " + Buffer.from(`${sourceKey}:s2/${seed}/${hash}`).toString("base64");

  const res = await fetch(`${endpoint}/transactions?limit=500&type=sale`, {
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
  });
  const data = await res.json();
  const txns = (data.transactions || data.data || []) as Array<Record<string, unknown>>;

  const groups = new Map<string, { count: number; total: number; first?: string; last?: string; campaignTagged: number }>();
  for (const t of txns) {
    const approved = t.result_code === "A" || t.result === "Approved";
    if (!approved) continue;
    // `source` names whoever submitted the transaction (our site, a terminal, a
    // third-party dialer). Fall back to other plausible label fields.
    const label = String(t.source ?? t.source_name ?? t.sourcekey ?? "(no source)");
    const amt = parseFloat(String(t.amount)) || 0;
    const when = String(t.created ?? t.datetime ?? "").slice(0, 10);
    const tagged = String(t.description ?? "").toLowerCase().includes("rosh hashanah campaign");

    const g = groups.get(label) ?? { count: 0, total: 0, campaignTagged: 0 };
    g.count += 1;
    g.total += amt;
    g.campaignTagged += tagged ? 1 : 0;
    if (when) {
      if (!g.first || when < g.first) g.first = when;
      if (!g.last || when > g.last) g.last = when;
    }
    groups.set(label, g);
  }

  return NextResponse.json({
    transactionsScanned: txns.length,
    // Field names only, so we can see what the API actually returns to group by.
    availableFields: txns[0] ? Object.keys(txns[0]).sort() : [],
    bySource: [...groups.entries()]
      .map(([source, g]) => ({ source, ...g, total: Math.round(g.total) }))
      .sort((a, b) => b.total - a.total),
  });
}
