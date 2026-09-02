import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { fetchTransactionsSince, txnDate } from "../../lib/usaepay-transactions";
import { fetchOfflineDonations } from "../../lib/merchant-funding-offline";

// How far back to read. It matches the campaign's first day: reading further
// would start pulling in a PREVIOUS year's campaign, whose descriptions carry
// the same "Rosh Hashanah Campaign" wording this total matches on.
const FETCH_SINCE = "2026-07-24";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Every response must be fresh — donors expect the progress bar to reflect
// the latest total, not a cached snapshot from the browser or a CDN.
function json(body: unknown, init?: ResponseInit) {
  const res = NextResponse.json(body, init);
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return res;
}

// Donations made outside the website's card form (Venmo, PayPal, Cash App,
// The Donors Fund, JCF) never touch USAePay, so staff log them in a Google
// Sheet and we add that running total here.
//
// Best-effort by design: if the sheet is slow, unreachable, or misconfigured,
// we return 0 for it rather than letting the whole progress bar fail.
//
// Cached in memory rather than via fetch's `next.revalidate`, because this
// route is force-dynamic (revalidate = 0) and Next rejects a longer per-fetch
// revalidate inside such a route — which took the whole endpoint down.
let otherCache: { value: number; at: number } | null = null;
const OTHER_CACHE_MS = 60_000;

// The campaign page polls this endpoint every 10s per visitor. Without a cache
// that meant every visitor pulling 500 transactions from USAePay six times a
// minute, which is almost certainly what got our IPs connection-throttled.
// One upstream call per minute is plenty for a progress bar.
let cardCache: { value: number; at: number } | null = null;
const CARD_CACHE_MS = 60_000;

async function fetchOtherDonationsTotal(): Promise<{ total: number; error?: string }> {
  const url = process.env.OTHER_DONATIONS_URL;
  const secret = process.env.OTHER_DONATIONS_SECRET;
  if (!url) return { total: 0 };

  if (otherCache && Date.now() - otherCache.at < OTHER_CACHE_MS) {
    return { total: otherCache.value };
  }

  try {
    const res = await fetch(`${url}?secret=${encodeURIComponent(secret || "")}`, {
      redirect: "follow",
      cache: "no-store",
    });
    if (!res.ok) return { total: 0, error: `HTTP ${res.status}` };

    const text = await res.text();
    let parsed: { total?: unknown; error?: unknown };
    try {
      parsed = JSON.parse(text);
    } catch {
      // Apps Script returns an HTML error page when misconfigured.
      return { total: 0, error: `non-JSON response: ${text.slice(0, 120)}` };
    }
    if (parsed.error) return { total: 0, error: String(parsed.error) };

    const value = parseFloat(String(parsed.total));
    if (!Number.isFinite(value) || value < 0) {
      return { total: 0, error: `bad total: ${String(parsed.total)}` };
    }
    otherCache = { value, at: Date.now() };
    return { total: value };
  } catch (err) {
    return { total: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

// Fetch total donations from USAePay for the campaign progress bar
export async function GET(req: NextRequest) {
  const debug = req.nextUrl.searchParams.get("debug") === "1";
  try {
    const sourceKey = process.env.NEXT_PUBLIC_USAEPAY_SOURCE_KEY?.trim();
    const pin = process.env.USAEPAY_PIN?.trim();
    const endpoint = process.env.USAEPAY_ENDPOINT || "https://usaepay.com/api/v2";

    if (!sourceKey || !pin) {
      return json({ total: 0 });
    }

    // Serve the cached card total when it's fresh, so visitor polling never
    // reaches USAePay directly.
    if (!debug && cardCache && Date.now() - cardCache.at < CARD_CACHE_MS) {
      const cachedOther = await fetchOtherDonationsTotal();
      // The campaign sheet belongs in every path that returns a total, not just
      // the uncached one — otherwise the bar changes value depending on whether
      // the cache happens to be warm.
      const cachedCampaign = await fetchOfflineDonations();
      return json({
        total: Math.round(cardCache.value + cachedOther.total + cachedCampaign.mainBarTotal),
      });
    }

    // Paged back to the campaign's first day rather than taking a flat 500.
    // USAePay returns newest first and caps a page at 500, which on this
    // account is only about a month of activity — the campaign's earliest
    // donations were about to start dropping out of this total.
    const { txns: transactions, complete } = await fetchTransactionsSince(
      endpoint,
      sourceKey,
      pin,
      FETCH_SINCE
    );

    // Only count donations explicitly tagged as Rosh Hashanah Campaign — otherwise
    // this sums the merchant account's entire donation history (mail, phone, the
    // general donate page, etc.), not just this specific campaign. That history is
    // large: recurring, the old payment page and DonorSuite together hold well over
    // $150k of non-campaign money on this same account.
    //
    // The telemarketer is the exception. ADM submits campaign donations by phone
    // and cannot add our description tag, so they're matched by source instead —
    // but only from CAMPAIGN_START onward, since ADM also raises money for us
    // outside this campaign.
    //
    // NB: USAePay stores the label with a trailing space ("ADM Telemarketing "),
    // so this must compare trimmed. An exact match silently counts nothing.
    const ADM_SOURCE = "adm telemarketing";
    const CAMPAIGN_START = "2026-07-24"; // first day of Rosh Hashanah campaign donations

    const total = transactions
      .filter((t) => {
        const approved = t.result_code === "A" || t.result === "Approved";
        const trantype = (t.trantype || "").toLowerCase();
        const reversed = trantype.includes("void") || trantype.includes("refund");
        if (!approved || reversed) return false;

        // The paged fetch stops just past the campaign's first day, so its last
        // page straddles the cutoff. Without a date guard a donation from a
        // PREVIOUS year's Rosh Hashanah campaign — same description wording —
        // would be counted into this year's total.
        //
        // Only a date we can actually read may exclude a donation. USAePay is
        // not consistent about which field carries it, and treating a missing
        // date as "too old" silently dropped $8,835 from this total.
        const when = txnDate(t);
        if (when && when < CAMPAIGN_START) return false;

        const tagged = (t.description || "").toLowerCase().includes("rosh hashanah campaign");
        if (tagged) return true;

        const source = (t.source_name || "").trim().toLowerCase();
        return source === ADM_SOURCE && when >= CAMPAIGN_START;
      })
      .reduce((sum, t) => sum + (parseFloat(String(t.amount)) || 0), 0);

    // A crawl that stopped early is missing the oldest donations, so publishing
    // it would show the bar going backwards. Serve the last good figure instead.
    if (!complete && cardCache) {
      console.error("Donation total: page limit hit before reaching campaign start");
      const cachedOther = await fetchOtherDonationsTotal();
      const cachedCampaign = await fetchOfflineDonations();
      return json({
        total: Math.round(cardCache.value + cachedOther.total + cachedCampaign.mainBarTotal),
        stale: true,
      });
    }

    cardCache = { value: total, at: Date.now() };

    const other = await fetchOtherDonationsTotal();

    // The merchant funding campaign's own offline sheet counts here too. A
    // cheque to that campaign is still a donation to this one, exactly as a
    // card donation through the campaign page already lands on both bars.
    // Separate sheet, separate source, so nothing is counted twice.
    const campaignOffline = await fetchOfflineDonations();
    if (campaignOffline.error) console.error("Campaign offline sheet:", campaignOffline.error);

    const combined = total + other.total + campaignOffline.mainBarTotal;

    if (debug) {
      return json({
        total: Math.round(combined),
        debug: {
          cardTotal: Math.round(total),
          otherPlatformsTotal: Math.round(other.total),
          campaignOfflineTotal: Math.round(campaignOffline.mainBarTotal),
          campaignOfflineGross: Math.round(campaignOffline.total),
          campaignOfflineError: campaignOffline.error ?? null,
          otherPlatformsError: other.error ?? null,
          otherPlatformsConfigured: Boolean(process.env.OTHER_DONATIONS_URL),
          transactionCount: transactions.length,
          pagedToCampaignStart: complete,
          sample: transactions.slice(0, 10),
        },
      });
    }

    return json({ total: Math.round(combined) });
  } catch (err) {
    // Node wraps network failures as a bare "fetch failed" — the actual reason
    // (DNS, TLS, refused, timeout) is only on the nested `cause`.
    const cause = (err as { cause?: unknown })?.cause;
    const message =
      (err instanceof Error ? err.message : String(err)) +
      (cause ? ` | cause: ${cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause)}` : "");
    console.error("Failed to fetch donation total:", message);
    // Surface the reason when debugging — a bare { total: 0 } made a hard
    // failure look identical to a campaign that simply hadn't raised anything.
    if (debug) return json({ total: 0, debug: { fatalError: message } });
    return json({ total: 0 });
  }
}
