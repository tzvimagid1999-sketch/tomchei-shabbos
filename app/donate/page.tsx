"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Script from "next/script";
import { Lock, Shield, CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

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
  { value: 125,   label: "$125",   note: "A family for one week" },
  { value: 10000, label: "$10k",   note: "A week of Shabbos for our whole community" },
  { value: 5400,  label: "$5,400", note: "Sustains a family for three full months" },
  { value: 3600,  label: "$3,600", note: "Become a community partner" },
  { value: 1800,  label: "$1,800", note: "Yom Tov joy for a large family" },
  { value: 1200,  label: "$1,200", note: "Yom Tov joy for a small family" },
  { value: 180,   label: "$180",   note: "A large family, every Shabbos this month" },
  { value: 360,   label: "$360",   note: "A medium family, every Shabbos this month" },
  { value: 520,   label: "$520",   note: "A small family, every Shabbos this month" },
  { value: 700,   label: "$700",   note: "One family's Shabbos table this week" },
];

function SuccessScreen({ name, amount, email, monthly, custnum }: { name: string; amount: number; email: string; monthly: boolean; custnum: string }) {
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
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h3 className="font-playfair text-3xl font-bold text-[#1AABAB] mb-3">
          Thank You{name ? `, ${name.split(" ")[0]}` : ""}!
        </h3>
        <p className="text-gray-600 text-lg mb-2">
          {monthly
            ? <>Your <strong>${amount}/month</strong> donation is set up.</>
            : <>Your <strong>${amount}</strong> donation has been received.</>}
        </p>
        <p className="text-gray-500 text-sm">
          You&apos;re making a real difference for families in our community.
        </p>
        {monthly && (
          <div className="mt-5 bg-[#FAF3E8] border border-[#E8D9C0] rounded-xl px-5 py-4 text-sm">
            <p className="text-gray-600">
              We&apos;ve emailed your confirmation to <strong>{email}</strong> with a
              one-click link to <strong>cancel anytime</strong> — no number to remember.
            </p>
          </div>
        )}
        {!monthly && email && (
          <p className="text-gray-400 text-xs mt-4">A receipt will be sent to {email}</p>
        )}
      </div>
    </div>
  );
}

function DonateForm() {
  const [frequency, setFrequency] = useState<"once" | "monthly">("once");
  const [selected, setSelected] = useState(0);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [custnum, setCustnum] = useState("");
  const [scriptReady, setScriptReady] = useState(false);

  const clientRef = useRef<InstanceType<NonNullable<Window["usaepay"]>["Client"]> | null>(null);
  const cardRef = useRef<USAePayCard | null>(null);

  // pay.js (the card field) authenticates with the PUBLIC key; the server
  // charge uses the Source Key + PIN. These are two different values.
  const publicKey = process.env.NEXT_PUBLIC_USAEPAY_PUBLIC_KEY;

  const donationAmount = Number(custom) || selected;

  const inputClass =
    "w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1AABAB] transition font-medium text-gray-700 bg-white";

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
      base: { fontSize: "15px", color: "#374151", fontFamily: "inherit" },
      "::placeholder": { color: "#9ca3af" },
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

    // Tokenize the card in the browser — the raw number never touches our server.
    // pay.js REJECTS with a JSON-string error on failure, and resolves with the
    // token on success (in .key, or occasionally the value itself).
    let paymentKey: string;
    let debugToken = "";
    try {
      const result = await clientRef.current.getPaymentKey(cardRef.current);
      debugToken = JSON.stringify(result); // TEMP DEBUG
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

    // One-time charges hit /api/usaepay; monthly sets up a recurring schedule.
    const endpoint = frequency === "monthly" ? "/api/usaepay/recurring" : "/api/usaepay";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: donationAmount, paymentKey, name, email, street, city, state, zip }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const dbg = frequency === "monthly"
          ? " || TOKEN: " + debugToken + " || SERVER: " + JSON.stringify(data.debug || {})
          : "";
        throw new Error((data.error || "Your donation could not be processed.") + dbg);
      }
      if (data.custnum) setCustnum(String(data.custnum));
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
    setLoading(false);
  };

  if (success) {
    return <SuccessScreen name={name} amount={donationAmount} email={email} monthly={frequency === "monthly"} custnum={custnum} />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Script
        src="https://www.usaepay.com/js/v2/pay.js"
        onLoad={() => setScriptReady(true)}
      />

      {/* One-time / Monthly toggle */}
      <div className="flex rounded-xl overflow-hidden border-2 border-gray-200">
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
        <p className="text-center text-xs text-[#1AABAB] font-semibold bg-[#1AABAB]/10 rounded-lg py-2 px-4">
          You&apos;ll be charged this amount every month. Cancel anytime at /manage-donation.
        </p>
      )}

      {/* Amount selector */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#1AABAB] mb-3">Sponsorships</p>
        <div className="flex flex-col gap-3 mb-5">
          {[[0, 1], [1, 3], [3, 6], [6, 10]].map(([start, end], rowIdx) => (
            <div key={rowIdx} className="flex justify-center gap-3">
              {amounts.slice(start, end).map((a) => {
                const active = selected === a.value && !custom;
                return (
                  <button type="button" key={a.value}
                    onClick={() => { setSelected(a.value); setCustom(""); }}
                    style={{
                      borderColor: active ? "#1AABAB" : "#E5E7EB",
                      backgroundColor: active ? "#F0FBFB" : "#FFFFFF",
                    }}
                    className="flex-1 max-w-[150px] rounded-xl border-2 p-3 text-center transition-all hover:border-[#1AABAB] flex flex-col items-center justify-start">
                    <span className="font-playfair text-xl font-bold mb-1" style={{ color: active ? "#1AABAB" : "#0D8585" }}>{a.label}</span>
                    <span className="text-[11px] leading-snug" style={{ color: active ? "#1AABAB" : "#6B7280" }}>{a.note}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-sm font-medium whitespace-nowrap">Custom amount:</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-sm">$</span>
            <input type="number" min="1" placeholder="Enter amount" value={custom}
              onChange={(e) => { setCustom(e.target.value); setSelected(0); }}
              className="w-full border-2 border-gray-200 rounded-lg pl-7 pr-4 py-3 focus:outline-none focus:border-[#1AABAB] font-medium text-sm transition" />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 pt-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Payment Details</p>
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Full Name *</label>
        <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email *</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </div>

      {/* Billing address */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Billing Address *</label>
        <input type="text" required value={street} onChange={(e) => setStreet(e.target.value)}
          placeholder="Street address" className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">City *</label>
          <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">State *</label>
          <input type="text" required value={state}
            onChange={(e) => setState(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2))}
            placeholder="FL" className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Billing ZIP *</label>
        <input type="text" inputMode="numeric" required value={zip}
          onChange={(e) => setZip(e.target.value.replace(/[^0-9]/g, "").slice(0, 5))}
          placeholder="12345" className={inputClass} />
      </div>

      {/* Card */}
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Card Details *</label>
        <div className="border-2 border-gray-200 rounded-lg px-4 py-3.5 focus-within:border-[#1AABAB] transition bg-white min-h-[52px]">
          <div id="usaepay-card-container" />
          {!scriptReady && <p className="text-gray-400 text-sm">Loading secure card field…</p>}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button type="submit" disabled={loading || !name || !email || !street || !city || state.length < 2 || zip.length < 5 || donationAmount < 1 || !scriptReady}
        className="w-full bg-[#F5A020] text-white py-4 rounded-lg font-semibold text-lg hover:bg-[#D48810] transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2">
        <Lock className="w-4 h-4" />
        {loading
          ? "Processing..."
          : frequency === "monthly"
            ? `Give $${donationAmount}/Month`
            : `Donate $${donationAmount} Securely`}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <Shield className="w-3.5 h-3.5" />
        256-bit SSL Encrypted &middot; Powered by USAePay
      </div>
      <p className="text-center text-xs text-gray-400">Visa &middot; Mastercard &middot; Amex &middot; Discover</p>
    </form>
  );
}

export default function DonatePage() {
  return (
    <main className="pt-20">

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

      {/* Form + Testimonials side by side */}
      <section id="payment" className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-start">

            {/* Left: testimonials */}
            <div className="lg:sticky lg:top-28">
              <span className="font-caveat text-[#C17642] text-3xl sm:text-4xl tracking-wide">From Our Families</span>
              <h2 className="font-playfair text-4xl sm:text-5xl font-bold text-gray-900 mt-2 mb-10 leading-[1.1]">Why It Matters</h2>
              <div className="flex flex-col gap-6">
                <div className="bg-[#FAF3E8] rounded-2xl p-8 border border-[#E8D9C0]">
                  <p className="font-playfair italic text-gray-700 text-lg leading-relaxed">
                    &ldquo;From the application process to having food delivered right to our door every week &mdash; Tomchei Shabbos has taken away our greatest stress. There are no words to describe our gratitude.&rdquo;
                  </p>
                </div>
                <div className="bg-[#FAF3E8] rounded-2xl p-8 border border-[#E8D9C0]">
                  <p className="font-playfair italic text-gray-700 text-lg leading-relaxed">
                    &ldquo;What would we do without Tomchei Shabbos? They have restored happiness and calm to our home. Shabbos is something we look forward to again. Thank you from the bottom of our hearts.&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Right: payment form */}
            <div>
              <DonateForm />
            </div>

          </div>
        </div>
      </section>

      {/* Other methods */}
      <section className="bg-[#FDF9F7] py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-[#1AABAB] font-semibold text-xs uppercase tracking-widest">Other Options</span>
            <h2 className="font-playfair text-4xl sm:text-5xl font-bold text-[#1AABAB] mt-3 leading-[1.1]">Other Ways to Give</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { name: "PayPal",      desc: "Fast & secure via PayPal",  href: "https://www.paypal.com/donate", btnText: "Donate via PayPal" },
              { name: "Zelle",       desc: "Zelle to: (Your info here)", href: "#",                            btnText: "Send via Zelle" },
              { name: "Donors Fund", desc: "Donate through your DAF",    href: "#",                            btnText: "Donors Fund" },
            ].map(({ name, desc, href, btnText }) => (
              <div key={name} className="bg-white rounded-2xl p-7 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <h3 className="font-bold text-[#1AABAB] text-lg mb-2">{name}</h3>
                <p className="text-gray-500 text-sm mb-6">{desc}</p>
                <a href={href} className="block w-full bg-[#F5A020] text-white py-3 rounded-lg font-semibold text-sm hover:bg-[#D48810] transition">
                  {btnText}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-[#1AABAB] py-12 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-white font-semibold text-base mb-2">Your donation is safe, secure, and tax-deductible</p>
          <p className="text-white/90 text-sm">501(c)(3) Non-Profit &middot; Tax ID: 83-2155012 &middot; 100% goes to families</p>
        </div>
      </section>

    </main>
  );
}
