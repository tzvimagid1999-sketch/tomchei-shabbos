"use client";
import { useState, useEffect, useRef } from "react";
import { Send, CheckCircle, Check } from "lucide-react";
import Image from "next/image";
import confetti from "canvas-confetti";
import FadeInOnScroll from "../components/FadeInOnScroll";

const highlights = [
  { title: "Be the Difference", desc: "One hour can change someone's week.",            accent: false },
  { title: "Give Back",         desc: "Join a caring community of volunteers.",          accent: true  },
  { title: "Make Shabbos",      desc: "Help bring warmth and dignity to local families.", accent: false },
];

const ways = [
  { title: "Deliver",   desc: "Bring boxes right to families' doors.", time: "~2 hrs · Thursday evenings", color: "#1AABAB", tintBg: "#DDF0F0", img: "/about-header.jpg" },
  { title: "Pack",      desc: "Sort and box food with the crew.",      time: "~1.5 hrs · Wednesdays",     color: "#F5A020", tintBg: "#FDF0DC", img: "/photos/boys-filling-boxes.jpg" },
  { title: "Fundraise", desc: "Rally support within your own circle.", time: "Flexible, on your time",    color: "#DC4C41", tintBg: "#FBE7E5", img: "/photos/photo-10.jpg" },
];

export default function VolunteerPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", message: "" });
  const [interests, setInterests] = useState<string[]>([]);
  const [interestError, setInterestError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!submitted || !canvasRef.current) return;
    const myConfetti = confetti.create(canvasRef.current, { resize: true, useWorker: true });
    const colors = ["#1AABAB", "#F5A020", "#DC4C41", "#0D8585", "#C17642"];
    const end = Date.now() + 2500;
    const fire = () => {
      myConfetti({ particleCount: 40, angle: 60,  spread: 70, origin: { x: 0, y: 0.6 }, colors });
      myConfetti({ particleCount: 40, angle: 120, spread: 70, origin: { x: 1, y: 0.6 }, colors });
      if (Date.now() < end) setTimeout(fire, 250);
    };
    fire();
  }, [submitted]);

  const toggleInterest = (option: string) => {
    setInterestError(false);
    setInterests((prev) => (prev.includes(option) ? prev.filter((i) => i !== option) : [...prev, option]));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (interests.length === 0) {
      setInterestError(true);
      document.getElementById("ways")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setLoading(true);
    await fetch("https://formspree.io/f/mykqpdoz", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...form, interests: interests.join(", ") }),
    });
    setSubmitted(true);
    setLoading(false);
  };

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1AABAB] transition bg-gray-50";

  return (
    <main className="pt-20">

      {/* Hero */}
      <section className="relative min-h-[520px] flex items-center justify-center text-center overflow-hidden">
        <Image src="/volunteer-header.jpg" alt="Tomchei Shabbos volunteers packing boxes"
          fill className="object-cover" style={{ objectPosition: "50% 65%" }} priority sizes="100vw" />
        <div className="absolute inset-0 bg-[#1AABAB]/25" />
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h1 className="font-playfair text-5xl sm:text-6xl lg:text-7xl font-bold text-white my-4 leading-[1.08]">Volunteer With Us</h1>
        </div>
      </section>

      {/* Impact highlights */}
      <section className="bg-[#FAF3E8] paper-texture py-16">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="grid sm:grid-cols-3 gap-10 sm:gap-8">
            {highlights.map((h) => (
              <div key={h.title}>
                <h3 className="font-playfair font-bold leading-tight" style={{ fontSize: "30px", color: h.accent ? "#1AABAB" : "#F5A020" }}>
                  {h.title}
                </h3>
                <p className="text-[#8B7355] text-sm sm:text-base mt-3 leading-relaxed max-w-[260px] mx-auto">
                  {h.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ways to help */}
      <section id="ways" className="bg-[#FEFCF7] paper-texture py-20 scroll-mt-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-playfair text-5xl sm:text-6xl font-bold text-gray-900 leading-[1.1]">Find Your Way to Give Back</h2>
            <p className="text-[#8B7355] mt-3">Pick at least one that speaks to you &mdash; you don&apos;t need to choose all three.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {ways.map((w, i) => {
              const active = interests.includes(w.title);
              return (
                <FadeInOnScroll key={w.title} delay={i * 120}>
                  <button type="button" onClick={() => toggleInterest(w.title)}
                    style={{ borderColor: active ? w.color : "#E8D9C0", boxShadow: active ? `0 10px 24px ${w.color}44` : undefined }}
                    className="block w-full text-left bg-white rounded-2xl border-2 overflow-hidden h-full hover:-translate-y-1 hover:shadow-md transition-all duration-300 cursor-pointer">
                    <div className="relative h-40">
                      <Image src={w.img} alt={w.title} fill className="object-cover" />
                      {active && (
                        <span className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white shadow"
                          style={{ backgroundColor: w.color }}>
                          <Check className="w-5 h-5" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="font-playfair text-xl font-bold text-gray-900 mb-2">{w.title}</h3>
                      <p className="text-[#8B7355] text-sm leading-relaxed">{w.desc}</p>
                    </div>
                  </button>
                </FadeInOnScroll>
              );
            })}
          </div>
          {interestError && (
            <p className="text-center text-red-500 text-sm font-semibold mt-6">
              Please pick at least one way you&apos;d like to help.
            </p>
          )}
        </div>
      </section>

      {/* Form */}
      <section className="bg-white py-24">
        <div className="max-w-lg mx-auto px-6">
          {submitted ? (
            <>
              <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-40" />
              <div className="relative text-center py-16">
                <CheckCircle className="w-16 h-16 text-[#1AABAB] mx-auto mb-5" />
                <h3 className="font-playfair text-3xl font-bold text-[#1AABAB] mb-3">Thank You!</h3>
                <p className="text-gray-600 text-lg mb-2">We&apos;ve received your details.</p>
                <p className="text-gray-500 max-w-sm mx-auto leading-relaxed">
                  A member of our team will personally reach out soon to learn a bit more about you and find the right way for you to help.
                </p>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="mb-6">
                <span className="text-[#F5A020] font-semibold text-xs uppercase tracking-widest">Sign Up</span>
                <h2 className="font-playfair text-4xl sm:text-5xl font-bold text-gray-900 mt-1 leading-[1.1]">Ready to Volunteer?</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">First Name *</label>
                  <input type="text" name="firstName" required value={form.firstName}
                    onChange={handleChange} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Last Name *</label>
                  <input type="text" name="lastName" required value={form.lastName}
                    onChange={handleChange} className={inputClass} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email *</label>
                <input type="email" name="email" required value={form.email}
                  onChange={handleChange} className={inputClass} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Phone *</label>
                <input type="tel" name="phone" required value={form.phone}
                  onChange={handleChange} className={inputClass} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Message</label>
                <textarea name="message" rows={4} value={form.message} onChange={handleChange}
                  className={inputClass + " resize-none"} />
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-[#F5A020] text-white py-4 rounded-lg font-semibold text-sm hover:bg-[#D48810] transition flex items-center justify-center gap-2 disabled:opacity-60">
                {loading ? "Submitting..." : "Sign Me Up"}
                {!loading && <Send className="w-4 h-4" />}
              </button>
            </form>
          )}
        </div>
      </section>

    </main>
  );
}


