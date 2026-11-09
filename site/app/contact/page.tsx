import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import PointerFx from "@/components/PointerFx";
import { Corners, DeptIcon, ServiceArt, Topography } from "@/components/Art";
import { PageIntro } from "@/components/Sections";
import {
  bookCallHref,
  contactNote,
  departments,
  mailHref,
  meetings,
  phones,
  telHref,
} from "@/lib/contact";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Call the United States or Canada line, email a department, or book a call with OZ Business Solutions.",
};

export default function ContactPage() {
  return (
    <>
      <PageIntro
        eyebrow="Contact"
        title={
          <>
            Let’s talk about your <em>next</em> ninety days.
          </>
        }
        lede="Call the United States or Canada line, write to a department, or use the form. Every enquiry is read by a person."
        art={<span className="intro-crosses" />}
      />

      <section className="section section--tight" aria-labelledby="lines-title">
        <div className="container">
          <div className="contact-top" data-reveal>
            <h2 id="lines-title" className="eyebrow">
              Direct lines
            </h2>
            <a href={bookCallHref} className="btn">
              Book a call
            </a>
          </div>
          <ul className="dept-cards">
            {phones.map((p) => (
              <li key={p.id} className="dept-card" data-reveal>
                <h3 className="dept-card__label">{p.label}</h3>
                <a className="dept-card__phone" href={telHref(p.tel)}>
                  <span className="sr-only">Call {p.label}: </span>
                  {p.display}
                </a>
              </li>
            ))}
            {departments.map((d) => (
              <li key={d.id} className="dept-card" data-reveal>
                <DeptIcon name={d.id} size={44} className="dept-card__icon" />
                <h3 className="dept-card__label">{d.label}</h3>
                <p className="dept-card__purpose">{d.purpose}</p>
                <a className="dept-card__mail" href={mailHref(d.email)}>
                  <span className="sr-only">Email {d.label}: </span>
                  {d.email}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--rule" aria-labelledby="form-title">
        <div className="container contact-form-grid">
          <div>
            <p className="eyebrow" data-reveal>
              Write to us
            </p>
            <h2 id="form-title" className="display-m" data-reveal>
              Tell us a little. We’ll come prepared.
            </h2>
            <div className="contact-aside" data-reveal>
              <p>{meetings}</p>
              <p className="fineprint">{contactNote}</p>
            </div>
            <PointerFx mode="spotlight" className="contact-panel" aria-hidden="true">
              <Topography className="contact-panel__topo" rings={9} />
              <span className="contact-panel__spot" data-spot>
                <span className="contact-panel__grid" />
              </span>
              <ServiceArt slug="customer-service" className="contact-panel__art" />
              <Corners />
            </PointerFx>
          </div>
          <div data-reveal>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
