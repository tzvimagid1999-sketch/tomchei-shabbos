"use client";
import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import Image from "next/image";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

function ThankYouScreen({ name, amount, email, onClose }: { name: string; amount: string; email: string; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const myConfetti = confetti.create(canvasRef.current, { resize: true, useWorker: true });
    const colors = ["#C8A75B", "#D9B870", "#ffffff", "#8B6F3A"];
    const duration = 3500;
    const end = Date.now() + duration;
    const fire = () => {
      myConfetti({ particleCount: 40, angle: 60, spread: 70, origin: { x: 0, y: 0.6 }, colors });
      myConfetti({ particleCount: 40, angle: 120, spread: 70, origin: { x: 1, y: 0.6 }, colors });
      myConfetti({ particleCount: 25, angle: 90, spread: 55, origin: { x: 0.5, y: 0 }, colors });
      if (Date.now() < end) setTimeout(fire, 250);
    };
    fire();
  }, []);

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center text-center px-6" style={{ zIndex: 9999 }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="relative" style={{ zIndex: 1 }}>
        <CheckCircle className="w-20 h-20 text-[#C8A75B] mx-auto mb-6" />
        <h3 className="font-playfair text-3xl font-bold text-[#2D2D2D] mb-3">
          Thank You{name ? `, ${name.split(" ")[0]}` : ""}!
        </h3>
        <p className="text-gray-600 text-lg mb-2">
          Your <strong>${amount}</strong> donation has been received.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          You&apos;re helping a family celebrate Rosh Hashanah with dignity and joy.
        </p>
        {email && <p className="text-gray-400 text-xs mb-8">A confirmation email has been sent to {email}</p>}
        <button onClick={onClose}
          className="bg-[#C8A75B] hover:bg-[#B8975B] text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300">
          Continue
        </button>
      </div>
    </div>
  );
}

export default function RoshHashanah() {
  const [totalDonated, setTotalDonated] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkoutAmount, setCheckoutAmount] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [thankYou, setThankYou] = useState<{ name: string; amount: string; email: string } | null>(null);

  const clientRef = useRef<any>(null);
  const cardRef = useRef<any>(null);
  const publicKey = process.env.NEXT_PUBLIC_USAEPAY_PUBLIC_KEY;

  const GOAL = 500000;
  const progressPercent = Math.min((totalDonated / GOAL) * 100, 100);

  useEffect(() => {
    const fetchTotal = async () => {
      try {
        const res = await fetch("/api/donation-total");
        const data = await res.json();
        setTotalDonated(data.total || 0);
      } catch (err) {
        console.error("Failed to fetch donation total:", err);
      }
      setLoading(false);
    };

    fetchTotal();
    const interval = setInterval(fetchTotal, 10000);
    return () => clearInterval(interval);
  }, []);

  // pay.js is often already cached from a previous page, so it can finish
  // loading before the Script component's onLoad listener attaches — poll
  // for window.usaepay directly instead of relying on onLoad alone.
  useEffect(() => {
    if (scriptReady) return;
    if ((window as any).usaepay) {
      setScriptReady(true);
      return;
    }
    const interval = setInterval(() => {
      if ((window as any).usaepay) {
        setScriptReady(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [scriptReady]);

  useEffect(() => {
    if (!scriptReady || !(window as any).usaepay || !publicKey || cardRef.current) return;
    const client = new (window as any).usaepay.Client(publicKey);
    clientRef.current = client;
    const card = client.createPaymentCardEntry();
    card.generateHTML({
      base: { fontSize: "15px", color: "#374151", fontFamily: "inherit" },
      "::placeholder": { color: "#9ca3af" },
    });
    card.addHTML("card-field");
    card.addEventListener("error", (data: any) => {
      if (data.error) console.error(data.error.message);
    });
    cardRef.current = card;
  }, [scriptReady, publicKey]);

  const handleCheckoutPayment = async () => {
    const firstName = (document.getElementById("firstName") as HTMLInputElement)?.value;
    const lastName = (document.getElementById("lastName") as HTMLInputElement)?.value;
    const email = (document.getElementById("email") as HTMLInputElement)?.value;
    const street = (document.getElementById("street") as HTMLInputElement)?.value;
    const city = (document.getElementById("city") as HTMLInputElement)?.value;
    const state = (document.getElementById("state") as HTMLInputElement)?.value;
    const zip = (document.getElementById("zip") as HTMLInputElement)?.value;

    if (!checkoutAmount || !firstName || !lastName || !email || !street || !city || !state || !zip) {
      alert("Please fill in all fields");
      return;
    }

    if (!clientRef.current || !cardRef.current) {
      alert("The payment form is still loading. Please try again in a moment.");
      return;
    }

    setCheckoutLoading(true);

    try {
      const result = await clientRef.current.getPaymentKey(cardRef.current);
      const paymentKey = result?.key || (typeof result === "string" ? result : "");
      if (!paymentKey) throw new Error("No payment token returned.");

      const response = await fetch("/api/usaepay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(checkoutAmount),
          paymentKey,
          firstName,
          lastName,
          email,
          street,
          city,
          state,
          zip,
          campaign: "rosh-hashanah",
        }),
      });

      const data = await response.json();
      if (data.success) {
        setThankYou({ name: firstName, amount: checkoutAmount, email });
        window.scrollTo({ top: 0, behavior: "smooth" });
        setCheckoutAmount("");
        (document.getElementById("firstName") as HTMLInputElement).value = "";
        (document.getElementById("lastName") as HTMLInputElement).value = "";
        (document.getElementById("email") as HTMLInputElement).value = "";
        (document.getElementById("street") as HTMLInputElement).value = "";
        (document.getElementById("city") as HTMLInputElement).value = "";
        (document.getElementById("state") as HTMLInputElement).value = "";
        (document.getElementById("zip") as HTMLInputElement).value = "";
      } else {
        alert("Payment failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      const msg = typeof err === "string" ? err : err instanceof Error ? err.message : "Error processing payment";
      alert(msg);
      console.error(err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const tiers = [
    { value: 125, label: "$125", title: "Shabbos for a family" },
    { value: 250, label: "$250", title: "Rosh Hashanah for a family" },
    { value: 600, label: "$600", title: "Succos for a family" },
    { value: 1250, label: "$1,250", title: "Shabbos for 10 families" },
    { value: 2500, label: "$2,500", title: "Rosh Hashanah for 10 families" },
    { value: 6000, label: "$6,000", title: "Succos for 10 families" },
  ];

  if (thankYou) {
    return <ThankYouScreen name={thankYou.name} amount={thankYou.amount} email={thankYou.email} onClose={() => setThankYou(null)} />;
  }

  return (
    <main className="min-h-screen pb-16 bg-white">
      <div className="relative z-10">
        <Script src="https://www.usaepay.com/js/v2/pay.js" onLoad={() => setScriptReady(true)} />

        {/* Hero */}
        <div className="relative text-center pt-32 pb-20 sm:pt-40 sm:pb-28 px-4 sm:px-6 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url(/rosh-hashanah-apples-honey.png)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="absolute inset-0" style={{ background: "rgba(15, 23, 42, 0.55)" }} />
          <div className="relative max-w-3xl mx-auto">
            <h1 className="font-playfair text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight">
              A New Year. A Fresh Start. A Chance to Make a <span style={{ color: "#D4A017" }}>Difference.</span>
            </h1>
            <p className="mt-8 text-white/90 max-w-xl mx-auto" style={{ fontFamily: "var(--font-manrope)", fontSize: "22px", lineHeight: 1.6 }}>
              Every family deserves to celebrate Rosh Hashanah with dignity. Your generosity provides food, hope, and joy to families who need it most.
            </p>
            <button onClick={() => document.getElementById('donate-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="mt-10 text-white px-8 sm:px-10 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto"
              style={{ backgroundColor: "#D4A017" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#B8860B")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#D4A017")}>
              Donate Now →
            </button>
          </div>
        </div>

        <div className="h-16 sm:h-20" />

        {/* Thermometer */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-16 sm:mb-20">
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8" style={{ background: 'rgba(255, 255, 255, 0.95)' }}>
            <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
              <div className="text-center">
                <p className="text-xs sm:text-sm font-semibold text-[#2D2D2D] uppercase tracking-wider mb-1 sm:mb-2">Goal</p>
                <p className="font-bold text-2xl sm:text-3xl text-[#C8A75B]">$500k</p>
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm font-semibold text-[#2D2D2D] uppercase tracking-wider mb-1 sm:mb-2">Raised</p>
                <p className="font-bold text-2xl sm:text-3xl text-[#2D2D2D]">${(totalDonated / 1000).toFixed(0)}k</p>
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm font-semibold text-[#2D2D2D] uppercase tracking-wider mb-1 sm:mb-2">Progress</p>
                <p className="font-bold text-2xl sm:text-3xl text-[#C8A75B]">{Math.round(progressPercent)}%</p>
              </div>
            </div>
            <div className="relative w-full h-6 bg-[#F8F4EC] rounded-full overflow-hidden shadow-sm">
              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#C8A75B] to-[#D9B870] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>

        {/* Donation Cards */}
        <div id="donate-section" className="max-w-6xl mx-auto px-4 sm:px-6 mb-16 sm:mb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {tiers.map((tier) => (
              <button key={tier.value} onClick={() => setCheckoutAmount(tier.value.toString())}
                className="group bg-white rounded-[20px] p-5 sm:p-8 text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-2 border-[#C8A75B]"
                style={{ background: selectedTier === tier.value ? '#F8F4EC' : '#FFFFFF' }}>
                <p className="font-bold text-4xl sm:text-5xl text-[#C8A75B] mb-3 sm:mb-4">{tier.label}</p>
                <h3 className="text-base sm:text-lg font-bold text-[#2D2D2D] mb-2 sm:mb-3 leading-snug">{tier.title}</h3>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Form */}
        <div className="max-w-3xl mx-auto px-6 mb-12">
          <h2 className="text-4xl font-bold text-[#2D2D2D] mb-3">Complete Your Donation</h2>
          <p className="text-[#2D2D2D] text-lg mb-8 font-light">Secure payment • All information is encrypted</p>

          <div className="bg-white rounded-2xl border-2 border-[#C8A75B] shadow-lg p-10">
            <div className="space-y-6">
              {checkoutAmount && (
                <div className="bg-gradient-to-br from-[#F8F4EC] to-white border-2 border-[#C8A75B] rounded-xl p-6 mb-6">
                  <p className="text-sm font-semibold text-[#2D2D2D] uppercase tracking-wider mb-2">Donation Amount</p>
                  <p className="font-bold text-5xl text-[#C8A75B]">${checkoutAmount}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-[#2D2D2D] mb-3 uppercase tracking-wider">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-4 text-[#C8A75B] font-semibold text-lg">$</span>
                  <input type="number" placeholder="0.00" value={checkoutAmount}
                    onChange={(e) => setCheckoutAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-lg border-2 border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A75B] focus:border-transparent bg-white" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2D2D2D] mb-3 uppercase tracking-wider">Card Number</label>
                <div id="card-field" className="border-2 border-[#E5E5E5] rounded-lg p-4 bg-white focus-within:ring-2 focus-within:ring-[#C8A75B]"></div>
              </div>

              <div className="pt-4">
                <h3 className="text-sm font-semibold text-[#2D2D2D] mb-4 uppercase tracking-wider">Billing Information</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input type="text" placeholder="First Name" className="border-2 border-[#E5E5E5] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8A75B] focus:border-transparent bg-white text-[#2D2D2D]" id="firstName" />
                  <input type="text" placeholder="Last Name" className="border-2 border-[#E5E5E5] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8A75B] focus:border-transparent bg-white text-[#2D2D2D]" id="lastName" />
                </div>
                <input type="email" placeholder="Email Address" className="w-full border-2 border-[#E5E5E5] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8A75B] focus:border-transparent bg-white text-[#2D2D2D] mb-4" id="email" required />
                <input type="text" placeholder="Street Address" className="w-full border-2 border-[#E5E5E5] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8A75B] focus:border-transparent bg-white text-[#2D2D2D] mb-4" id="street" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="City" className="border-2 border-[#E5E5E5] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8A75B] focus:border-transparent bg-white text-[#2D2D2D]" id="city" />
                  <input type="text" placeholder="State" maxLength={2} className="border-2 border-[#E5E5E5] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8A75B] focus:border-transparent bg-white text-[#2D2D2D]" id="state" />
                </div>
                <input type="text" placeholder="ZIP Code" maxLength={5} className="w-full border-2 border-[#E5E5E5] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8A75B] focus:border-transparent bg-white text-[#2D2D2D] mt-4" id="zip" />
              </div>

              <button onClick={handleCheckoutPayment} disabled={checkoutLoading} className="w-full bg-[#C8A75B] hover:bg-[#B8975B] text-white py-4 rounded-lg font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 mt-8">
                {checkoutLoading ? "Processing..." : "Complete Donation"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
