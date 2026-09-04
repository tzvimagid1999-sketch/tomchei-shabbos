import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// TEMPORARY, read-only. Re-added to confirm why only one of Sholom Schorr's
// two $360 gifts (one personal, one through Forest Capital) is showing on the
// wall. Gated behind DEBUG_TOKEN, deleted again once answered.
export async function GET(req: Request) {
  const token = process.env.DEBUG_TOKEN;
  const given = new URL(req.url).searchParams.get("token");
  const ok =
    !!token &&
    !!given &&
    token.length === given.length &&
    crypto.timingSafeEqual(Buffer.from(token), Buffer.from(given));
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });

  const sourceKey = process.env.NEXT_PUBLIC_USAEPAY_SOURCE_KEY?.trim();
  const pin = process.env.USAEPAY_PIN?.trim();
  const endpoint = process.env.USAEPAY_ENDPOINT || "https://usaepay.com/api/v2";
  if (!sourceKey || !pin) return NextResponse.json({ error: "no credentials" }, { status: 500 });

  const auth = () => {
    const seed = crypto.randomBytes(16).toString("hex");
    const hash = crypto.createHash("sha256").update(sourceKey + seed + pin).digest("hex");
    return "Basic " + Buffer.from(`${sourceKey}:s2/${seed}/${hash}`).toString("base64");
  };

  const sp = new URL(req.url).searchParams;
  const needle = (sp.get("q") || "").toLowerCase();

  const res = await fetch(`${endpoint}/transactions?limit=500&type=sale`, {
    headers: { Authorization: auth(), "Content-Type": "application/json" },
  });
  const data = await res.json();
  const txns = (data.transactions || data.data || []) as Array<Record<string, unknown>>;

  const matches = txns
    .filter((t) => String(t.description ?? "").toLowerCase().includes(needle))
    .map((t) => ({
      when: t.created ?? t.datetime ?? t.date,
      amount: t.amount,
      result: t.result ?? t.result_code,
      description: t.description,
    }));

  return NextResponse.json({ matches });
}
