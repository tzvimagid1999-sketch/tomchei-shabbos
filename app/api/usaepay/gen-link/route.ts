import { NextRequest, NextResponse } from "next/server";
import { signCustKey } from "../../../lib/donation-email";

// TEMP: generate a valid signed cancellation link for a given custkey, without
// sending a new email.
export async function GET(req: NextRequest) {
  const custkey = req.nextUrl.searchParams.get("custkey");
  if (!custkey) return NextResponse.json({ error: "Missing custkey" }, { status: 400 });

  const sig = signCustKey(custkey);
  const url = `${new URL(req.url).origin}/manage-donation?c=${encodeURIComponent(custkey)}&s=${sig}`;
  return NextResponse.json({ url });
}
