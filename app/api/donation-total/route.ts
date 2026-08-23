import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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
      return json({ total: Math.round(cardCache.value + cachedOther.total) });
    }

    const seed = crypto.randomBytes(16).toString("hex");
    const hash = crypto.createHash("sha256").update(sourceKey + seed + pin).digest("hex");
    const authHeader =
      "Basic " + Buffer.from(`${sourceKey}:s2/${seed}/${hash}`).toString("base64");

    // Fetch all transactions for one-time + recurring donations
    const res = await fetch(`${endpoint}/transactions?limit=500&type=sale`, {
      headers: { Authorization: authHeader },
      cache: "no-store",
    });

    if (!res.ok) {
      const rawText = await res.text();
      if (debug) {
        return json({ total: 0, debug: { httpStatus: res.status, raw: rawText.slice(0, 1500) } });
      }
      return json({ total: 0 });
    }

    const data = await res.json();
    const transactions = (data.transactions || data.data || []) as Array<{
      result_code?: string;
      result?: string;
      amount?: string | number;
      trantype?: string;
      description?: string;
    }>;

    // Only count donations explicitly tagged as Rosh Hashanah Campaign — otherwise
    // this sums the merchant account's entire donation history (mail, phone, the
    // general donate page, etc.), not just this specific campaign.
    const total = transactions
      .filter((t) => {
        const approved = t.result_code === "A" || t.result === "Approved";
        const trantype = (t.trantype || "").toLowerCase();
        const reversed = trantype.includes("void") || trantype.includes("refund");
        const tagged = (t.description || "").toLowerCase().includes("rosh hashanah campaign");
        return approved && !reversed && tagged;
      })
      .reduce((sum, t) => sum + (parseFloat(String(t.amount)) || 0), 0);

    cardCache = { value: total, at: Date.now() };

    const other = await fetchOtherDonationsTotal();
    const combined = total + other.total;

    if (debug) {
      return json({
        total: Math.round(combined),
        debug: {
          cardTotal: Math.round(total),
          otherPlatformsTotal: Math.round(other.total),
          otherPlatformsError: other.error ?? null,
          otherPlatformsConfigured: Boolean(process.env.OTHER_DONATIONS_URL),
          transactionCount: transactions.length,
          sample: transactions.slice(0, 10),
          rawKeys: Object.keys(data),
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
