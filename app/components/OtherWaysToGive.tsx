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
      </div>
    </div>
  );
}
