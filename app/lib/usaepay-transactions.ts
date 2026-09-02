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
