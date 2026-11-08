"use client";

import { useEffect, useRef } from "react";

const COUNT = 20;

const seed = (n: number) => {
  const x = Math.sin(n * 91.7 + 12.3) * 43758.5453;
  return x - Math.floor(x);
};

/** Home positions (% of hero), size, opacity, pull toward cursor, lag and idle-drift phase. */
const orbs = Array.from({ length: COUNT }, (_, i) => ({
  x: 0.08 + seed(i + 1) * 0.86,
  y: 0.08 + seed(i + 11) * 0.84,
  size: 10 + Math.round(seed(i + 21) * 46),
  opacity: 0.08 + seed(i + 31) * 0.12,
  brass: i % 3 !== 0,
  pull: 0.05 + seed(i + 41) * 0.13,
  ease: 0.025 + seed(i + 51) * 0.04,
  phase: seed(i + 61) * Math.PI * 2,
  amp: 6 + seed(i + 71) * 12,
  speed: 0.25 + seed(i + 81) * 0.35,
}));

/**
 * Soft brass/ivory light orbs behind the homepage hero copy. On a fine pointer each orb eases a
 * per-orb fraction of the way toward the cursor with its own lag, plus a slow idle float. Touch
 * devices get the idle float via CSS only; reduced motion leaves them still.
 */
export default function HeroOrbs() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = ref.current;
    const hero = layer?.parentElement;
    if (!layer || !hero) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Touch screens get a slow float only. A missing pointer (desktop with no device yet) still
    // follows once mouse events arrive.
    if (window.matchMedia("(pointer: coarse)").matches) {
      layer.classList.add("hero-orbs--idle");
      return;
    }

    const els = Array.from(layer.children) as HTMLElement[];
    let w = 0;
    let h = 0;
    let top = 0;
    let left = 0;
    const measure = () => {
      const r = hero.getBoundingClientRect();
      w = r.width;
      h = r.height;
      top = r.top + window.scrollY;
      left = r.left;
    };
    measure();

    const state = orbs.map(() => ({ x: 0, y: 0 }));
    const target = { x: 0, y: 0, active: false };
    let raf = 0;
    let visible = true;
    let t0 = performance.now();

    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      for (let i = 0; i < COUNT; i++) {
        const o = orbs[i];
        const bx = o.x * w;
        const by = o.y * h;
        const ix = Math.sin(t * o.speed + o.phase) * o.amp;
        const iy = Math.cos(t * o.speed * 0.8 + o.phase) * o.amp * 0.7;
        const tx = (target.active ? (target.x - bx) * o.pull : 0) + ix;
        const ty = (target.active ? (target.y - by) * o.pull : 0) + iy;
        const s = state[i];
        s.x += (tx - s.x) * o.ease;
        s.y += (ty - s.y) * o.ease;
        els[i].style.transform = `translate3d(${(bx + s.x).toFixed(1)}px, ${(by + s.y).toFixed(1)}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      target.x = e.clientX - left;
      target.y = e.clientY + window.scrollY - top;
      target.active = true;
    };
    const onLeave = () => {
      target.active = false;
    };
    const onVis = () => (document.hidden ? stop() : start());
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(hero);

    hero.addEventListener("pointermove", onMove, { passive: true });
    hero.addEventListener("pointerleave", onLeave, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    layer.classList.add("is-live");
    t0 = performance.now();
    start();

    return () => {
      stop();
      io.disconnect();
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", measure);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div ref={ref} className="hero-orbs" aria-hidden="true">
      {orbs.map((o, i) => (
        <span
          key={i}
          className={o.brass ? "orb orb--brass" : "orb"}
          style={
            {
              width: o.size,
              height: o.size,
              marginLeft: -o.size / 2,
              marginTop: -o.size / 2,
              opacity: o.opacity,
              left: `${o.x * 100}%`,
              top: `${o.y * 100}%`,
              "--d": `${(8 + o.speed * 10).toFixed(1)}s`,
              "--delay": `${(-o.phase).toFixed(2)}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
