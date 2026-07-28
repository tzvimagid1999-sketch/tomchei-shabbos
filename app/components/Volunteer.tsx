"use client";
import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";

const roles = [
  "🛒 Shopping for food packages",
  "📦 Packing food packages",
  "🚗 Delivering to families",
  "📣 Fundraising & outreach",
  "💻 Social media & marketing",
  "🏢 Office & admin support",
];

const perks = [
  { emoji: "❤️", text: "Make a real difference every week" },
  { emoji: "👫", text: "Meet an amazing community" },
  { emoji: "📜", text: "Volunteer hours letter available" },
  { emoji: "🎉", text: "Volunteer appreciation events" },
];

export default function Volunteer() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", message: "" });

  const toggleRole = (role: string) =>
    setSelectedRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // TODO: Replace YOUR_FORM_ID with your Formspree form ID for volunteer sign-ups
    await fetch("https://formspree.io/f/YOUR_FORM_ID", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ ...form, roles: selectedRoles.join(", ") }),
    });
    setSubmitted(true);
    setLoading(false);
  };

  const inputClass = "w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition";

  return (
    <section id="volunteer" className="bg-blue-50 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-yellow-600 font-bold text-sm uppercase tracking-widest">Join Our Team</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-blue-900 mt-3 mb-4">
            Volunteer With Us 🙋
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto text-lg">
            You don&apos;t need any special skills — just a big heart! Every volunteer makes a huge impact. 💙
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">

          {/* Left — perks & roles */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-800 to-blue-600 rounded-3xl p-8 text-white">
              <h3 className="text-xl font-extrabold mb-5">Why Volunteer? 🌟</h3>
              <div className="space-y-4">
                {perks.map(({ emoji, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-blue-100">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border-2 border-yellow-200 p-8">
              <h3 className="text-lg font-extrabold text-blue-900 mb-4">Ways to Help 🤝</h3>
              <ul className="space-y-3">
                {roles.map((role) => (
                  <li key={role} className="flex items-center gap-2 text-gray-700 font-medium">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0" />
                    {role}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right — sign-up form */}
          <div className="bg-white rounded-3xl border-2 border-blue-100 p-8 shadow-sm">
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-16">
                <div className="text-7xl mb-4">🎉</div>
                <CheckCircle className="w-12 h-12 text-blue-500 mb-4" />
                <h3 className="text-2xl font-extrabold text-blue-900 mb-2">Thank You!</h3>
                <p className="text-gray-500">We&apos;ll be in touch shortly. We&apos;re so excited to have you on the team! 💙</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="text-xl font-extrabold text-blue-900 mb-2">Sign Up to Volunteer</h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">First Name *</label>
                    <input type="text" name="firstName" required value={form.firstName}
                      onChange={handleChange} className={inputClass} placeholder="Moshe" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Last Name *</label>
                    <input type="text" name="lastName" required value={form.lastName}
                      onChange={handleChange} className={inputClass} placeholder="Cohen" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address *</label>
                  <input type="email" name="email" required value={form.email}
                    onChange={handleChange} className={inputClass} placeholder="you@example.com" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                  <input type="tel" name="phone" value={form.phone}
                    onChange={handleChange} className={inputClass} placeholder="(555) 000-0000" />
                </div>

                {/* Role checkboxes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">How would you like to help?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {roles.map((role) => (
                      <button type="button" key={role}
                        onClick={() => toggleRole(role)}
                        className={`text-left text-xs px-3 py-2 rounded-xl border-2 font-medium transition-all ${
                          selectedRoles.includes(role)
                            ? "border-yellow-400 bg-yellow-50 text-blue-900"
                            : "border-gray-200 text-gray-600 hover:border-blue-200"
                        }`}>
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Anything else?</label>
                  <textarea name="message" rows={3} value={form.message} onChange={handleChange}
                    className={inputClass + " resize-none"} placeholder="Tell us about yourself or your availability…" />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-blue-700 text-white py-4 rounded-2xl font-extrabold text-base hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading ? "Submitting…" : "🙋 Sign Me Up!"}
                  {!loading && <Send className="w-4 h-4" />}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
