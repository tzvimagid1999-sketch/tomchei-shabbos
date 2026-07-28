"use client";
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0a6e78]">
      <div className="max-w-7xl mx-auto px-6 py-1.5 flex items-center justify-between gap-x-4 overflow-hidden">
        <p className="text-white/50 text-[11px] whitespace-nowrap shrink-0">© {year} Tomchei Shabbos Florida</p>
        <div className="flex gap-x-4 shrink-0">
          {[
            { href: "/",               label: "Home" },
            { href: "/about",          label: "About" },
            { href: "/donate#payment", label: "Donate" },
            { href: "/volunteer",      label: "Volunteer" },
            { href: "/blog",           label: "Blog" },
            { href: "/manage-donation", label: "Cancel Monthly" },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="text-white/50 text-[11px] hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
        <p className="text-white/40 text-[11px] hidden sm:block shrink-0">501(c)(3) · Tax ID: 83-2155012</p>
      </div>
    </footer>
  );
}
