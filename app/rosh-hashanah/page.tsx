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
      backgroundImage: "url(/rosh-hashana-bg.jpg)",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
      position: "relative"
    }}>
      <div className="absolute inset-0 bg-[#FDF9F7]/80"></div>
      <div className="relative z-10">
      {/* Hero */}
      <div className="max-w-3xl mx-auto px-6 text-center mb-16">
        <span className="font-caveat text-[#FF8C00] text-3xl sm:text-4xl tracking-wide">
          Rosh Hashanah Campaign
        </span>
        <h1 className="font-playfair text-6xl sm:text-7xl font-bold text-[#FF8C00] mt-4 leading-[1.1]">
          A New Year. A Fresh Start. A Chance to Make a Difference.
        </h1>
        <p className="text-gray-600 text-xl mt-6 leading-relaxed">
          Behind every donation is a family, a story, and a chance to make someone's New Year a little brighter.
        </p>
      </div>

      {/* Main Content with Vertical Tracker on Left and Tiers on Right */}
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="flex gap-8 items-start">
          {/* Left: Vertical Progress Tracker */}
          <div className="hidden lg:flex flex-col items-center gap-6 min-w-fit">
            {/* Goal Display - Top */}
            <div className="text-center bg-gradient-to-br from-[#FF8C00] to-[#FF8C00] rounded-2xl px-6 py-4 shadow-lg">
              <p className="text-white text-sm font-semibold uppercase tracking-wider">Our Goal</p>
              <p className="font-playfair text-5xl font-bold text-white">
                ${(GOAL / 1000000).toFixed(1)}M
              </p>
            </div>

            {/* Vertical Progress Bar Container - Much Taller & Wider */}
            <div className="relative h-[700px] w-32 bg-gray-100 rounded-3xl overflow-visible border-4 border-[#FF8C00] flex flex-col shadow-2xl" style={{ background: 'linear-gradient(to bottom, #fff, #f5f5f5)' }}>
              {/* Honey Bowl at Top - Using SVG for cleaner look */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-8 z-20 w-32 h-32 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FF8C00] shadow-xl border-4 border-white flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-24 h-24" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="50" cy="30" rx="35" ry="20" fill="#D4A574" opacity="0.8"/>
                  <path d="M 25 30 Q 25 70 50 75 Q 75 70 75 30" fill="#D4A574"/>
                  <ellipse cx="50" cy="75" rx="25" ry="15" fill="#C19A6B" opacity="0.6"/>
                </svg>
              </div>

              {/* Filled portion (bottom to top) */}
              <div
                className="absolute bottom-0 w-full bg-gradient-to-t from-[#FF6B00] via-[#FF8C00] to-[#FFED4E] transition-all duration-500 rounded-b-2xl"
                style={{ height: `${progressPercent}%` }}
              />

              {/* Apple Icon - Rises with progress */}
              <div
                className="absolute left-1/2 transform -translate-x-1/2 transition-all duration-500 z-10 drop-shadow-lg"
                style={{ bottom: `${progressPercent}%` }}
              >
                <Image src="/apple.svg" alt="Apple" width={70} height={70} className="object-contain animate-bounce" />
              </div>

              {/* Left Milestone Markers - On Tracker */}
              <div className="absolute left-0 w-8 h-2 bg-[#FF8C00]" style={{ top: `${100 - (250000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }} />
              <span className="absolute font-bold text-[#FF8C00] text-xs whitespace-nowrap" style={{ left: '-50px', top: `${100 - (250000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }}>$250k</span>

              <div className="absolute left-0 w-8 h-2 bg-[#FF8C00]" style={{ top: `${100 - (750000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }} />
              <span className="absolute font-bold text-[#FF8C00] text-xs whitespace-nowrap" style={{ left: '-50px', top: `${100 - (750000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }}>$750k</span>

              <div className="absolute left-0 w-8 h-2 bg-[#FF8C00]" style={{ top: `${100 - (1250000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }} />
              <span className="absolute font-bold text-[#FF8C00] text-xs whitespace-nowrap" style={{ left: '-50px', top: `${100 - (1250000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }}>$1.25M</span>

              <div className="absolute left-0 w-8 h-2 bg-[#FF8C00]" style={{ top: `${100 - (1750000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }} />
              <span className="absolute font-bold text-[#FF8C00] text-xs whitespace-nowrap" style={{ left: '-50px', top: `${100 - (1750000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }}>$1.75M</span>

              {/* Right Milestone Markers - On Tracker */}
              <div className="absolute right-0 w-8 h-2 bg-[#FFEC0D]" style={{ top: `${100 - (500000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }} />
              <span className="absolute font-bold text-[#FFEC0D] text-xs whitespace-nowrap" style={{ right: '-50px', top: `${100 - (500000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }}>$500k</span>

              <div className="absolute right-0 w-8 h-2 bg-[#FFEC0D]" style={{ top: `${100 - (1000000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }} />
              <span className="absolute font-bold text-[#FFEC0D] text-xs whitespace-nowrap" style={{ right: '-50px', top: `${100 - (1000000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }}>$1M</span>

              <div className="absolute right-0 w-8 h-2 bg-[#FFEC0D]" style={{ top: `${100 - (1500000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }} />
              <span className="absolute font-bold text-[#FFEC0D] text-xs whitespace-nowrap" style={{ right: '-50px', top: `${100 - (1500000 / 2000000) * 100}%`, transform: 'translateY(-50%)' }}>$1.5M</span>
            </div>

            {/* Amount Raised Display - Below tracker */}
            <div className="text-center bg-gradient-to-br from-[#FFED4E] to-[#FFEC0D] rounded-2xl px-6 py-4 shadow-lg">
              <p className="text-gray-700 text-sm font-semibold uppercase tracking-wider">Raised So Far</p>
              <p className="font-playfair text-5xl font-bold text-gray-900">
                ${(totalDonated / 1000000).toFixed(2)}M
              </p>
            </div>

            {/* Tagline */}
            <p className="text-center text-[#FF8C00] font-playfair font-bold text-lg max-w-48">
              Help the apple reach the honey
            </p>
          </div>

          {/* Right: Donation Tiers */}
          <div className="hidden lg:block flex-1">
            <h2 className="font-playfair text-3xl font-bold text-[#FF8C00] mb-6">
              Choose Your Gift
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {tiers.map((tier) => (
                <button
                  key={tier.value}
                  onClick={() => {
                    setCheckoutAmount(tier.value.toString());
                    setSelectedTier(tier.value);
                  }}
                  className={`bg-white rounded-xl p-4 text-left transition group cursor-pointer border-2 ${
                    selectedTier === tier.value
                      ? "border-[#FFEC0D] bg-yellow-50 shadow-lg"
                      : "border-gray-200 hover:border-[#FF8C00] hover:shadow-lg"
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-bold text-2xl text-[#FF8C00] mb-2">{tier.label}</p>
                    <p className="text-base font-semibold text-gray-700 mb-2">{tier.title}</p>
                    <p className="text-sm text-gray-600 leading-snug">{tier.note}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Progress Section */}
          <div className="lg:hidden w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-playfair text-xl font-bold text-[#FF8C00]">Progress</h2>
              <p className="text-gray-600 text-sm">
                ${(totalDonated / 1000000).toFixed(2)}M / ${(GOAL / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#FF8C00] to-[#FFEC0D] h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Checkout */}
      <div className="lg:hidden max-w-2xl mx-auto px-6 mb-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="font-playfair text-3xl font-bold text-[#FF8C00] mb-2">
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
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
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
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                id="firstName-mobile"
              />
              <input
                type="text"
                placeholder="Last Name"
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                id="lastName-mobile"
              />
            </div>

            <input
              type="text"
              placeholder="Street Address"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
              id="street-mobile"
            />

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="City"
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                id="city-mobile"
              />
              <input
                type="text"
                placeholder="State"
                maxLength={2}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
                id="state-mobile"
              />
            </div>

            <input
              type="text"
              placeholder="ZIP Code"
              maxLength={5}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF8C00]"
              id="zip-mobile"
            />

            {/* Submit Button */}
            <button
              onClick={handleCheckoutPayment}
              className="w-full bg-[#FF8C00] text-white py-3 rounded-lg font-bold text-lg hover:bg-[#B91130] transition mt-6"
            >
              Donate Now
            </button>
          </div>
        </div>
      </div>

      {/* Credit Card Checkout Section */}
      <div className="max-w-3xl mx-auto px-6 mb-12">
        <h2 className="font-playfair text-4xl font-bold text-[#FF8C00] mb-2">
          Complete Your Donation
        </h2>
        <p className="text-gray-600 text-lg mb-6">Pay securely with your credit card</p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <div className="space-y-4">
            {/* Selected Amount Display */}
            {checkoutAmount && (
              <div className="bg-yellow-50 border-2 border-[#FFEC0D] rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600">Donation Amount</p>
                <p className="text-3xl font-bold text-[#FFEC0D]">${checkoutAmount}</p>
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
                  className="w-full pl-8 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF8C00] [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
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
              <input type="text" placeholder="First Name" className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF8C00]" id="firstName" />
              <input type="text" placeholder="Last Name" className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF8C00]" id="lastName" />
            </div>

            <input type="text" placeholder="Street Address" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF8C00]" id="street" />

            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="City" className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF8C00]" id="city" />
              <input type="text" placeholder="State" maxLength={2} className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF8C00]" id="state" />
            </div>

            <input type="text" placeholder="ZIP Code" maxLength={5} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#FF8C00]" id="zip" />

            {/* Submit Button */}
            <button onClick={handleCheckoutPayment} disabled={checkoutLoading} className="w-full bg-[#FF8C00] text-white py-4 rounded-lg font-bold text-xl hover:bg-orange-600 transition mt-6 disabled:opacity-50">
              {checkoutLoading ? "Processing..." : "Complete Donation"}
            </button>
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}
