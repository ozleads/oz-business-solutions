import Link from "next/link";
import { Topography, Watermark } from "./Art";
import PointerFx from "./PointerFx";
import { bookCallHref, dept, mailHref, phones, telHref } from "@/lib/contact";

export function PageIntro({
  eyebrow,
  title,
  lede,
  art,
  parallax = false,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: string;
  art?: React.ReactNode;
  parallax?: boolean;
}) {
  const Wrap = ({ children }: { children: React.ReactNode }) =>
    parallax ? (
      <PointerFx mode="parallax" as="section" className="page-intro page-intro--art">
        {children}
      </PointerFx>
    ) : (
      <section className={`page-intro ${art ? "page-intro--art" : ""}`}>{children}</section>
    );
  return (
    <Wrap>
      {art ? (
        <div className="page-intro__art" aria-hidden="true">
          {art}
        </div>
      ) : null}
      <div className="container">
        <p className="eyebrow" data-reveal>
          {eyebrow}
        </p>
        <h1 className="display-xl" data-reveal>
          {title}
        </h1>
        {lede ? (
          <p className="lede" data-reveal>
            {lede}
          </p>
        ) : null}
      </div>
    </Wrap>
  );
}

export function ContactLine({ departmentId, topic }: { departmentId: string; topic: string }) {
  const d = dept(departmentId);
  return (
    <p className="contact-line">
      <span className="contact-line__label">Talk to {d.label}</span>
      <a href={mailHref(d.email, topic)}>{d.email}</a>
    </p>
  );
}

export function ContactBand({ title = "Tell us where you want to be in ninety days." }: { title?: string }) {
  const general = dept("general");
  return (
    <section className="contact-band" aria-labelledby="band-title">
      <div className="contact-band__decor" aria-hidden="true">
        <Topography className="contact-band__topo" rings={10} />
        <span className="contact-band__wm">
          <Watermark />
        </span>
      </div>
      <div className="container">
        <div className="contact-band__grid">
          <div>
            <p className="eyebrow" data-reveal>
              Start a conversation
            </p>
            <h2 id="band-title" className="display-l" data-reveal>
              {title}
            </h2>
            <div className="contact-band__actions" data-reveal>
              <a href={bookCallHref} className="btn">
                Book a call
              </a>
              <Link href="/contact" className="btn btn--ghost">
                All contact options
              </Link>
            </div>
          </div>
          <div className="contact-band__lines" data-reveal>
            {phones.map((p) => (
              <a className="contact-band__big" href={telHref(p.tel)} key={p.id}>
                {p.label} {p.display}
              </a>
            ))}
            <a className="contact-band__big contact-band__big--mail" href={mailHref(general.email)}>
              {general.email}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
