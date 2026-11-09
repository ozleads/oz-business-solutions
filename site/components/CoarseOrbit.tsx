"use client";

import { useEffect, useRef } from "react";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Scroll-linked shift for the services line art on coarse pointers only.
 * Fine pointers leave the layers still, which is how they render today.
 */
export default function CoarseOrbit({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: coarse)").matches) return;

    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-depth]"));
    const state = layers.map(() => ({ y: 0, ty: 0 }));
    let raf = 0;
    let visible = false;

    const tick = () => {
      raf = 0;
      let moving = false;
      layers.forEach((el, i) => {
        const s = state[i];
        s.y = lerp(s.y, s.ty, 0.08);
        if (Math.abs(s.y - s.ty) >= 0.01) moving = true;
        el.style.transform = `translate3d(0, ${s.y.toFixed(2)}px, 0)`;
      });
      if (moving && visible && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      const r = root.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      const ny = Math.max(-1, Math.min(1, (window.innerHeight / 2 - mid) / (window.innerHeight / 2)));
      layers.forEach((el, i) => {
        const depth = Number(el.dataset.depth || 1);
        state[i].ty = ny * depth * 8;
      });
      kick();
    };
    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else onScroll();
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) onScroll();
      else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(root);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("visibilitychange", onVis);
      for (const el of layers) el.style.transform = "";
    };
  }, []);

  return (
    <div ref={ref} className="orbit-layers" aria-hidden="true">
      {children}
    </div>
  );
}
