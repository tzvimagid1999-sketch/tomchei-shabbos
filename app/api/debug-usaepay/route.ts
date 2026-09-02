import { NextResponse } from "next/server";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// TEMPORARY diagnostic endpoint.
//
// Added to work out why a monthly donation that USAePay approved is not
// reaching the campaign total. It exists because the machine doing the
// debugging is IP-blocked by USAePay, so the only way to see a transaction as
// USAePay records it is to ask from the server.
//
// It returns donor names and amounts, so it is gated behind DEBUG_TOKEN and
// should be deleted once the question is answered. It is read-only: it can
// look at transactions and schedules, and cannot create, charge or cancel
// anything.
export async function GET(req: Request) {
  const token = process.env.DEBUG_TOKEN;
  const given = new URL(req.url).searchParams.get("token");
  // Constant-time compare, so the token cannot be guessed a character at a time.
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
  const custkey = sp.get("custkey");

  const customer = sp.get("customer");
  if (customer) {
    const r = await fetch(`${endpoint}/customers/${customer}`, {
      headers: { Authorization: auth(), "Content-Type": "application/json" },
    });
    const raw = await r.text();
    return NextResponse.json({ httpStatus: r.status, raw: raw.slice(0, 4000) });
  }

  // Schedules for one customer, when asked for.
  if (custkey) {
    const r = await fetch(`${endpoint}/customers/${custkey}/billing_schedules`, {
      headers: { Authorization: auth(), "Content-Type": "application/json" },
    });
    const raw = await r.text();
    return NextResponse.json({ httpStatus: r.status, raw: raw.slice(0, 3000) });
  }

  const qs = sp.get("qs") || "limit=500&type=sale";
  const res = await fetch(`${endpoint}/transactions?${qs}`, {
    headers: { Authorization: auth(), "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (sp.get("envelope")) {
    const { transactions, data: d2, ...rest } = data as Record<string, unknown>;
    return NextResponse.json({
      queried: qs,
      envelope: rest,
      arrayLength: (transactions as unknown[] | undefined)?.length ?? (d2 as unknown[] | undefined)?.length ?? 0,
    });
  }
  const txns = (data.transactions || data.data || []) as Array<Record<string, unknown>>;

  // Read-only audit: every monthly sign-up the WEBSITE took, and whether a
  // recurring schedule actually exists for it. A sign-up with no schedule was
  // charged once and will never be charged again.
  if (sp.get("audit")) {
    const isSignup = (d: string) => {
      const s = d.toLowerCase();
      return s.includes("monthly donation to tomchei") || s.includes("pledge payment 1 of");
    };
    const wanted = txns.filter(
      (t) =>
        isSignup(String(t.description ?? "")) &&
        (t.result === "Approved" || t.result_code === "A") &&
        !String(t.trantype ?? "").toLowerCase().includes("void")
    );

    const out = [];
    for (const t of wanted.slice(0, 25)) {
      const ck = String((t as Record<string, unknown>).custkey ?? "");
      let schedules: number | string = "no custkey";
      if (ck) {
        try {
          const r = await fetch(`${endpoint}/customers/${ck}/billing_schedules`, {
            headers: { Authorization: auth(), "Content-Type": "application/json" },
          });
          const j = JSON.parse(await r.text());
          const list = j.data ?? j.billing_schedules ?? [];
          schedules = Array.isArray(list) ? list.length : `? ${r.status}`;
        } catch {
          schedules = "error";
        }
      }
      out.push({
        when: t.created ?? t.datetime,
        amount: t.amount,
        who: (t as Record<string, unknown>).customerid,
        custkey: ck,
        schedules,
      });
    }
    return NextResponse.json({ signupsFound: wanted.length, checked: out.length, signups: out });
  }

  if (sp.get("raw")) {
    const needle = (sp.get("raw") || "").toLowerCase();
    const first = txns.find((t) => String(t.description ?? "").toLowerCase().includes(needle));
    return NextResponse.json({ found: !!first, txn: first ?? null });
  }

  if (sp.get("tagged")) {
    return NextResponse.json({
      queried: qs,
      tagged: txns
        .filter((t) => String(t.description ?? "").toLowerCase().includes("[team:merchant-funding]"))
        .map((t) => ({
          when: t.created ?? t.datetime ?? t.date,
          amount: t.amount,
          result: t.result ?? t.result_code,
          result_code: t.result_code,
          trantype: t.trantype,
          description: t.description,
        })),
    });
  }

  if (sp.get("span")) {
    const when = (t: Record<string, unknown>) => String(t.created ?? t.datetime ?? t.date ?? "");
    const dates = txns.map(when).filter(Boolean).sort();
    return NextResponse.json({
      queried: qs,
      count: txns.length,
      firstItem: when(txns[0] ?? {}),
      lastItem: when(txns[txns.length - 1] ?? {}),
      minDate: dates[0],
      maxDate: dates[dates.length - 1],
      taggedInPage: txns.filter((t) => String(t.description ?? "").toLowerCase().includes("[team:merchant-funding]")).length,
    });
  }

  // Newest last in USAePay's ordering, so the tail is what we want.
  const recent = txns.slice(-12).reverse().map((t) => ({
    when: t.created ?? t.datetime ?? t.date,
    amount: t.amount,
    result: t.result ?? t.result_code,
    trantype: t.trantype,
    refnum: t.refnum,
    custkey: (t.customer as Record<string, unknown> | undefined)?.custkey ?? t.custkey,
    description: t.description,
    hasCampaignTag: String(t.description ?? "").toLowerCase().includes("[team:merchant-funding]"),
  }));

  return NextResponse.json({
    totalReturned: txns.length,
    hitTheLimit: txns.length >= 500,
    recent,
  });
}
