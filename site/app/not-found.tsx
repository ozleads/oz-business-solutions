import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page-intro page-intro--tall">
      <div className="container">
        <p className="eyebrow">404</p>
        <h1 className="display-xl">This page isn’t here.</h1>
        <p className="lede">It may have moved, or never existed.</p>
        <Link href="/" className="btn">
          Back to home
        </Link>
      </div>
    </section>
  );
}
