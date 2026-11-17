import { useEffect, useRef } from 'react';

// Gold light rays drawn on a canvas, scaled to whatever box contains it.
export default function Rays({ cx = 0.72, cy = 0.35 }: { cx?: number; cy?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); if (!ctx) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let t = 0, raf = 0;
    const draw = () => {
      const r = c.getBoundingClientRect(); if (!r.width) return;
      const d = Math.min(window.devicePixelRatio || 1, 2);
      if (c.width !== Math.round(r.width * d)) { c.width = Math.round(r.width * d); c.height = Math.round(r.height * d); }
      ctx.setTransform(d, 0, 0, d, 0, 0);
      const w = r.width, h = r.height, x0 = w * cx, y0 = h * cy, n = 36, len = Math.max(w, h) * 1.7;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + t, al = (i % 2 ? 0.12 : 0.06) * (0.75 + 0.25 * Math.sin(t * 3 + i));
        ctx.strokeStyle = `rgba(244,201,93,${al.toFixed(3)})`; ctx.lineWidth = i % 2 ? 1.5 : 1;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + Math.cos(a) * len, y0 + Math.sin(a) * len); ctx.stroke();
      }
    };
    const loop = () => { t += 0.0006; draw(); raf = requestAnimationFrame(loop); };
    if (reduce) draw(); else raf = requestAnimationFrame(loop);
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, [cx, cy]);
  return <canvas ref={ref} className="rays" aria-hidden="true" />;
}
