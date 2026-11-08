"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Monogram, Wordmark } from "./Brand";
import { nav } from "@/lib/nav";
import {
  bookCallHref,
  contactNote,
  dept,
  mailHref,
  messaging,
  smsHref,
  telHref,
  whatsappHref,
} from "@/lib/contact";
import { getLenis } from "./SmoothScroll";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const general = dept("general");

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const lenis = getLenis();
    if (open) {
      root.classList.add("menu-open");
      lenis?.stop();
      const first = panelRef.current?.querySelector<HTMLElement>("a, button");
      first?.focus();
    } else {
      root.classList.remove("menu-open");
      lenis?.start();
    }

    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = [
        toggleRef.current,
        ...Array.from(panelRef.current.querySelectorAll<HTMLElement>("a, button")),
      ].filter(Boolean) as HTMLElement[];
      const firstEl = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className={`site-header ${scrolled ? "is-scrolled" : ""} ${open ? "is-open" : ""}`}>
        <div className="site-header__inner">
          <Link href="/" className="brand-link" aria-label="OZ Business Solutions — home">
            <Monogram size={34} className="brand-link__mark" />
            <Wordmark />
          </Link>
          <nav className="site-header__actions" aria-label="Quick contact">
            <Link href="/contact" className="header-link">
              Contact
            </Link>
            <a href={bookCallHref} className="btn btn--small btn--ghost header-book">
              Book a call
            </a>
            <button
              ref={toggleRef}
              type="button"
              className="menu-toggle"
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="menu-toggle__label">{open ? "Close" : "Menu"}</span>
              <span className="menu-toggle__icon" aria-hidden="true">
                <span />
                <span />
              </span>
            </button>
          </nav>
        </div>
      </header>

      <div
        id="site-menu"
        ref={panelRef}
        className={`menu ${open ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="menu__inner">
          <nav aria-label="Primary" className="menu__nav">
            <ol>
              {nav.map((item, i) => (
                <li key={item.href} style={{ "--i": i } as React.CSSProperties}>
                  <Link
                    href={item.href}
                    className="menu__link"
                    aria-current={pathname === item.href ? "page" : undefined}
                    onClick={close}
                  >
                    <span className="menu__num">{String(i + 1).padStart(2, "0")}</span>
                    <span className="menu__label">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
          <aside className="menu__aside" aria-label="Contact details">
            <p className="eyebrow">Talk to us</p>
            <a className="menu__big" href={telHref(general.phone)}>
              {general.phone}
            </a>
            <a className="menu__big" href={mailHref(general.email)}>
              {general.email}
            </a>
            <p className="menu__msg">
              {messaging.label}: <a href={whatsappHref}>WhatsApp</a> · <a href={smsHref}>SMS</a>{" "}
              {messaging.display}
            </p>
            <a href={bookCallHref} className="btn" onClick={close}>
              Book a call
            </a>
            <p className="fineprint">{contactNote}</p>
          </aside>
        </div>
      </div>
    </>
  );
}
