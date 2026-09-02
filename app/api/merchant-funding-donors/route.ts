import { NextResponse } from "next/server";
import { parseWallName, pledgeMultiplier } from "../../lib/donor-wall";
import { fetchTransactionsSince, txnDate } from "../../lib/usaepay-transactions";

export const dynamic = "force-dynamic";

// Names for the merchant funding campaign's donor wall, newest first.
//
// Only donations whose description carries a [wall:...] tag appear here, and
// that tag is written only when the donor ticked the box asking to be named.
// Everyone else is invisible to this endpoint — there is no way for it to
// surface a donor who did not opt in.
//
// Amounts are shown alongside the name, at the organisation's request. Both are
// covered by the same opt-in: no tag, no name and no figure.
const TAG = "[team:merchant-funding]";
const MAX = 30;
const CAMPAIGN_START = "2026-07-24";

type Donor = { name: string; amount: number };

// Reading the names costs a full crawl of the transaction feed — about 14
// seconds — so it is cached hard. But a donor who has just given refreshes the
// page looking for their own name, and not finding it reads as broken, so the
// window is kept to about a minute rather than the several it could be.
let cache: { value: Donor[]; at: number } | null = null;
const CACHE_MS = 45_000;

// Cached at Vercel's edge, not just in this instance's memory. The in-memory
// cache only helps a visitor who happens to land on an already-warm instance;
// everyone else waited out the full crawl, which is what made the page take
// ten seconds to fill in.
//
// stale-while-revalidate is the important half: once the edge has any copy, it
// answers instantly and refreshes in the background, so a visitor never pays
// for the refresh.
//
// The revalidate window is deliberately short. A longer one is cheaper, but it
// means a donor who has just given can refresh and not see their own name for
// several minutes, which reads as the page being broken. A minute of staleness
// is the most this should carry.
//
// Safe to cache publicly: this response is identical for every visitor and
// holds only names donors asked to have shown.
//
// Next rewrites Cache-Control on route handlers and drops s-maxage, so the CDN
// directives go in the headers Vercel reads instead and leaves alone.
const EDGE_CACHE = "public, s-maxage=45, stale-while-revalidate=120";
const json = (body: unknown) =>
  NextResponse.json(body, {
    headers: {
      "Cache-Control": EDGE_CACHE,
      "CDN-Cache-Control": EDGE_CACHE,
      "Vercel-CDN-Cache-Control": EDGE_CACHE,
    },
  });

export async function GET() {
  try {
    if (cache && Date.now() - cache.at < CACHE_MS) return json({ donors: cache.value });

    const sourceKey = process.env.NEXT_PUBLIC_USAEPAY_SOURCE_KEY?.trim();
    const pin = process.env.USAEPAY_PIN?.trim();
    const endpoint = process.env.USAEPAY_ENDPOINT || "https://usaepay.com/api/v2";
    if (!sourceKey || !pin) return json({ donors: [] });

    const { txns } = await fetchTransactionsSince(endpoint, sourceKey, pin, CAMPAIGN_START);

    const donors: Donor[] = [];
    const seen = new Set<string>();
    // USAePay returns newest first, so walking forwards gives newest first —
    // which is what the wall should show once there are more than MAX names.
    for (let i = 0; i < txns.length && donors.length < MAX; i++) {
      const t = txns[i];
      if (txnDate(t) < CAMPAIGN_START) continue;
      const approved = t.result_code === "A" || t.result === "Approved";
      const trantype = (t.trantype || "").toLowerCase();
      if (!approved || trantype.includes("void") || trantype.includes("refund")) continue;
      if (!(t.description || "").toLowerCase().includes(TAG)) continue;
      // Skip the scheduled charges of a fixed-term pledge: the pledge was shown
      // in full on its first charge, so counting these would show the donor a
      // second time with a smaller figure than the bar credits them.
      const multiplier = pledgeMultiplier(t.description);
      if (multiplier === 0) continue;

      const name = parseWallName(t.description);
      if (!name) continue;
      // A monthly donor charges every month; show them once.
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      // A pledge shows its full commitment, matching what the bar credits.
      donors.push({ name, amount: Math.round((parseFloat(String(t.amount)) || 0) * multiplier) });
    }

    cache = { value: donors, at: Date.now() };
    return json({ donors });
  } catch (err) {
    console.error(
      "Failed to fetch merchant funding donors:",
      err instanceof Error ? err.message : String(err)
    );
    // An empty wall is the safe failure: it under-reports rather than showing
    // a stale or wrong name against a donation.
    if (cache) return json({ donors: cache.value, stale: true });
    return json({ donors: [] });
  }
}
