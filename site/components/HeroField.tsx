"use client";

import { useEffect, useRef } from "react";

type P = {
  r: number;
  a: number;
  speed: number;
  tilt: number;
  lift: number;
  size: number;
  x: number;
  y: number;
  z: number;
  glow: number;
};

const IVORY = "244,239,230";
const BRASS = "196,165,116";

/**
 * An orbit field: points travel on tilted elliptical rings around an off-centre core and
 * connect to near neighbours. The pointer tilts the whole field and warms nearby points to
 * brass. Falls back to the CSS backdrop when canvas is unavailable, renders a single still
 * frame for reduced motion, and runs lighter on coarse pointers / small screens.
 */
export default function HeroField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D | null = null;
    try {
      ctx = canvas.getContext("2d", { alpha: true });
    } catch {
      ctx = null;
    }
    if (!ctx) return;
    const c = ctx;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const small = window.innerWidth < 760;
    const lite = coarse || small;

    const count = lite ? 70 : 170;
    const linkDist = lite ? 90 : 120;
    const dprCap = lite ? 1.25 : 1.75;
    const frameMs = lite ? 1000 / 30 : 0;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let cx = 0;
    let cy = 0;
    let scale = 1;

    const seed = (n: number) => {
      const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };

    const pts: P[] = Array.from({ length: count }, (_, i) => {
      const band = seed(i + 1);
      const r = 0.18 + Math.pow(band, 0.8) * 0.9;
      return {
        r,
        a: seed(i + 7) * Math.PI * 2,
        speed: (0.04 + seed(i + 13) * 0.08) * (seed(i + 19) > 0.5 ? 1 : -0.6) / (0.4 + r),
        tilt: (seed(i + 23) - 0.5) * 0.5,
        lift: (seed(i + 29) - 0.5) * 0.22,
        size: 0.6 + seed(i + 31) * 1.4,
        x: 0,
        y: 0,
        z: 0,
        glow: 0,
      };
    });

    const pointer = { x: 0, y: 0, tx: 0, ty: 0, px: -9999, py: -9999, active: false };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = w * (small ? 0.5 : 0.66);
      cy = h * (small ? 0.27 : 0.5);
      scale = Math.min(w, h) * (small ? 0.62 : 0.52);
    };

    let t = 0;
    const draw = (dt: number) => {
      t += dt;
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;

      c.clearRect(0, 0, w, h);

      const baseTilt = 1.12 + pointer.y * 0.18;
      const yaw = pointer.x * 0.35 + t * 0.02;
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);

      for (const p of pts) {
        p.a += p.speed * dt;
        const ox = Math.cos(p.a) * p.r;
        const oz = Math.sin(p.a) * p.r;
        const oy = p.lift + Math.sin(p.a * 2 + p.r * 6) * 0.025;
        const rx = ox * cosY - oz * sinY;
        const rz = ox * sinY + oz * cosY;
        const tl = baseTilt + p.tilt;
        const y2 = oy * Math.cos(tl) - rz * Math.sin(tl);
        const z2 = oy * Math.sin(tl) + rz * Math.cos(tl);
        const persp = 1 / (1.9 - z2 * 0.6);
        p.x = cx + rx * scale * persp * 1.6;
        p.y = cy + y2 * scale * persp * 1.6;
        p.z = z2;

        const dx = p.x - pointer.px;
        const dy = p.y - pointer.py;
        const d2 = dx * dx + dy * dy;
        const near = pointer.active ? Math.max(0, 1 - d2 / (170 * 170)) : 0;
        p.glow += (near - p.glow) * 0.08;
        if (near > 0) {
          const push = near * 18;
          const d = Math.sqrt(d2) || 1;
          p.x += (dx / d) * push;
          p.y += (dy / d) * push;
        }
      }

      c.lineWidth = 0.6;
      const ld2 = linkDist * linkDist;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > ld2) continue;
          const k = 1 - d2 / ld2;
          const depth = 0.5 + (a.z + b.z) * 0.25;
          const g = Math.max(a.glow, b.glow);
          const alpha = k * 0.16 * depth + g * k * 0.35;
          c.strokeStyle = `rgba(${g > 0.15 ? BRASS : IVORY},${alpha.toFixed(3)})`;
          c.beginPath();
          c.moveTo(a.x, a.y);
          c.lineTo(b.x, b.y);
          c.stroke();
        }
      }

      for (const p of pts) {
        const depth = Math.min(1, Math.max(0.15, 0.55 + p.z * 0.6));
        const s = p.size * (0.6 + depth * 0.8) + p.glow * 1.6;
        c.fillStyle =
          p.glow > 0.1 ? `rgba(${BRASS},${(0.5 + p.glow * 0.5).toFixed(3)})` : `rgba(${IVORY},${(depth * 0.75).toFixed(3)})`;
        c.beginPath();
        c.arc(p.x, p.y, s, 0, Math.PI * 2);
        c.fill();
      }

      const ringR = scale * 0.2;
      c.strokeStyle = `rgba(${BRASS},0.55)`;
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(cx, cy, ringR, ringR * (0.36 + pointer.y * 0.05), pointer.x * 0.12, 0, Math.PI * 2);
      c.stroke();
    };

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let running = false;
    let visible = true;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const elapsed = now - last;
      last = now;
      if (frameMs) {
        acc += elapsed;
        if (acc < frameMs) return;
        draw(Math.min(acc, 100) / 1000);
        acc = 0;
      } else {
        draw(Math.min(elapsed, 100) / 1000);
      }
    };

    const start = () => {
      if (running || reduce.matches || !visible || document.hidden) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const still = () => {
      for (let i = 0; i < 4; i++) draw(0);
    };

    resize();
    t = 6;
    still();
    canvas.classList.add("is-ready");
    start();

    const onResize = () => {
      resize();
      if (!running) still();
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      const rect = canvas.getBoundingClientRect();
      pointer.px = e.clientX - rect.left;
      pointer.py = e.clientY - rect.top;
      pointer.tx = (pointer.px / rect.width - 0.5) * 2;
      pointer.ty = (pointer.py / rect.height - 0.5) * 2;
      pointer.active = pointer.py >= 0 && pointer.py <= rect.height;
    };
    const onLeave = () => {
      pointer.active = false;
      pointer.tx = 0;
      pointer.ty = 0;
    };
    const onVis = () => (document.hidden ? stop() : start());
    const onReduce = () => (reduce.matches ? (stop(), still()) : start());

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVis);
    reduce.addEventListener("change", onReduce);

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
      reduce.removeEventListener("change", onReduce);
    };
  }, []);

  return <canvas ref={ref} className="hero-field" aria-hidden="true" />;
}
