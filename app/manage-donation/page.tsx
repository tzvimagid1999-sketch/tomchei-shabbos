"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle } from "lucide-react";

function ManageDonation() {
  const params = useSearchParams();
  const linkCode = params.get("c") || "";
  const linkSig = params.get("s") || "";

  const [custkey, setCustkey] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const inputClass =
    "w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#1AABAB] transition font-medium text-gray-700 bg-white";

  const cancel = async (body: Record<string, string>) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/usaepay/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Could not cancel.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
    setLoading(false);
  };

  // One-click cancel: if the email link carried a signed code, cancel automatically.
  useEffect(() => {
    if (linkCode && linkSig) cancel({ custkey: linkCode, sig: linkSig });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkCode, linkSig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    cancel({ custkey, email });
  };

  const oneClickPending = linkCode && linkSig && !done && !error;

  return (
    <main className="pt-32 pb-32 bg-[#FDF9F7] min-h-screen">
      <div className="max-w-md mx-auto px-6">
        <div className="text-center mb-8">
          <span className="font-caveat text-[#C17642] text-3xl sm:text-4xl tracking-wide">Monthly Donations</span>
          <h1 className="font-playfair text-4xl sm:text-5xl font-bold text-[#0F9FAE] mt-2 leading-[1.1]">
            Cancel a Monthly Donation
          </h1>
        </div>

        {done ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-5" />
            <h2 className="font-playfair text-2xl font-bold text-[#1AABAB] mb-2">Cancelled</h2>
            <p className="text-gray-600">
              Your monthly donation has been stopped — you won&apos;t be charged again.
              Thank you for everything you&apos;ve given.
            </p>
          </div>
        ) : oneClickPending ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <p className="text-gray-600">Cancelling your monthly donation…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-5">
            <p className="text-gray-500 text-sm text-center">
              Enter your email and the confirmation number from your confirmation email.
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Confirmation Number *</label>
              <input type="text" required value={custkey} onChange={(e) => setCustkey(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email *</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading || !custkey || !email}
              className="w-full bg-[#F5A020] text-white py-4 rounded-lg font-semibold text-lg hover:bg-[#D48810] transition disabled:opacity-50">
              {loading ? "Cancelling..." : "Cancel My Monthly Donation"}
            </button>
            <p className="text-center text-xs text-gray-400">
              Can&apos;t find your confirmation number? Email us at tomcheishabbosfl@gmail.com and we&apos;ll take care of it.
            </p>
          </form>
        )}

        {error && (linkCode && linkSig) && (
          <p className="text-center text-red-500 text-sm mt-4">{error}</p>
        )}
      </div>
    </main>
  );
}

export default function ManageDonationPage() {
  return (
    <Suspense fallback={<main className="pt-32 min-h-screen bg-[#FDF9F7]" />}>
      <ManageDonation />
    </Suspense>
  );
}
