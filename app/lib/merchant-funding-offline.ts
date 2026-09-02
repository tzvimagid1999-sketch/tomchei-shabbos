// Donations to the merchant funding campaign that never touched the website —
// a cheque, a wire, a pledge taken over the phone. Staff record them in a
// Google Sheet and this reads that sheet, so those gifts show on the campaign
// bar and their names appear on the supporter wall alongside card donations.
//
// It mirrors the arrangement the main site already uses for Venmo/PayPal/Cash
// App totals, with one addition: this one carries names as well as amounts,
// because the campaign page has a donor wall and the main site does not.
//
// Best effort by design. If the sheet is slow, unreachable or misconfigured
// this returns nothing rather than letting a spreadsheet outage take down the
// campaign page's figures.

export type OfflineDonor = { name: string; amount: number };
export type OfflineResult = {
  total: number;
  /** The part of `total` the main site's bar may add. See below. */
  mainBarTotal: number;
  donors: OfflineDonor[];
  error?: string;
};

// Gifts in this sheet that the main site's bar ALREADY counts by another route,
// and which would therefore be added twice if the sheet's total went in whole.
//
// Black Tie Funding's $5,000 came in through ADM, the telemarketer. The main
// bar matches ADM donations by their source, so that $5,000 is already on it;
// the sheet row exists so the gift reaches the CAMPAIGN bar and the supporter
// wall, which ADM donations otherwise never touch.
//
// Matched on the name exactly as it appears on the wall, case-insensitively.
// Keep this list short: a name here is silently worth nothing to the main bar,
// which is the sort of thing that is easy to forget and hard to spot later.
const ALREADY_ON_MAIN_BAR = ["black tie funding"];

const EMPTY: OfflineResult = { total: 0, mainBarTotal: 0, donors: [] };

let cache: { value: OfflineResult; at: number } | null = null;
const CACHE_MS = 60_000;

export async function fetchOfflineDonations(): Promise<OfflineResult> {
  const url = process.env.MERCHANT_FUNDING_SHEET_URL;
  const secret = process.env.MERCHANT_FUNDING_SHEET_SECRET;
  if (!url) return EMPTY;

  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;

  try {
    const res = await fetch(`${url}?secret=${encodeURIComponent(secret || "")}`, {
      redirect: "follow",
      cache: "no-store",
    });
    if (!res.ok) return { ...EMPTY, error: `HTTP ${res.status}` };

    const text = await res.text();
    let parsed: { total?: unknown; donors?: unknown; error?: unknown };
    try {
      parsed = JSON.parse(text);
    } catch {
      // Apps Script serves an HTML error page when the deployment is wrong.
      return { ...EMPTY, error: `non-JSON response: ${text.slice(0, 120)}` };
    }
    if (parsed.error) return { ...EMPTY, error: String(parsed.error) };

    const total = parseFloat(String(parsed.total));
    if (!Number.isFinite(total) || total < 0) {
      return { ...EMPTY, error: `bad total: ${String(parsed.total)}` };
    }

    // Names are optional per row: a gift can count towards the goal without
    // being named, exactly like an anonymous card donation.
    const donors: OfflineDonor[] = Array.isArray(parsed.donors)
      ? (parsed.donors as unknown[])
          .map((d) => {
            const row = d as { name?: unknown; amount?: unknown };
            // Square brackets are stripped for the same reason as on the card
            // path: they delimit tags elsewhere and have no business in a name.
            const name = String(row?.name ?? "").replace(/[[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 40);
            const amount = parseFloat(String(row?.amount));
            return { name, amount: Number.isFinite(amount) && amount > 0 ? amount : 0 };
          })
          .filter((d) => d.name)
      : [];

    // Subtracted rather than filtered out of `total`, so the campaign bar and
    // the wall still show the gift in full — only the main bar's share shrinks.
    const alreadyCounted = donors
      .filter((d) => ALREADY_ON_MAIN_BAR.includes(d.name.toLowerCase()))
      .reduce((sum, d) => sum + d.amount, 0);

    const value: OfflineResult = {
      total,
      mainBarTotal: Math.max(0, total - alreadyCounted),
      donors,
    };
    cache = { value, at: Date.now() };
    return value;
  } catch (err) {
    return { ...EMPTY, error: err instanceof Error ? err.message : String(err) };
  }
}
