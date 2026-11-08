/**
 * Single source of truth for every phone number, inbox and social link on the site.
 * All values below are placeholders: 555-014-xxxx numbers are reserved for fiction
 * and the inboxes are not live yet. Replace them here and every page updates.
 */

export type Department = {
  id: string;
  label: string;
  purpose: string;
  phone: string;
  email: string;
};

export const contactNote = "Numbers and inboxes shown here are placeholders and will be updated.";

export const meetings = "Meetings by appointment — by video call or at your place of business.";

export const departments: Department[] = [
  {
    id: "general",
    label: "General",
    purpose: "Not sure where to start? We’ll route you to the right partner.",
    phone: "(555) 014-2000",
    email: "hello@ozbusinesssolutions.com",
  },
  {
    id: "sales",
    label: "Sales",
    purpose: "New projects, packages, quotes and booking a first call.",
    phone: "(555) 014-2001",
    email: "sales@ozbusinesssolutions.com",
  },
  {
    id: "success",
    label: "Client success",
    purpose: "Existing clients: your engagement, roadmap and reporting.",
    phone: "(555) 014-2002",
    email: "success@ozbusinesssolutions.com",
  },
  {
    id: "support",
    label: "Support",
    purpose: "Something broken or urgent on a system we run for you.",
    phone: "(555) 014-2003",
    email: "support@ozbusinesssolutions.com",
  },
  {
    id: "marketing",
    label: "Marketing",
    purpose: "Brand, websites, SEO, ads, content and reviews.",
    phone: "(555) 014-2004",
    email: "marketing@ozbusinesssolutions.com",
  },
  {
    id: "operations",
    label: "Operations",
    purpose: "SOPs, automation, software setup and dashboards.",
    phone: "(555) 014-2005",
    email: "ops@ozbusinesssolutions.com",
  },
];

export const messaging = {
  label: "WhatsApp & SMS",
  display: "+1 (555) 014-2006",
  e164: "+15550142006",
};

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

/** "(555) 014-2000" -> "tel:+15550142000" (assumes North American numbers). */
export function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `tel:+${digits.length === 10 ? "1" + digits : digits}`;
}

export function mailHref(email: string, subject?: string): string {
  return `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`;
}

export const whatsappHref = `https://wa.me/${messaging.e164.replace("+", "")}`;
export const smsHref = `sms:${messaging.e164}`;

export const bookCallHref = mailHref(dept("sales").email, "Book a call with OZ Business Solutions");
