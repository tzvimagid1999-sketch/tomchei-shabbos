"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";

export default function PopupBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 3000);
  }, []);

  const close = () => setVisible(false);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-fade-in-up">

        <div className="relative aspect-[1200/660] w-full">
          <Image src="/rosh-hashanah-popup.jpeg" alt="Delivery Status: Pending — Awaiting Your Generosity" fill className="object-cover object-center" priority />

          {/* Clickable "Click To Give" hotspot, positioned over the button in the graphic */}
          <Link href="/RoshHashanah" onClick={close}
            aria-label="Click to give"
            className="absolute rounded-[10px] cursor-pointer transition-all duration-150 hover:ring-2 hover:ring-inset hover:ring-[#0F6B6B] active:scale-[0.97]"
            style={{ left: "69%", top: "79%", width: "27.5%", height: "11.5%" }} />
        </div>

        {/* Close button */}
        <button onClick={close}
          className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white rounded-md p-1.5 transition">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}


