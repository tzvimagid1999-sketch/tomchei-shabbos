"use client";

const GOLD = "#A08243";
const INK = "#2D2D2D";

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

// The campaign bar, as a gold ribbon with named milestones underneath.
//
// The milestones do the work the bar alone cannot: they turn a percentage into
// what a given sum actually buys. Reached ones are inked in gold, the ones
// still ahead stay light, so the row reads as a route rather than decoration.
const MILESTONES: [number, string][] = [
  [10000, "The first tables are being set"],
  [25000, "Halfway to a sweeter new year"],
  [40000, "The community is coming together"],
  [50000, "Together, we set the table"],
];

export default function CampaignBar({
  pct,
  goal,
  raised,
  run,
}: {
  pct: number;
  goal: number;
  raised: number | null;
  run: boolean;
}) {
  return (
    <div className="mf-reveal mt-10">
      {/* Fill capped at 100% by the caller so the ribbon can never overrun. */}
      <div className="overflow-hidden rounded-[100px]" style={{ backgroundColor: "#E5E5E5" }}>
        <div
          className="mf-ribbon h-7 rounded-[100px]"
          style={{ width: run ? `${pct}%` : "0%" }}
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${Math.round(pct)} percent of the ${money(goal)} goal raised`}
        />
      </div>

      <ol className="mt-6 grid gap-3 sm:grid-cols-4">
        {MILESTONES.map(([at, label]) => {
          // Unknown total is not the same as "not reached", but it renders the
          // same way — the page never claims a milestone it cannot confirm.
          const reached = raised !== null && raised >= at;
          return (
            <li key={at} className="flex gap-2.5">
              <span
                className="mt-1.5 h-2.5 w-2.5 flex-none rounded-full"
                style={{ backgroundColor: reached ? GOLD : "rgba(45,45,45,0.18)" }}
              />
              <span>
                <span
                  className="block text-[15px] font-bold tabular-nums"
                  style={{ color: reached ? GOLD : INK, opacity: reached ? 1 : 0.45 }}
                >
                  {money(at)}
                </span>
                <span className="mt-0.5 block text-[14px] leading-[1.35]" style={{ opacity: reached ? 0.8 : 0.4 }}>
                  {label}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
