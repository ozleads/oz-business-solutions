"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

let instance: Lenis | null = null;

export function getLenis() {
  return instance;
}

export default function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    if (reduce || coarse) return;

    const lenis = new Lenis({ duration: 1.1, anchors: true, autoRaf: true });
    instance = lenis;
    document.documentElement.classList.add("lenis-on");
    return () => {
      lenis.destroy();
      instance = null;
      document.documentElement.classList.remove("lenis-on");
    };
  }, []);

  useEffect(() => {
    if (window.location.hash) return;
    instance?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return null;
}
