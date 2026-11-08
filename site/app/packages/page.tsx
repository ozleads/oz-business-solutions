import type { Metadata } from "next";
import { Corners, PackageArt, Topography } from "@/components/Art";
import { ContactBand, ContactLine, PageIntro } from "@/components/Sections";
import { packages, packagesNote } from "@/lib/content";

export const metadata: Metadata = {
  title: "Packages",
  description:
    "Launch, Grow and Scale — starting-point price ranges for OZ Business Solutions engagements, from a one-time audit and setup to a full monthly growth system.",
};

const rows: { label: string; launch: boolean; grow: boolean; scale: boolean }[] = [
  { label: "Business audit", launch: true, grow: false, scale: false },
  { label: "90-day roadmap", launch: true, grow: true, scale: true },
  { label: "Core setup — CRM, profiles, tracking", launch: true, grow: true, scale: true },
  { label: "Marketing management", launch: false, grow: true, scale: true },
  { label: "Content", launch: false, grow: true, scale: true },
  { label: "Paid ads management", launch: false, grow: true, scale: true },
  { label: "CRM upkeep", launch: false, grow: true, scale: true },
  { label: "Monthly reporting", launch: false, grow: true, scale: true },
  { label: "Sales system and scripts", launch: false, grow: false, scale: true },
  { label: "AI receptionist", launch: false, grow: false, scale: true },
  { label: "Outsourced customer support", launch: false, grow: false, scale: true },
];

function Cell({ on }: { on: boolean }) {
  return on ? (
    <td className="cmp__yes">
      <span aria-hidden="true">●</span>
      <span className="sr-only">Included</span>
    </td>
  ) : (
    <td className="cmp__no">
      <span aria-hidden="true">—</span>
      <span className="sr-only">Not included</span>
    </td>
  );
}

export default function PackagesPage() {
  return (
    <>
      <PageIntro
        eyebrow="Packages"
        title={
          <>
            Start where you are. <em>Grow</em> from there.
          </>
        }
        lede={packagesNote}
        art={<Topography />}
      />
      <section className="section section--tight">
        <div className="container">
          <div className="package-grid package-grid--large">
            {packages.map((p) => (
              <article key={p.name} className={`package ${p.featured ? "package--featured" : ""}`} data-reveal>
                {p.featured ? <Corners /> : null}
                <PackageArt name={p.name} />
                <header>
                  <p className="package__cadence">{p.cadence}</p>
                  <h2 className="package__name">{p.name}</h2>
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
            ))}
          </div>
        </div>
      </section>

      <section className="section section--rule" aria-labelledby="cmp-title">
        <div className="container">
          <div className="section-head">
            <p className="eyebrow" data-reveal>
              Side by side
            </p>
            <h2 id="cmp-title" className="display-m" data-reveal>
              What each package covers
            </h2>
          </div>
          <div className="cmp-wrap" data-reveal>
            <table className="cmp">
              <caption className="sr-only">Package comparison</caption>
              <thead>
                <tr>
                  <th scope="col">Included</th>
                  <th scope="col">Launch</th>
                  <th scope="col">Grow</th>
                  <th scope="col">Scale</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label}>
                    <th scope="row">{r.label}</th>
                    <Cell on={r.launch} />
                    <Cell on={r.grow} />
                    <Cell on={r.scale} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="notes-grid">
            <div data-reveal>
              <h3 className="eyebrow">How pricing works</h3>
              <p>
                We confirm a fixed monthly fee after the first call, based on how many channels, locations and
                systems are involved. Ad spend and third-party software are paid directly by you, so you keep
                ownership of every account.
              </p>
            </div>
            <div data-reveal>
              <h3 className="eyebrow">Moving between packages</h3>
              <p>
                Most clients begin with Launch, then move to Grow once the foundation is in place. Scale adds the
                sales and support seats when volume justifies them. You can step up or down at a monthly review.
              </p>
            </div>
          </div>
          <ContactLine departmentId="sales" topic="Package enquiry" />
        </div>
      </section>
      <ContactBand title="Get a scoped price after one call." />
    </>
  );
}
