"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X } from "lucide-react";

export default function PopupBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 10000);
  }, []);

  const close = () => setVisible(false);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in-up">

        {/* Image header bar */}
        <div className="relative px-8 py-8 text-center overflow-hidden">
          <Image src="/rosh-hashana-bg-small.jpg" alt="Rosh Hashana" fill className="object-cover object-center" />
          <div className="absolute inset-0 bg-[#C9A961]/70" />
          <div className="relative z-10">
            <p className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-2">Special Announcement</p>
            <h2 className="font-playfair text-3xl font-extrabold text-white leading-tight">
              Rosh Hashana Campaign<br />Starting Now
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-7 text-center">
          <p className="text-gray-600 mb-6 leading-relaxed">
            Help us ensure every family in our community has a beautiful and meaningful Rosh Hashana. Your donation makes it possible.
          </p>
          <Link href="/rosh-hashanah" onClick={close}
            className="block w-full bg-[#C9A961] text-white py-3.5 rounded-lg font-bold text-sm tracking-wide hover:bg-[#FFC700] transition mb-3">
            Learn More & Donate
          </Link>
          <button onClick={close} className="text-gray-400 text-xs hover:text-gray-600 transition">
            Maybe later
          </button>
        </div>

        {/* Close button */}
        <button onClick={close}
          className="absolute top-3 right-3 text-white/70 hover:text-white transition p-1">
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}


