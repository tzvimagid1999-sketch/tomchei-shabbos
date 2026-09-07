import { NextRequest, NextResponse } from "next/server";
import { getMainDonationTotal } from "../../lib/main-donation-total";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Every response must be fresh — donors expect the progress bar to reflect
// the latest total, not a cached snapshot from the browser or a CDN.
function json(body: unknown, init?: ResponseInit) {
  const res = NextResponse.json(body, init);
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return res;
}

// The /RoshHashanah page's own server render calls getMainDonationTotal()
// directly, so the first paint already has the real figure. This route is
// for the client-side polling that keeps it current after that, plus the
// ?debug=1 view used to diagnose the total — same underlying function, same
// cache, so neither path repeats the other's work.
export async function GET(req: NextRequest) {
  const debug = req.nextUrl.searchParams.get("debug") === "1";
  const result = await getMainDonationTotal({ debug });
  return json(result);
}
