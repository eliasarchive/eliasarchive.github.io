import { useEffect, useRef } from "react";

type Seg = [number, number, number, number, number];

function bolt(x: number, y: number, len: number, w: number, depth = 0): Seg[] {
  const out: Seg[] = [];
  let cx = x, cy = y;
  const steps = 14;
  for (let i = 0; i < steps; i++) {
    const nx = cx + (Math.random() - 0.5) * len * 0.22;
    const ny = cy + len / steps;
    out.push([cx, cy, nx, ny, w]);
    if (depth < 2 && Math.random() < 0.18) out.push(...bolt(nx, ny, len * 0.45, w * 0.5, depth + 1));
    cx = nx; cy = ny;
  }
  return out;
}

export function LightningCanvas({ onStrike }: { onStrike?: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let raf = 0, timer = 0, start = 0, segs: Seg[] = [], w = 0, h = 0;
    const resize = () => { const d = Math.min(devicePixelRatio || 1, 2); w = canvas.clientWidth; h = canvas.clientHeight; canvas.width = w * d; canvas.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    resize(); addEventListener("resize", resize);
    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      const age = t - start;
      if (age < 700) {
        const flicker = age < 90 ? 1 : age < 160 ? 0.25 : age < 260 ? 0.85 : Math.max(0, 1 - (age - 260) / 440);
        ctx.fillStyle = `rgba(190,205,235,${0.12 * flicker})`; ctx.fillRect(0, 0, w, h * 0.6);
        ctx.lineCap = "round"; ctx.shadowColor = "rgba(200,215,255,.95)"; ctx.shadowBlur = 18;
        for (const [a, b, c, d, lw] of segs) { ctx.strokeStyle = `rgba(235,242,255,${flicker})`; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }
        ctx.shadowBlur = 0;
      }
        raf = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    };
    const scheduleStrike = () => {
      timer = window.setTimeout(() => {
        if (!document.hidden) {
          start = performance.now();
          segs = bolt(w * (0.15 + Math.random() * 0.7), -10, h * (0.32 + Math.random() * 0.12), 2.4);
          onStrike?.();
          raf = requestAnimationFrame(draw);
        }
        scheduleStrike();
      }, 4500 + Math.random() * 6000);
    };
    timer = window.setTimeout(() => {
      if (!document.hidden) {
        start = performance.now();
        segs = bolt(w * (0.15 + Math.random() * 0.7), -10, h * (0.32 + Math.random() * 0.12), 2.4);
        onStrike?.();
        raf = requestAnimationFrame(draw);
      }
      scheduleStrike();
    }, 1800);
    return () => { cancelAnimationFrame(raf); window.clearTimeout(timer); removeEventListener("resize", resize); };
  }, [onStrike]);
  return <canvas ref={ref} className="pointer-events-none absolute inset-0 z-[1] h-full w-full" aria-hidden="true" />;
}
