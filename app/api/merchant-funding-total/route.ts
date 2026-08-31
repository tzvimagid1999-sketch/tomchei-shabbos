import { NextResponse } from "next/server";
import crypto from "crypto";

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

    const seed = crypto.randomBytes(16).toString("hex");
    const hash = crypto.createHash("sha256").update(sourceKey + seed + pin).digest("hex");
    const authHeader = "Basic " + Buffer.from(`${sourceKey}:s2/${seed}/${hash}`).toString("base64");

    const res = await fetch(`${endpoint}/transactions?limit=500&type=sale`, {
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
    });
    const data = await res.json();
    const txns = (data.transactions || data.data || []) as Array<{
      result?: string;
      result_code?: string;
      trantype?: string;
      amount?: string | number;
      description?: string;
    }>;

    const total = txns.reduce((sum, t) => {
      const approved = t.result_code === "A" || t.result === "Approved";
      const trantype = (t.trantype || "").toLowerCase();
      if (!approved || trantype.includes("void") || trantype.includes("refund")) return sum;
      if (!(t.description || "").toLowerCase().includes(TAG)) return sum;
      return sum + (parseFloat(String(t.amount)) || 0);
    }, 0);

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
