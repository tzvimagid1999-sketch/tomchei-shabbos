"use client";

import { useState } from "react";

export default function ContactForm() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", message: "", website: "" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in your name, email and message.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Your message couldn't be sent.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your message couldn't be sent.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-xl bg-[#F8F4EC] p-10 text-center">
        <p className="font-playfair text-2xl font-bold text-[#2D2D2D] mb-2">Thank you!</p>
        <p className="text-gray-600 leading-relaxed">
          Your message is on its way. We&rsquo;ll get back to you soon.
        </p>
      </div>
    );
  }

  const field =
    "w-full bg-[#F4F4F4] border border-transparent rounded-none px-5 py-4 text-[15px] text-[#2D2D2D] placeholder:text-gray-500 focus:border-[#C8A75B] focus:bg-white focus:outline-none transition-colors";

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <input className={field} placeholder="Name" value={form.name} onChange={set("name")} aria-label="Name" />
        <input className={field} type="email" placeholder="Email Address" value={form.email} onChange={set("email")} aria-label="Email address" />
      </div>

      <textarea
        className={`${field} min-h-[210px] resize-y mb-4`}
        placeholder="Message"
        value={form.message}
        onChange={set("message")}
        aria-label="Message"
      />

      {/* Hidden from people, catches bots that fill every field they find. */}
      <input
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={form.website}
        onChange={set("website")}
      />

      {error && <p className="text-[15px] text-red-700 font-semibold mb-4">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={sending}
          className="bg-[#4A5568] hover:bg-[#3A4453] text-white px-12 py-4 text-sm font-bold uppercase tracking-[0.16em] transition-colors disabled:opacity-50"
        >
          {sending ? "Sending…" : "Submit"}
        </button>
      </div>
    </form>
  );
}
