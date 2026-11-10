// Shows this week's parsha and Shabbos times for Miami and Boca Raton.
// Data comes from Hebcal's free Shabbat API and refreshes on its own: the
// fetch is cached for an hour, so the card rolls over to the next week
// without anyone editing the site. If Hebcal can't be reached it renders nothing.

const CITIES = [
  { name: "Miami", geonameid: 4164138 },
  { name: "Boca Raton", geonameid: 4148411 },
];

type HebcalItem = { category: string; title: string; date: string; hebrew?: string };

async function getShabbos(geonameid: number) {
  try {
    const res = await fetch(`https://www.hebcal.com/shabbat?cfg=json&geonameid=${geonameid}&M=on`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const items: HebcalItem[] = (await res.json()).items ?? [];
    const time = (cat: string) => {
      const item = items.find((i) => i.category === cat);
      if (!item) return null;
      return new Date(item.date).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: "America/New_York",
      });
    };
    const parsha = items.find((i) => i.category === "parashat");
    const candles = items.find((i) => i.category === "candles");
    if (!parsha || !candles) return null;
    return {
      parsha: parsha.title.replace(/^Parashat /, ""),
      hebrew: parsha.hebrew,
      shabbosDate: new Date(parsha.date + "T12:00:00").toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      candles: time("candles"),
      havdalah: time("havdalah"),
    };
  } catch {
    return null;
  }
}

export default async function ShabbosTimes() {
  const results = await Promise.all(CITIES.map((c) => getShabbos(c.geonameid)));
  const first = results.find(Boolean);
  if (!first) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 text-center">
      <p className="text-[#F5A020] font-semibold text-xs uppercase tracking-widest mb-2">This Shabbos</p>
      <h2 className="font-playfair text-3xl sm:text-4xl font-bold text-gray-900">Parshas {first.parsha}</h2>
      {first.hebrew && <p className="text-[#8B7355] mt-1" dir="rtl">{first.hebrew}</p>}
      <p className="text-gray-500 text-sm mt-1">{first.shabbosDate}</p>
      <div className="grid sm:grid-cols-2 gap-4 mt-6">
        {CITIES.map((c, i) => {
          const r = results[i];
          if (!r) return null;
          return (
            <div key={c.name} className="rounded-xl bg-[#FAF3E8] p-5">
              <p className="font-playfair font-bold text-lg text-[#1AABAB] mb-2">{c.name}</p>
              <p className="font-josefin text-gray-600 text-[16px]">Candle lighting: <strong>{r.candles}</strong></p>
              {r.havdalah && <p className="font-josefin text-gray-600 text-[16px]">Havdalah: <strong>{r.havdalah}</strong></p>}
            </div>
          );
        })}
      </div>
      <p className="text-gray-400 text-xs mt-4">
        Times from <a href="https://www.hebcal.com" className="underline hover:text-[#1AABAB]">Hebcal.com</a>
      </p>
    </div>
  );
}
