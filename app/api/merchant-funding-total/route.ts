import { NextResponse } from "next/server";
import { pledgeMultiplier } from "../../lib/donor-wall";
import { fetchTransactionsSince, txnDate } from "../../lib/usaepay-transactions";

export const dynamic = "force-dynamic";

// Total raised by the merchant funding campaign page.
//
// It reads the same USAePay transaction feed the main bar uses, but counts only
// donations carrying this campaign's tag. Those donations also appear on the
// main bar, because their description still contains the Rosh Hashanah wording
// that bar looks for — the same dollar shown in two places, by design.
//
// Cached for 60s and served from cache to every visitor. That cache is not an
// optimisation: polling USAePay once per visitor per few seconds got this site's
// IP throttled mid-campaign and took live donations down for an hour.
const TAG = "[team:merchant-funding]";

// No campaign donation predates this. It bounds the paged fetch, and stops a
// straddling final page from ever reaching a previous year's campaign.
const CAMPAIGN_START = "2026-07-24";

let cache: { value: number; at: number } | null = null;
const CACHE_MS = 60_000;

const json = (body: unknown) =>
  NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });

export async function GET() {
  try {
    if (cache && Date.now() - cache.at < CACHE_MS) return json({ total: cache.value });

    const sourceKey = process.env.NEXT_PUBLIC_USAEPAY_SOURCE_KEY?.trim();
    const pin = process.env.USAEPAY_PIN?.trim();
    const endpoint = process.env.USAEPAY_ENDPOINT || "https://usaepay.com/api/v2";
    if (!sourceKey || !pin) return json({ total: 0 });

    const { txns, complete } = await fetchTransactionsSince(endpoint, sourceKey, pin, CAMPAIGN_START);

    const total = txns.reduce((sum, t) => {
      const approved = t.result_code === "A" || t.result === "Approved";
      const trantype = (t.trantype || "").toLowerCase();
      if (!approved || trantype.includes("void") || trantype.includes("refund")) return sum;
      if (!(t.description || "").toLowerCase().includes(TAG)) return sum;
      // The final page straddles the cutoff and can carry older transactions.
      if (txnDate(t) < CAMPAIGN_START) return sum;
      // A fixed-term pledge counts its whole commitment on its first charge;
      // the scheduled charges that follow it count 0, so nothing is doubled.
      return sum + (parseFloat(String(t.amount)) || 0) * pledgeMultiplier(t.description);
    }, 0);

    // An incomplete crawl is missing the oldest donations, so it would under-
    // report. Keep serving the last good figure rather than publishing a total
    // that has quietly lost money.
    if (!complete) {
      console.error("Merchant funding total: page limit hit before reaching campaign start");
      if (cache) return json({ total: cache.value, stale: true });
    }

    cache = { value: Math.round(total), at: Date.now() };
    return json({ total: cache.value });
  } catch (err) {
    const cause = (err as { cause?: unknown })?.cause;
    console.error(
      "Failed to fetch merchant funding total:",
      (err instanceof Error ? err.message : String(err)) + (cause ? ` | cause: ${String(cause)}` : "")
    );
    // Serve the last good figure rather than a misleading zero.
    if (cache) return json({ total: cache.value, stale: true });
    return json({ total: 0, error: true });
  }
}
