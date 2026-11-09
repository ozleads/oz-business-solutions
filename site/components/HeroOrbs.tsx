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
 * devices ease gently toward a finger and with page scroll. Reduced motion leaves them still.
 */
export default function HeroOrbs() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = ref.current;
    const hero = layer?.parentElement;
    if (!layer || !hero) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Coarse pointers get a lighter loop: a finger and page scroll nudge the orbs. The fine-pointer
    // loop below is unchanged. A desktop with no pointer device yet still follows once the mouse moves.
    if (window.matchMedia("(pointer: coarse)").matches) {
      const els = Array.from(layer.children) as HTMLElement[];
      let w = 0;
      let h = 0;
      const measure = () => {
        const r = hero.getBoundingClientRect();
        w = r.width;
        h = r.height;
      };
      measure();

      const state = orbs.map(() => ({ x: 0, y: 0 }));
      const touch = { x: 0, y: 0, active: false };
      let scrollShift = 0;
      let raf = 0;
      let visible = true;
      let t0 = performance.now();

      const tick = (now: number) => {
        const t = (now - t0) / 1000;
        for (let i = 0; i < COUNT; i++) {
          const o = orbs[i];
          const bx = o.x * w;
          const by = o.y * h;
          const ix = Math.sin(t * o.speed * 0.65 + o.phase) * o.amp * 0.45;
          const iy = Math.cos(t * o.speed * 0.5 + o.phase) * o.amp * 0.35;
          const pull = o.pull * 0.4;
          const tx = (touch.active ? (touch.x - bx) * pull : 0) + ix;
          const ty = (touch.active ? (touch.y - by) * pull : 0) + iy + scrollShift * (0.3 + o.pull);
          const s = state[i];
          s.x += (tx - s.x) * o.ease;
          s.y += (ty - s.y) * o.ease;
          els[i].style.transform = `translate3d(${(bx + s.x).toFixed(1)}px, ${(by + s.y).toFixed(1)}px, 0)`;
        }
        if (visible && !document.hidden) raf = requestAnimationFrame(tick);
        else raf = 0;
      };
      const start = () => {
        if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick);
      };
      const stop = () => {
        cancelAnimationFrame(raf);
        raf = 0;
      };
      const place = (e: PointerEvent) => {
        const r = hero.getBoundingClientRect();
        touch.x = e.clientX - r.left;
        touch.y = e.clientY - r.top;
        touch.active = true;
      };
      const onDown = (e: PointerEvent) => {
        if (e.pointerType === "mouse") return;
        place(e);
      };
      const onMove = (e: PointerEvent) => {
        if (!touch.active || e.pointerType === "mouse") return;
        place(e);
      };
      const onUp = (e: PointerEvent) => {
        if (e.pointerType === "mouse") return;
        touch.active = false;
      };
      const onScroll = () => {
        const r = hero.getBoundingClientRect();
        const viewed = Math.min(1, Math.max(0, -r.top / Math.max(r.height, 1)));
        scrollShift = (viewed - 0.12) * 26;
      };
      const onVis = () => (document.hidden ? stop() : start());
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      });
      io.observe(hero);
      hero.addEventListener("pointerdown", onDown, { passive: true });
      hero.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerup", onUp, { passive: true });
      window.addEventListener("pointercancel", onUp, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", measure, { passive: true });
      document.addEventListener("visibilitychange", onVis);
      layer.classList.add("is-live");
      onScroll();
      t0 = performance.now();
      start();

      return () => {
        stop();
        io.disconnect();
        hero.removeEventListener("pointerdown", onDown);
        hero.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", measure);
        document.removeEventListener("visibilitychange", onVis);
      };
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
