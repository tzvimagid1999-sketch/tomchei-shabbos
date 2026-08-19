"use client";
import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 350,   suffix: "+",  label: "Families Served",      accent: false },
  { value: 12116, suffix: "",   label: "Pounds of Food Weekly", accent: true  },
  { value: 100,   suffix: "+",  label: "Volunteers",            accent: false },
  { value: 4000,  suffix: "",   label: "Sq Ft Warehouse",       accent: true  },
];

function Counter({ value, suffix, label, accent }: { value: number; suffix: string; label: string; accent: boolean }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;

        const totalDuration = 2200;
        const steps = 60;
        const interval = totalDuration / steps;

        let step = 0;
        const timer = setInterval(() => {
          step++;
          const progress = step / steps;
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(eased * value));
          if (step >= steps) clearInterval(timer);
        }, interval);
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={ref} className="text-center py-12 px-6 bg-[#FEFCF7]">
      <div className={`font-pt-serif text-5xl sm:text-6xl font-bold mb-3 tabular-nums ${
        accent ? "text-[#F5A020]" : "text-[#1AABAB]"
      }`}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs font-bold uppercase tracking-widest text-[#A89070]">{label}</div>
    </div>
  );
}

export default function StatsSection() {
  return (
    <section className="bg-[#E8D9C0] border-t border-b border-[#E8D9C0]">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 gap-px bg-[#E8D9C0]">
          {stats.map((s) => (
            <Counter key={s.label} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}
