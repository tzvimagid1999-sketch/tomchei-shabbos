"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Script from "next/script";
import CampaignBar from "./CampaignBar";


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

// Same set as the main donate page, so a pledge means the same thing wherever
// it is made. The recurring route already accepts numPayments.
const SPLIT_MONTH_OPTIONS = [3, 6, 12, 18, 24, 36];

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
//
// The failsafe matters: animation frames stop in a backgrounded tab, so without
// it a count that starts while the tab is hidden can sit on its opening value
// indefinitely. On the hero that meant the page could read "0+ Florida families
// served every week", which is worse than no animation at all. If the run has
// not finished by the time it should have, the real figure is written in.
function useCountUp(target: number | null, run: boolean, duration = 900, delay = 0) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (target === null || !run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setN(target);
      return;
    }
    let raf = 0;
    let started = 0;
    const begin = window.setTimeout(() => {
      started = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - started) / duration);
        setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    const failsafe = window.setTimeout(() => setN(target), delay + duration + 1200);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(begin);
      clearTimeout(failsafe);
    };
  }, [target, run, duration, delay]);
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
  // null = ongoing until cancelled, matching the main donate page.
  const [splitMonths, setSplitMonths] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const publicKey = process.env.NEXT_PUBLIC_USAEPAY_PUBLIC_KEY;
  const [scriptReady, setScriptReady] = useState(false);
  const clientRef = useRef<any>(null);
  const cardRef = useRef<any>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  // The ticker only scrolls when one copy of the list is wider than the strip.
  // A short list is centred and left still, so nobody sees their name twice.
  const marqueeRef = useRef<HTMLDivElement>(null);
  const namesGroupRef = useRef<HTMLDivElement>(null);
  // Defaults to scrolling: if the strip can never be measured, a duplicated
  // name is a cosmetic annoyance, while a clipped list hides donors entirely.
  const [scrollNames, setScrollNames] = useState(true);

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
    const sp = new URLSearchParams(window.location.search);
    setDemo(sp.get("demo") === "1");
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

  // Re-measured whenever the list changes or the window resizes, so the ticker
  // starts scrolling as soon as enough names arrive to need it.
  useEffect(() => {
    const measure = () => {
      const strip = marqueeRef.current?.clientWidth ?? 0;
      const oneCopy = namesGroupRef.current?.scrollWidth ?? 0;
      // A zero-width reading means the strip has not been laid out yet. Leaving
      // the decision alone beats acting on it: scrolling a list that fits only
      // shows a name twice, but not scrolling one that overflows would clip
      // names off the edge with no way to see them.
      if (!strip || !oneCopy) return;
      // A few pixels of slack, so a list that only just fits does not scroll.
      setScrollNames(oneCopy > strip + 8);
    };
    measure();
    // Web fonts land after first paint and change every name's width, so the
    // first measurement can be wrong by enough to flip the decision.
    document.fonts?.ready.then(measure).catch(() => {});
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [donors]);

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

  // On the white wash the field is light, so the gold has to be the darker one
  // the page already uses on cream. #F5A020 measures about 2:1 against white
  // and would be unreadable; #A08243 is the gold in the headline and reads
  // 3.4:1 over the cream ground, 3.0:1 over the artwork's darkest patch.
  const goldAccent = "#A08243";

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
          ...(monthly && splitMonths ? { numPayments: splitMonths } : {}),
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
      if (monthly && splitMonths) q.set("months", String(splitMonths));
      window.location.assign(`/merchant-funding/thank-you?${q.toString()}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="mf"
      style={{
        backgroundColor: "#FBF8F3",
        color: "#2D2D2D",
        fontFamily: "var(--font-dm), ui-sans-serif, system-ui, sans-serif",
        fontWeight: 500,
      }}
    >
      <Script src="https://www.usaepay.com/js/v2/pay.js" onLoad={() => setScriptReady(true)} />

      <header
        className="relative flex w-full items-center justify-between gap-5 px-5 py-5 sm:px-8"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <a href="/" className="flex items-center">
          <Image src="/logo-transparent.png" alt="Tomchei Shabbos of Florida" width={670} height={120} priority className="h-9 w-auto sm:h-10" />
        </a>

        {/* Centred on the page rather than between the logo and the button,
            which sit at different widths. Absolute so it cannot push either of
            them around, and pointer-events-none so it never intercepts a click
            meant for the Donate button behind it.

            Below sm the logo and the button leave no room between them, so it
            drops to its own line under the header instead. */}
        <p
          className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 whitespace-nowrap text-[13px] uppercase tracking-[0.2em] sm:block"
          style={{ color: "#2D2D2D", opacity: 0.55 }}
        >
          MCA Donation Page
        </p>

        {/* whitespace-nowrap and the smaller phone padding stop this wrapping
            to "Donate / Now", which it did at 375px and left an 83px-tall
            button next to the logo. */}
        <a href="#give" className="shrink-0 whitespace-nowrap rounded-[100px] px-6 py-3 text-[15px] font-bold sm:px-9 sm:py-4 sm:text-[17px]" style={{ backgroundColor: "#F5A020", color: "#2D2D2D" }}>
          Donate Now
        </a>
      </header>

      {/* Phone fallback for the line that sits inside the header at sm+. */}
      <p
        className="px-5 pb-4 pt-1 text-center text-[13px] uppercase tracking-[0.2em] sm:hidden"
        style={{ color: "#2D2D2D", opacity: 0.55 }}
      >
        MCA Donation Page
      </p>

      {/* ?hero= — the photographic hero. A full-bleed photograph with the
          headline set over it, in place of the headline-beside-artwork row.

          It uses a photograph rather than the Out For Delivery banner because
          that banner already carries its own headline, logo and body copy;
          a second headline on top of it would collide.

          The wash is a gradient, not a flat overlay, so the side the type sits
          on is dark enough to read white against while the other side of the
          frame stays as photographed. */}
      {/* ?hero=field — the colour-field hero: one deep teal field carrying a
          line drawing and the statement, with the two actions across the foot.

          The drawing is inline SVG rather than an image file so it stays sharp
          at any size and can be recoloured from the same tokens as the page.
          Its vocabulary is the campaign's own — the state, the route, the van,
          the packed box, the candles — drawn at one line weight with rounded
          joins, matching the icons already on the Out For Delivery artwork. */}
      {/* ?hero=concept — the rendered concept image used as the hero.

          The image bakes its own action bar into the bottom ~16% of the frame,
          which cannot be clicked, so the frame is cropped above it and real
          links are rendered underneath in the same colours.

          No colour filter is applied. The image's teal measures 186 degrees of
          hue against the site's 185 — the same colour family — and differs only
          in lightness. Lifting it enough to match clips the gold lettering to
          yellow, and a targeted lighten blend flattens the Florida map into the
          background, since map and field both sit below the site teal. */}
      {/* ?hero=words — the three lines over the campaign artwork.

          The artwork always sits behind this hero; it is not a variant. Over it
          a wash of the site's own #0a6e78 at 86%, which is the lightest setting
          that still holds white type at 4.5:1 against the artwork's cream
          ground. Lighter shows more of the picture but the type starts to
          struggle — 78% drops white to 3.9:1 and 74% to 3.6:1. */}
              <section className="mf-words-bg">
          <div className="mx-auto flex max-w-[68rem] flex-col items-center px-5 py-20 text-center sm:px-8 sm:py-28">
            {/* Sets the frame before the ask: this page went to a short list,
                not to a mailing list. Kept small and above the statement so it
                reads as context rather than as a claim competing with it. */}
            <p
              className="mf-h1 mb-5 max-w-[54rem] text-[clamp(0.75rem,1.2vw,0.9375rem)] font-bold uppercase tracking-[0.18em]"
              style={{ color: goldAccent, textWrap: "balance" }}
            >
              An Exclusive Campaign for Merchant Funding Industry Leaders
            </p>

            <h1
              className="text-[clamp(3.25rem,10vw,9rem)]"
              style={{
                fontFamily: "var(--font-anton), sans-serif",
                color: "#2D2D2D",
                lineHeight: 0.92,
                letterSpacing: "0.01em",
              }}
            >
              <span className="mf-h2 block">YOM TOV</span>
              <span className="mf-h3 block">DELIVERED</span>
            </h1>

            <span className="mf-h4 my-9 block h-0.5 w-28" style={{ backgroundColor: goldAccent }} />

            <p
              className="mf-h5 text-[clamp(1rem,2.4vw,1.75rem)] font-bold uppercase tracking-[0.16em]"
              style={{ color: "#2D2D2D" }}
            >
              Powered by <span style={{ color: goldAccent }}>merchant funding</span>
            </p>

            {/* Bold and at least 20px, so it counts as large text against the
                washed artwork behind it. */}
            <p className="mf-h6 mt-7 text-[clamp(1.25rem,2.2vw,1.875rem)] font-bold" style={{ color: "#2D2D2D" }}>
              <strong className="tabular-nums" style={{ color: goldAccent, fontWeight: 700 }}>
                350+
              </strong>{" "}
              Florida families served every week.
            </p>
          </div>

          {/* Both actions go to the donation form; the second lands there with
              the monthly option already chosen. */}
          <div className="grid grid-cols-2">
            <a
              href="#give"
              onClick={() => setMonthly(false)}
              className="flex items-center justify-center px-4 py-5 text-center text-[clamp(0.9375rem,1.5vw,1.25rem)] font-bold"
              style={{ backgroundColor: "#F5A020", color: "#2D2D2D" }}
            >
              Donate Now
            </a>
            <a
              href="#give"
              onClick={() => setMonthly(true)}
              className="flex items-center justify-center px-4 py-5 text-center text-[clamp(0.9375rem,1.5vw,1.25rem)] font-bold"
              style={{ backgroundColor: "#0a6e78", color: "#FFFFFF" }}
            >
              Give monthly
            </a>
          </div>
        </section>

      <section ref={statsRef} className="px-5 pb-4 sm:px-8">
        {/* Supporter names, scrolling directly above the totals. Only names
            whose owners left Anonymous unticked reach this far — the API
            cannot return anyone else.

            The list is rendered twice so the loop has no visible seam, and the
            duration scales with the donor count to hold the speed steady
            however many names there are.

            No box around them: no background, no border. The negative margins
            cancel the section's padding so the names run off both edges of the
            screen rather than stopping at a container. */}
        {demo && (
          <p className="mb-2 text-center text-[12px] uppercase tracking-[0.16em]" style={{ color: "#8B6F3A" }}>
            Preview · sample names, not real donors
          </p>
        )}
        {donors.length > 0 && (
          <div ref={marqueeRef} className="mf-marquee -mx-5 mb-4 overflow-hidden py-4 sm:-mx-8">
            <div
              className={`mf-marquee-track${scrollNames ? "" : " mf-marquee-still"}`}
              style={scrollNames ? { animationDuration: `${Math.max(18, donors.length * 7)}s` } : undefined}
            >
              {/* The second copy is what makes the loop seamless: the track
                  scrolls exactly one copy's width and lands back where it
                  started. It is only rendered when a single copy is wider than
                  the screen — otherwise both copies sit in view at once and a
                  donor sees their own name twice. */}
              {(scrollNames ? [0, 1] : [0]).map((copy) => (
                <div key={copy} ref={copy === 0 ? namesGroupRef : undefined} className="mf-marquee-group" aria-hidden={copy === 1}>
                  {donors.map((d, i) => (
                    <span key={`${copy}-${i}`} className="mf-marquee-item text-[clamp(1rem,1.4vw,1.25rem)] leading-[1.4]">
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
            ["Our Goal", money(GOAL)],
            ["What We Raised", shownRaised === null ? (loadFailed ? "Unavailable" : "—") : money(shownRaised)],
            ["Our Impact So Far", raised === null ? "—" : percent(pct)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[24px] px-8 py-10" style={{ backgroundColor: "#FFFFFF", border: "2px solid #E5E5E5" }}>
              <p className="text-[clamp(0.8125rem,1.1vw,1rem)] font-bold uppercase tracking-[0.12em]" style={{ opacity: 0.7 }}>{label}</p>
              <p className="mf-display mt-4 text-[clamp(2.75rem,6vw,4.5rem)] tabular-nums" style={{ color: "#C8A75B" }}>{value}</p>
            </div>
          ))}
        </div>



        <CampaignBar pct={pct} goal={GOAL} raised={raised} run={inView} />

      </section>

      <section id="give" className="scroll-mt-6 px-5 pb-20 pt-14 sm:px-8 sm:pt-20">
        <div className="mf-reveal mx-auto max-w-[720px] rounded-[32px] px-6 py-10 sm:px-12 sm:py-12" style={{ backgroundColor: "#FFFFFF" }}>
          <h2 className="mf-display text-center text-[clamp(2.1rem,4.6vw,3.25rem)]">Help provide Shabbos for a family</h2>

          <div className="mt-9 flex gap-3">
            {[
              // Clearing the term on the way out keeps a stale pledge length
              // from riding along if the donor switches back to monthly later.
              { label: "One-time", on: !monthly, set: () => { setMonthly(false); setSplitMonths(null); } },
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
            <>
              <p className="mt-3 text-[14px]" style={{ opacity: 0.65 }}>
                {splitMonths
                  ? `Charged every month for ${splitMonths} months, then it stops automatically — ${money(
                      (parseFloat(amount) || 0) * splitMonths
                    )} in total.`
                  : "Charged monthly until you cancel."}
              </p>

              <Legend>Split Over</Legend>
              <select
                value={splitMonths ?? ""}
                onChange={(e) => setSplitMonths(e.target.value ? Number(e.target.value) : null)}
                className="h-14 w-full rounded-[16px] px-5 text-[16px] focus:outline-none"
                style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(45,45,45,0.12)", color: "#2D2D2D" }}
              >
                <option value="">Ongoing (until cancelled)</option>
                {SPLIT_MONTH_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m} months</option>
                ))}
              </select>
            </>
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

          <label className="mt-2 flex cursor-pointer items-start gap-3 rounded-[16px] px-5 py-4"
            style={{ border: "1px solid rgba(45,45,45,0.12)" }}>
            <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0" style={{ accentColor: "#C8A75B" }} />
            <span className="text-[15px] leading-[1.45]">Anonymous</span>
          </label>

          <Legend>Billing address</Legend>
          <Field id="street" label="Street address" />
          <div className="grid gap-x-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <Field id="city" label="City" />
            <Field id="state" label="State" />
            <Field id="zip" label="ZIP" />
          </div>
          <Field id="phone" label="Phone" type="tel" />

          <Legend>Payment details</Legend>
          <div id="card-field" className="rounded-[16px] px-5 py-4" style={{ backgroundColor: "#FFFFFF", border: "1px solid rgba(45,45,45,0.12)" }} />

          {error && (
            <p role="alert" className="mt-5 rounded-[16px] px-5 py-4 text-[15px]" style={{ backgroundColor: "#FCEEEC", color: "#8C1D18", border: "1px solid #E4B4AE" }}>{error}</p>
          )}

          <button onClick={submit} disabled={loading}
            className="mt-8 w-full rounded-[100px] py-5 text-[17px] font-bold disabled:opacity-60"
            style={{ backgroundColor: "#C8A75B", color: "#2D2D2D" }}>
            {loading ? "Processing…" : "Help Feed a Family"}
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

          {/* The way back to the main site. Someone arriving on this link has
              no navigation otherwise — only the logo, which reads as a mark
              rather than a link to most people. */}
          <a
            href="/"
            className="mt-6 inline-block text-[15px] font-bold underline underline-offset-4"
            style={{ color: "#FFFFFF", textDecorationColor: "rgba(255,255,255,.5)" }}
          >
            Visit tomcheishabbosflorida.org
          </a>
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
