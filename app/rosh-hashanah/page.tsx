"use client";
import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import Image from "next/image";

export default function RoshHashanah() {
  const [totalDonated, setTotalDonated] = useState(0);
  const [loading, setLoading] = useState(true);

  const GOAL = 2000000; // $2M
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

  // Load USAePay card field
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://secure.usaepay.com/upapi/embedded_fields_v1.min.js";
    script.async = true;
    script.onload = () => {
      if (typeof UPAPI !== "undefined") {
        UPAPI.embedded.setup({
          customPubKey: process.env.NEXT_PUBLIC_KEY,
          fields: {
            cardNumber: {
              selector: "#card-field",
              placeholder: "Card Number"
            }
          },
          override: {
            cardNumber: {
              autoTab: true,
              autoFormat: true
            }
          }
        });
      }
    };
    document.body.appendChild(script);
  }, []);

  const [checkoutAmount, setCheckoutAmount] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<number | null>(null);

  const handleCheckoutPayment = async () => {
    const firstName = (document.getElementById("firstName") as HTMLInputElement)?.value;
    const lastName = (document.getElementById("lastName") as HTMLInputElement)?.value;
    const street = (document.getElementById("street") as HTMLInputElement)?.value;
    const city = (document.getElementById("city") as HTMLInputElement)?.value;
    const state = (document.getElementById("state") as HTMLInputElement)?.value;
    const zip = (document.getElementById("zip") as HTMLInputElement)?.value;

    if (!checkoutAmount || !firstName || !lastName || !street || !city || !state || !zip) {
      alert("Please fill in all fields");
      return;
    }

    setCheckoutLoading(true);
    const amountCents = Math.round(parseFloat(checkoutAmount) * 100);

    try {
      const response = await fetch("/api/usaepay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountCents,
          cardRef: (window as any).tokenizedCardRef,
          firstName,
          lastName,
          street,
          city,
          state,
          zip,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`Donation of $${checkoutAmount} received! Thank you.`);
        setCheckoutAmount("");
        (document.getElementById("firstName") as HTMLInputElement).value = "";
        (document.getElementById("lastName") as HTMLInputElement).value = "";
        (document.getElementById("street") as HTMLInputElement).value = "";
        (document.getElementById("city") as HTMLInputElement).value = "";
        (document.getElementById("state") as HTMLInputElement).value = "";
        (document.getElementById("zip") as HTMLInputElement).value = "";
      } else {
        alert("Payment failed: " + (result.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error processing payment");
      console.error(err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const tiers = [
    { value: 180, label: "$180", emoji: "🍎", title: "A Sweet Start to the New Year", note: "Inspired by the sweetness of apples and honey and the call of the shofar during Elul, your donation helps bring warmth, dignity, and joy to a family this Rosh Hashanah." },
    { value: 250, label: "$250", emoji: "🍯", title: "Share the Sweetness of Rosh Hashanah", note: "Your donation helps a family prepare for the New Year with the comfort and support they need to celebrate with dignity." },
    { value: 360, label: "$360", emoji: "🍎", title: "Answer the Call of the Shofar", note: "As we reflect and prepare during Elul, your donation helps bring hope, happiness, and a brighter Rosh Hashanah to families in our community." },
    { value: 500, label: "$500", emoji: "🍯", title: "Sweeten a Family's New Year", note: "Your donation helps ensure a family can welcome Rosh Hashanah with dignity, warmth, and the sweetness they deserve." },
    { value: 750, label: "$750", emoji: "🍎", title: "Spread the Blessings of the New Year", note: "Help extend the spirit of Rosh Hashanah by bringing comfort and support to more families in need." },
    { value: 1000, label: "$1,000", emoji: "🍯", title: "A Rosh Hashanah Community Sponsor", note: "Your generous donation helps make a meaningful difference for families as they begin the New Year." },
    { value: 1800, label: "$1,800", emoji: "🍎", title: "A Greater Measure of Kindness", note: "During this sacred time of reflection and renewal, your donation helps bring greater support and sweetness to families throughout our community." },
    { value: 2500, label: "$2,500", emoji: "🍯", title: "A Year of Blessing and Giving", note: "Your donation helps create lasting impact, allowing more families to experience the joy and dignity of Rosh Hashanah." },
    { value: 5000, label: "$5,000", emoji: "🍯", title: "The Sweetest Blessing", note: "Your extraordinary donation helps bring hope, comfort, and support to many families as we enter a new year together." },
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
      {/* Hero */}
      <div className="max-w-3xl mx-auto px-6 text-center mb-16">
        <span className="font-caveat text-[#1E40AF] text-3xl sm:text-4xl tracking-wide">
          Rosh Hashanah Campaign
        </span>
        <h1 className="font-playfair text-6xl sm:text-7xl font-bold text-[#C9A961] mt-4 leading-[1.1]">
          A New Year. A Fresh Start. A Chance to Make a Difference.
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
                ${(GOAL / 1000000).toFixed(1)}M
              </p>
            </div>

            {/* Vertical Progress Bar Container - Much Taller & Wider */}
            <div className="relative h-[900px] w-32 bg-gray-100 rounded-3xl overflow-visible flex flex-col shadow-2xl" style={{ background: 'linear-gradient(to bottom, #fff, #f5f5f5)', border: '4px solid #1E40AF' }}>

              {/* Filled portion (bottom to top) */}
              <div
                className="absolute bottom-0 w-full bg-gradient-to-t from-[#FF6B00] via-[#C9A961] to-[#FFED4E] transition-all duration-500 rounded-b-2xl"
                style={{ height: `${progressPercent}%` }}
              />


              {/* Left Milestone Markers - On Tracker */}
              <div className="absolute left-0 w-8 h-2 bg-[#C9A961]" style={{ top: `${100 - (250000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }} />
              <span className="absolute font-bold text-[#C9A961] text-xs whitespace-nowrap" style={{ left: '-50px', top: `${100 - (250000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }}>$250k</span>

              <div className="absolute left-0 w-8 h-2 bg-[#C9A961]" style={{ top: `${100 - (750000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }} />
              <span className="absolute font-bold text-[#C9A961] text-xs whitespace-nowrap" style={{ left: '-50px', top: `${100 - (750000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }}>$750k</span>

              <div className="absolute left-0 w-8 h-2 bg-[#C9A961]" style={{ top: `${100 - (1250000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }} />
              <span className="absolute font-bold text-[#C9A961] text-xs whitespace-nowrap" style={{ left: '-50px', top: `${100 - (1250000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }}>$1.25M</span>

              <div className="absolute left-0 w-8 h-2 bg-[#C9A961]" style={{ top: `${100 - (1750000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }} />
              <span className="absolute font-bold text-[#C9A961] text-xs whitespace-nowrap" style={{ left: '-50px', top: `${100 - (1750000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }}>$1.75M</span>

              {/* Right Milestone Markers - On Tracker */}
              <div className="absolute right-0 w-8 h-2 bg-[#C9A961]" style={{ top: `${100 - (500000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }} />
              <span className="absolute font-bold text-[#C9A961] text-xs whitespace-nowrap" style={{ right: '-50px', top: `${100 - (500000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }}>$500k</span>

              <div className="absolute right-0 w-8 h-2 bg-[#C9A961]" style={{ top: `${100 - (1000000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }} />
              <span className="absolute font-bold text-[#C9A961] text-xs whitespace-nowrap" style={{ right: '-50px', top: `${100 - (1000000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }}>$1M</span>

              <div className="absolute right-0 w-8 h-2 bg-[#C9A961]" style={{ top: `${100 - (1500000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }} />
              <span className="absolute font-bold text-[#C9A961] text-xs whitespace-nowrap" style={{ right: '-50px', top: `${100 - (1500000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }}>$1.5M</span>
            </div>

            {/* Amount Raised Display - Below tracker */}
            <div className="text-center bg-gradient-to-br from-[#FFED4E] to-[#C9A961] rounded-2xl px-6 py-4 shadow-lg">
              <p className="text-gray-700 text-sm font-semibold uppercase tracking-wider">Raised So Far</p>
              <p className="font-playfair text-5xl font-bold text-gray-900">
                ${(totalDonated / 1000000).toFixed(2)}M
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
                <h2 className="font-playfair text-3xl font-bold text-[#C9A961] text-center max-w-xs">
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
                      borderColor: selectedTier === tier.value ? "#C9A961" : "#1E40AF",
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
