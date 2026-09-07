import { NextResponse } from "next/server";
import { getMerchantFundingTotal } from "../../lib/merchant-funding-total";

export const dynamic = "force-dynamic";

// Cached at the edge as well as in memory — see the note in the donors route.
// The total is the same number for every visitor, so serving it from the edge
// costs nothing in accuracy and saves each one a crawl of the transaction feed.
// A minute of staleness on a progress bar is not noticeable; ten seconds of
// blank space is.
const EDGE_CACHE = "public, s-maxage=60, stale-while-revalidate=600";
const json = (body: unknown) =>
  NextResponse.json(body, {
    headers: {
      "Cache-Control": EDGE_CACHE,
      "CDN-Cache-Control": EDGE_CACHE,
      "Vercel-CDN-Cache-Control": EDGE_CACHE,
    },
  });

// The page's own server render calls getMerchantFundingTotal() directly, so
// the first paint already has the real figure. This route exists for the
// client-side polling that keeps it current after that — same underlying
// function, same cache, so neither path repeats the other's work.
export async function GET() {
  const result = await getMerchantFundingTotal();
  return json(result);
}
