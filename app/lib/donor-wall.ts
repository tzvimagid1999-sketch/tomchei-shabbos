// Donor wall: the names shown on the merchant funding campaign page.
//
// USAePay gives us no custom fields on a transaction, so the donor's chosen
// display name rides along in the description as a [wall:...] tag, next to the
// [team:...] campaign tag. These two functions are the only places that format
// or read it — keep them in step.
//
// A name is written ONLY when the donor ticked the box asking for it. No tag
// means the gift stays anonymous, so a donation can never be attributed by
// accident.

const MAX_LEN = 40;

/**
 * Formats a donor's chosen display name as a description tag, e.g. "[wall:Acme Capital] ".
 * Returns "" when there is no usable name, which is also the anonymous case.
 *
 * Square brackets are stripped rather than escaped: they are the tag's own
 * delimiters, so a name containing one would otherwise truncate the parse or
 * let a donor forge a second tag.
 */
export function wallTag(displayName: unknown): string {
  if (typeof displayName !== "string") return "";
  const clean = displayName
    .replace(/[[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_LEN)
    .trim();
  return clean ? `[wall:${clean}] ` : "";
}

/**
 * Formats a donor's company as its own tag, e.g. "[co:Black Tie Funding] ".
 *
 * Kept separate from the wall name so the page can show a person AND the firm
 * they came from. Written only alongside a wall name — a company tag on an
 * anonymous gift would identify the donor by the back door.
 */
export function companyTag(company: unknown): string {
  if (typeof company !== "string") return "";
  const clean = company
    .replace(/[[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_LEN)
    .trim();
  return clean ? `[co:${clean}] ` : "";
}

/** Reads back a company written by companyTag. */
export function parseCompanyName(description: unknown): string | null {
  if (typeof description !== "string") return null;
  const m = description.match(/\[co:([^\]]{1,40})\]/);
  const name = m?.[1]?.trim();
  return name ? name : null;
}

/** Reads back a name written by wallTag. Returns null for anonymous donations. */
export function parseWallName(description: unknown): string | null {
  if (typeof description !== "string") return null;
  const m = description.match(/\[wall:([^\]]{1,40})\]/);
  const name = m?.[1]?.trim();
  return name ? name : null;
}

// Fixed-term pledges count their whole commitment on the campaign bar the day
// they are made, not one month at a time. That needs two markers, because the
// money arrives across many transactions:
//
//   [pledge:N]  on the first charge — count this transaction N times over.
//   [pledged]   on the schedule that makes the remaining charges — already
//               counted by the tag above, so skip these entirely.
//
// Open-ended monthly donations carry neither marker: each of their charges is
// real money in, counted once, as it always was.
const MAX_PLEDGE_MONTHS = 60;

/** Marks the first charge of a fixed-term pledge, e.g. "[pledge:6] ". */
export function pledgeTag(months: unknown): string {
  const n = Number(months);
  if (!Number.isInteger(n) || n < 2 || n > MAX_PLEDGE_MONTHS) return "";
  return `[pledge:${n}] `;
}

/** Marks charges made by a fixed-term pledge's schedule, so they are not counted twice. */
export const PLEDGED_TAG = "[pledged] ";

/**
 * How many times this transaction's amount should count towards the campaign.
 * 0 means "do not count" — a scheduled charge whose pledge was already counted
 * in full when it was made.
 */
export function pledgeMultiplier(description: unknown): number {
  if (typeof description !== "string") return 1;
  if (description.toLowerCase().includes(PLEDGED_TAG.toLowerCase())) return 0;
  const m = description.match(/\[pledge:(\d{1,2})\]/);
  const n = m ? Number(m[1]) : 0;
  return n >= 2 && n <= MAX_PLEDGE_MONTHS ? n : 1;
}
