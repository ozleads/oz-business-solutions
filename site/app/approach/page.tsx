import type { Metadata } from "next";
import { Watermark } from "@/components/Art";
import { ContactBand, PageIntro } from "@/components/Sections";
import { steps } from "@/lib/content";

export const metadata: Metadata = {
  title: "Approach",
  description:
    "Audit, plan, build, run: the four-step system OZ Business Solutions uses to find what is holding growth back, fix it in order, and keep it running.",
};

const principles = [
  {
    title: "One point of contact",
    body: "A project manager coordinates every specialist, so you never brief the same thing twice.",
  },
  {
    title: "A partner in the room",
    body: "Each monthly review is led by the partner who owns your outcome — not handed down to a junior.",
  },
  {
    title: "You own the accounts",
    body: "Ad accounts, domains, CRM and software are set up in your name. If we part ways, everything stays.",
  },
  {
    title: "Plain-language reporting",
    body: "A short monthly report: what we did, what it produced, and what we’ll change next.",
  },
];

export default function ApproachPage() {
  return (
    <>
      <PageIntro
        eyebrow="Approach"
        title={
          <>
            A system, <em>not</em> a scattering of tactics.
          </>
        }
        lede="Every engagement moves through the same four steps. The order is the point: we don’t build before we understand, and we don’t stop once it’s built."
        art={<Watermark className="page-intro__wm" />}
      />
      <section className="section section--tight">
        <div className="container">
          <ol className="approach approach--path">
            {steps.map((s) => (
              <li key={s.name} className="approach__step" data-reveal>
                <div className="approach__index">
                  <span className="approach__num">{s.index}</span>
                  <h2 className="display-l approach__name">{s.name}</h2>
                </div>
                <div className="approach__body">
                  <p className="approach__line">{s.line}</p>
                  <p>{s.detail}</p>
                  <h3 className="eyebrow">You receive</h3>
                  <ul className="ticks">
                    {s.outputs.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section className="section section--crosses section--glow" aria-labelledby="principles-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow" data-reveal>
              Working with us
            </p>
            <h2 id="principles-title" className="display-m" data-reveal>
              What stays the same, whatever the package.
            </h2>
          </div>
          <div className="principles">
            {principles.map((p) => (
              <div key={p.title} className="principle" data-reveal>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <ContactBand title="Step one is a conversation." />
    </>
  );
}
