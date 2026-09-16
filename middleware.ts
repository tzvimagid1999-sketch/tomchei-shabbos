import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CAMPAIGN_PATH } from "./app/lib/site-config";

// Makes the campaign URL case-insensitive. Next.js routes are case-sensitive
// by default (a folder named "tishrei" only matches "/tishrei" exactly), and
// this is the one URL on the site people are actually typing or remembering
// from having heard it out loud — "Tishrei", "TISHREI", "Tishre" capitalised
// mid-sentence, autocorrect capitalising the first letter, all real ways a
// human retypes a word. Any casing lands on the same page instead of a 404.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.toLowerCase() === CAMPAIGN_PATH.toLowerCase() &&
    pathname !== CAMPAIGN_PATH
  ) {
    const url = req.nextUrl.clone();
    url.pathname = CAMPAIGN_PATH;
    return NextResponse.redirect(url, 307);
  }

  return NextResponse.next();
}

// Runs on every page request except static assets and Next's own internals —
// those can never match CAMPAIGN_PATH case-insensitively anyway, so excluding
// them just avoids the check firing on every image and JS chunk for nothing.
export const config = {
  matcher: ["/((?!_next/|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|css|js|woff2?)$).*)"],
};
