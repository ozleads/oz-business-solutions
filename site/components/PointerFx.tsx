"use client";

import { useEffect, useRef } from "react";

/*
 * Section-scoped pointer effects. Each instance listens only on its own element, runs a
 * requestAnimationFrame loop only while something is still easing, reads layout only when its
 * cached rects are invalidated (scroll/resize), and writes transform/opacity only.
 * The fine-pointer loop is unchanged. Coarse pointers use a separate, lighter loop.
 * prefers-reduced-motion leaves both still.
 */

type Mode = "tilt" | "magnetic" | "parallax" | "drift" | "spotlight";

type Pointer = { x: number; y: number; inside: boolean };
type Frame = (p: Pointer, root: DOMRect) => boolean;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const settled = (a: number, b: number) => Math.abs(a - b) < 0.01;

function canAnimate() {
  return (
    !window.matchMedia("(pointer: coarse)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

type Item = { el: HTMLElement; rect: DOMRect; s: number[] };

function makeFrame(mode: Mode, root: HTMLElement, items: () => Item[]): Frame {
  switch (mode) {
    case "tilt":
      // Cards rotate up to ~5° toward the pointer; a brass sheen glides under the cursor.
      return (p) => {
        let moving = false;
        for (const it of items()) {
          const r = it.rect;
          const over = p.inside && p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
          const u = over ? (p.x - r.left) / r.width : 0.5;
          const v = over ? (p.y - r.top) / r.height : 0.5;
          const target = [over ? (0.5 - v) * 6 : 0, over ? (u - 0.5) * 8 : 0, u * r.width, v * r.height, over ? 1 : 0];
          for (let i = 0; i < 5; i++) {
            it.s[i] = lerp(it.s[i], target[i], 0.12);
            if (!settled(it.s[i], target[i])) moving = true;
          }
          it.el.style.transform = `perspective(1000px) rotateX(${it.s[0].toFixed(2)}deg) rotateY(${it.s[1].toFixed(2)}deg)`;
          const sheen = it.el.querySelector<HTMLElement>("[data-sheen]");
          if (sheen) {
            sheen.style.transform = `translate3d(${(it.s[2] - 180).toFixed(1)}px, ${(it.s[3] - 180).toFixed(1)}px, 0)`;
            sheen.style.opacity = (it.s[4] * 0.9).toFixed(3);
          }
        }
        return moving;
      };
    case "magnetic":
      // Icons within 200px lean toward the pointer (max ~10px) and rotate a few degrees.
      return (p) => {
        let moving = false;
        for (const it of items()) {
          const cx = it.rect.left + it.rect.width / 2;
          const cy = it.rect.top + it.rect.height / 2;
          const dx = p.x - cx;
          const dy = p.y - cy;
          const d = Math.hypot(dx, dy);
          const pull = p.inside ? Math.max(0, 1 - d / 200) : 0;
          const target = [dx * 0.09 * pull, dy * 0.09 * pull, dx * 0.04 * pull, 1 + pull * 0.08];
          for (let i = 0; i < 4; i++) {
            it.s[i] = lerp(it.s[i], target[i], 0.14);
            if (!settled(it.s[i], target[i])) moving = true;
          }
          it.el.style.transform = `translate3d(${it.s[0].toFixed(2)}px, ${it.s[1].toFixed(2)}px, 0) rotate(${it.s[2].toFixed(2)}deg) scale(${it.s[3].toFixed(3)})`;
        }
        return moving;
      };
    case "parallax":
      // Line-art layers slide at different depths with the pointer, front layers further.
      return (p, rr) => {
        let moving = false;
        const nx = p.inside ? ((p.x - rr.left) / rr.width - 0.5) * 2 : 0;
        const ny = p.inside ? ((p.y - rr.top) / rr.height - 0.5) * 2 : 0;
        for (const it of items()) {
          const depth = Number(it.el.dataset.depth || 1);
          const target = [nx * depth * 16, ny * depth * 11];
          for (let i = 0; i < 2; i++) {
            it.s[i] = lerp(it.s[i], target[i], 0.06);
            if (!settled(it.s[i], target[i])) moving = true;
          }
          it.el.style.transform = `translate3d(${it.s[0].toFixed(2)}px, ${it.s[1].toFixed(2)}px, 0)`;
        }
        return moving;
      };
    case "drift":
      // The oversized monogram drifts slowly opposite the pointer and turns slightly.
      return (p, rr) => {
        let moving = false;
        const nx = p.inside ? ((p.x - rr.left) / rr.width - 0.5) * 2 : 0;
        const ny = p.inside ? ((p.y - rr.top) / rr.height - 0.5) * 2 : 0;
        for (const it of items()) {
          const target = [-nx * 30, -ny * 18, -nx * 4];
          for (let i = 0; i < 3; i++) {
            it.s[i] = lerp(it.s[i], target[i], 0.035);
            if (!settled(it.s[i], target[i])) moving = true;
          }
          it.el.style.transform = `translate3d(${it.s[0].toFixed(2)}px, ${it.s[1].toFixed(2)}px, 0) rotate(${it.s[2].toFixed(2)}deg)`;
        }
        return moving;
      };
    case "spotlight":
      // A circular window follows the pointer; its inner grid is counter-shifted so the grid
      // stays fixed and only the lit area moves.
      return (p, rr) => {
        let moving = false;
        for (const it of items()) {
          const size = it.rect.width;
          const tx = p.inside ? p.x - rr.left - size / 2 : it.s[0];
          const ty = p.inside ? p.y - rr.top - size / 2 : it.s[1];
          const target = [tx, ty, p.inside ? 1 : 0];
          for (let i = 0; i < 3; i++) {
            it.s[i] = lerp(it.s[i], target[i], i === 2 ? 0.08 : 0.16);
            if (!settled(it.s[i], target[i])) moving = true;
          }
          it.el.style.transform = `translate3d(${it.s[0].toFixed(1)}px, ${it.s[1].toFixed(1)}px, 0)`;
          it.el.style.opacity = it.s[2].toFixed(3);
          const inner = it.el.firstElementChild as HTMLElement | null;
          if (inner) inner.style.transform = `translate3d(${(-it.s[0]).toFixed(1)}px, ${(-it.s[1]).toFixed(1)}px, 0)`;
        }
        return moving;
      };
  }
}

const selectorFor: Record<Mode, string> = {
  tilt: "[data-tilt]",
  magnetic: "[data-magnet]",
  parallax: "[data-depth]",
  drift: "[data-drift]",
  spotlight: "[data-spot]",
};

function bindCoarse(mode: Mode, root: HTMLElement) {
  if (mode === "tilt") return bindCoarseTilt(root);
  if (mode === "spotlight") return bindCoarseSpotlight(root);
  if (mode === "parallax") return bindCoarseParallax(root);
  return;
}

/** A light press and tilt while a finger is down, then ease back. */
function bindCoarseTilt(root: HTMLElement) {
  const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-tilt]"));
  const state = cards.map(() => ({ rx: 0, ry: 0, sc: 1, op: 0, trx: 0, try: 0, tsc: 1, top: 0 }));
  let raf = 0;
  let visible = false;

  const tick = () => {
    raf = 0;
    let moving = false;
    cards.forEach((el, i) => {
      const s = state[i];
      s.rx = lerp(s.rx, s.trx, 0.18);
      s.ry = lerp(s.ry, s.try, 0.18);
      s.sc = lerp(s.sc, s.tsc, 0.2);
      s.op = lerp(s.op, s.top, 0.18);
      if (!settled(s.rx, s.trx) || !settled(s.ry, s.try) || !settled(s.sc, s.tsc) || !settled(s.op, s.top)) {
        moving = true;
      }
      el.style.transform = `perspective(1000px) rotateX(${s.rx.toFixed(2)}deg) rotateY(${s.ry.toFixed(2)}deg) scale(${s.sc.toFixed(3)})`;
      const sheen = el.querySelector<HTMLElement>("[data-sheen]");
      if (sheen) sheen.style.opacity = (s.op * 0.5).toFixed(3);
    });
    if (moving && visible && !document.hidden) raf = requestAnimationFrame(tick);
  };
  const kick = () => {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick);
  };
  const release = () => {
    for (const s of state) {
      s.trx = 0;
      s.try = 0;
      s.tsc = 1;
      s.top = 0;
    }
    kick();
  };
  const onDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse") return;
    const card = (e.target as Element | null)?.closest?.("[data-tilt]") as HTMLElement | null;
    if (!card || !root.contains(card)) return;
    const i = cards.indexOf(card);
    if (i < 0) return;
    const r = card.getBoundingClientRect();
    const u = (e.clientX - r.left) / r.width;
    const v = (e.clientY - r.top) / r.height;
    state[i].trx = (0.5 - v) * 2.4;
    state[i].try = (u - 0.5) * 3.2;
    state[i].tsc = 0.985;
    state[i].top = 1;
    kick();
  };
  const onUp = (e: PointerEvent) => {
    if (e.pointerType === "mouse") return;
    release();
  };
  const onVis = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
  io.observe(root);
  root.addEventListener("pointerdown", onDown, { passive: true });
  root.addEventListener("pointerup", onUp, { passive: true });
  root.addEventListener("pointercancel", onUp, { passive: true });
  document.addEventListener("visibilitychange", onVis);
  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    root.removeEventListener("pointerdown", onDown);
    root.removeEventListener("pointerup", onUp);
    root.removeEventListener("pointercancel", onUp);
    document.removeEventListener("visibilitychange", onVis);
    for (const el of cards) {
      el.style.transform = "";
      const sheen = el.querySelector<HTMLElement>("[data-sheen]");
      if (sheen) sheen.style.opacity = "";
    }
  };
}

/** The contact spotlight follows a finger and fades when the finger lifts. */
function bindCoarseSpotlight(root: HTMLElement) {
  const spots = Array.from(root.querySelectorAll<HTMLElement>("[data-spot]"));
  const state = spots.map(() => ({ x: 0, y: 0, o: 0, tx: 0, ty: 0, to: 0 }));
  let raf = 0;
  let visible = false;
  let touching = false;

  const tick = () => {
    raf = 0;
    let moving = false;
    spots.forEach((el, i) => {
      const s = state[i];
      s.x = lerp(s.x, s.tx, 0.2);
      s.y = lerp(s.y, s.ty, 0.2);
      s.o = lerp(s.o, s.to, 0.12);
      if (!settled(s.x, s.tx) || !settled(s.y, s.ty) || !settled(s.o, s.to)) moving = true;
      el.style.transform = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0)`;
      el.style.opacity = s.o.toFixed(3);
      const inner = el.firstElementChild as HTMLElement | null;
      if (inner) inner.style.transform = `translate3d(${(-s.x).toFixed(1)}px, ${(-s.y).toFixed(1)}px, 0)`;
    });
    if ((moving || touching) && visible && !document.hidden) raf = requestAnimationFrame(tick);
  };
  const kick = () => {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick);
  };
  const place = (e: PointerEvent) => {
    const rr = root.getBoundingClientRect();
    spots.forEach((el, i) => {
      const size = el.getBoundingClientRect().width;
      state[i].tx = e.clientX - rr.left - size / 2;
      state[i].ty = e.clientY - rr.top - size / 2;
      state[i].to = 1;
    });
    touching = true;
    kick();
  };
  const onDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse") return;
    place(e);
  };
  const onMove = (e: PointerEvent) => {
    if (!touching || e.pointerType === "mouse") return;
    place(e);
  };
  const onUp = (e: PointerEvent) => {
    if (e.pointerType === "mouse") return;
    touching = false;
    for (const s of state) s.to = 0;
    kick();
  };
  const onVis = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else kick();
  };
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
  io.observe(root);
  root.addEventListener("pointerdown", onDown, { passive: true });
  root.addEventListener("pointermove", onMove, { passive: true });
  root.addEventListener("pointerup", onUp, { passive: true });
  root.addEventListener("pointercancel", onUp, { passive: true });
  document.addEventListener("visibilitychange", onVis);
  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    root.removeEventListener("pointerdown", onDown);
    root.removeEventListener("pointermove", onMove);
    root.removeEventListener("pointerup", onUp);
    root.removeEventListener("pointercancel", onUp);
    document.removeEventListener("visibilitychange", onVis);
    for (const el of spots) {
      el.style.transform = "";
      el.style.opacity = "";
    }
  };
}

/** Line-art layers shift a few pixels with scroll position. */
function bindCoarseParallax(root: HTMLElement) {
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
      if (!settled(s.y, s.ty)) moving = true;
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
}

export default function PointerFx({
  mode,
  as: Tag = "div",
  className,
  children,
  ...rest
}: {
  mode: Mode;
  as?: "div" | "section" | "ul";
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || !canAnimate()) return;

    let items: Item[] = [];
    let rootRect = root.getBoundingClientRect();
    let dirty = true;
    const measure = () => {
      rootRect = root.getBoundingClientRect();
      const els = Array.from(root.querySelectorAll<HTMLElement>(selectorFor[mode]));
      items = els.map((el, i) => ({
        el,
        rect: el.getBoundingClientRect(),
        s: items[i]?.s ?? (mode === "magnetic" ? [0, 0, 0, 1] : [0, 0, 0, 0, 0]),
      }));
      dirty = false;
    };

    const pointer: Pointer = { x: 0, y: 0, inside: false };
    const frame = makeFrame(mode, root, () => items);
    let raf = 0;
    let visible = false;

    const tick = () => {
      raf = 0;
      if (frame(pointer, rootRect) && visible && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const kick = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      if (dirty) measure();
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.inside = true;
      kick();
    };
    const onLeave = () => {
      pointer.inside = false;
      kick();
    };
    const invalidate = () => {
      dirty = true;
    };
    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else kick();
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) {
        cancelAnimationFrame(raf);
        raf = 0;
        pointer.inside = false;
      } else {
        dirty = true;
      }
    });
    io.observe(root);

    root.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave, { passive: true });
    window.addEventListener("scroll", invalidate, { passive: true });
    window.addEventListener("resize", invalidate, { passive: true });
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", invalidate);
      window.removeEventListener("resize", invalidate);
      document.removeEventListener("visibilitychange", onVis);
      for (const it of items) {
        it.el.style.transform = "";
        it.el.style.opacity = "";
      }
    };
  }, [mode]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    return bindCoarse(mode, root);
  }, [mode]);

  return (
    <Tag ref={ref as React.Ref<never>} className={className} data-fx={mode} {...rest}>
      {children}
    </Tag>
  );
}
