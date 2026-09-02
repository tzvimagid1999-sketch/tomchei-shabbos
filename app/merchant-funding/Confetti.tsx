"use client";

import { useEffect, useRef } from "react";

// A short burst of confetti, drawn on a canvas rather than pulled from a
// library, so it adds nothing to the bundle and cannot load anything external.
//
// It runs once per page load and stops on its own. The canvas sits above the
// page but ignores the pointer, so it can never block the Donate button
// underneath it — a celebration that swallowed clicks would cost donations.
const COLOURS = ["#F5A020", "#C8A75B", "#0a6e78", "#0F9FAE", "#E8D9A8"];

const DURATION_MS = 6000;
const PIECES = 160;

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  colour: string;
  spin: number;
  angle: number;
};

export default function Confetti({ run }: { run: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!run) return;
    // Anyone who has asked their system to reduce motion gets no falling
    // pieces at all; the goal is still announced in text beside the bar.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    const size = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    window.addEventListener("resize", size);

    // Everything starts above the fold and falls in, staggered, so the screen
    // does not fill all at once.
    const pieces: Piece[] = Array.from({ length: PIECES }, () => ({
      x: Math.random() * width,
      y: -20 - Math.random() * height * 0.8,
      vx: (Math.random() - 0.5) * 60,
      vy: 90 + Math.random() * 130,
      w: 6 + Math.random() * 7,
      h: 10 + Math.random() * 8,
      colour: COLOURS[Math.floor(Math.random() * COLOURS.length)],
      spin: (Math.random() - 0.5) * 6,
      angle: Math.random() * Math.PI,
    }));

    const started = performance.now();
    let last = started;
    let raf = 0;

    const frame = (now: number) => {
      const elapsed = now - started;
      // Seconds since the previous frame, capped so a backgrounded tab does
      // not resume with one enormous jump.
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      ctx.clearRect(0, 0, width, height);

      // Fade out over the last second rather than vanishing mid-fall.
      const fade = elapsed > DURATION_MS - 1000 ? Math.max(0, (DURATION_MS - elapsed) / 1000) : 1;
      ctx.globalAlpha = fade;

      for (const p of pieces) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.angle += p.spin * dt;
        p.vy += 40 * dt; // gravity

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.colour;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (elapsed < DURATION_MS) {
        raf = requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
    };
  }, [run]);

  if (!run) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50"
    />
  );
}
