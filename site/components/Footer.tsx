import Link from "next/link";
import { Monogram, Wordmark } from "./Brand";
import { nav } from "@/lib/nav";
import {
  bookCallHref,
  contactNote,
  departments,
  mailHref,
  meetings,
  messaging,
  smsHref,
  socials,
  telHref,
  whatsappHref,
} from "@/lib/contact";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <Monogram size={56} className="brass" />
            <Wordmark className="wordmark--lg" />
            <p className="site-footer__tag">Marketing, sales and customer service under one roof.</p>
            <a href={bookCallHref} className="btn">
              Book a call
            </a>
          </div>
          <nav aria-label="Footer" className="site-footer__nav">
            <p className="eyebrow">Site</p>
            <ul>
              {nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="site-footer__contacts" aria-label="Direct lines">
          {departments.map((d) => (
            <div key={d.id} className="footer-contact">
              <p className="footer-contact__label">{d.label}</p>
              <a href={telHref(d.phone)}>{d.phone}</a>
              <a href={mailHref(d.email)}>{d.email}</a>
            </div>
          ))}
          <div className="footer-contact">
            <p className="footer-contact__label">{messaging.label}</p>
            <a href={whatsappHref}>WhatsApp {messaging.display}</a>
            <a href={smsHref}>SMS {messaging.display}</a>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>{meetings}</p>
          <ul className="socials" aria-label="Social">
            {socials.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noopener noreferrer">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="fineprint">{contactNote}</p>
          <p className="fineprint">© {new Date().getFullYear()} OZ Business Solutions</p>
        </div>
      </div>
    </footer>
  );
}
