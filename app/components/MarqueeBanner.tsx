const taglines = [
  "Every family deserves a full Shabbos table",
  "Shabbos for all",
  "Your donation is a family's Shabbos meal this week",
];

export default function MarqueeBanner() {
  return (
    <div className="bg-[#1AABAB] text-white py-2 overflow-hidden w-full fixed top-0 left-0 z-50">
      <div className="flex items-center justify-center gap-6 flex-wrap px-4">
        {taglines.map((text, i) => (
          <span key={i} className="font-playfair italic text-sm flex items-center gap-6">
            {text}
            {i < taglines.length - 1 && <span className="text-white/50">Â·</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

