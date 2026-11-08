"use client";

import { useEffect, useRef } from "react";

/*
 * Section-scoped pointer effects. Each instance listens only on its own element, runs a
 * requestAnimationFrame loop only while something is still easing, reads layout only when its
 * cached rects are invalidated (scroll/resize), and writes transform/opacity only.
 * Disabled on coarse pointers and under prefers-reduced-motion (graphics stay static).
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

  return (
    <Tag ref={ref as React.Ref<never>} className={className} data-fx={mode} {...rest}>
      {children}
    </Tag>
  );
}
