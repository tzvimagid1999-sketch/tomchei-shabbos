/** Destination for every "Donate Now" link across the site. */
export const DONATE_HREF = "/donate#payment";

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS BAR
//
// Emergency kill switch. On 2026-08-21 USAePay began refusing connections from
// our servers (ConnectTimeoutError on usaepay.com:443), which broke live
// donations as well as the bar. The suspected cause was this bar polling
// USAePay's transactions endpoint every 10s per open tab.
//
// Mitigated by caching the total server-side for 60s and slowing browser
// polling to 60s — together roughly a 95% reduction in upstream calls.
//
// IF DONATIONS EVER FAIL WITH CONNECTION TIMEOUTS AGAIN: set this to `false`.
// That stops every automated call to USAePay immediately, leaving the payment
// path as the only traffic. Nothing else needs changing.
// ─────────────────────────────────────────────────────────────────────────────
export const SHOW_PROGRESS_BAR = true;
