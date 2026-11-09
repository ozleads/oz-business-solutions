import Link from "next/link";
import { Monogram, Wordmark } from "./Brand";
import { nav } from "@/lib/nav";
import { bookCallHref, meetings } from "@/lib/contact";

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

        <div className="site-footer__bottom">
          <p>{meetings}</p>
          <p className="fineprint">© {new Date().getFullYear()} OZ Business Solutions</p>
        </div>
      </div>
    </footer>
  );
}
