// ─────────────────────────────────────────────────────────────────────────────
// CAMPAIGN MODE
//
// While a campaign is running, every "Donate Now" button on the site points to
// the campaign page instead of the general donate page, and /donate redirects
// there too, so donors never land on the regular payment form.
//
// TO TURN THE CAMPAIGN OFF (after Rosh Hashanah / Yom Tov):
//   change the line below to `export const CAMPAIGN_MODE = false;`
//   That's the only edit needed — every button and the redirect switch back
//   to the regular donate page automatically.
// ─────────────────────────────────────────────────────────────────────────────
export const CAMPAIGN_MODE = true;

/** Where the campaign sends donors while CAMPAIGN_MODE is on. */
export const CAMPAIGN_PATH = "/RoshHashanah";

/** The normal donate page, used whenever CAMPAIGN_MODE is off. */
export const REGULAR_DONATE_PATH = "/donate#payment";

/** Destination for every "Donate Now" link across the site. */
export const DONATE_HREF = CAMPAIGN_MODE ? CAMPAIGN_PATH : REGULAR_DONATE_PATH;

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
