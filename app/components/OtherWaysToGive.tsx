"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { MAILING } from "../lib/contact-info";

const ZELLE_EMAIL = "tomcheishabbosfl@gmail.com";

const methods = [
  {
    name: "The Donors Fund",
    href: "https://www.thedonorsfund.org/donate/tomchei-shabbos-of-florida/832155012",
    bg: "#F5A020",
    letter: "D",
  },
  {
    name: "Venmo",
    href: "https://venmo.com/u/TomcheiShabbosfl",
    bg: "#3D95CE",
    letter: "V",
  },
  {
    name: "Cash App",
    href: "https://cash.app/$tomcheishabbosfl",
    bg: "#00D64F",
    letter: "$",
  },
  {
    name: "PayPal",
    href: "https://www.paypal.com/donate/?hosted_button_id=XGHDR4EE3ND2U",
    bg: "#003087",
    letter: "P",
  },
  {
    name: "Jewish Communal Fund",
    href: "https://jcfny.org/",
    bg: "#6B4C9A",
    letter: "J",
  },
];

// Zelle has no payment URL — donors send from their own bank app to an address.
// So this row shows the address and copies it, rather than linking out.
function ZelleRow() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ZELLE_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (older browsers, insecure context). The address
      // is visible on screen either way, so the donor can still select it.
      setCopied(false);
    }
  };

  return (
    <button type="button" onClick={copy}
      className="w-full flex items-center gap-4 bg-white border-2 border-gray-100 rounded-xl px-4 py-3 hover:border-[#1AABAB] hover:shadow-md transition-all text-left">
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
        style={{ backgroundColor: "#6D1ED4" }}>
        Z
      </div>
      <div className="min-w-0 flex-1">
        <span className="font-semibold text-gray-700 block">Donate with Zelle</span>
        <span className="text-xs text-gray-500 break-all">{ZELLE_EMAIL}</span>
      </div>
      <span className="shrink-0 flex items-center gap-1 text-xs font-semibold text-[#1AABAB]">
        {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
      </span>
    </button>
  );
}

// Checks have no payment URL either. This matters more than it looks: donors
// making a required distribution from an IRA can often ONLY give by mailed
// check, and until now the address appeared nowhere on the site — only inside
// receipts sent after donating.
function CheckRow() {
  const [copied, setCopied] = useState(false);
  const fullAddress = `${MAILING.payableTo}\n${MAILING.street}\n${MAILING.cityStateZip}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the address is on screen either way.
      setCopied(false);
    }
  };

  return (
    <div className="bg-white border-2 border-gray-100 rounded-xl px-4 py-3">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
          style={{ backgroundColor: "#C8A75B" }}>
          ✉
        </div>
        <span className="font-semibold text-gray-700 flex-1 min-w-0">Donate by check</span>
        <button type="button" onClick={copy}
          className="shrink-0 flex items-center gap-1 text-xs font-semibold text-[#1AABAB]">
          {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
        </button>
      </div>
      <div className="mt-3 pl-14 text-xs text-gray-500 leading-relaxed">
        Make checks payable to <span className="font-semibold text-gray-700">{MAILING.payableTo}</span>
        <address className="not-italic mt-1.5 text-gray-600">
          {MAILING.street}<br />
          {MAILING.cityStateZip}
        </address>
      </div>
    </div>
  );
}

export default function OtherWaysToGive() {
  return (
    <div className="max-w-md mx-auto">
      <p className="text-xs font-bold uppercase tracking-widest text-[#1AABAB] mb-3 text-center">Other Ways to Give</p>
      <div className="space-y-3">
        {methods.map((m) => (
          <a key={m.name} href={m.href} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 bg-white border-2 border-gray-100 rounded-xl px-4 py-3 hover:border-[#1AABAB] hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
              style={{ backgroundColor: m.bg }}>
              {m.letter}
            </div>
            <span className="font-semibold text-gray-700">Donate with {m.name}</span>
          </a>
        ))}
        <ZelleRow />
        <CheckRow />
      </div>
    </div>
  );
}
