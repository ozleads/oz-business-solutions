import type { Metadata } from "next";
import { Monogram } from "@/components/Brand";
import { Corners, DeptIcon, NetworkArt, Watermark } from "@/components/Art";
import { ContactBand, PageIntro } from "@/components/Sections";
import { orgDepartments, partners } from "@/lib/content";

export const metadata: Metadata = {
  title: "Company",
  description:
    "How OZ Business Solutions is built: four partners, four departments — Marketing, Sales, Customer Experience and Operations — and a network of specialists.",
};

export default function CompanyPage() {
  return (
    <>
      <PageIntro
        eyebrow="Company"
        title={
          <>
            Built like a firm. <em>Run</em> like a partnership.
          </>
        }
        lede="OZ Business Solutions is led by four partners, each accountable for one part of how a business grows. Underneath them, four departments put the right specialist on each piece of work."
        art={<Watermark className="page-intro__wm" />}
      />

      <section className="section section--tight" aria-labelledby="partners-title">
        <div className="container">
          <h2 id="partners-title" className="eyebrow" data-reveal>
            The partners
          </h2>
          <ul className="partners">
            {partners.map((p) => (
              <li key={p.title} className="partner" data-reveal>
                <Corners />
                <Monogram size={44} className="partner__mark" />
                <h3 className="partner__title">{p.title}</h3>
                <p>{p.remit}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--rule" aria-labelledby="org-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow" data-reveal>
              Departments
            </p>
            <h2 id="org-title" className="display-l" data-reveal>
              Four departments, one brief.
            </h2>
          </div>
          <div className="org">
            {orgDepartments.map((d, i) => (
              <article key={d.name} className="org__dept" data-reveal>
                <header className="org__head">
                  <DeptIcon name={d.name} size={56} className="org__icon" />
                  <span className="org__num">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="display-s">{d.name}</h3>
                  <p className="org__lead">Led by {d.lead}</p>
                  <p className="org__summary">{d.summary}</p>
                </header>
                <dl className="seats">
                  {d.seats.map((s) => (
                    <div key={s.role} className="seat">
                      <dt>{s.role}</dt>
                      <dd>{s.does}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--warm section--glow" aria-labelledby="network-title">
        <div className="container network">
          <div>
            <p className="eyebrow" data-reveal>
              Specialist network
            </p>
            <h2 id="network-title" className="display-m" data-reveal>
              The right hands for each job, coordinated by one team.
            </h2>
            <NetworkArt className="network__art" />
          </div>
          <div className="network__body" data-reveal>
            <p>
              Not every project needs every seat every month. Beyond the core departments, we work with a network
              of independent specialists — for example a photographer for a new location, a translator for a second
              market, or a developer for a particular platform — brought in for a defined piece of work.
            </p>
            <p>
              Each one is briefed and reviewed by the relevant department and works through your project manager.
              You get one contract, one invoice and one point of contact, however many people touch the work.
            </p>
          </div>
        </div>
      </section>

      <ContactBand title="Speak with the partner who fits your question." />
    </>
  );
}
