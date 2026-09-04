import { NextResponse } from "next/server";
import { getMerchantFundingDonors } from "../../lib/merchant-funding-donors";

export const dynamic = "force-dynamic";

// Cached at Vercel's edge, not just in this instance's memory. The in-memory
// cache only helps a visitor who happens to land on an already-warm instance;
// everyone else waited out the full crawl, which is what made the page take
// ten seconds to fill in.
//
// stale-while-revalidate is the important half: once the edge has any copy, it
// answers instantly and refreshes in the background, so a visitor never pays
// for the refresh.
//
// The revalidate window is deliberately short. A longer one is cheaper, but it
// means a donor who has just given can refresh and not see their own name for
// several minutes, which reads as the page being broken. A minute of staleness
// is the most this should carry.
//
// Safe to cache publicly: this response is identical for every visitor and
// holds only names donors asked to have shown.
//
// Next rewrites Cache-Control on route handlers and drops s-maxage, so the CDN
// directives go in the headers Vercel reads instead and leaves alone.
const EDGE_CACHE = "public, s-maxage=45, stale-while-revalidate=120";
const json = (body: unknown) =>
  NextResponse.json(body, {
    headers: {
      "Cache-Control": EDGE_CACHE,
      "CDN-Cache-Control": EDGE_CACHE,
      "Vercel-CDN-Cache-Control": EDGE_CACHE,
    },
  });

// The page's own server render calls getMerchantFundingDonors() directly, so
// the first paint already has the list. This route exists for the client-side
// polling that keeps it current after that — same underlying function, same
// cache, so neither path repeats the other's work.
export async function GET() {
  const result = await getMerchantFundingDonors();
  return json(result);
}
