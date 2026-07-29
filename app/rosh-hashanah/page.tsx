"use client";
import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import { Heart } from "lucide-react";
import Image from "next/image";

export default function RoshHashanah() {
  const [totalDonated, setTotalDonated] = useState(0);
  const [loading, setLoading] = useState(true);

  // Animation for heading
  const headingStyle = `
    @keyframes slideInFade {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .heading-animate {
      animation: slideInFade 0.8s ease-out;
    }
  `;

  const GOAL = 500000; // $500k
  const progressPercent = Math.min((totalDonated / GOAL) * 100, 100);
  const reachedGoal = totalDonated >= GOAL;

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
    // Poll every 10 seconds for real-time updates
    const interval = setInterval(fetchTotal, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load USAePay - same as donate page
  const [scriptReady, setScriptReady] = useState(false);
  const cardRef = useRef<any>(null);
  const clientRef = useRef<any>(null);
  const publicKey = process.env.NEXT_PUBLIC_USAEPAY_PUBLIC_KEY;

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

  const [checkoutAmount, setCheckoutAmount] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);

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

      const amountCents = Math.round(parseFloat(checkoutAmount) * 100);
      const response = await fetch("/api/usaepay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountCents,
          paymentKey,
          firstName,
          lastName,
          email,
          street,
          city,
          state,
          zip,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Donation of $${checkoutAmount} received! Thank you. A confirmation email has been sent to ${email}`);
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
    { value: 6000, label: "$6,000", emoji: "🍎", title: "Sponsor Succos for 10 families", note: "Sponsor Succos for 10 families" },
    { value: 1250, label: "$1,250", emoji: "🍯", title: "Sponsor Shabbas for 10 families", note: "Sponsor Shabbas for 10 families" },
    { value: 250, label: "$250", emoji: "🍎", title: "Sponsor Rosh Hashanah for a family", note: "Sponsor Rosh Hashanah for a family" },
    { value: 2500, label: "$2,500", emoji: "🍯", title: "Sponsor Rosh Hashanah for 10 families", note: "Sponsor Rosh Hashanah for 10 families" },
    { value: 600, label: "$600", emoji: "🍎", title: "Sponsor Succos for a family", note: "Sponsor Succos for a family" },
    { value: 125, label: "$125", emoji: "🍯", title: "Sponsor Shabbas for a family", note: "Sponsor Shabbas for a family" },
  ];

  return (
    <main className="min-h-screen pt-20 pb-16" style={{
      backgroundImage: "url(/rosh-hashanah-bg.png)",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
      position: "relative"
    }}>
      <div className="absolute inset-0 bg-[#FDF9F7]/80"></div>
      <div className="relative z-10">
      <style>{headingStyle}</style>
      <Script
        src="https://www.usaepay.com/js/v2/pay.js"
        onLoad={() => setScriptReady(true)}
      />
      {/* Hero */}
      <div className="max-w-3xl mx-auto px-6 text-center mb-16">
        <span className="font-caveat text-[#E57373] text-3xl sm:text-4xl tracking-wide">
          Rosh Hashanah Campaign
        </span>
        <h1 className="font-playfair text-6xl sm:text-7xl font-bold text-[#C9A961] mt-4 leading-[1.1] heading-animate" style={{ textShadow: '4px 4px 8px rgba(0, 0, 0, 0.3), 2px 2px 4px rgba(0, 0, 0, 0.2)' }}>
          A New Year! A Fresh Start! A Chance to Make a Difference!
        </h1>
      </div>

      {/* Main Content with Vertical Tracker on Left and Tiers on Right */}
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="flex gap-8 items-start" style={{ marginTop: "-200px" }}>
          {/* Left: Vertical Progress Tracker */}
          <div className="hidden lg:flex flex-col items-center gap-6 min-w-fit">
            {/* Goal Display - Top */}
            <div className="text-center bg-gradient-to-br from-[#C9A961] to-[#C9A961] rounded-2xl px-6 py-4 shadow-lg">
              <p className="text-white text-sm font-semibold uppercase tracking-wider">Our Goal</p>
              <p className="font-playfair text-5xl font-bold text-white">
                ${(GOAL / 1000).toFixed(0)}k
              </p>
            </div>

            {/* Vertical Progress Bar Container - Much Taller & Wider */}
            <div className="relative h-[900px] w-32 bg-gray-100 rounded-3xl overflow-visible flex flex-col shadow-2xl" style={{ background: 'linear-gradient(to bottom, #fff, #f5f5f5)', border: '4px solid #FF6B6B' }}>

              {/* Filled portion (bottom to top) */}
              <div
                className="absolute bottom-0 w-full bg-gradient-to-t from-[#FF6B00] via-[#C9A961] to-[#FFED4E] transition-all duration-500 rounded-b-2xl"
                style={{ height: `${progressPercent}%` }}
              />


              {/* Left Milestone Markers - On Tracker */}
              <div className="absolute left-0 w-8 h-2 bg-[#C9A961]" style={{ top: `${100 - (100000 / 500000) * 100}%`, transform: 'translateY(-50%)' }} />
              <span className="absolute font-bold text-[#C9A961] text-xs whitespace-nowrap" style={{ left: '-50px', top: `${100 - (100000 / 500000) * 100}%`, transform: 'translateY(-50%)' }}>$100k</span>

              <div className="absolute left-0 w-8 h-2 bg-[#C9A961]" style={{ top: `${100 - (300000 / 500000) * 100}%`, transform: 'translateY(-50%)' }} />
              <span className="absolute font-bold text-[#C9A961] text-xs whitespace-nowrap" style={{ left: '-50px', top: `${100 - (300000 / 500000) * 100}%`, transform: 'translateY(-50%)' }}>$300k</span>

              {/* Right Milestone Markers - On Tracker */}
              <div className="absolute right-0 w-8 h-2 bg-[#C9A961]" style={{ top: `${100 - (200000 / 500000) * 100}%`, transform: 'translateY(-50%)' }} />
              <span className="absolute font-bold text-[#C9A961] text-xs whitespace-nowrap" style={{ right: '-50px', top: `${100 - (200000 / 500000) * 100}%`, transform: 'translateY(-50%)' }}>$200k</span>

              <div className="absolute right-0 w-8 h-2 bg-[#C9A961]" style={{ top: `${100 - (400000 / 500000) * 100}%`, transform: 'translateY(-50%)' }} />
              <span className="absolute font-bold text-[#C9A961] text-xs whitespace-nowrap" style={{ right: '-50px', top: `${100 - (400000 / 500000) * 100}%`, transform: 'translateY(-50%)' }}>$400k</span>
            </div>

            {/* Amount Raised Display - Below tracker */}
            <div className="text-center bg-gradient-to-br from-[#FFED4E] to-[#C9A961] rounded-2xl px-6 py-4 shadow-lg">
              <p className="text-gray-700 text-sm font-semibold uppercase tracking-wider">Raised So Far</p>
              <p className="font-playfair text-5xl font-bold text-gray-900">
                ${(totalDonated / 1000).toFixed(0)}k
              </p>
            </div>

          </div>

          {/* Right: Donation Tiers - Circular Layout */}
          <div className="hidden lg:flex flex-1 items-center justify-center" style={{ minHeight: "900px", marginTop: "200px" }}>
            <div className="relative" style={{ width: "800px", height: "800px" }}>
              {/* Circle reference (invisible) */}
              <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0 }}>
                <circle cx="400" cy="400" r="300" fill="none" stroke="#C9A961" strokeWidth="2" />
              </svg>

              {/* Center heading */}
              <div className="absolute inset-0 flex items-center justify-center">
                <h2 className="font-playfair text-3xl font-bold text-[#FF6B6B] text-center max-w-xs">
                  Rosh Hashanah Donation
                </h2>
              </div>

              {/* Boxes arranged in circle */}
              {tiers.map((tier, index) => {
                const angle = (index / tiers.length) * 360;
                const radius = 320;
                const x = 400 + radius * Math.cos((angle - 90) * Math.PI / 180);
                const y = 400 + radius * Math.sin((angle - 90) * Math.PI / 180);

                return (
                  <button
                    key={tier.value}
                    onClick={() => {
                      setCheckoutAmount(tier.value.toString());
                      setSelectedTier(tier.value);
                    }}
                    className={`absolute bg-white rounded-xl p-4 text-left transition group cursor-pointer w-40 ${
                      selectedTier === tier.value
                        ? "bg-yellow-50 shadow-lg"
                        : "hover:shadow-lg"
                    }`}
                    style={{
                      left: `${x}px`,
                      top: `${y}px`,
                      transform: "translate(-50%, -50%)",
                      borderWidth: "2px",
                      borderColor: selectedTier === tier.value ? "#C9A961" : "#FF6B6B",
                      boxShadow: selectedTier === tier.value ? undefined : "0 2px 8px rgba(30, 64, 175, 0.2)"
                    }}
                  >
                    <div className="flex-1">
                      <p className="font-bold text-xl text-[#C9A961] mb-2">{tier.label}</p>
                      <p className="text-sm font-bold text-black mb-2 line-clamp-2">{tier.title}</p>
                      <p className="text-xs text-gray-600 leading-snug line-clamp-3">{tier.note}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Progress Section */}
          <div className="lg:hidden w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-playfair text-xl font-bold text-[#C9A961]">Progress</h2>
              <p className="text-gray-600 text-sm">
                ${(totalDonated / 1000000).toFixed(2)}M / ${(GOAL / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#C9A961] to-[#C9A961] h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Checkout */}
      <div className="lg:hidden max-w-2xl mx-auto px-6 mb-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="font-playfair text-3xl font-bold text-[#C9A961] mb-2">
            Donate Now
          </h2>
          <p className="text-gray-600 mb-6">Pay securely with your credit card</p>

          <div className="space-y-4">
            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Donation Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">$</span>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={checkoutAmount}
                  onChange={(e) => setCheckoutAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                />
              </div>
            </div>

            {/* Card Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Card Number
              </label>
              <div id="card-field-mobile" className="border border-gray-300 rounded-lg p-3 bg-white"></div>
            </div>

            {/* Billing Address */}
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First Name"
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                id="firstName-mobile"
              />
              <input
                type="text"
                placeholder="Last Name"
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                id="lastName-mobile"
              />
            </div>

            <input
              type="email"
              placeholder="Email Address"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
              id="email-mobile"
              required
            />

            <input
              type="text"
              placeholder="Street Address"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
              id="street-mobile"
            />

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="City"
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                id="city-mobile"
              />
              <input
                type="text"
                placeholder="State"
                maxLength={2}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
                id="state-mobile"
              />
            </div>

            <input
              type="text"
              placeholder="ZIP Code"
              maxLength={5}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A961]"
              id="zip-mobile"
            />

            {/* Submit Button */}
            <button
              onClick={handleCheckoutPayment}
              className="w-full bg-[#C9A961] text-white py-3 rounded-lg font-bold text-lg hover:bg-[#B91130] transition mt-6"
            >
              Donate Now
            </button>
          </div>
        </div>
      </div>

      {/* Credit Card Checkout Section */}
      <div className="max-w-3xl mx-auto px-6 mb-12">
        <h2 className="font-playfair text-4xl font-bold text-[#C9A961] mb-2">
          Complete Your Donation
        </h2>
        <p className="text-gray-600 text-lg mb-6">Pay securely with your credit card</p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="space-y-4">
            {/* Selected Amount Display */}
            {checkoutAmount && (
              <div className="bg-yellow-50 border-2 border-[#C9A961] rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600">Donation Amount</p>
                <p className="text-3xl font-bold text-[#C9A961]">${checkoutAmount}</p>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-2">
                Amount (or enter custom)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">$</span>
                <input
                  type="number"
                  placeholder="Enter amount"
                  value={checkoutAmount}
                  onChange={(e) => setCheckoutAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A961] [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                />
              </div>
            </div>

            {/* Card Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Card Number
              </label>
              <div id="card-field" className="border border-gray-300 rounded-lg p-3 bg-white"></div>
            </div>

            {/* Billing Address */}
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="First Name" className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A961]" id="firstName" />
              <input type="text" placeholder="Last Name" className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A961]" id="lastName" />
            </div>

            <input type="email" placeholder="Email Address" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A961]" id="email" required />

            <input type="text" placeholder="Street Address" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A961]" id="street" />

            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="City" className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A961]" id="city" />
              <input type="text" placeholder="State" maxLength={2} className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A961]" id="state" />
            </div>

            <input type="text" placeholder="ZIP Code" maxLength={5} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#C9A961]" id="zip" />

            {/* Submit Button */}
            <button onClick={handleCheckoutPayment} disabled={checkoutLoading} className="w-full bg-[#C9A961] text-white py-4 rounded-lg font-bold text-xl hover:bg-orange-600 transition mt-6 disabled:opacity-50">
              {checkoutLoading ? "Processing..." : "Complete Donation"}
            </button>
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}
