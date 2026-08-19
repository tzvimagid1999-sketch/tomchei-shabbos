"use client";
import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0a6e78]">
      <div className="max-w-7xl mx-auto px-6 py-3 sm:py-1.5 flex flex-col sm:flex-row items-center sm:justify-between gap-y-2 gap-x-4">
        <p className="text-white/50 text-[11px] whitespace-nowrap shrink-0 order-2 sm:order-1">© {year} Tomchei Shabbos Florida</p>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 order-1 sm:order-2">
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
        <p className="text-white/40 text-[11px] hidden sm:block shrink-0 order-3">501(c)(3) · Tax ID: 83-2155012</p>
      </div>
    </footer>
  );
}
