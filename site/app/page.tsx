import type { Metadata } from "next";
import Link from "next/link";
import HeroField from "@/components/HeroField";
import HeroOrbs from "@/components/HeroOrbs";
import PointerFx from "@/components/PointerFx";
import { Corners, DeptIcon, Divider, PackageArt, ServiceArt } from "@/components/Art";
import { ContactBand } from "@/components/Sections";
import { orgDepartments, packages, packagesNote, promise, services, steps } from "@/lib/content";
import { bookCallHref } from "@/lib/contact";

export const metadata: Metadata = {
  title: { absolute: "OZ Business Solutions — Marketing, sales and customer service under one roof" },
  description:
    "OZ Business Solutions helps growing businesses get more customers and run smoother: growth strategy, sales, marketing, customer service and operations from one team.",
};

export default function Home() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__backdrop" aria-hidden="true" />
        <HeroField />
        <HeroOrbs />
        <div className="hero__content container">
          <p className="eyebrow hero__eyebrow">OZ Business Solutions</p>
          <h1 id="hero-title" className="display-hero">
            <span className="line">
              <span>More customers.</span>
            </span>
            <span className="line">
              <em>Smoother</em> days.
            </span>
          </h1>
          <p className="hero__promise">{promise}</p>
          <div className="hero__actions">
            <a href={bookCallHref} className="btn">
              Book a call
            </a>
            <Link href="/services" className="btn btn--ghost">
              See what we do
            </Link>
          </div>
        </div>
        <div className="hero__scroll" aria-hidden="true">
          <span>Scroll</span>
          <span className="hero__scroll-line" />
        </div>
      </section>

      <section className="section section--crosses" aria-labelledby="services-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow" data-reveal>
              What we do
            </p>
            <h2 id="services-title" className="display-l" data-reveal>
              Five disciplines. <em>One</em> team accountable for the result.
            </h2>
          </div>
          <ol className="service-rows">
            {services.map((s) => (
              <li key={s.slug} data-reveal>
                <Link href={`/services#${s.slug}`} className="service-row">
                  <span className="service-row__num">{s.index}</span>
                  <span className="service-row__title">{s.title}</span>
                  <span className="service-row__short">{s.short}</span>
                  <ServiceArt slug={s.slug} className="service-row__art" />
                  <span className="service-row__arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section--warm section--glow" aria-labelledby="packages-title">
        <div className="container">
          <div className="section-head section-head--split">
            <div>
              <p className="eyebrow" data-reveal>
                Packages
              </p>
              <h2 id="packages-title" className="display-l" data-reveal>
                Three ways to start.
              </h2>
            </div>
            <p className="section-head__aside" data-reveal>
              {packagesNote}
            </p>
          </div>
          <PointerFx mode="tilt" className="package-grid package-grid--tilt">
            {packages.map((p) => (
              <div key={p.name} className="package-cell" data-reveal>
                <article className={`package ${p.featured ? "package--featured" : ""}`} data-tilt>
                  <span className="package__sheen" data-sheen aria-hidden="true" />
                  {p.featured ? <Corners /> : null}
                  <PackageArt name={p.name} />
                  <header>
                    <p className="package__cadence">{p.cadence}</p>
                    <h3 className="package__name">{p.name}</h3>
                    <p className="package__range">
                      <span className="package__from">Starting point</span>
                      {p.range}
                      {p.cadence === "Monthly" ? <span className="package__per"> / month</span> : null}
                    </p>
                    <p className="package__lede">{p.lede}</p>
                  </header>
                  <ul className="ticks">
                    {p.includes.map((i) => (
                      <li key={i}>{i}</li>
                    ))}
                  </ul>
                </article>
              </div>
            ))}
          </PointerFx>
          <p className="section-link" data-reveal>
            <Link href="/packages" className="text-link">
              Compare packages
            </Link>
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="approach-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow" data-reveal>
              How we work
            </p>
            <h2 id="approach-title" className="display-l" data-reveal>
              Audit. Plan. Build. Run.
            </h2>
          </div>
          <div className="steps-path" aria-hidden="true">
            <svg viewBox="0 0 1000 40" preserveAspectRatio="none" fill="none">
              <path d="M0 20 C120 2 210 38 333 20 S546 2 666 20 S880 38 1000 20" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
          <ol className="steps steps--markers">
            {steps.map((s) => (
              <li key={s.name} className="step" data-reveal>
                <span className="step__marker" aria-hidden="true">
                  <span>{s.index}</span>
                </span>
                <span className="step__num">{s.index}</span>
                <h3 className="step__name">{s.name}</h3>
                <p className="step__line">{s.line}</p>
              </li>
            ))}
          </ol>
          <p className="section-link" data-reveal>
            <Link href="/approach" className="text-link">
              Read the approach
            </Link>
          </p>
        </div>
      </section>

      <Divider />

      <section className="section" aria-labelledby="depts-title">
        <div className="container">
          <div className="section-head section-head--split">
            <div>
              <p className="eyebrow" data-reveal>
                The company
              </p>
              <h2 id="depts-title" className="display-l" data-reveal>
                Four partners. Four departments. A specialist in every seat.
              </h2>
            </div>
            <p className="section-head__aside" data-reveal>
              Each department is led by a partner and staffed by the specialist your work calls for — so
              strategy, execution and reporting never sit in different companies.
            </p>
          </div>
          <div className="dept-grid">
            {orgDepartments.map((d, i) => (
              <article key={d.name} className="dept" data-reveal>
                <span className="dept__icon">
                  <DeptIcon name={d.name} size={52} />
                </span>
                <p className="dept__num">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="dept__name">{d.name}</h3>
                <p className="dept__summary">{d.summary}</p>
                <p className="dept__seats">{d.seats.map((s) => s.role).join(" · ")}</p>
              </article>
            ))}
          </div>
          <p className="section-link" data-reveal>
            <Link href="/company" className="text-link">
              Meet the structure
            </Link>
          </p>
        </div>
      </section>

      <ContactBand />
    </>
  );
}
