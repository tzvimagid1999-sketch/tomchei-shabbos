"use client";
import { useState } from "react";
import { CheckCircle } from "lucide-react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const inputClass =
    "w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1AABAB] transition font-medium text-gray-700 bg-white";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Something went wrong.");
      setSent(true);
      setName(""); setEmail(""); setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="text-center py-10">
        <CheckCircle className="w-12 h-12 text-[#1AABAB] mx-auto mb-4" />
        <p className="font-playfair text-2xl font-bold text-gray-900 mb-2">Message sent!</p>
        <p className="text-gray-500">We&apos;ll get back to you soon.</p>
        <button onClick={() => setSent(false)} className="mt-6 text-[#1AABAB] text-sm font-semibold hover:underline">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="text" required placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      <input type="email" required placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      <textarea required placeholder="Message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className={inputClass} />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full bg-[#F5A020] text-white py-3 rounded-lg font-bold uppercase tracking-widest text-sm hover:bg-[#D48810] transition disabled:opacity-50">
        {loading ? "Sending..." : "Submit"}
      </button>
    </form>
  );
}
