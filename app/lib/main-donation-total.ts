// Total raised for the main site's Rosh Hashanah campaign bar.
//
// Extracted from the API route so the /RoshHashanah page's own SERVER render
// can call it directly and ship the real figure in the very first HTML,
// instead of every visitor's browser fetching it after the page has already
// loaded — the gap that showed "Calculating..." for as long as the fetch
// took, worst on a slow connection.
import { fetchTransactionsSince, txnDate } from "./usaepay-transactions";
import { fetchOfflineDonations } from "./merchant-funding-offline";

// How far back to read. It matches the campaign's first day: reading further
// would start pulling in a PREVIOUS year's campaign, whose descriptions carry
// the same "Rosh Hashanah Campaign" wording this total matches on.
const FETCH_SINCE = "2026-07-24";
const CAMPAIGN_START = FETCH_SINCE;

// The telemarketer is the exception. ADM submits campaign donations by phone
// and cannot add our description tag, so they're matched by source instead —
// but only from CAMPAIGN_START onward, since ADM also raises money for us
// outside this campaign.
//
// NB: USAePay stores the label with a trailing space ("ADM Telemarketing "),
// so this must compare trimmed. An exact match silently counts nothing.
const ADM_SOURCE = "adm telemarketing";

// Donations made outside the website's card form (Venmo, PayPal, Cash App,
// The Donors Fund, JCF) never touch USAePay, so staff log them in a Google
// Sheet and this adds that running total.
//
// Best-effort by design: if the sheet is slow, unreachable, or misconfigured,
// this returns 0 for it rather than letting the whole progress bar fail.
let otherCache: { value: number; at: number } | null = null;
const OTHER_CACHE_MS = 60_000;

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

// The campaign page polled this every 10s per visitor at one point. Without a
// cache that meant every visitor pulling 500 transactions from USAePay six
// times a minute, which is almost certainly what got our IPs throttled by
// USAePay for an hour. One upstream crawl per minute is plenty for a bar.
//
// Shared across every caller in this server instance — the API route and the
// page's own server render both read and populate the same cache.
let cardCache: { value: number; at: number } | null = null;
const CARD_CACHE_MS = 60_000;

type TotalResult = {
  total: number;
  stale?: boolean;
  debug?: Record<string, unknown>;
};

export async function getMainDonationTotal(opts?: { debug?: boolean }): Promise<TotalResult> {
  const debug = opts?.debug ?? false;
  try {
    const sourceKey = process.env.NEXT_PUBLIC_USAEPAY_SOURCE_KEY?.trim();
    const pin = process.env.USAEPAY_PIN?.trim();
    const endpoint = process.env.USAEPAY_ENDPOINT || "https://usaepay.com/api/v2";

    if (!sourceKey || !pin) return { total: 0 };

    // Serve the cached card total when it's fresh, so visitor polling never
    // reaches USAePay directly.
    if (!debug && cardCache && Date.now() - cardCache.at < CARD_CACHE_MS) {
      const cachedOther = await fetchOtherDonationsTotal();
      const cachedCampaign = await fetchOfflineDonations();
      return {
        total: Math.round(cardCache.value + cachedOther.total + cachedCampaign.mainBarTotal),
      };
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

    // Only count donations explicitly tagged as Rosh Hashanah Campaign —
    // otherwise this sums the merchant account's entire donation history
    // (mail, phone, the general donate page, etc.), not just this specific
    // campaign. That history is large: recurring, the old payment page and
    // DonorSuite together hold well over $150k of non-campaign money on this
    // same account.
    const total = transactions
      .filter((t) => {
        const approved = t.result_code === "A" || t.result === "Approved";
        const trantype = (t.trantype || "").toLowerCase();
        const reversed = trantype.includes("void") || trantype.includes("refund");
        if (!approved || reversed) return false;

        // The paged fetch stops just past the campaign's first day, so its
        // last page straddles the cutoff. Without a date guard a donation
        // from a PREVIOUS year's Rosh Hashanah campaign — same description
        // wording — would be counted into this year's total.
        //
        // Only a date we can actually read may exclude a donation. USAePay is
        // not consistent about which field carries it, and treating a
        // missing date as "too old" once silently dropped $8,835 from this
        // total.
        const when = txnDate(t);
        if (when && when < CAMPAIGN_START) return false;

        const tagged = (t.description || "").toLowerCase().includes("rosh hashanah campaign");
        if (tagged) return true;

        const source = (t.source_name || "").trim().toLowerCase();
        return source === ADM_SOURCE && when >= CAMPAIGN_START;
      })
      .reduce((sum, t) => sum + (parseFloat(String(t.amount)) || 0), 0);

    // A crawl that stopped early is missing the oldest donations, so
    // publishing it would show the bar going backwards. Serve the last good
    // figure instead.
    if (!complete && cardCache) {
      console.error("Donation total: page limit hit before reaching campaign start");
      const cachedOther = await fetchOtherDonationsTotal();
      const cachedCampaign = await fetchOfflineDonations();
      return {
        total: Math.round(cardCache.value + cachedOther.total + cachedCampaign.mainBarTotal),
        stale: true,
      };
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
      return {
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
      };
    }

    return { total: Math.round(combined) };
  } catch (err) {
    // Node wraps network failures as a bare "fetch failed" — the actual
    // reason (DNS, TLS, refused, timeout) is only on the nested `cause`.
    const cause = (err as { cause?: unknown })?.cause;
    const message =
      (err instanceof Error ? err.message : String(err)) +
      (cause ? ` | cause: ${cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause)}` : "");
    console.error("Failed to fetch donation total:", message);
    if (debug) return { total: 0, debug: { fatalError: message } };
    return { total: 0 };
  }
}
