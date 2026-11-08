/**
 * Single source of truth for every phone number, inbox and social link on the site.
 * Phone numbers are the live lines. Email addresses are still placeholders.
 */

export type Department = {
  id: string;
  label: string;
  purpose: string;
  email: string;
};

export type PhoneLine = {
  id: string;
  label: string;
  display: string;
  tel: string;
};

export const contactNote = "Phone numbers are the live lines. Email addresses are still placeholders.";

export const meetings = "Meetings by appointment — by video call or at your place of business.";

export const phones: PhoneLine[] = [
  { id: "us", label: "United States", display: "(205) 308-9904", tel: "+12053089904" },
  { id: "ca", label: "Canada", display: "(647) 713-7349", tel: "+16477137349" },
];

export const departments: Department[] = [
  {
    id: "general",
    label: "General",
    purpose: "Not sure where to start? We’ll route you to the right partner.",
    email: "hello@ozbusinesssolutions.com",
  },
  {
    id: "sales",
    label: "Sales",
    purpose: "New projects, packages, quotes and booking a first call.",
    email: "sales@ozbusinesssolutions.com",
  },
  {
    id: "success",
    label: "Client success",
    purpose: "Existing clients: your engagement, roadmap and reporting.",
    email: "success@ozbusinesssolutions.com",
  },
  {
    id: "support",
    label: "Support",
    purpose: "Something broken or urgent on a system we run for you.",
    email: "support@ozbusinesssolutions.com",
  },
  {
    id: "marketing",
    label: "Marketing",
    purpose: "Brand, websites, SEO, ads, content and reviews.",
    email: "marketing@ozbusinesssolutions.com",
  },
  {
    id: "operations",
    label: "Operations",
    purpose: "SOPs, automation, software setup and dashboards.",
    email: "ops@ozbusinesssolutions.com",
  },
];

export const socials = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/oz-business-solutions" },
  { label: "Instagram", href: "https://www.instagram.com/ozbusinesssolutions" },
  { label: "X", href: "https://x.com/ozbizsolutions" },
];

export function dept(id: string): Department {
  const d = departments.find((x) => x.id === id);
  if (!d) throw new Error(`Unknown department: ${id}`);
  return d;
}

/** "+12053089904" -> "tel:+12053089904". */
export function telHref(tel: string): string {
  return `tel:${tel}`;
}

export function mailHref(email: string, subject?: string): string {
  return `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
}

export const bookCallHref = mailHref(dept("sales").email, "Book a call with OZ Business Solutions");
