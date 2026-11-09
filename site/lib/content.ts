export const promise =
  "We help growing businesses get more customers and run smoother — marketing, sales, and customer service under one roof.";

export type Service = {
  slug: string;
  index: string;
  title: string;
  short: string;
  summary: string;
  includes: string[];
  department: string;
  departmentLabel: string;
};

export const services: Service[] = [
  {
    slug: "growth",
    index: "01",
    title: "Growth strategy & expansion",
    short: "Know where the next customers come from — professional website building included — and the order to go after them.",
    summary:
      "We look at the whole business before touching a single campaign: where revenue comes from, where it leaks, and which moves are worth making next.",
    includes: [
      "Business and revenue audits",
      "90-day growth roadmaps",
      "Professional website building",
      "Market and competitor research",
      "Expansion planning — new locations, offers, regions",
      "Pricing and offer review",
      "Fractional strategy advisor",
    ],
    department: "sales",
    departmentLabel: "Sales",
  },
  {
    slug: "sales",
    index: "02",
    title: "Sales",
    short: "A repeatable way to turn interest into signed work.",
    summary:
      "We build the process, the words and the pipeline — then train your people to run it, or put fractional reps in the seat while you hire.",
    includes: [
      "Sales process design and call scripts",
      "Lead generation and appointment setting",
      "CRM setup and pipeline hygiene",
      "Sales training for your team",
      "Fractional sales reps",
    ],
    department: "sales",
    departmentLabel: "Sales",
  },
  {
    slug: "marketing",
    index: "03",
    title: "Marketing",
    short: "Be found, be chosen, be remembered.",
    summary:
      "From what you say to where you say it: one team for brand, web, search, ads, content and reputation, measured against the same numbers.",
    includes: [
      "Brand and messaging",
      "Websites and landing pages",
      "SEO and Google Business Profile",
      "Paid ads — search and social",
      "Social content",
      "Email and SMS campaigns",
      "Review generation and management",
    ],
    department: "marketing",
    departmentLabel: "Marketing",
  },
  {
    slug: "customer-service",
    index: "04",
    title: "Customer service & retention",
    short: "Every call answered. Every customer kept a little longer.",
    summary:
      "Human support where it matters and AI where it helps — so no enquiry goes unanswered and existing customers have reasons to stay.",
    includes: [
      "Phone, chat and email support",
      "AI chat assistant and AI phone receptionist",
      "Help desk setup",
      "Customer onboarding and loyalty programs",
      "Customer surveys and feedback loops",
    ],
    department: "success",
    departmentLabel: "Client success",
  },
  {
    slug: "operations",
    index: "05",
    title: "Operations & systems",
    short: "Less chasing, fewer spreadsheets, clearer numbers.",
    summary:
      "We write down how the work gets done, automate the repetitive parts and give you a dashboard you’ll actually open.",
    includes: [
      "Standard operating procedures (SOPs)",
      "Workflow automation",
      "Software selection and setup",
      "KPI dashboards and reporting",
    ],
    department: "operations",
    departmentLabel: "Operations",
  },
];

export type Package = {
  name: string;
  cadence: string;
  range: string;
  lede: string;
  includes: string[];
  featured?: boolean;
};

export const packages: Package[] = [
  {
    name: "Launch",
    cadence: "One-time",
    range: "$1,500–$3,000",
    lede: "A clear picture and a working foundation.",
    includes: ["Business audit", "90-day roadmap", "Core setup — CRM, profiles, tracking"],
  },
  {
    name: "Grow",
    cadence: "Monthly",
    range: "$1,500–$4,000",
    lede: "A steady engine for new customers.",
    includes: ["Marketing management", "Content", "Paid ads", "CRM upkeep", "Monthly reporting"],
    featured: true,
  },
  {
    name: "Scale",
    cadence: "Monthly",
    range: "$4,000–$10,000",
    lede: "Growth plus the people and systems to carry it.",
    includes: ["Everything in Grow", "Sales system and scripts", "AI receptionist", "Outsourced customer support"],
  },
];

export const packagesNote =
  "Ranges are starting points, not quotes. Final pricing depends on scope, channels and ad spend, which is billed separately.";

export type Step = { index: string; name: string; line: string; detail: string; outputs: string[] };

export const steps: Step[] = [
  {
    index: "I",
    name: "Audit",
    line: "We look before we touch anything.",
    detail:
      "Interviews with you and your team, a walk through your numbers, your tools and your customer’s path from first search to repeat purchase.",
    outputs: ["Findings in plain language", "Where revenue leaks", "What to leave alone"],
  },
  {
    index: "II",
    name: "Plan",
    line: "One roadmap, in the right order.",
    detail:
      "A 90-day plan that ranks every move by effort and expected return, with owners, budget and the numbers we’ll judge it by.",
    outputs: ["90-day roadmap", "Budget and owners", "Agreed scorecard"],
  },
  {
    index: "III",
    name: "Build",
    line: "We make the pieces — and connect them.",
    detail:
      "Site, campaigns, CRM, scripts, help desk, automations. Built by the right specialist, coordinated by one project manager.",
    outputs: ["Live assets and systems", "Documentation", "Team handover"],
  },
  {
    index: "IV",
    name: "Run",
    line: "Then we keep it running, and keep improving it.",
    detail:
      "Monthly operation, reporting and a standing review with a partner. What works gets more budget; what doesn’t gets cut.",
    outputs: ["Monthly report", "Partner review", "Next 90 days"],
  },
];

export const partners = [
  { title: "Partner, Growth", remit: "Owns strategy, audits, roadmaps and the sales practice." },
  { title: "Partner, Marketing", remit: "Leads brand, web, search, paid media and content." },
  { title: "Partner, Client Success", remit: "Leads customer service, retention and every client relationship." },
  { title: "Partner, Operations", remit: "Runs delivery, systems, automation and reporting." },
];

export type Dept = { name: string; lead: string; summary: string; seats: { role: string; does: string }[] };

export const orgDepartments: Dept[] = [
  {
    name: "Marketing",
    lead: "Partner, Marketing",
    summary: "Makes you easy to find and easy to choose.",
    seats: [
      { role: "Brand strategist", does: "positioning, naming, messaging" },
      { role: "Copywriter", does: "web, ads, email and scripts" },
      { role: "Paid media specialist", does: "search and social campaigns" },
      { role: "SEO specialist", does: "search, local and Google Business Profile" },
      { role: "Web developer", does: "sites and landing pages" },
      { role: "Designer", does: "identity, layouts, social assets" },
      { role: "Video editor", does: "short-form and ad creative" },
    ],
  },
  {
    name: "Sales",
    lead: "Partner, Growth",
    summary: "Turns interest into booked calls and signed work.",
    seats: [
      { role: "Outbound specialist", does: "prospecting and appointment setting" },
      { role: "CRM specialist", does: "pipelines, stages and hygiene" },
      { role: "Sales trainer", does: "scripts, role-play, coaching" },
      { role: "Fractional rep", does: "works your pipeline under your name" },
    ],
  },
  {
    name: "Customer Experience",
    lead: "Partner, Client Success",
    summary: "Answers every enquiry and keeps customers coming back.",
    seats: [
      { role: "Support specialist", does: "phone, chat and email" },
      { role: "Onboarding specialist", does: "first-90-day customer journeys" },
      { role: "AI receptionist specialist", does: "AI phone and chat setup and tuning" },
    ],
  },
  {
    name: "Operations",
    lead: "Partner, Operations",
    summary: "Keeps the work organised, automated and measured.",
    seats: [
      { role: "Project manager", does: "your single point of coordination" },
      { role: "Automation specialist", does: "workflows between your tools" },
      { role: "Reporting analyst", does: "dashboards and monthly reports" },
    ],
  },
];
