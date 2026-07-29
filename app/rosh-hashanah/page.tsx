"use client";
import { useState, useEffect, useRef } from "react";
import Script from "next/script";
import { Heart } from "lucide-react";
import Image from "next/image";

export default function RoshHashanah() {
  const [totalDonated, setTotalDonated] = useState(0);
  const [loading, setLoading] = useState(true);

  // Animations for premium feel
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
    @keyframes slideIn {
      from {
        width: 0;
      }
      to {
        width: 100%;
      }
    }
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
    .heading-animate {
      animation: slideInFade 0.8s ease-out;
    }
    .fade-in-up {
      animation: fadeInUp 0.6s ease-out forwards;
      opacity: 0;
    }
    .fade-in-up-delay-1 { animation-delay: 0.1s; }
    .fade-in-up-delay-2 { animation-delay: 0.2s; }
    .fade-in-up-delay-3 { animation-delay: 0.3s; }
    .fade-in-up-delay-4 { animation-delay: 0.4s; }
    .fade-in-up-delay-5 { animation-delay: 0.5s; }
    .fade-in-up-delay-6 { animation-delay: 0.6s; }
    .fade-in {
      animation: fadeIn 0.8s ease-out forwards;
      opacity: 0;
    }
    .scale-in {
      animation: scaleIn 0.6s ease-out forwards;
      opacity: 0;
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
    { value: 125, label: "$125", emoji: "🍯", title: "Shabbas for a family", note: "" },
    { value: 250, label: "$250", emoji: "🍎", title: "Rosh Hashanah for a family", note: "" },
    { value: 600, label: "$600", emoji: "🍎", title: "Succos for a family", note: "" },
    { value: 1250, label: "$1,250", emoji: "🍯", title: "Shabbas for 10 families", note: "" },
    { value: 2500, label: "$2,500", emoji: "🍯", title: "Rosh Hashanah for 10 families", note: "" },
    { value: 6000, label: "$6,000", emoji: "🍎", title: "Succos for 10 families", note: "" },
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
      {/* Hero - Premium Section */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center mb-16 sm:mb-20">
        <span className="font-caveat text-[#E57373] text-xl sm:text-3xl tracking-wide block mb-2 sm:mb-4">
          Rosh Hashanah Campaign
        </span>
        <h1 className="font-playfair text-3xl sm:text-5xl font-bold text-[#2D2D2D] mt-4 sm:mt-6 leading-tight sm:leading-relaxed heading-animate">
          A New Year. A Fresh Start. A Chance to Make a Difference.
        </h1>
        <p className="text-sm sm:text-lg text-[#2D2D2D] mt-4 sm:mt-8 leading-relaxed max-w-xl mx-auto font-light">
          Every family deserves to celebrate the Jewish New Year with dignity, warmth, and the comfort of a complete Rosh Hashanah. Your donation directly provides food, joy, and hope to families in our community who need it most.
        </p>
        <button
          onClick={() => {
            const element = document.getElementById('donate-section');
            element?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="mt-6 sm:mt-10 bg-[#C8A75B] hover:bg-[#B8975B] text-white px-6 sm:px-10 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all duration-300 shadow-lg hover:shadow-xl heading-animate w-full sm:w-auto"
          style={{ animationDelay: '0.2s' }}
        >
          Donate Now
        </button>
      </div>

      {/* Premium Goal Thermometer Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-16 sm:mb-20 fade-in">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 scale-in" style={{ background: 'rgba(255, 255, 255, 0.95)' }}>
          {/* Header */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="text-center">
              <p className="text-xs sm:text-sm font-semibold text-[#2D2D2D] uppercase tracking-wider mb-1 sm:mb-2">Goal</p>
              <p className="font-playfair text-2xl sm:text-3xl font-bold text-[#C8A75B]">
                $500k
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm font-semibold text-[#2D2D2D] uppercase tracking-wider mb-1 sm:mb-2">Raised</p>
              <p className="font-playfair text-2xl sm:text-3xl font-bold text-[#2D2D2D]">
                ${(totalDonated / 1000).toFixed(0)}k
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs sm:text-sm font-semibold text-[#2D2D2D] uppercase tracking-wider mb-1 sm:mb-2">Progress</p>
              <p className="font-playfair text-2xl sm:text-3xl font-bold text-[#C8A75B]">
                {Math.round(progressPercent)}%
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-6 bg-[#F8F4EC] rounded-full overflow-hidden shadow-sm">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#C8A75B] to-[#D9B870] rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%`, animation: progressPercent > 0 ? 'slideIn 1s ease-out' : 'none' }}
            />
          </div>

          {/* Milestone labels */}
          <div className="flex justify-between mt-4 text-xs font-semibold text-[#2D2D2D]">
            <span>$0</span>
            <span>$125k</span>
            <span>$250k</span>
            <span>$375k</span>
            <span>$500k</span>
          </div>

          {/* Urgency message */}
          <p className="text-center mt-6 text-sm text-[#2D2D2D] font-light">
            Help us reach our goal before Rosh Hashanah to support every family in need.
          </p>
        </div>
      </div>

      {/* Donation Cards Grid Section */}
      <div id="donate-section" className="max-w-6xl mx-auto px-4 sm:px-6 mb-16 sm:mb-20">
        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {tiers.map((tier, index) => (
            <button
              key={tier.value}
              onClick={() => {
                setCheckoutAmount(tier.value.toString());
                setSelectedTier(tier.value);
                const element = document.getElementById('donate-section');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`group bg-white rounded-[20px] p-5 sm:p-8 text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-2 border-[#C8A75B] fade-in-up fade-in-up-delay-${Math.min(index + 1, 6)}`}
              style={{
                background: selectedTier === tier.value ? '#F8F4EC' : '#FFFFFF'
              }}
            >
              {/* Amount - Most Prominent */}
              <p className="font-playfair text-4xl sm:text-5xl font-bold text-[#C8A75B] mb-3 sm:mb-4">
                {tier.label}
              </p>

              {/* Title - Impact Focused */}
              <h3 className="text-base sm:text-lg font-bold text-[#2D2D2D] mb-2 sm:mb-3 leading-snug">
                {tier.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-[#2D2D2D] font-light leading-relaxed">
                {tier.note}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Progress Section */}
      <div className="lg:hidden max-w-4xl mx-auto px-6 mb-12">
        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-playfair text-xl font-bold text-[#C9A961]">Progress</h2>
            <p className="text-gray-600 text-sm">
              ${(totalDonated / 1000).toFixed(0)}k / $500k
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#C8A75B] to-[#D9B870] h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Trust & Urgency Section */}
      <div className="bg-gradient-to-r from-[#F8F4EC] to-white py-16 px-6 mb-20 fade-in">
        <div className="max-w-6xl mx-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Families Helped */}
            <div className="text-center fade-in-up fade-in-up-delay-1">
              <p className="font-playfair text-5xl font-bold text-[#C8A75B] mb-2">
                2,500+
              </p>
              <p className="text-[#2D2D2D] font-semibold">
                Families Helped
              </p>
              <p className="text-sm text-[#2D2D2D] font-light mt-2">
                Families strengthened through our support
              </p>
            </div>

            {/* Years Serving */}
            <div className="text-center fade-in-up fade-in-up-delay-2">
              <p className="font-playfair text-5xl font-bold text-[#C8A75B] mb-2">
                20+
              </p>
              <p className="text-[#2D2D2D] font-semibold">
                Years Serving Our Community
              </p>
              <p className="text-sm text-[#2D2D2D] font-light mt-2">
                Dedicated to supporting families every week
              </p>
            </div>

            {/* Direct Impact */}
            <div className="text-center fade-in-up fade-in-up-delay-3">
              <p className="font-playfair text-5xl font-bold text-[#C8A75B] mb-2">
                100%
              </p>
              <p className="text-[#2D2D2D] font-semibold">
                Direct Impact
              </p>
              <p className="text-sm text-[#2D2D2D] font-light mt-2">
                Your donation goes directly to families in need
              </p>
            </div>
          </div>

          {/* Urgency Message */}
          <div className="text-center bg-white rounded-2xl border-2 border-[#C8A75B] p-8">
            <p className="text-lg text-[#2D2D2D] font-semibold mb-2">
              Help Us Reach Our Goal
            </p>
            <p className="text-[#2D2D2D] font-light">
              We're on a mission to support every family this Rosh Hashanah. Your donation today makes a direct difference in someone's life.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Checkout */}
      <div className="lg:hidden max-w-2xl mx-auto px-6 mb-12">
        <div className="bg-white rounded-2xl border-2 border-[#C8A75B] shadow-lg p-8">
          <h2 className="font-playfair text-3xl font-bold text-[#2D2D2D] mb-2">
            Donate Now
          </h2>
          <p className="text-[#2D2D2D] font-light mb-8">Secure payment • All information encrypted</p>

          <div className="space-y-6">
            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-[#2D2D2D] mb-2 uppercase tracking-wider">
                Donation Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-[#C8A75B] font-semibold">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={checkoutAmount}
                  onChange={(e) => setCheckoutAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A75B] focus:border-transparent bg-white text-[#2D2D2D]"
                />
              </div>
            </div>

            {/* Card Field */}
            <div>
              <label className="block text-sm font-semibold text-[#2D2D2D] mb-2 uppercase tracking-wider">
                Card Number
              </label>
              <div id="card-field-mobile" className="border-2 border-[#E5E5E5] rounded-lg p-4 bg-white"></div>
            </div>

            {/* Billing Address */}
            <div className="pt-2">
              <h3 className="text-sm font-semibold text-[#2D2D2D] mb-4 uppercase tracking-wider">Billing Information</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="First Name"
                  className="border-2 border-[#E5E5E5] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8A75B] focus:border-transparent bg-white text-[#2D2D2D]"
                  id="firstName-mobile"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  className="border-2 border-[#E5E5E5] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8A75B] focus:border-transparent bg-white text-[#2D2D2D]"
                  id="lastName-mobile"
                />
              </div>

              <input
                type="email"
                placeholder="Email Address"
                className="w-full border-2 border-[#E5E5E5] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8A75B] focus:border-transparent bg-white text-[#2D2D2D] mb-3"
                id="email-mobile"
                required
              />

              <input
                type="text"
                placeholder="Street Address"
                className="w-full border-2 border-[#E5E5E5] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8A75B] focus:border-transparent bg-white text-[#2D2D2D] mb-3"
                id="street-mobile"
              />

              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="City"
                  className="border-2 border-[#E5E5E5] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8A75B] focus:border-transparent bg-white text-[#2D2D2D]"
                  id="city-mobile"
                />
                <input
                  type="text"
                  placeholder="State"
                  maxLength={2}
                  className="border-2 border-[#E5E5E5] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8A75B] focus:border-transparent bg-white text-[#2D2D2D]"
                  id="state-mobile"
                />
              </div>

              <input
                type="text"
                placeholder="ZIP Code"
                maxLength={5}
                className="w-full border-2 border-[#E5E5E5] rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8A75B] focus:border-transparent bg-white text-[#2D2D2D]"
                id="zip-mobile"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleCheckoutPayment}
              disabled={checkoutLoading}
              className="w-full bg-[#C8A75B] hover:bg-[#B8975B] text-white py-4 rounded-lg font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 mt-8"
            >
              {checkoutLoading ? "Processing..." : "Donate Now"}
            </button>
          </div>
        </div>
      </div>

      {/* Credit Card Checkout Section */}
      <div className="max-w-3xl mx-auto px-6 mb-12">
        <h2 className="font-playfair text-4xl font-bold text-[#2D2D2D] mb-3">
          Complete Your Donation
        </h2>
        <p className="text-[#2D2D2D] text-lg mb-8 font-light">Secure payment • All information is encrypted</p>

        <div className="bg-white rounded-2xl border-2 border-[#C8A75B] shadow-lg p-10">
          <div className="space-y-6">
            {/* Selected Amount Display */}
            {checkoutAmount && (
              <div className="bg-gradient-to-br from-[#F8F4EC] to-white border-2 border-[#C8A75B] rounded-xl p-6 mb-6">
                <p className="text-sm font-semibold text-[#2D2D2D] uppercase tracking-wider mb-2">Donation Amount</p>
                <p className="font-playfair text-5xl font-bold text-[#C8A75B]">${checkoutAmount}</p>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-semibold text-[#2D2D2D] mb-3 uppercase tracking-wider">
                Amount (or enter custom)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-4 text-[#C8A75B] font-semibold text-lg">$</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={checkoutAmount}
                  onChange={(e) => setCheckoutAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-lg border-2 border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8A75B] focus:border-transparent bg-white [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                />
              </div>
            </div>

            {/* Card Field */}
            <div>
              <label className="block text-sm font-semibold text-[#2D2D2D] mb-3 uppercase tracking-wider">
                Card Number
              </label>
              <div id="card-field" className="border-2 border-[#E5E5E5] rounded-lg p-4 bg-white focus-within:ring-2 focus-within:ring-[#C8A75B]"></div>
            </div>

            {/* Billing Details */}
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

            {/* Submit Button */}
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
