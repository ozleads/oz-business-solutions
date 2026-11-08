"use client";

import { useRef, useState } from "react";
import { services } from "@/lib/content";
import { dept, mailHref } from "@/lib/contact";

type Fields = { name: string; email: string; company: string; need: string; message: string };
type Errors = Partial<Record<keyof Fields, string>>;

const empty: Fields = { name: "", email: "", company: "", need: "", message: "" };

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = "Please tell us your name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "Please enter a valid email address.";
  if (!f.need) e.need = "Choose the closest match — we’ll route it.";
  if (f.message.trim().length < 10) e.message = "A sentence or two helps us prepare (10+ characters).";
  return e;
}

export default function ContactForm() {
  const [fields, setFields] = useState<Fields>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const general = dept("general");

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFields((f) => ({ ...f, [k]: value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(fields);
    setErrors(found);
    const firstBad = Object.keys(found)[0];
    if (firstBad) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstBad}"]`)?.focus();
      return;
    }
    setSubmitting(true);
    // No backend yet: connect a form service or API route here when the inboxes go live.
    window.setTimeout(() => {
      setSubmitting(false);
      setSent(true);
      requestAnimationFrame(() => successRef.current?.focus());
    }, 600);
  };

  if (sent) {
    return (
      <div className="form-success" role="status" tabIndex={-1} ref={successRef}>
        <p className="eyebrow">Received</p>
        <h3 className="display-s">Thank you, {fields.name.trim().split(" ")[0]}.</h3>
        <p>
          Your note about <strong>{fields.need}</strong> is in. A partner will reply to{" "}
          <strong>{fields.email}</strong>.
        </p>
        <p className="fineprint">
          The form is not yet connected to a live inbox. Until it is, you can also write to{" "}
          <a href={mailHref(general.email)}>{general.email}</a>.
        </p>
        <button
          type="button"
          className="btn btn--ghost btn--small"
          onClick={() => {
            setFields(empty);
            setSent(false);
          }}
        >
          Send another
        </button>
      </div>
    );
  }

  const field = (k: keyof Fields) => ({
    id: `f-${k}`,
    name: k,
    value: fields[k],
    onChange: set(k),
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `f-${k}-err` : undefined,
  });

  const err = (k: keyof Fields) =>
    errors[k] ? (
      <p className="field__error" id={`f-${k}-err`}>
        {errors[k]}
      </p>
    ) : null;

  return (
    <form className="form" noValidate onSubmit={onSubmit} ref={formRef} aria-label="Contact form">
      <div className="form__row">
        <div className="field">
          <label htmlFor="f-name">Name</label>
          <input type="text" autoComplete="name" required {...field("name")} />
          {err("name")}
        </div>
        <div className="field">
          <label htmlFor="f-email">Email</label>
          <input type="email" autoComplete="email" required {...field("email")} />
          {err("email")}
        </div>
      </div>
      <div className="form__row">
        <div className="field">
          <label htmlFor="f-company">
            Company <span className="field__opt">optional</span>
          </label>
          <input type="text" autoComplete="organization" {...field("company")} />
        </div>
        <div className="field">
          <label htmlFor="f-need">What you need</label>
          <select required {...field("need")}>
            <option value="" disabled>
              Choose one
            </option>
            {services.map((s) => (
              <option key={s.slug} value={s.title}>
                {s.title}
              </option>
            ))}
            <option value="A package (Launch, Grow or Scale)">A package (Launch, Grow or Scale)</option>
            <option value="Not sure yet">Not sure yet</option>
          </select>
          {err("need")}
        </div>
      </div>
      <div className="field">
        <label htmlFor="f-message">Message</label>
        <textarea rows={5} required {...field("message")} />
        {err("message")}
      </div>
      <div className="form__foot">
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? "Sending…" : "Send message"}
        </button>
        <p className="fineprint">We only use these details to reply to you.</p>
      </div>
    </form>
  );
}
