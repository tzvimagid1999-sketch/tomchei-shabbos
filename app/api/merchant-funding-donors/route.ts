import { NextResponse } from "next/server";
import crypto from "crypto";
import { parseWallName } from "../../lib/donor-wall";

export const dynamic = "force-dynamic";

// Names for the merchant funding campaign's donor wall, newest first.
//
// Only donations whose description carries a [wall:...] tag appear here, and
// that tag is written only when the donor ticked the box asking to be named.
// Everyone else is invisible to this endpoint — there is no way for it to
// surface a donor who did not opt in.
//
// Amounts are deliberately NOT returned. The page shows who gave, not how much.
const TAG = "[team:merchant-funding]";
const MAX = 30;

let cache: { value: string[]; at: number } | null = null;
const CACHE_MS = 60_000;

const json = (body: unknown) =>
  NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });

export async function GET() {
  try {
    if (cache && Date.now() - cache.at < CACHE_MS) return json({ donors: cache.value });

    const sourceKey = process.env.NEXT_PUBLIC_USAEPAY_SOURCE_KEY?.trim();
    const pin = process.env.USAEPAY_PIN?.trim();
    const endpoint = process.env.USAEPAY_ENDPOINT || "https://usaepay.com/api/v2";
    if (!sourceKey || !pin) return json({ donors: [] });

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
      description?: string;
    }>;

    const donors: string[] = [];
    const seen = new Set<string>();
    // USAePay returns oldest-first, so walk backwards for newest-first.
    for (let i = txns.length - 1; i >= 0 && donors.length < MAX; i--) {
      const t = txns[i];
      const approved = t.result_code === "A" || t.result === "Approved";
      const trantype = (t.trantype || "").toLowerCase();
      if (!approved || trantype.includes("void") || trantype.includes("refund")) continue;
      if (!(t.description || "").toLowerCase().includes(TAG)) continue;

      const name = parseWallName(t.description);
      if (!name) continue;
      // A monthly donor charges every month; show them once.
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      donors.push(name);
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
