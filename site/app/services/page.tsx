import type { Metadata } from "next";
import { OrbitLayers, ServiceArt } from "@/components/Art";
import { ContactBand, ContactLine, PageIntro } from "@/components/Sections";
import { services } from "@/lib/content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Growth strategy, sales, marketing, customer service and operations — what each OZ Business Solutions service includes and who to contact.",
};

export default function ServicesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Services"
        title={
          <>
            Everything between <em>interest</em> and a loyal customer.
          </>
        }
        lede="Five services, delivered by four departments. Use one, or let us run them together so nothing falls between agencies."
        art={<OrbitLayers />}
      />
      <nav className="container jump" aria-label="Jump to a service">
        <ul>
          {services.map((s) => (
            <li key={s.slug}>
              <a href={`#${s.slug}`}>
                <span>{s.index}</span> {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {services.map((s) => (
        <section key={s.slug} id={s.slug} className="service-detail" aria-labelledby={`${s.slug}-title`}>
          <div className="container service-detail__grid">
            <div className="service-detail__head" data-reveal>
              <p className="service-detail__num">{s.index}</p>
              <h2 id={`${s.slug}-title`} className="display-m">
                {s.title}
              </h2>
              <p className="service-detail__short">{s.short}</p>
              <div className="service-detail__art" aria-hidden="true">
                <ServiceArt slug={s.slug} />
              </div>
            </div>
            <div className="service-detail__body" data-reveal>
              <p className="service-detail__summary">{s.summary}</p>
              <h3 className="eyebrow">What it includes</h3>
              <ul className="ticks ticks--cols">
                {s.includes.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
              <ContactLine departmentId={s.department} topic={`${s.title} enquiry`} />
            </div>
          </div>
        </section>
      ))}
      <ContactBand title="Not sure which service you need? Start with an audit." />
    </>
  );
}
