"use client";

import { useEffect, useState } from "react";

// A 36-hour countdown for the campaign.
//
// The deadline is a fixed instant, written with its offset so it means the same
// moment everywhere. A donor in another timezone sees the same time remaining
// as the office does, which is the whole point of a countdown — "ends at 8pm"
// would not be.
// Started Wednesday 2 September 2026 at 6:30pm Eastern, running 36 hours.
export const CAMPAIGN_ENDS_AT = "2026-09-04T06:30:00-04:00";

const INK = "#2D2D2D";

type Left = { hours: number; minutes: number; seconds: number; done: boolean };

function timeLeft(endMs: number): Left {
  const ms = endMs - Date.now();
  if (ms <= 0) return { hours: 0, minutes: 0, seconds: 0, done: true };
  const total = Math.floor(ms / 1000);
  return {
    // Hours are not wrapped into days: a 36-hour campaign reads better as
    // "35 hours left" than "1 day 11 hours".
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    done: false,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export default function Countdown() {
  const endMs = new Date(CAMPAIGN_ENDS_AT).getTime();
  // Nothing is rendered until the clock is running. The server has no idea what
  // "now" is for this reader, and rendering a guess would flash a wrong number
  // and break hydration.
  const [left, setLeft] = useState<Left | null>(null);

  useEffect(() => {
    if (!Number.isFinite(endMs)) return;
    setLeft(timeLeft(endMs));
    const id = setInterval(() => setLeft(timeLeft(endMs)), 1000);
    return () => clearInterval(id);
  }, [endMs]);

  if (!left) {
    // Holds the space so the hero does not jump when the clock appears.
    return <div className="mt-9 h-[4.5rem]" aria-hidden="true" />;
  }

  if (left.done) {
    return (
      <p
        className="mt-9 text-[clamp(1rem,2vw,1.375rem)] font-bold uppercase tracking-[0.14em]"
        style={{ color: INK }}
      >
        This campaign has closed — donations are still welcome
      </p>
    );
  }

  const cells: [number, string][] = [
    [left.hours, left.hours === 1 ? "Hour" : "Hours"],
    [left.minutes, "Minutes"],
    [left.seconds, "Seconds"],
  ];

  return (
    <div className="mt-9">
      <p
        className="mb-3 text-[clamp(0.75rem,1.1vw,0.9375rem)] font-bold uppercase tracking-[0.18em]"
        style={{ color: "#2D2D2D", opacity: 0.7 }}
      >
        Campaign ends in
      </p>

      {/* One announcement, not a screen reader counting every second. */}
      <p className="sr-only" aria-live="polite">
        {left.hours} hours and {left.minutes} minutes remaining
      </p>

      <div className="flex items-start justify-center gap-3 sm:gap-5" aria-hidden="true">
        {cells.map(([value, label], i) => (
          <div key={label} className="flex items-start gap-3 sm:gap-5">
            <div className="text-center">
              <div
                className="mf-display tabular-nums text-[clamp(2.5rem,7vw,4.5rem)] leading-none"
                style={{ color: INK }}
              >
                {pad(value)}
              </div>
              <div
                className="mt-2 text-[clamp(0.625rem,1vw,0.8125rem)] font-bold uppercase tracking-[0.16em]"
                style={{ color: "#2D2D2D", opacity: 0.6 }}
              >
                {label}
              </div>
            </div>
            {i < cells.length - 1 && (
              <span
                className="mf-display leading-none text-[clamp(2.5rem,7vw,4.5rem)]"
                style={{ color: INK, opacity: 0.3 }}
              >
                :
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
