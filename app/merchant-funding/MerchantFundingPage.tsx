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
  // ?bg=1 — a look to try, not a decision: the artwork becomes a faint
  // full-page backdrop and the inline hero frame is dropped, since keeping both
  // would show the same picture twice.
  const [bgArt, setBgArt] = useState(false);
  // ?hero=left | right | center — previews the photographic hero: a full-bleed
  // photograph with the headline set over it, in place of the headline-beside-
  // artwork row. Preview only; the plain URL is untouched.
  const [heroV, setHeroV] = useState("");
  // ?pic=banner swaps the hero photograph for the Out For Delivery artwork.
  const [heroPic, setHeroPic] = useState("photo");
  // ?copy=short swaps the long headline for the short one from the mockups.
  // Over a photograph the long sentence runs to four lines and fights the
  // picture; the short one holds two.
  const [shortCopy, setShortCopy] = useState(false);
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
    const q = new URLSearchParams(window.location.search);
    setDemo(q.get("demo") === "1");
    setBgArt(q.get("bg") === "1");
    const h = q.get("hero") || "";
    setHeroV(["left", "right", "center", "field", "concept", "words"].includes(h) ? h : "");
    setHeroPic(q.get("pic") === "banner" ? "banner" : "photo");
    setShortCopy(q.get("copy") === "short");
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

  // A lighter gold for the teal field. The site's #F5A020 measures 2.8:1
  // against #0a6e78 and 2.6:1 against the washed artwork — under the 3:1 floor
  // either way — where #FFB84D reads 3.5:1 and 3.2:1. The site gold stays as it
  // is everywhere it sits on cream.
  const goldAccent = "#FFB84D";

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
    <div
      // The backdrop lives in globals.css as .mf-bgart, because it needs a
      // media query — it fills the screen on phones and shows the whole banner
      // from lg up — and inline styles cannot express that.
      className={`mf ${bgArt ? "mf-bgart" : ""}`}
      style={{
        backgroundColor: "#FBF8F3",
        color: "#2D2D2D",
        fontFamily: "var(--font-dm), ui-sans-serif, system-ui, sans-serif",
        fontWeight: 500,
      }}
    >
      <Script src="https://www.usaepay.com/js/v2/pay.js" onLoad={() => setScriptReady(true)} />

      {/* The concept hero carries its own logo and "Help a family" button
          inside the artwork, so the page header would duplicate both. */}
      <header
        className={`relative w-full items-center justify-between gap-5 px-5 py-5 sm:px-8 ${heroV === "concept" ? "hidden" : "flex"}`}
        style={heroV ? { backgroundColor: "#FFFFFF" } : undefined}
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
        className={`px-5 pb-4 pt-1 text-center text-[13px] uppercase tracking-[0.2em] sm:hidden ${heroV === "concept" ? "hidden" : ""}`}
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
      {/* ?hero=words — the hero reduced to the three lines, with nothing else
          in it. No illustration, no photograph, no buttons.

          The field is built from the two teals the site already uses, #0F9FAE
          and #0a6e78, so the colour is the site's rather than a new mix. */}
      {heroV === "words" && (
        <section
          style={
            heroPic === "banner"
              ? {
                  // The banner sits behind the type under a wash of the site's
                  // own #0a6e78 rather than a darker mix, so the field reads as
                  // the brand colour instead of a dark green.
                  //
                  // The wash is heavy by necessity — the artwork's ground is
                  // cream, so white type over it needs one. At 95% the blend
                  // lands near #16757e: white reads 5.4:1 and the lighter gold
                  // 3.2:1. The trade is that the artwork behind is very faint at
                  // this depth; a lighter wash shows more of it but drops the
                  // gold under 3:1, which is the floor for any text size.
                  backgroundImage:
                    "linear-gradient(rgba(10,110,120,0.94), rgba(10,110,120,0.96)), url('/rosh-hashanah-campaign-hero.jpeg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }
              : {
                  // Centred on the site teal, with only a slight lift and fall
                  // either side of it. The previous bottom stop, #06525A, is
                  // what made the field read as dark green.
                  background:
                    "radial-gradient(120% 90% at 50% 10%, #0a7a85 0%, #0a6e78 55%, #08606a 100%)",
                }
          }
        >
          <div className="mx-auto flex max-w-[60rem] flex-col items-center px-5 py-16 text-center sm:px-8 sm:py-24">
            <h1
              className="text-[clamp(2.8rem,8vw,7rem)]"
              style={{
                fontFamily: "var(--font-anton), sans-serif",
                color: "#FFFFFF",
                lineHeight: 0.92,
                letterSpacing: "0.01em",
              }}
            >
              SHABBOS<br />DELIVERED
            </h1>

            <span className="my-7 block h-0.5 w-20" style={{ backgroundColor: goldAccent }} />

            <p
              className="text-[clamp(0.9375rem,1.8vw,1.375rem)] font-bold uppercase tracking-[0.16em]"
              style={{ color: "#FFFFFF" }}
            >
              Powered by <span style={{ color: goldAccent }}>merchant funding</span>
            </p>

            {/* Bold and at least 20px, so it counts as large text and holds up
                against the washed artwork behind it. */}
            <p className="mt-6 text-[clamp(1.25rem,1.8vw,1.5rem)] font-bold" style={{ color: "#FFFFFF" }}>
              <strong style={{ color: goldAccent, fontWeight: 700 }}>350+</strong> Florida families served every week.
            </p>
          </div>
        </section>
      )}

      {heroV === "concept" && (
        // Held to a max width and centred rather than run edge to edge. The
        // band behind it is painted the image's own field colour, sampled from
        // the file, so the margins read as part of the artwork instead of as
        // the page showing through beside it.
        <section style={{ backgroundColor: "#0d3e43" }}>
          <div className="relative mx-auto aspect-[1672/786] w-full max-w-[72rem] overflow-hidden">
            <Image
              src="/hero-concept.png"
              alt="This Yom Tov, Shabbos delivered, powered by merchant funding. 350+ Florida families, every week."
              fill
              priority
              sizes="100vw"
              className="object-cover object-top"
            />

            {/* The "Help a family" pill is painted into the image, so it needs
                a real link laid over it. The box is not eyeballed: the gold
                pixels in the top-right corner of the file measure 1363,26 to
                1627,88, which is what these percentages are derived from. */}
            <a
              href="#give"
              aria-label="Help a family — go to the donation form"
              className="absolute rounded-full"
              style={{ left: "81.52%", top: "3.31%", width: "15.79%", height: "7.89%" }}
            />
          </div>
          <div className="mx-auto grid max-w-[72rem] grid-cols-2">
            <a
              href="#give"
              className="flex items-center justify-center gap-3 px-4 py-5 text-center text-[clamp(0.9375rem,1.5vw,1.25rem)] font-bold"
              style={{ backgroundColor: "#EFA31D", color: "#1A1A1A" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[1.2em] w-[1.2em] shrink-0" aria-hidden="true">
                <path d="M20.8 8.6c0 4.4-8.8 9.4-8.8 9.4S3.2 13 3.2 8.6a4.6 4.6 0 0 1 8.8-1.8 4.6 4.6 0 0 1 8.8 1.8Z" />
              </svg>
              Make a donation
            </a>
            <a
              href="#give"
              className="flex items-center justify-center gap-3 px-4 py-5 text-center text-[clamp(0.9375rem,1.5vw,1.25rem)] font-bold"
              style={{ backgroundColor: "#12494F", color: "#FFFFFF" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[1.2em] w-[1.2em] shrink-0" aria-hidden="true">
                <rect x="3.2" y="5" width="17.6" height="16" rx="2.4" />
                <path d="M3.2 10h17.6M8 3v4M16 3v4" />
              </svg>
              Give monthly
            </a>
          </div>
        </section>
      )}

      {heroV === "field" && (
        <section
          style={{
            // Built from the two teals the site already uses — #0F9FAE and
            // #0a6e78 — rather than a new mix. Both sit at 185-186 degrees of
            // hue, where the previous centre stop was greener and pulled the
            // whole field away from the brand.
            background:
              "radial-gradient(120% 90% at 50% 8%, #0F9FAE 0%, #0a6e78 48%, #06525A 100%)",
          }}
        >
          <div className="grid items-center gap-6 px-5 pb-8 pt-6 sm:px-8 sm:pt-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-10">
            <svg
              viewBox="0 0 1120 560"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="A Tomchei Shabbos box, Shabbos candles and a delivery van travelling the length of Florida"
              className="h-auto w-full"
            >
              <defs>
                <filter id="mfglow" x="-25%" y="-25%" width="150%" height="150%">
                  <feGaussianBlur stdDeviation="4.5" result="b" />
                  <feMerge>
                    <feMergeNode in="b" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <g stroke="#E8D9A8" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" filter="url(#mfglow)">
                {/* The state sits back as a ground for the route rather than
                    competing with the box and the van in front of it. */}
                <path opacity=".45" d="M470 132 L516 112 L578 118 L648 106 L742 110 L816 100 L878 106 L900 158 L918 214 L940 268 L960 324 L976 380 L988 434 L976 482 L946 504 L914 488 L896 444 L884 392 L866 342 L838 300 L804 268 L766 250 L720 242 L672 234 L626 214 L578 196 L534 172 Z" />
                <path d="M962 516 l-26 14 M922 534 l-28 12 M878 548 l-26 8" opacity=".8" />
                <path d="M556 168 C 640 206, 726 250, 800 316 C 862 372, 900 430, 918 470" strokeDasharray="14 16" opacity=".75" />
                <g transform="translate(742 292) rotate(34)">
                  <path d="M-58 -22 H 16 a10 10 0 0 1 10 10 V 16 H -58 a10 10 0 0 1 -10 -10 V -12 a10 10 0 0 1 10 -10 Z" />
                  <path d="M26 -6 H 48 l 18 20 V 16 H 26 Z" />
                  <path d="M30 -2 H 46 l 12 14 H 30 Z" opacity=".6" />
                  <circle cx="-36" cy="16" r="11" />
                  <circle cx="40" cy="16" r="11" />
                  <path d="M-46 -6 h 20" opacity=".55" />
                </g>
                <g transform="translate(196 250)">
                  <path d="M-118 -34 L 0 -66 L 118 -34 L 118 78 L 0 110 L -118 78 Z" />
                  <path d="M-118 -34 L 0 2 L 118 -34" />
                  <path d="M0 2 L 0 110" />
                  <path d="M-96 -52 L -118 -96 L -8 -122 L 8 -84" opacity=".85" />
                  <path d="M96 -52 L 118 -96 L 8 -122" opacity=".85" />
                  <path d="M-74 -46 c 10 -18, 44 -24, 60 -10" opacity=".9" />
                  <path d="M-70 -38 c 12 -14, 40 -18, 54 -6" opacity=".55" />
                  <path d="M28 -52 v -26 h 16 v 26 c 10 6, 14 14, 14 24 v 22 h -44 v -22 c 0 -10, 4 -18, 14 -24 Z" />
                  <path d="M14 -22 h 44" opacity=".55" />
                  {/* The wordmark on the box, set as real text so the letters
                      are correct rather than drawn approximations. Skewed to
                      follow the box's right face. */}
                  <text
                    x="58"
                    y="66"
                    transform="skewY(15)"
                    textAnchor="middle"
                    stroke="none"
                    fill="#E8D9A8"
                    opacity=".85"
                    style={{ fontFamily: "var(--font-dm), sans-serif", fontSize: "15px", fontWeight: 700, letterSpacing: "0.12em" }}
                  >
                    TOMCHEI SHABBOS
                  </text>
                </g>
                <g transform="translate(336 58)" stroke="#F5A020">
                  <path d="M-30 46 v -44 M 30 46 v -44" />
                  <path d="M-46 46 h 32 M 14 46 h 32" />
                  <path d="M-30 -6 c -9 -10, -2 -20, 0 -26 c 2 6, 9 16, 0 26 Z" />
                  <path d="M30 -6 c -9 -10, -2 -20, 0 -26 c 2 6, 9 16, 0 26 Z" />
                </g>
              </g>
            </svg>

            {/* Type to the right of the drawing, ranged left within its
                column, so the statement has a straight edge to sit against. */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <p className="text-[clamp(0.8125rem,1.3vw,1rem)] uppercase tracking-[0.24em]" style={{ color: "#F5A020" }}>
                This Yom Tov
              </p>
              <h1
                className="mt-2 text-[clamp(2.6rem,6.4vw,5.4rem)]"
                style={{ fontFamily: "var(--font-anton), sans-serif", color: "#FFFFFF", lineHeight: 0.92, letterSpacing: "0.01em" }}
              >
                SHABBOS<br />DELIVERED
              </h1>
              <span className="my-5 block h-0.5 w-16" style={{ backgroundColor: "#F5A020", opacity: 0.85 }} />
              <p className="text-[clamp(0.875rem,1.4vw,1.0625rem)] uppercase tracking-[0.16em] font-bold" style={{ color: "#FFFFFF" }}>
                Powered by <span style={{ color: "#F5A020" }}>merchant funding</span>
              </p>
              <p className="mt-5 text-[clamp(1rem,1.5vw,1.25rem)]" style={{ color: "rgba(255,255,255,.88)" }}>
                <strong style={{ color: "#F5A020", fontWeight: 700 }}>350+</strong> Florida families, every week.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2">
            <a
              href="#give"
              className="flex items-center justify-center gap-3 px-4 py-5 text-center text-[clamp(0.9375rem,1.5vw,1.25rem)] font-bold"
              style={{ backgroundColor: "#F5A020", color: "#2D2D2D" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[1.2em] w-[1.2em] shrink-0" aria-hidden="true">
                <path d="M20.8 8.6c0 4.4-8.8 9.4-8.8 9.4S3.2 13 3.2 8.6a4.6 4.6 0 0 1 8.8-1.8 4.6 4.6 0 0 1 8.8 1.8Z" />
              </svg>
              Make a donation
            </a>
            <a
              href="#give"
              className="flex items-center justify-center gap-3 px-4 py-5 text-center text-[clamp(0.9375rem,1.5vw,1.25rem)] font-bold"
              style={{ backgroundColor: "rgba(255,255,255,.08)", color: "#FFFFFF" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[1.2em] w-[1.2em] shrink-0" aria-hidden="true">
                <rect x="3.2" y="5" width="17.6" height="16" rx="2.4" />
                <path d="M3.2 10h17.6M8 3v4M16 3v4" />
              </svg>
              Give monthly
            </a>
          </div>
        </section>
      )}

      {heroV && heroV !== "field" && heroV !== "concept" && heroV !== "words" && (
        <section className="relative isolate grid min-h-[clamp(20rem,44vw,34rem)]">
          <Image
            src={heroPic === "banner" ? "/rosh-hashanah-hero-mobile.jpg" : "/photos/boys-filling-boxes.jpg"}
            alt={
              heroPic === "banner"
                ? "Your generosity out for delivery. This Yom Tov, it's going a long way."
                : "Volunteers packing Shabbos boxes with fresh produce"
            }
            fill
            priority
            sizes="100vw"
            className="-z-20 object-cover object-center"
          />
          {/* The banner needs a heavier wash than a photograph: it carries its
              own lettering, and only a deep wash pushes that back far enough to
              read as texture behind the headline rather than as a second
              headline competing with it. */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              background:
                heroPic === "banner"
                  ? "linear-gradient(180deg, rgba(8,34,38,.80) 0%, rgba(8,34,38,.86) 100%)"
                  : heroV === "center"
                    ? "linear-gradient(180deg, rgba(10,40,44,.55) 0%, rgba(10,40,44,.75) 100%)"
                    : `linear-gradient(${heroV === "left" ? "270deg" : "90deg"}, rgba(10,40,44,0) 22%, rgba(10,40,44,.62) 52%, rgba(10,40,44,.88) 100%)`,
            }}
          />
          <div
            className={`relative w-full self-center px-5 py-14 sm:px-10 ${
              heroV === "left"
                ? "mr-auto max-w-[min(66rem,94%)]"
                : heroV === "right"
                  ? "ml-auto max-w-[min(66rem,94%)] text-right"
                  : "mx-auto max-w-[min(72rem,94%)] text-center"
            }`}
          >
            <h1
              className="font-bold"
              style={{
                fontFamily: "var(--font-playfair), Georgia, serif",
                color: "#FFFFFF",
                // Runs the width of the hero rather than sitting in a column.
                fontSize: "clamp(2.4rem, 7vw, 6.5rem)",
                lineHeight: 1.04,
                textShadow: "0 2px 18px rgba(6,26,29,.55)",
              }}
            >
              {shortCopy ? (
                <>A single box changes <span style={{ fontStyle: "italic" }}>everything</span>.</>
              ) : (
                <>When <span style={{ fontStyle: "italic" }}>merchant funding</span> comes together, communities move forward.</>
              )}
            </h1>
            <p className="mx-auto mt-6 max-w-[46rem] text-[clamp(1.0625rem,1.7vw,1.375rem)] leading-[1.5]" style={{ color: "rgba(255,255,255,.92)" }}>
              {shortCopy ? (
                <>This Yom Tov, the <strong style={{ fontWeight: 700 }}>merchant funding</strong> community is filling 350 tables across South Florida.</>
              ) : (
                <>This Yom Tov, help put food on 350 South Florida tables.</>
              )}
            </p>
            <a
              href="#give"
              className="mt-7 inline-block rounded-[100px] px-8 py-4 text-[16px] font-bold"
              style={{ backgroundColor: "#F5A020", color: "#2D2D2D" }}
            >
              Help us reach {money(GOAL)}
            </a>
          </div>
        </section>
      )}

      {/* Gold rule closing off the hero — the header, banner and headline above
          it, the totals and the form below. */}
      {heroV && <div className="h-1 w-full" style={{ backgroundColor: "#C8A75B" }} />}

      {/* The banner runs full width as its own band, with the headline centred
          beneath it.

          contain rather than cover, each crop at its own ratio — the 1920x300
          file from sm up, the 800x600 one below — so the whole banner shows and
          nothing is cut off the ends. The band is painted the page's cream,
          which is also the artwork's own ground, so the letterbox either side
          of it is invisible.

          Nothing is laid over the artwork: it carries its own headline, logo
          and body copy, and a second headline on top would collide. */}
      <section className={heroV ? "hidden" : ""} style={{ backgroundColor: "#FBF8F3" }}>
        <div className="relative aspect-[4/3] w-full sm:hidden">
          <Image
            src="/rosh-hashanah-hero-mobile.jpg"
            alt="Your generosity out for delivery. This Yom Tov, it's going a long way. A Tomchei Shabbos box packed with challah, wine and food, and a delivery van."
            fill
            priority
            sizes="100vw"
            className="object-contain object-center"
          />
        </div>
        <div className="relative hidden aspect-[1920/300] w-full sm:block">
          <Image
            src="/rosh-hashanah-hero-v2.jpg"
            alt="Your generosity out for delivery. This Yom Tov, it's going a long way. A Tomchei Shabbos box packed with challah, wine and food, and a delivery van."
            fill
            priority
            sizes="100vw"
            className="object-contain object-center"
          />
        </div>

        {/* Gold rule closing the banner off from the headline beneath it. */}
        <div className="h-1 w-full" style={{ backgroundColor: "#C8A75B" }} />

        <div className="mx-auto w-full max-w-[52rem] px-5 pb-14 pt-10 text-center sm:px-8 sm:pb-20 sm:pt-12">
          {/* The line breaks are set deliberately from lg up, where there is
              room for the intended shape:

                When Florida's
                merchant funding community
                comes together, local families
                move forward.

              Below lg the breaks are hidden and the sentence wraps to the
              column; "merchant funding" is nowrap so the phrase never splits
              across a line at any width. */}
          <h1 className="mf-headline mx-auto max-w-[54rem] text-[clamp(2rem,4vw,3.1rem)]" style={{ color: "#2D2D2D" }}>
            When Florida&rsquo;s<br className="hidden lg:inline" />{" "}
            <span className="mf-highlight">merchant funding</span> community<br className="hidden lg:inline" />{" "}
            comes together, local families<br className="hidden lg:inline" />{" "}
            move forward.
          </h1>
          <a href="#give" className="mt-9 inline-block rounded-[100px] px-8 py-4 text-[16px] font-bold" style={{ backgroundColor: "#C8A75B", color: "#2D2D2D" }}>
            Help us reach {money(GOAL)}
          </a>
        </div>
      </section>

      <section ref={statsRef} className="px-5 pb-4 sm:px-8">
        {/* Supporter names, scrolling directly above the totals. Only names
            whose owners left Anonymous unticked reach this far — the API
            cannot return anyone else.

            The list is rendered twice so the loop has no visible seam, and the
            duration scales with the donor count to hold the speed steady
            however many names there are. */}
        {demo && (
          <p className="mb-2 text-center text-[12px] uppercase tracking-[0.16em]" style={{ color: "#8B6F3A" }}>
            Preview · sample names, not real donors
          </p>
        )}
        {donors.length > 0 && (
          <div className="mf-marquee mb-4 overflow-hidden rounded-none py-3.5"
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
