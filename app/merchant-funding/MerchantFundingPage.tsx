"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Script from "next/script";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Merchant funding campaign page. Unlisted: not in the navigation, not in the
// sitemap, noindex — reachable only by the link the organisation sends out.
//
// It posts to the site's existing /api/usaepay routes rather than its own, so
// there is one payment implementation on this site and donations land in the
// same MerchPay account as every other page. The subCampaign tag lets this
// page total its own donations while they still count on the main $250k bar.
const SUB_CAMPAIGN = "team:merchant-funding";
const GOAL = 50000;

type Donor = { name: string; amount: number };

// Sample supporters for ?demo=1, so the ticker can be shown to the campaign
// team before any real donor has opted in. Invented names, never real donors —
// the page labels them as samples so the preview cannot be mistaken for the
// actual supporter list. Demo mode touches nothing but this list: the totals,
// the bar and the donation form are unchanged.
const DEMO_DONORS: Donor[] = [
  { name: "Coastal Merchant Group", amount: 2500 },
  { name: "Bright Harbor Funding", amount: 1800 },
  { name: "Daniel Weiss", amount: 500 },
  { name: "Sunrise Advance LLC", amount: 3600 },
  { name: "Deerfield Capital", amount: 1250 },
  { name: "M. Rosenberg", amount: 360 },
  { name: "Palm Funding Co.", amount: 5000 },
  { name: "Aventura Business Capital", amount: 720 },
  { name: "Biscayne Working Capital", amount: 2400 },
  { name: "The Gruen Family", amount: 1000 },
  { name: "North Bay Advance", amount: 1500 },
  { name: "Surfside Capital Partners", amount: 4200 },
];

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

// Whole percentages only — no decimals, no "<" prefix.
const percent = (pct: number) => `${Math.round(pct)}%`;

// Counts up once the figure scrolls into view; skipped under reduced motion.
function useCountUp(target: number | null, run: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (target === null || !run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(target);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 900);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run]);
  return target === null ? null : n;
}

export default function MerchantFundingPage() {
  const [raised, setRaised] = useState<number | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [amount, setAmount] = useState("");
  const [honoreeType, setHonoreeType] = useState<"" | "honor" | "memory">("");
  // Ticking this suppresses the donor's entry entirely — no name, no amount.
  const [anonymous, setAnonymous] = useState(false);
  const [donors, setDonors] = useState<Donor[]>([]);
  // Resolved after mount rather than during render: reading the URL while
  // rendering would disagree with the server's HTML and break hydration. null
  // means "not yet known", which holds the donors fetch back — starting it
  // first let its response land after the demo list and wipe it.
  const [demo, setDemo] = useState<boolean | null>(null);
  const [monthly, setMonthly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const publicKey = process.env.NEXT_PUBLIC_USAEPAY_PUBLIC_KEY;
  const [scriptReady, setScriptReady] = useState(false);
  const clientRef = useRef<any>(null);
  const cardRef = useRef<any>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // Polls once a minute — no faster. Polling harder than this once got the
  // site's IP throttled by USAePay and took live donations down for an hour.
  const refreshDonors = useCallback(
    () =>
      fetch("/api/merchant-funding-donors")
        .then((r) => r.json())
        .then((d) => Array.isArray(d?.donors) && setDonors(d.donors))
        .catch(() => {}),
    []
  );

  const refresh = useCallback(
    () =>
      fetch("/api/merchant-funding-total")
        .then((r) => r.json())
        .then((d) => {
          if (typeof d?.total === "number") {
            setRaised(d.total);
            setLoadFailed(Boolean(d.error));
          } else setLoadFailed(true);
        })
        .catch(() => setLoadFailed(true)),
    []
  );

  useEffect(() => {
    setDemo(new URLSearchParams(window.location.search).get("demo") === "1");
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, [refresh]);

  // In demo mode the sample list stands in for the real one, and the donors
  // endpoint is never called.
  useEffect(() => {
    if (demo === null) return;
    if (demo) {
      setDonors(DEMO_DONORS);
      return;
    }
    refreshDonors();
    const id = setInterval(refreshDonors, 60_000);
    return () => clearInterval(id);
  }, [demo, refreshDonors]);

  // Always open at the top. Browsers restore the previous scroll position on a
  // revisit, which on a phone dropped returning visitors straight into the
  // middle of the card form instead of the campaign's opening.
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    if (!window.location.hash) window.scrollTo(0, 0);
  }, []);

  // Reveals are armed only once JS can un-arm them, so a failed observer can
  // never leave the donation form invisible.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = document.querySelectorAll(".mf-reveal");
    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window && !reduced) {
      io = new IntersectionObserver(
        (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("mf-shown")),
        { rootMargin: "0px 0px -10% 0px" }
      );
      els.forEach((el) => { el.classList.add("mf-armed"); io!.observe(el); });
      setTimeout(() => els.forEach((el) => el.classList.add("mf-shown")), 2000);
    }
    let statsIo: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window && statsRef.current) {
      statsIo = new IntersectionObserver(([e]) => e.isIntersecting && setInView(true), { threshold: 0.3 });
      statsIo.observe(statsRef.current);
    }
    const fallback = setTimeout(() => setInView(true), 1500);
    return () => { io?.disconnect(); statsIo?.disconnect(); clearTimeout(fallback); };
  }, []);

  const shownRaised = useCountUp(raised, inView);

  // pay.js is often cached, so it can load before onLoad attaches.
  useEffect(() => {
    if (scriptReady) return;
    if ((window as any).usaepay) return setScriptReady(true);
    const id = setInterval(() => {
      if ((window as any).usaepay) { setScriptReady(true); clearInterval(id); }
    }, 100);
    return () => clearInterval(id);
  }, [scriptReady]);

  useEffect(() => {
    if (!scriptReady || !(window as any).usaepay || !publicKey || cardRef.current) return;
    const client = new (window as any).usaepay.Client(publicKey);
    clientRef.current = client;
    const card = client.createPaymentCardEntry();
    card.generateHTML({
      styles: `
        .payjs-base { font-size: 16px; color: #2D2D2D; font-family: inherit; }
        .payjs-base::placeholder { color: #8a8a86; }
        .payjs-container { display: flex; flex-wrap: wrap; gap: 10px; }
        .payjs-wrapper { margin-bottom: 0; }
        .payjs-wrapper:nth-child(1) { flex: 1 1 100%; }
        .payjs-wrapper:nth-child(2) { flex: 1 1 90px; }
        .payjs-wrapper:nth-child(3) { flex: 1 1 90px; }
        .payjs-wrapper:nth-child(4) { flex: 1 1 70px; }
      `,
    });
    card.addHTML("card-field");
    cardRef.current = card;
  }, [scriptReady, publicKey]);

  const chosenAmount = amount;
  const pct = raised === null ? 0 : Math.min(100, (raised / GOAL) * 100);

  const submit = async () => {
    setError("");
    const val = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value?.trim() || "";
    const firstName = val("firstName");
    const lastName = val("lastName");
    const email = val("email");
    const phone = val("phone");
    const street = val("street");
    const city = val("city");
    const state = val("state");
    const zip = val("zip");
    const honoreeName = val("honoreeName");
    const honoreeEmail = val("honoreeEmail");
    const company = val("company");
    // Businesses are the audience here, so a company name is what goes on the
    // wall when there is one. Sent only if the donor ticked the box.
    const displayName = anonymous ? "" : company || `${firstName} ${lastName}`.trim();

    if (!chosenAmount || Number(chosenAmount) < 1) return setError("Enter an amount to give.");
    if (!firstName || !lastName || !email || !street || !city || !state || !zip)
      return setError("Fill in your name, email and billing address.");
    if (!clientRef.current || !cardRef.current)
      return setError("The card form is still loading. Give it a moment and try again.");

    setLoading(true);
    try {
      const result = await clientRef.current.getPaymentKey(cardRef.current);
      const paymentKey = result?.key || (typeof result === "string" ? result : "");
      if (!paymentKey) throw new Error("Your card details could not be read. Check them and try again.");

      // The site's existing routes — same implementation the donate and Rosh
      // Hashanah pages use, so the money lands in the same account.
      const res = await fetch(monthly ? "/api/usaepay/recurring" : "/api/usaepay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(chosenAmount),
          paymentKey,
          campaign: "rosh-hashanah",
          subCampaign: SUB_CAMPAIGN,
          ...(monthly ? { name: `${firstName} ${lastName}` } : { firstName, lastName }),
          // Both routes put the dedication in the USAePay description and the
          // receipt; an "in honor of" email address also sends the honouree a note.
          ...(honoreeType && honoreeName ? { honoreeType, honoreeName } : {}),
          ...(honoreeType === "honor" && honoreeEmail ? { honoreeEmail } : {}),
          email, phone, street, city, state, zip,
          ...(company ? { company } : {}),
          ...(displayName ? { displayName } : {}),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Your card was declined. Please try another card.");

      // Hand the donor off to the thank-you page. Kept as a full navigation so
      // the back button cannot land them on a filled-in card form, and so the
      // page they end on is a stable URL the organisation can point at.
      const q = new URLSearchParams({ name: firstName, amount: chosenAmount });
      if (monthly) q.set("monthly", "1");
      window.location.assign(`/merchant-funding/thank-you?${q.toString()}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="mf" style={{ backgroundColor: "#FBF8F3", color: "#2D2D2D", fontFamily: "var(--font-dm), ui-sans-serif, system-ui, sans-serif", fontWeight: 500 }}>
      <Script src="https://www.usaepay.com/js/v2/pay.js" onLoad={() => setScriptReady(true)} />

      <header className="flex w-full items-center justify-between gap-5 px-5 py-5 sm:px-8">
        <a href="/" className="flex items-center">
          <Image src="/logo-transparent.png" alt="Tomchei Shabbos of Florida" width={670} height={120} priority className="h-9 w-auto sm:h-10" />
        </a>
        <a href="#give" className="rounded-[100px] px-9 py-4 text-[17px] font-bold" style={{ backgroundColor: "#F5A020", color: "#2D2D2D" }}>
          Donate Now
        </a>
      </header>

      <p className="px-5 pb-7 pt-1 text-center text-[13px] uppercase tracking-[0.2em] sm:px-8" style={{ color: "#2D2D2D", opacity: 0.55 }}>
        MCA Donation Page
      </p>

      {/* Headline left, artwork right. Nothing frames the image: no rounded
          corners, no border, no card. The section carries no horizontal padding
          of its own — the text column supplies its own — so the image runs off
          the right edge of the viewport at lg and off both edges when stacked.
          Together with a ground that is the page's exact cream (#FBF8F3), the
          artwork has no edge of any kind and reads as part of the page rather
          than a picture placed on it. */}
      <section className="grid items-center gap-8 pb-14 sm:pb-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10">
        <div className="order-2 px-5 sm:px-8 lg:order-1 lg:pr-0">
          {/* Sized to hold three lines in this column — 3.6vw tipped it to four. */}
          <h1 className="mf-display max-w-[26ch] text-[clamp(2.2rem,3.3vw,2.75rem)]" style={{ color: "#2D2D2D" }}>
            When <span style={{ color: "#A08243" }}>MERCHANT FUNDING</span> comes together, communities move forward.
          </h1>
          <a href="#give" className="mt-9 inline-block rounded-[100px] px-8 py-4 text-[16px] font-bold" style={{ backgroundColor: "#C8A75B", color: "#2D2D2D" }}>
            Help us reach {money(GOAL)}
          </a>
        </div>

        <div className="relative order-1 aspect-[4/3] w-full overflow-hidden lg:order-2">
          <Image
            src="/rosh-hashanah-hero-mobile.jpg"
            alt="Your generosity out for delivery. This Yom Tov, it's going a long way. A Tomchei Shabbos box packed with challah, wine and food, and a delivery van."
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-contain object-center"
          />
        </div>
      </section>

      {/* The gold rule that closes the hero on /RoshHashanah. */}
      <div className="h-1 w-full" style={{ backgroundColor: "#C8A75B" }} />

      <section ref={statsRef} className="px-5 pb-4 sm:px-8">
        {/* Donor wall. Only names whose owners ticked the box reach this far —
            the API cannot return anyone else.

            Every name scrolls past rather than one showing at a time, so a long
            list can be read in full. The duration scales with the number of
            names, which keeps the speed constant however many there are. The
            list is rendered twice so the loop has no visible seam. */}
        {demo && (
          <p className="mb-2 text-center text-[12px] uppercase tracking-[0.16em]" style={{ color: "#8B6F3A" }}>
            Preview · sample names, not real donors
          </p>
        )}
        {donors.length > 0 && (
          <div className="mf-marquee mb-4 overflow-hidden rounded-[100px] py-3.5"
            style={{ backgroundColor: "#FFFFFF", border: "2px solid #C8A75B" }}>
            <div className="mf-marquee-track" style={{ animationDuration: `${Math.max(18, donors.length * 7)}s` }}>
              {[0, 1].map((copy) => (
                <div key={copy} className="mf-marquee-group" aria-hidden={copy === 1}>
                  {donors.map((d, i) => (
                    <span key={`${copy}-${i}`} className="mf-marquee-item text-[15px] leading-[1.4]">
                      <span className="mf-marquee-dot" style={{ backgroundColor: "#1AABAB" }} />
                      <strong style={{ color: "#8B6F3A" }}>{d.name}</strong>
                      {d.amount > 0 && <span style={{ opacity: 0.65 }}>{" · "}{money(d.amount)}</span>}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mf-reveal grid gap-4 sm:grid-cols-3">
          {[
            ["Goal", money(GOAL)],
            ["Raised", shownRaised === null ? (loadFailed ? "Unavailable" : "—") : money(shownRaised)],
            ["Progress", raised === null ? "—" : percent(pct)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[24px] px-7 py-8" style={{ backgroundColor: "#FFFFFF", border: "2px solid #E5E5E5" }}>
              <p className="text-[12px] uppercase tracking-[0.1em]" style={{ opacity: 0.7 }}>{label}</p>
              <p className="mf-display mt-3 text-[clamp(2.2rem,5vw,3.5rem)] tabular-nums" style={{ color: "#C8A75B" }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Fill capped at 100% so the bar can never overrun. */}
        <div className="mf-reveal mt-10 overflow-hidden rounded-[100px]" style={{ backgroundColor: "#E5E5E5" }}>
          <div
            className="h-5 rounded-[100px]"
            style={{ width: inView ? `${pct}%` : "0%", backgroundImage: "linear-gradient(to right, #1AABAB, #3DC4C4)", transition: "width 1.1s cubic-bezier(.22,.61,.36,1)" }}
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${Math.round(pct)} percent of the ${money(GOAL)} goal raised`}
          />
        </div>

      </section>

      <section id="give" className="scroll-mt-6 px-5 pb-20 pt-14 sm:px-8 sm:pt-20">
        <div className="mf-reveal mx-auto max-w-[720px] rounded-[32px] px-6 py-10 sm:px-12 sm:py-12" style={{ backgroundColor: "#FFFFFF" }}>
          <h2 className="mf-display text-center text-[clamp(1.9rem,4vw,2.8rem)]">Help provide Shabbos for a family</h2>

          <div className="mt-9 flex gap-3">
            {[
              { label: "One-time", on: !monthly, set: () => setMonthly(false) },
              { label: "Monthly", on: monthly, set: () => setMonthly(true) },
            ].map((o) => (
              <button key={o.label} type="button" onClick={o.set} aria-pressed={o.on}
                className="flex-1 rounded-[100px] py-3.5 text-[16px] font-bold"
                style={{ backgroundColor: o.on ? "#2D2D2D" : "transparent", color: o.on ? "#FFFFFF" : "#2D2D2D", border: o.on ? "1px solid #2D2D2D" : "1px solid rgba(45,45,45,0.2)" }}>
                {o.label}
              </button>
            ))}
          </div>
          {monthly && (
            <p className="mt-3 text-[14px]" style={{ opacity: 0.65 }}>Charged monthly until you cancel.</p>
          )}

          <Legend>Amount</Legend>
          <div className="flex items-center rounded-[16px] px-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(45,45,45,0.12)" }}>
            <span className="mf-display text-[1.6rem]" style={{ color: "#C8A75B" }}>$</span>
            <input aria-label="Donation amount" inputMode="decimal" placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className="mf-display h-16 w-full bg-transparent px-3 text-[1.6rem] tabular-nums focus:outline-none" />
          </div>

          <Legend>Dedicated to</Legend>
          <div className="flex overflow-hidden rounded-[100px]" style={{ border: "1px solid rgba(45,45,45,0.2)" }}>
            {([
              { key: "", label: "None" },
              { key: "honor", label: "In Honor Of" },
              { key: "memory", label: "In Memory Of" },
            ] as const).map((opt) => {
              const on = honoreeType === opt.key;
              return (
                <button key={opt.key || "none"} type="button" onClick={() => setHonoreeType(opt.key)} aria-pressed={on}
                  className="flex-1 py-3.5 text-[15px] font-bold"
                  style={{ backgroundColor: on ? "#C8A75B" : "transparent", color: on ? "#FFFFFF" : "#2D2D2D" }}>
                  {opt.label}
                </button>
              );
            })}
          </div>
          {honoreeType && (
            <div className="mt-4">
              <Field id="honoreeName" label={honoreeType === "memory" ? "Name of the person being remembered" : "Name of the person being honored"} />
              {honoreeType === "honor" && (
                <Field id="honoreeEmail" label="Their email" type="email" optional
                  hint="We will send them a note letting them know." />
              )}
            </div>
          )}

          <Legend>Your details</Legend>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field id="firstName" label="First name" />
            <Field id="lastName" label="Last name" />
          </div>
          <Field id="company" label="Company name" optional
            hint="If given, this name will be displayed." />
          <Field id="email" label="Email" type="email" hint="Where your receipt is sent." />
          <Field id="phone" label="Phone" type="tel" optional />

          <label className="mt-2 flex cursor-pointer items-start gap-3 rounded-[16px] px-5 py-4"
            style={{ border: "1px solid rgba(45,45,45,0.12)" }}>
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0" style={{ accentColor: "#C8A75B" }} />
            <span className="text-[15px] leading-[1.45]">
              Anonymous
              <span className="mt-1 block text-[13px]" style={{ opacity: 0.6 }}>
                Keep me off the supporters listed above. Otherwise your company name
                is shown, or your own name if you did not give one.
              </span>
            </span>
          </label>

          <Legend>Billing address</Legend>
          <Field id="street" label="Street address" />
          <div className="grid gap-x-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <Field id="city" label="City" />
            <Field id="state" label="State" />
            <Field id="zip" label="ZIP" />
          </div>

          <Legend>Payment details</Legend>
          <div id="card-field" className="rounded-[16px] px-5 py-4" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(45,45,45,0.12)" }} />

          {error && (
            <p role="alert" className="mt-5 rounded-[16px] px-5 py-4 text-[15px]" style={{ backgroundColor: "#FCEEEC", color: "#8C1D18", border: "1px solid #E4B4AE" }}>{error}</p>
          )}

          <button onClick={submit} disabled={loading}
            className="mt-8 w-full rounded-[100px] py-5 text-[17px] font-bold disabled:opacity-60"
            style={{ backgroundColor: "#C8A75B", color: "#2D2D2D" }}>
            {loading ? "Processing…" : `Give ${chosenAmount ? money(Number(chosenAmount)) : ""}${monthly ? " a month" : ""}`}
          </button>
          <p className="mt-4 text-center text-[12px]" style={{ opacity: 0.6 }}>
            Secure checkout · Tax-deductible · 501(c)(3) · Tax ID 83-2155012
          </p>
        </div>
      </section>

      <footer className="px-5 py-14 sm:px-8" style={{ backgroundColor: "#0a6e78", color: "#FFFFFF" }}>
        <div>
          <p className="mf-display text-[1.6rem]">Tomchei Shabbos of Florida</p>
          <address className="mt-3 text-[15px] not-italic" style={{ opacity: 0.75 }}>
            194 NE 186th Terrace<br />North Miami Beach, FL 33179
          </address>
          <p className="mt-3 text-[15px]" style={{ opacity: 0.75 }}>Tax ID 83-2155012</p>
        </div>
      </footer>
    </div>
  );
}

function Legend({ children }: { children: React.ReactNode }) {
  return <p className="mt-9 mb-4 text-[12px] uppercase tracking-[0.1em]" style={{ opacity: 0.55 }}>{children}</p>;
}

function Field({ id, label, type = "text", optional, hint }: { id: string; label: string; type?: string; optional?: boolean; hint?: string }) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-2 block text-[14px]">
        {label}
        {optional && <span className="ml-1.5" style={{ opacity: 0.5 }}>(optional)</span>}
      </label>
      <input id={id} type={type}
        className="h-14 w-full rounded-[16px] px-5 text-[16px] focus:outline-none"
        style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(45,45,45,0.12)", color: "#2D2D2D" }} />
      {hint && <p className="mt-2 text-[13px]" style={{ opacity: 0.55 }}>{hint}</p>}
    </div>
  );
}
