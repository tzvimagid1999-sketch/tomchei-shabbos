"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Script from "next/script";
import { Lock, CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";
import OtherWaysToGive from "../components/OtherWaysToGive";

// pay.js (loaded from USAePay) attaches a global `usaepay` object.
declare global {
  interface Window {
    usaepay?: {
      Client: new (apiKey: string) => {
        createPaymentCardEntry: () => USAePayCard;
        getPaymentKey: (card: USAePayCard) => Promise<{
          error?: { message: string };
          key?: string;
          creditCard?: { expiration?: string; number?: string; type?: string };
        }>;
      };
    };
  }
}
interface USAePayCard {
  generateHTML: (styles?: Record<string, unknown>) => void;
  addHTML: (containerId: string) => void;
  addEventListener: (event: string, cb: (data: { error?: { message: string } }) => void) => void;
}

const amounts = [
  { value: 125,  monthlyValue: 613, label: "$125",   title: "Small family for a week" },
  { value: 225,  monthlyValue: 500, label: "$225",   title: "Medium family for a week" },
  { value: 350,  monthlyValue: 325, label: "$350",   title: "Large family for a week" },
  { value: 600,  monthlyValue: 200, label: "$600",   title: "Small family for a month" },
  { value: 900,  monthlyValue: 180, label: "$900",   title: "Medium family for a month" },
  { value: 1350, monthlyValue: 72,  label: "$1,350", title: "Large family for a month" },
  { value: 6000, monthlyValue: 36,  label: "$6,000", title: "Family for a year" },
];

const SPLIT_MONTH_OPTIONS = [3, 6, 12, 18, 24, 36];

function SuccessScreen({ name, amount, email, monthly, pledgeMonths, onClose }: { name: string; amount: number; email: string; monthly: boolean; pledgeMonths?: number; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const myConfetti = confetti.create(canvasRef.current, { resize: true, useWorker: true });
    const colors = ["#1AABAB", "#F5A020", "#ffffff", "#0D8585", "#FFD700"];
    const duration = 3500;
    const end = Date.now() + duration;
    const fire = () => {
      myConfetti({ particleCount: 40, angle: 60,  spread: 70, origin: { x: 0,   y: 0.6 }, colors });
      myConfetti({ particleCount: 40, angle: 120, spread: 70, origin: { x: 1,   y: 0.6 }, colors });
      myConfetti({ particleCount: 25, angle: 90,  spread: 55, origin: { x: 0.5, y: 0   }, colors });
      if (Date.now() < end) setTimeout(fire, 250);
    };
    fire();
  }, []);

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center text-center px-6" style={{ zIndex: 9999 }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="relative" style={{ zIndex: 1 }}>
        <CheckCircle className="w-20 h-20 text-[#1AABAB] mx-auto mb-6" />
        <h3 className="font-playfair text-3xl font-bold text-[#2D2D2D] mb-3">
          Thank You{name ? `, ${name.split(" ")[0]}` : ""}!
        </h3>
        <p className="text-gray-600 text-lg mb-2">
          {pledgeMonths
            ? <>Your <strong>${amount}/month</strong> pledge is set up for <strong>{pledgeMonths} months</strong> (total: ${(amount * pledgeMonths).toLocaleString()}).</>
            : monthly
            ? <>Your <strong>${amount}/month</strong> donation is set up.</>
            : <>Your <strong>${amount}</strong> donation has been received.</>}
        </p>
        <p className="text-gray-500 text-sm mb-8">
          You&apos;re making a real difference for families in our community.
        </p>
        {email && <p className="text-gray-400 text-xs mb-8">A confirmation email has been sent to {email}</p>}
        <button onClick={onClose}
          className="bg-[#F5A020] hover:bg-[#D48810] text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300">
          Continue
        </button>
      </div>
    </div>
  );
}

export default function DonatePage() {
  const [frequency, setFrequency] = useState<"once" | "monthly">("once");
  const [selected, setSelected] = useState(0);
  const [custom, setCustom] = useState("");
  const [splitMonths, setSplitMonths] = useState<number | null>(null); // null = ongoing until cancelled
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [honoreeType, setHonoreeType] = useState<"" | "honor" | "memory">("");
  const [honoreeName, setHonoreeName] = useState("");
  const [honoreeEmail, setHonoreeEmail] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  const clientRef = useRef<InstanceType<NonNullable<Window["usaepay"]>["Client"]> | null>(null);
  const cardRef = useRef<USAePayCard | null>(null);
  const publicKey = process.env.NEXT_PUBLIC_USAEPAY_PUBLIC_KEY;

  const donationAmount = Number(custom) || selected;
  const isRecurringFreq = frequency === "monthly";

  const inputClass =
    "w-full border-2 border-[#E5E5E5] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1AABAB] focus:border-transparent bg-white text-[#2D2D2D]";

  // pay.js is often already cached from a previous page, so it can finish
  // loading before the Script component's onLoad listener attaches — poll
  // for window.usaepay directly instead of relying on onLoad alone.
  useEffect(() => {
    if (scriptReady) return;
    if (window.usaepay) {
      setScriptReady(true);
      return;
    }
    const interval = setInterval(() => {
      if (window.usaepay) {
        setScriptReady(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [scriptReady]);

  // Build the secure card entry once pay.js has loaded.
  useEffect(() => {
    if (!scriptReady || !window.usaepay || !publicKey || cardRef.current) return;
    const client = new window.usaepay.Client(publicKey);
    clientRef.current = client;
    const card = client.createPaymentCardEntry();
    card.generateHTML({
      styles: `
        .payjs-base { font-size: 15px; color: #374151; font-family: inherit; }
        .payjs-base::placeholder { color: #9ca3af; }
        .payjs-container { display: flex; flex-wrap: wrap; gap: 10px; }
        .payjs-wrapper { margin-bottom: 0; }
        .payjs-wrapper:nth-child(1) { flex: 1 1 100%; }
        .payjs-wrapper:nth-child(2) { flex: 1 1 90px; }
        .payjs-wrapper:nth-child(3) { flex: 1 1 90px; }
        .payjs-wrapper:nth-child(4) { flex: 1 1 70px; }
      `,
    });
    card.addHTML("usaepay-card-container");
    card.addEventListener("error", (data) => {
      if (data.error) setError(data.error.message);
    });
    cardRef.current = card;
  }, [scriptReady, publicKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (donationAmount < 1) return;
    if (!clientRef.current || !cardRef.current) {
      setError("The payment form is still loading. Please try again in a moment.");
      return;
    }
    setLoading(true);
    setError("");

    let paymentKey: string;
    try {
      const result = await clientRef.current.getPaymentKey(cardRef.current);
      const token = result?.key || (typeof result === "string" ? result : "");
      if (!token) throw new Error("No payment token returned.");
      paymentKey = token;
    } catch (err) {
      let msg = "Please check your card number, expiration, and CVV.";
      const raw = typeof err === "string" ? err : err instanceof Error ? err.message : "";
      try {
        const info = JSON.parse(raw);
        if (info?.message) msg = info.reason ? `${info.message} (${info.reason})` : info.message;
      } catch {
        if (raw && raw[0] !== "[") msg = raw;
      }
      setError(msg);
      setLoading(false);
      return;
    }

    const endpoint = isRecurringFreq ? "/api/usaepay/recurring" : "/api/usaepay";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: donationAmount,
          paymentKey, name, email, street, city, state, zip,
          ...(frequency === "monthly" && splitMonths ? { numPayments: splitMonths } : {}),
          ...(honoreeType && honoreeName ? { honoreeType, honoreeName } : {}),
          ...(honoreeType === "honor" && honoreeEmail ? { honoreeEmail } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Your donation could not be processed.");
      }
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <SuccessScreen
        name={name}
        amount={donationAmount}
        email={email}
        monthly={isRecurringFreq}
        pledgeMonths={splitMonths || undefined}
        onClose={() => {
          setSuccess(false);
          setName(""); setEmail(""); setStreet(""); setCity(""); setState(""); setZip("");
          setSelected(0); setCustom(""); setSplitMonths(null); setFrequency("once");
        }}
      />
    );
  }

  return (
    <main className="min-h-screen pb-16 bg-white">
      <div className="relative z-10">
        <Script src="https://www.usaepay.com/js/v2/pay.js" onLoad={() => setScriptReady(true)} />

        {/* Hero */}
        <section className="relative min-h-[300px] flex items-center justify-center text-center overflow-hidden">
          <Image src="/donate-header.jpg" alt="Tomchei Shabbos volunteers with food"
            fill className="object-cover object-center" priority sizes="100vw" />
          <div className="absolute inset-0 bg-[#1AABAB]/25" />
          <div className="relative z-10 max-w-4xl mx-auto px-6">
            <h1 className="font-playfair text-5xl sm:text-6xl lg:text-7xl font-bold text-white mt-4 mb-5 leading-[1.08]">Donate Today</h1>
            <p className="text-white/90 text-lg max-w-xl mx-auto leading-relaxed">
              Your gift puts food on a family&apos;s Shabbos table this week. Every dollar counts.
            </p>
          </div>
        </section>

        <div className="h-8 sm:h-10" />

        {/* Sponsorship tier cards */}
        <div id="donate-section" className="max-w-6xl mx-auto px-4 sm:px-6 mb-16 sm:mb-20">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {amounts.map((a) => {
              const tierValue = frequency === "monthly" ? a.monthlyValue : a.value;
              const active = selected === tierValue && !custom;
              return (
                <button key={a.value}
                  onClick={() => {
                    setSelected(tierValue);
                    setCustom("");
                    // Wait a tick for the amount bar to render (it's conditional on donationAmount) before scrolling to it.
                    requestAnimationFrame(() => {
                      document.getElementById("donation-amount-bar")?.scrollIntoView({ behavior: "smooth", block: "center" });
                    });
                  }}
                  className="group bg-white rounded-[20px] p-5 sm:p-8 text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-2 border-[#1AABAB] w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)]"
                  style={{ background: active ? "#F0FBFB" : "#FFFFFF" }}>
                  <p className="font-bold text-4xl sm:text-5xl text-[#1AABAB] mb-3 sm:mb-4">
                    {frequency === "monthly" ? `$${a.monthlyValue}/mo` : a.label}
                  </p>
                  <h3 className="text-base sm:text-lg font-bold text-[#2D2D2D] mb-2 sm:mb-3 leading-snug">
                    {frequency === "monthly" ? `Per year: $${(a.monthlyValue * 12).toLocaleString()}` : a.title}
                  </h3>
                  {active && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1AABAB]">
                      <CheckCircle className="w-4 h-4" /> Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Form */}
        <div className="max-w-3xl mx-auto px-6 mb-12">
          <h2 className="text-4xl font-bold text-[#2D2D2D] mb-3">Complete Your Donation</h2>
          <p className="text-[#2D2D2D] text-lg mb-8 font-light">Secure payment &bull; All information is encrypted</p>

          <div className="bg-white rounded-2xl border-2 border-[#1AABAB] shadow-lg p-6 sm:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* One-Time / Monthly toggle */}
              <div className="flex rounded-xl overflow-hidden border-2 border-[#E5E5E5]">
                {(["once", "monthly"] as const).map((f) => (
                  <button type="button" key={f} onClick={() => setFrequency(f)}
                    className={`flex-1 py-3 text-sm font-bold tracking-wide transition-all ${
                      frequency === f ? "bg-[#1AABAB] text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                    }`}>
                    {f === "once" ? "One-Time" : "Monthly"}
                  </button>
                ))}
              </div>

              {frequency === "monthly" && (
                <>
                  <p className="text-center text-xs text-[#1AABAB] font-semibold bg-[#1AABAB]/10 rounded-lg py-2 px-4">
                    {splitMonths
                      ? `You'll be charged this amount monthly for ${splitMonths} months, then it automatically stops.`
                      : "You'll be charged this amount every month. Cancel anytime at /manage-donation."}
                  </p>
                  <div>
                    <label className="block text-sm font-semibold text-[#2D2D2D] mb-3 uppercase tracking-wider">Split Over</label>
                    <select value={splitMonths ?? ""} onChange={(e) => setSplitMonths(e.target.value ? Number(e.target.value) : null)}
                      className="w-full border-2 border-[#E5E5E5] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1AABAB] focus:border-transparent bg-white text-[#2D2D2D]">
                      <option value="">Ongoing (until cancelled)</option>
                      {SPLIT_MONTH_OPTIONS.map((m) => (
                        <option key={m} value={m}>{m} months</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {donationAmount > 0 && (
                <div id="donation-amount-bar" className="bg-gradient-to-br from-[#F0FBFB] to-white border-2 border-[#1AABAB] rounded-xl p-6 mb-2 scroll-mt-24">
                  <p className="text-sm font-semibold text-[#2D2D2D] uppercase tracking-wider mb-2">Donation Amount</p>
                  <p className="font-bold text-5xl text-[#1AABAB]">${donationAmount}{isRecurringFreq ? "/mo" : ""}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-[#2D2D2D] mb-3 uppercase tracking-wider">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-[#1AABAB] font-semibold text-lg">$</span>
                  <input type="number" min="1" placeholder="0.00" value={custom}
                    onChange={(e) => { setCustom(e.target.value); setSelected(0); }}
                    className="w-full pl-10 pr-4 py-3 text-lg border-2 border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1AABAB] focus:border-transparent bg-white" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2D2D2D] mb-3 uppercase tracking-wider">Dedicated To</label>
                <div className="flex rounded-xl overflow-hidden border-2 border-[#E5E5E5] mb-3">
                  {([
                    { key: "", label: "None" },
                    { key: "honor", label: "In Honor Of" },
                    { key: "memory", label: "In Memory Of" },
                  ] as const).map((opt) => (
                    <button type="button" key={opt.key} onClick={() => setHonoreeType(opt.key)}
                      className={`flex-1 py-2.5 text-xs font-bold tracking-wide transition-all ${
                        honoreeType === opt.key ? "bg-[#1AABAB] text-white" : "bg-white text-gray-500 hover:bg-gray-50"
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {honoreeType && (
                  <input type="text" placeholder="Name" value={honoreeName} onChange={(e) => setHonoreeName(e.target.value)}
                    className={`${inputClass} mb-3`} />
                )}
                {honoreeType === "honor" && (
                  <input type="email" placeholder="Their email (optional — sends them a note letting them know)"
                    value={honoreeEmail} onChange={(e) => setHonoreeEmail(e.target.value)}
                    className={inputClass} />
                )}
              </div>

              <div className="pt-4">
                <h3 className="text-sm font-semibold text-[#2D2D2D] mb-4 uppercase tracking-wider">Billing Information</h3>
                <div className="mb-4">
                  <input type="text" required placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                </div>
                <div className="mb-4">
                  <input type="email" required placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                </div>
                {/* min-w-0 on each field: grid items default to min-width:auto, so inputs
                    refuse to shrink below their intrinsic size and overflow the card. */}
                <div className="grid grid-cols-2 sm:grid-cols-[2fr_1fr_0.7fr_1fr] gap-3">
                  <input type="text" required placeholder="Address" value={street} onChange={(e) => setStreet(e.target.value)} className={`${inputClass} min-w-0 col-span-2 sm:col-span-1`} />
                  <input type="text" required placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className={`${inputClass} min-w-0 col-span-2 sm:col-span-1`} />
                  <input type="text" required placeholder="State" maxLength={2} value={state}
                    onChange={(e) => setState(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2))} className={`${inputClass} min-w-0`} />
                  <input type="text" required inputMode="numeric" placeholder="Zip" maxLength={5} value={zip}
                    onChange={(e) => setZip(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))} className={`${inputClass} min-w-0`} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2D2D2D] mb-3 uppercase tracking-wider">Card Details</label>
                <div className="border-2 border-[#E5E5E5] rounded-lg p-4 bg-white focus-within:ring-2 focus-within:ring-[#1AABAB] min-h-[52px]">
                  <div id="usaepay-card-container" />
                  {!scriptReady && <p className="text-gray-400 text-sm">Loading secure card field…</p>}
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button type="submit"
                disabled={loading || !name || !email || !street || !city || state.length < 2 || zip.length < 5 || donationAmount < 1 || !scriptReady}
                className="w-full bg-[#F5A020] hover:bg-[#D48810] text-white py-4 rounded-lg font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 mt-8 flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />
                {loading
                  ? "Processing..."
                  : donationAmount < 1
                    ? "Choose an amount to continue"
                    : isRecurringFreq
                      ? `Give $${donationAmount}/Month`
                      : `Donate $${donationAmount} Securely`}
              </button>

              <p className="text-center text-xs text-gray-400">
                Secure checkout &middot; Donation is tax-deductible &middot; 501(c)(3) Tax ID: 83-2155012
              </p>
            </form>

            <div className="mt-8">
              <OtherWaysToGive />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
