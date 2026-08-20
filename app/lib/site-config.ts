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
