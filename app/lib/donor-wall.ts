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

/** Reads back a name written by wallTag. Returns null for anonymous donations. */
export function parseWallName(description: unknown): string | null {
  if (typeof description !== "string") return null;
  const m = description.match(/\[wall:([^\]]{1,40})\]/);
  const name = m?.[1]?.trim();
  return name ? name : null;
}
