"use client";
import { useState } from "react";
import Image from "next/image";
import { CheckCircle } from "lucide-react";

const initialForm = {
  email: "",
  status: "",
  firstName: "",
  lastName: "",
  spouseName: "",
  street: "",
  unit: "",
  city: "",
  zip: "",
  phone: "",
  spouseEmail: "",
  numChildren: "",
  childrenAges: "",
  occupation: "",
  spouseOccupation: "",
  assistanceType: "",
  rabbiName: "",
  rabbiPhone: "",
  rabbiCongregation: "",
  otherOrgAssistance: "",
  otherOrgAssistanceDetails: "",
  additionalInfo: "",
};

export default function ApplyForAssistancePage() {
  const [form, setForm] = useState(initialForm);
  const [childAges, setChildAges] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const inputClass =
    "w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1AABAB] transition font-medium text-gray-700 bg-white";
  const labelClass = "block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleNumChildrenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const n = Number(e.target.value);
    setForm({ ...form, numChildren: e.target.value });
    setChildAges((prev) => Array.from({ length: n }, (_, i) => prev[i] || ""));
  };

  const handleAgeChange = (index: number, value: string) => {
    setChildAges((prev) => prev.map((a, i) => (i === index ? value : a)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/apply-assistance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, childrenAges: childAges.join(", ") }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Something went wrong. Please try again.");
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <main className="pt-32 pb-32 bg-[#FDF9F7] min-h-screen">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-5" />
            <h1 className="font-playfair text-3xl font-bold text-[#1AABAB] mb-3">Application Received</h1>
            <p className="text-gray-600">
              Thank you for submitting your application. Our team will review it and reach out to you soon.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-20">
      {/* Hero */}
      <section className="relative min-h-[280px] flex items-center justify-center text-center overflow-hidden">
        <Image src="/apply-header.jpg" alt="" fill className="object-cover" priority sizes="100vw" />
        <div className="absolute inset-0 bg-[#1AABAB]/60" />
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h1 className="font-playfair text-4xl sm:text-6xl font-bold text-white my-4 leading-[1.08]">Apply for Assistance</h1>
          <p className="text-white/90 max-w-xl mx-auto">
            Applicants in financial need seeking assistance with Shabbos observance are asked to complete all fields thoroughly.
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
          {/* Status */}
          <div>
            <label className={labelClass}>Status *</label>
            <div className="flex gap-4 mt-1">
              {["I am a new recipient", "I am re-applying"].map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input type="radio" name="status" value={opt} checked={form.status === opt} onChange={handleChange} required />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          {/* Applicant info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">Your Information</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelClass}>First Name *</label>
                <input name="firstName" required value={form.firstName} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Last Name *</label>
                <input name="lastName" required value={form.lastName} onChange={handleChange} className={inputClass} />
              </div>
            </div>
            <div className="mb-3">
              <label className={labelClass}>Email *</label>
              <input type="email" name="email" required value={form.email} onChange={handleChange} className={inputClass} />
            </div>
            <div className="mb-3">
              <label className={labelClass}>Phone Number *</label>
              <input name="phone" required value={form.phone} onChange={handleChange} className={inputClass} />
            </div>
            <div className="mb-3">
              <label className={labelClass}>Occupation *</label>
              <input name="occupation" required value={form.occupation} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          {/* Spouse info */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">Spouse&apos;s Information</h3>
            <div className="mb-3">
              <label className={labelClass}>Spouse&apos;s Name *</label>
              <input name="spouseName" required value={form.spouseName} onChange={handleChange} className={inputClass} />
            </div>
            <div className="mb-3">
              <label className={labelClass}>Spouse&apos;s Email *</label>
              <input type="email" name="spouseEmail" required value={form.spouseEmail} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Spouse&apos;s Occupation *</label>
              <input name="spouseOccupation" required value={form.spouseOccupation} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">Address</h3>
            <div className="mb-3">
              <label className={labelClass}>Street Address *</label>
              <input name="street" required value={form.street} onChange={handleChange} className={inputClass} />
            </div>
            <div className="mb-3">
              <label className={labelClass}>Unit / Apartment Number</label>
              <input name="unit" value={form.unit} onChange={handleChange} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>City *</label>
                <input name="city" required value={form.city} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>ZIP Code *</label>
                <input name="zip" required value={form.zip} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>

          {/* Children */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">Children</h3>
            <div>
              <label className={labelClass}>Number of Children at Home *</label>
              <select name="numChildren" required value={form.numChildren} onChange={handleNumChildrenChange} className={inputClass}>
                <option value="" disabled>Select</option>
                {Array.from({ length: 16 }, (_, i) => i).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {childAges.length > 0 && (
              <div className="mt-3">
                <label className={labelClass}>Ages of Children *</label>
                <div className="grid grid-cols-4 gap-2">
                  {childAges.map((age, i) => (
                    <input key={i} type="number" min={0} max={30} required placeholder={`#${i + 1}`}
                      value={age} onChange={(e) => handleAgeChange(i, e.target.value)}
                      className={`${inputClass} text-center`} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Assistance type */}
          <div>
            <label className={labelClass}>Assistance Type Requested *</label>
            <div className="space-y-2 mt-1">
              {["Yom Tov assistance only", "Shabbos assistance only", "Shabbos and Yom Tov assistance"].map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input type="radio" name="assistanceType" value={opt} checked={form.assistanceType === opt} onChange={handleChange} required />
                  {opt}
                </label>
              ))}
            </div>
          </div>

          {/* Rabbi */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wide">Local Rabbi</h3>
            <div className="mb-3">
              <label className={labelClass}>Rabbi&apos;s Name *</label>
              <input name="rabbiName" required value={form.rabbiName} onChange={handleChange} className={inputClass} />
            </div>
            <div className="mb-3">
              <label className={labelClass}>Rabbi&apos;s Phone Number *</label>
              <input name="rabbiPhone" required value={form.rabbiPhone} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Rabbi&apos;s Congregation *</label>
              <input name="rabbiCongregation" required value={form.rabbiCongregation} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          {/* Other */}
          <div>
            <label className={labelClass}>Are you receiving assistance from other organization(s)? *</label>
            <div className="flex gap-4 mt-1">
              {["Yes", "No"].map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <input type="radio" name="otherOrgAssistance" value={opt} checked={form.otherOrgAssistance === opt} onChange={handleChange} required />
                  {opt}
                </label>
              ))}
            </div>
            {form.otherOrgAssistance === "Yes" && (
              <div className="mt-3">
                <label className={labelClass}>Which organization(s)? *</label>
                <textarea name="otherOrgAssistanceDetails" required rows={2} value={form.otherOrgAssistanceDetails} onChange={handleChange} className={inputClass} />
              </div>
            )}
          </div>
          <div>
            <label className={labelClass}>Additional Information</label>
            <textarea name="additionalInfo" rows={3} value={form.additionalInfo} onChange={handleChange} className={inputClass} />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-[#F5A020] text-white py-4 rounded-lg font-semibold text-lg hover:bg-[#D48810] transition disabled:opacity-50">
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </main>
  );
}
