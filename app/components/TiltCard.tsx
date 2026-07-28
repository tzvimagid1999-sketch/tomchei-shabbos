"use client";
import { useRef, useState } from "react";

export default function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // -0.5 .. 0.5 relative to card centre
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;

    setStyle({
      transform: `perspective(900px) rotateX(${(-py * 10).toFixed(2)}deg) rotateY(${(px * 12).toFixed(2)}deg) translateY(-4px) scale(1.02)`,
      boxShadow: `${(-px * 18).toFixed(1)}px ${(14 - py * 10).toFixed(1)}px 30px -10px rgba(15,159,174,0.28)`,
      transition: "box-shadow 150ms ease-out",
    });
  };

  const handleLeave = () => {
    setStyle({
      transform: "perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)",
      transition: "transform 450ms cubic-bezier(0.22,1,0.36,1), box-shadow 450ms ease-out",
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ transformStyle: "preserve-3d", willChange: "transform", ...style }}
      className="bg-[#F5EEE7] rounded-xl px-6 py-5 shadow-sm border border-[#E7DACD]"
    >
      {children}
    </div>
  );
}
