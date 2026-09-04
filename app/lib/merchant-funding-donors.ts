// Names for the merchant funding campaign's donor wall, newest first.
//
// Only donations whose description carries a [wall:...] tag appear here, and
// that tag is written only when the donor ticked the box asking to be named.
// An [anon:...] tag lists a donor as "Anonymous" without exposing who they
// are. Everyone else is invisible to this function — there is no way for it
// to surface a donor who did not opt into one or the other.
//
// Extracted from the API route so the campaign page's SERVER render can call
// it directly and ship the donor list in the very first HTML response,
// instead of every visitor's browser fetching it after the page has already
// loaded — the gap that made the ticker and the supporter list appear empty
// until a manual refresh, worst on a slow mobile connection.
import {
  parseWallName,
  parseCompanyName,
  parseAnonId,
  pledgeMultiplier,
  isExcludedTestDonation,
} from "./donor-wall";
import { fetchTransactionsSince, txnDate, isAfterLaunch } from "./usaepay-transactions";
import { fetchOfflineDonations } from "./merchant-funding-offline";

export type Donor = { name: string; company?: string; amount: number };

const TAG = "[team:merchant-funding]";
const MAX = 30;
const CAMPAIGN_START = "2026-07-24";

// Reading the names costs a full crawl of the transaction feed — about 14
// seconds — so it is cached hard. But a donor who has just given refreshes the
// page looking for their own name, and not finding it reads as broken, so the
// window is kept to about a minute rather than the several it could be.
//
// Shared across every caller in this server instance — the API route and the
// page's own server render both read and populate the same cache, so neither
// one duplicates the other's crawl.
let cache: { value: Donor[]; at: number } | null = null;
const CACHE_MS = 45_000;

export async function getMerchantFundingDonors(): Promise<{ donors: Donor[]; stale?: boolean }> {
  if (cache && Date.now() - cache.at < CACHE_MS) return { donors: cache.value };

  const sourceKey = process.env.NEXT_PUBLIC_USAEPAY_SOURCE_KEY?.trim();
  const pin = process.env.USAEPAY_PIN?.trim();
  const endpoint = process.env.USAEPAY_ENDPOINT || "https://usaepay.com/api/v2";
  if (!sourceKey || !pin) return { donors: [] };

  try {
    const { txns } = await fetchTransactionsSince(endpoint, sourceKey, pin, CAMPAIGN_START);

    const donors: Donor[] = [];
    const seen = new Set<string>();
    // USAePay returns newest first, so walking forwards gives newest first —
    // which is what the wall should show once there are more than MAX names.
    for (let i = 0; i < txns.length && donors.length < MAX; i++) {
      const t = txns[i];
      if (txnDate(t) < CAMPAIGN_START) continue;
      // Staff test donations made while the page was being built.
      if (!isAfterLaunch(t)) continue;
      const approved = t.result_code === "A" || t.result === "Approved";
      const trantype = (t.trantype || "").toLowerCase();
      if (!approved || trantype.includes("void") || trantype.includes("refund")) continue;
      if (!(t.description || "").toLowerCase().includes(TAG)) continue;
      // Skip the scheduled charges of a fixed-term pledge: the pledge was shown
      // in full on its first charge, so counting these would show the donor a
      // second time with a smaller figure than the bar credits them.
      const multiplier = pledgeMultiplier(t.description);
      if (multiplier === 0) continue;

      // A test donation that reached the live page and could not be voided.
      // Matched on the figure the page actually shows, which for a pledge is
      // the whole commitment rather than the single charge behind it.
      const shown = Math.round((parseFloat(String(t.amount)) || 0) * multiplier);
      if (isExcludedTestDonation(t.description, shown)) continue;

      const wallName = parseWallName(t.description);
      const anonId = wallName ? null : parseAnonId(t.description);
      // Neither tag: the donor never opted to be shown, one way or the other.
      // The money still counted towards the total; it just has no place here.
      if (!wallName && !anonId) continue;

      // Every qualifying transaction gets its own row — two gifts from the
      // same person are two gifts, shown twice, not merged into one. The only
      // thing that ever collapses to a single row is a fixed-term PLEDGE's own
      // later instalments, which were already excluded above (multiplier===0):
      // that is one commitment credited once in full, not several gifts.
      const company = wallName ? parseCompanyName(t.description) : null;
      const key = wallName
        ? `${wallName.toLowerCase()}|${(company || "").toLowerCase()}`
        : `anon:${anonId}`;
      // Recorded, not enforced: kept only so the offline sheet below can tell
      // a row apart from a card donor of the same name and company, and skip
      // logging the same real-world gift twice — not to limit how many times
      // one person may appear here.
      seen.add(key);

      donors.push({
        name: wallName ?? "Anonymous",
        // Guards against a donor typing their own name again into the company
        // field — shown only when it actually adds information.
        ...(company && wallName && company.toLowerCase() !== wallName.toLowerCase() ? { company } : {}),
        amount: Math.round((parseFloat(String(t.amount)) || 0) * multiplier),
      });
    }

    // Cheques, wires and phone pledges from the campaign's sheet, shown on the
    // wall beside the card donations. Listed first: these are the largest gifts
    // and are entered by hand, so they are the ones staff most expect to see.
    const offline = await fetchOfflineDonations();
    if (offline.error) console.error("Campaign offline sheet:", offline.error);
    const combined = [
      ...offline.donors.filter((d) => {
        // Same key shape as the card donors above (name + company together),
        // so a sheet row for someone who also gave by card is only skipped
        // when both the name and the company genuinely match.
        const key = `${d.name.toLowerCase()}|${(d.company || "").toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }),
      ...donors,
    ].slice(0, MAX);

    cache = { value: combined, at: Date.now() };
    return { donors: combined };
  } catch (err) {
    console.error(
      "Failed to fetch merchant funding donors:",
      err instanceof Error ? err.message : String(err)
    );
    // An empty wall is the safe failure: it under-reports rather than showing
    // a stale or wrong name against a donation.
    if (cache) return { donors: cache.value, stale: true };
    return { donors: [] };
  }
}
