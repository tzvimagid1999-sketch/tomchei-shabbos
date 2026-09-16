"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";

// Shown once per browser, not on every new tab — but an explicit page
// refresh always shows it again, since a visitor hitting reload is asking to
// see the page fresh, and that is generally expected to include this.
const SEEN_KEY = "tsf-popup-seen";

// The Navigation Timing API tells a real reload (F5, the reload button) apart
// from an ordinary navigation (typing the URL, opening a new tab, following a
// link) — the one distinction localStorage alone cannot make, since both look
// identical to it.
function isPageReload(): boolean {
  try {
    const [entry] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (entry?.type === "reload") return true;
  } catch {
    // Fall through to the older API below.
  }
  try {
    // The modern API above is not consistently populated by every mobile
    // browser for every kind of reload (pull-to-refresh in particular has a
    // history of not behaving like a normal reload internally). This older,
    // deprecated API is a second, independent way engines report the same
    // thing, so a browser that gets one wrong may still get the other right.
    // eslint-disable-next-line deprecation/deprecation
    return (performance as unknown as { navigation?: { type: number } }).navigation?.type === 1;
  } catch {
    return false;
  }
}

export default function PopupBanner() {
  const [visible, setVisible] = useState(false);
  // The merchant funding campaign is its own standalone landing page; a
  // site-wide interstitial over its donation form would only get in the way.
  const suppressed = usePathname().startsWith("/merchant-funding");

  useEffect(() => {
    if (suppressed) return;

    let alreadySeen = false;
    try {
      alreadySeen = localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      // Private browsing or storage blocked: treat as never seen, matching
      // the old always-show behaviour rather than silently going quiet.
    }
    if (alreadySeen && !isPageReload()) return;

    const id = setTimeout(() => {
      setVisible(true);
      try {
        localStorage.setItem(SEEN_KEY, "1");
      } catch {
        // If storage cannot be written, it just shows again next time too —
        // the safe direction to fail in for a promotional popup.
      }
    }, 3000);
    return () => clearTimeout(id);
  }, [suppressed]);

  const close = () => setVisible(false);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-fade-in-up">

        <div className="relative aspect-[1200/660] w-full">
          <Image src="/rosh-hashanah-popup-v2.jpg" alt="Delivery Status: Pending — Awaiting Your Generosity, Yom Tov Campaign" fill className="object-cover object-center" priority />

          {/* Clickable "Click To Give" hotspot, positioned over the button in the graphic */}
          <Link href="/Tishrei" onClick={close}
            aria-label="Click to give"
            className="absolute rounded-none cursor-pointer transition-all duration-150 hover:ring-2 hover:ring-inset hover:ring-[#0F6B6B] active:scale-[0.97]"
            style={{ left: "70.75%", top: "76.36%", width: "25.42%", height: "10.91%" }} />
        </div>

        {/* Close button */}
        <button onClick={close}
          className="absolute top-2 right-2 bg-black/40 hover:bg-black/60 text-white rounded-sm p-0.5 transition">
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}


