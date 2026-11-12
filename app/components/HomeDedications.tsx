// Names (and dedications) of this week's sponsors, shown in the home page banner.
// They come from the ParnasYom display page: its server-rendered HTML carries the
// current dedications, so adding someone there puts them on this page on its own.
// The fetch is cached for 15 minutes. If ParnasYom can't be reached, or nobody is
// listed, this renders nothing.
//
// Only the name and the dedication text are ever used. The same data also holds
// the sponsor's email and amount; those are deliberately never read.

const DISPLAY_URL = "https://parnasyom.com/display/6a8494c11d29a35cf8158e7e/18";

type Dedication = { name: string; message: string };

async function getDedications(): Promise<Dedication[]> {
  try {
    const res = await fetch(DISPLAY_URL, { next: { revalidate: 900 } });
    if (!res.ok) return [];
    const html = await res.text();
    const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!match) return [];
    const items = JSON.parse(match[1])?.props?.pageProps?.initialMultiple;
    if (!Array.isArray(items)) return [];

    const now = Date.now();
    const seen = new Set<string>();
    const out: Dedication[] = [];
    for (const d of items) {
      if (!d || d.deleted || d.isApproved === false || d.anonymous) continue;
      const name = typeof d.name === "string" ? d.name.trim() : "";
      if (!name) continue;
      if (d.startDate && Date.parse(d.startDate) > now) continue;
      if (d.endDate && Date.parse(d.endDate) < now) continue;
      const message = typeof d.message === "string" ? d.message.trim() : "";
      const key = name + "|" + message;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ name, message });
    }
    return out;
  } catch {
    return [];
  }
}

export default async function HomeDedications() {
  const list = await getDedications();
  if (list.length === 0) return null;

  return (
    <div className="mt-6 max-w-3xl">
      <p className="font-jost text-[#F5A020] text-xs sm:text-sm font-bold uppercase tracking-[0.25em] mb-2 drop-shadow">
        Sponsored This Week By
      </p>
      <ul className="space-y-1">
        {list.map((d) => (
          <li key={d.name + d.message} className="font-jost text-white text-lg sm:text-2xl font-semibold drop-shadow-lg">
            {d.name}
            {d.message && (
              <span className="block text-left text-white/85 text-sm sm:text-lg font-normal" dir="auto">
                {d.message}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
