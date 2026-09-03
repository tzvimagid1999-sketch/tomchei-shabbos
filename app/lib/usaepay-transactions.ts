import crypto from "crypto";

// Fetching the transactions a campaign total needs to add up.
//
// USAePay returns transactions NEWEST FIRST and caps a request at 500. A single
// unpaged request therefore covers only "the last 500 transactions", which is a
// shrinking window of time: at this account's current rate that is about a
// month, and it gets shorter as donations speed up. A campaign that runs longer
// than the window starts silently losing its oldest donations — the bar would
// go DOWN while money was still coming in.
//
// So instead of a fixed count, callers ask for a date: keep paging until the
// page being read has run past that date, then stop.

export type UsaepayTxn = {
  result?: string;
  result_code?: string;
  trantype?: string;
  amount?: string | number;
  description?: string;
  source_name?: string;
  created?: string;
  datetime?: string;
  date?: string;
};

const PAGE = 500;
// 12 pages is 6,000 transactions — years of history on this account. It exists
// only so a bad cutoff cannot turn into an unbounded crawl of the API.
const MAX_PAGES = 12;

export const txnDate = (t: UsaepayTxn): string =>
  String(t.created ?? t.datetime ?? t.date ?? "").slice(0, 10);

/** Full "YYYY-MM-DD HH:MM:SS" stamp, in USAePay's own (Pacific) clock. */
export const txnStamp = (t: UsaepayTxn): string =>
  String(t.created ?? t.datetime ?? t.date ?? "");

// Everything charged through the campaign page before this moment was a test
// donation made while the page was being built, so the campaign starts from
// zero rather than opening with $30 of staff testing on the bar and a wall of
// invented supporter names.
//
// Stamped in USAePay's clock, which is PACIFIC — three hours behind Florida.
// Getting that wrong hides real donations: this was first set to 19:50, taken
// from a shell whose timezone override silently did not apply, so the value was
// UTC. On USAePay's clock that sat hours in the future and every genuine
// donation was discarded as a test. Set from Pacific, and only Pacific.
//
// The last staff test was stamped 12:23 Pacific, so 12:30 clears them all and
// admits everything after.
//
// This hides those charges from the CAMPAIGN page only. The money was really
// taken and still sits on the main site's bar; reversing it means voiding or
// refunding the transactions in MerchPay.
export const CAMPAIGN_LIVE_FROM = "2026-09-02 12:30:00";

/** True for a real campaign donation, false for the pre-launch test charges. */
export const isAfterLaunch = (t: UsaepayTxn): boolean => {
  const stamp = txnStamp(t);
  // An unreadable stamp is treated as real: never hide a donation on a guess.
  return !stamp || stamp >= CAMPAIGN_LIVE_FROM;
};

// Whether a customer has any recurring schedule at all.
//
// A fixed-term pledge is credited in full on the day it is made, which is only
// honest if the remaining payments are actually going to be collected. When a
// schedule fails to be created the donor is charged once and never again, so
// crediting the whole pledge would put money on the bar that will never arrive.
//
// This deliberately does not care whether the schedule is still enabled. A
// donor who cancels later made a real pledge; a schedule that was never created
// never did.
const scheduleMemo = new Map<string, { has: boolean; at: number }>();
const SCHEDULE_MEMO_MS = 600_000;

export async function customerHasSchedule(
  endpoint: string,
  sourceKey: string,
  pin: string,
  custkey: string
): Promise<boolean> {
  if (!custkey) return false;
  const hit = scheduleMemo.get(custkey);
  if (hit && Date.now() - hit.at < SCHEDULE_MEMO_MS) return hit.has;

  const seed = crypto.randomBytes(16).toString("hex");
  const hash = crypto.createHash("sha256").update(sourceKey + seed + pin).digest("hex");
  const authHeader = "Basic " + Buffer.from(`${sourceKey}:s2/${seed}/${hash}`).toString("base64");

  try {
    const res = await fetch(`${endpoint}/customers/${custkey}/billing_schedules`, {
      headers: { Authorization: authHeader, "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`billing_schedules ${res.status}`);
    const j = await res.json();
    const list = j.data ?? j.billing_schedules ?? [];
    const has = Array.isArray(list) && list.length > 0;
    scheduleMemo.set(custkey, { has, at: Date.now() });
    return has;
  } catch {
    // Unknown is not the same as missing. Assume the pledge stands rather than
    // making the bar lurch downwards because one lookup failed.
    return true;
  }
}

/**
 * Every sale transaction on or after `since` (YYYY-MM-DD), newest first.
 *
 * `complete` is false when the page limit was reached before the cutoff, which
 * means the answer is missing the oldest donations. Callers should treat that
 * as a stale/partial figure rather than publishing it as the total.
 */
export async function fetchTransactionsSince(
  endpoint: string,
  sourceKey: string,
  pin: string,
  since: string
): Promise<{ txns: UsaepayTxn[]; complete: boolean }> {
  // A fresh seed and hash per request: USAePay rejects a replayed one.
  const auth = () => {
    const seed = crypto.randomBytes(16).toString("hex");
    const hash = crypto.createHash("sha256").update(sourceKey + seed + pin).digest("hex");
    return "Basic " + Buffer.from(`${sourceKey}:s2/${seed}/${hash}`).toString("base64");
  };

  const all: UsaepayTxn[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await fetch(
      `${endpoint}/transactions?limit=${PAGE}&type=sale&offset=${page * PAGE}`,
      { headers: { Authorization: auth(), "Content-Type": "application/json" }, cache: "no-store" }
    );
    if (!res.ok) throw new Error(`USAePay transactions ${res.status}`);

    const data = await res.json();
    const txns = (data.transactions || data.data || []) as UsaepayTxn[];
    all.push(...txns);

    // A short page is the end of the account's history.
    if (txns.length < PAGE) return { txns: all, complete: true };

    // Newest first, so the last item on the page is its oldest. Once that has
    // passed the cutoff, everything still unread is older again.
    const oldest = txnDate(txns[txns.length - 1]);
    if (oldest && oldest < since) return { txns: all, complete: true };
  }

  return { txns: all, complete: false };
}
