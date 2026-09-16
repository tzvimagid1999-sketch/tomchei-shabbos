"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";
import { usePathname } from "next/navigation";

// Shown once per browser, not on every new tab — but an explicit page
// refresh always shows it again, since a visitor hitting reload is asking to
// see the page fresh, and that is generally expected to include this.
//
// The first attempt at this detected "was this a reload" via the Navigation
// Timing API. That turned out to be unreliable on mobile: pull-to-refresh in
// particular has a documented history of not behaving like a normal reload
// internally, so the popup stopped reappearing on refresh on phones.
//
// This uses sessionStorage instead, which needs no browser-reported "reload"
// signal at all — it relies only on the one guarantee every browser gives
// consistently: sessionStorage survives a refresh of the SAME tab, and resets
// the moment a genuinely new tab or window opens. That distinction is exactly
// "was this tab reloaded" vs "is this a new visit", with nothing to detect.
const SEEN_KEY = "tsf-popup-seen"; // localStorage: seen at least once, ever, on this browser
const TAB_LOADED_KEY = "tsf-popup-tab-loaded"; // sessionStorage: this exact tab has loaded the site before

export default function PopupBanner() {
  const [visible, setVisible] = useState(false);
  // The merchant funding campaign is its own standalone landing page; a
  // site-wide interstitial over its donation form would only get in the way.
  const suppressed = usePathname().startsWith("/merchant-funding");

  useEffect(() => {
    if (suppressed) return;

    let alreadySeen = false;
    let sameTabReload = false;
    try {
      alreadySeen = localStorage.getItem(SEEN_KEY) === "1";
      // Set immediately, not inside the timeout below: it must be written the
      // moment this tab first loads the page, so that IF this exact tab is
      // later reloaded, sessionStorage has survived to prove it.
      sameTabReload = sessionStorage.getItem(TAB_LOADED_KEY) === "1";
      sessionStorage.setItem(TAB_LOADED_KEY, "1");
    } catch {
      // Private browsing or storage blocked: treat as never seen, matching
      // the old always-show behaviour rather than silently going quiet.
    }
    if (alreadySeen && !sameTabReload) return;

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


