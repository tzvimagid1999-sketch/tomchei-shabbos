"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { DONATE_HREF } from "../lib/site-config";

const links = [
  { href: "/",          label: "Home" },
  { href: "/about",     label: "About Us" },
  { href: "/volunteer", label: "Volunteer" },
  { href: "/blog",      label: "Blog" },
  { href: "/apply-for-assistance", label: "Apply for Assistance" },
  { href: "/contact",   label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 w-full z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[1fr_auto_1fr] md:flex md:justify-between items-center h-20">

          {/* Left spacer — keeps the logo visually centered on mobile, matching the hamburger's width */}
          <div className="md:hidden" />

          {/* Logo — centered on mobile, left-aligned on desktop */}
          <Link href="/" className="block justify-self-center md:justify-self-auto">
            <Image src="/ts-logo.png.jpg" alt="Tomchei Shabbos Florida" width={240} height={75}
              className="object-contain" />
          </Link>

          {/* Desktop links — every item is a plain link; Donate Now is the only
              button, pushed hard right. whitespace-nowrap stops the longer
              labels wrapping onto a second line. */}
          <div className="hidden md:flex flex-1 items-center gap-0.5 lg:gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href}
                className={`whitespace-nowrap px-2.5 lg:px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  pathname === l.href
                    ? "bg-[#1AABAB]/10 text-[#1AABAB]"
                    : "text-[#1AABAB] hover:bg-[#1AABAB]/5 hover:text-[#1AABAB]"
                }`}>
                {l.label}
              </Link>
            ))}
            <Link href="/RoshHashanah"
              className="whitespace-nowrap px-2.5 lg:px-3.5 py-2 rounded-lg text-sm font-semibold text-[#0F9FAE] hover:bg-orange-100 transition-all flex items-center gap-1.5">
              🍎 Rosh Hashanah Campaign
            </Link>
            <Link href={DONATE_HREF}
              className="ml-auto whitespace-nowrap bg-[#F5A020] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-[#D48810] transition-all tracking-wide active:translate-y-[2px]">
              Donate Now
            </Link>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-[#1AABAB] p-1 justify-self-end" onClick={() => setOpen(!open)}>
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1 shadow-lg">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className={`block px-4 py-2.5 rounded-lg font-semibold text-sm ${
                pathname === l.href ? "bg-[#1AABAB]/10 text-[#1AABAB]" : "text-[#1AABAB] hover:bg-[#1AABAB]/5"
              }`}
              onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link href="/RoshHashanah"
            className="block px-4 py-2.5 rounded-lg font-semibold text-sm text-[#0F9FAE] hover:bg-orange-100 mt-2"
            onClick={() => setOpen(false)}>
            🍎 Rosh Hashanah Campaign
          </Link>
          <Link href={DONATE_HREF}
            className="block bg-[#F5A020] text-white text-center px-4 py-2.5 rounded-lg font-bold text-sm mt-2 tracking-wide"
            onClick={() => setOpen(false)}>
            Donate Now
          </Link>
        </div>
      )}
    </nav>
  );
}


