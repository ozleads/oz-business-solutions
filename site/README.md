# OZ Business Solutions — website

Marketing site for OZ Business Solutions. Next.js (App Router) + TypeScript, one global stylesheet, no UI kit.
Every page is statically prerendered, so the output can run on any Node host or any static host.

## Run it

Requires Node 20+.

```bash
npm install
npm run dev          # http://localhost:3000, live reload
npm run build        # production build (must pass before deploying)
npm start            # serve the production build on :3000
npm run typecheck
```

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Hero, promise, five services, three packages, four-step approach, departments, contact band |
| `/services` | The five services, what each includes, and which department to contact |
| `/packages` | Launch / Grow / Scale starting-point ranges and a comparison table |
| `/approach` | Audit, Plan, Build, Run |
| `/company` | Four partners (by title), four departments, specialist network |
| `/contact` | United States and Canada lines, department email cards, contact form |

## Contacts

Phone numbers, inboxes and social links live in **one file: `lib/contact.ts`**.
Edit the values there and every page (header menu, footer, contact page, service contact lines, contact band)
updates on the next build.

- `phones`: the two live lines, United States and Canada. Each has a display string and a `tel` value
  (`+12053089904`, `+16477137349`). `telHref()` turns that into the `tel:` link.
- `departments`: label, one-line purpose and `email`. Department cards and contact lines show the email only.
- `socials`: LinkedIn, Instagram, X URLs.
- `bookCallHref`: currently a pre-addressed email to Sales. Swap it for a scheduling link (Calendly, Cal.com,
  Google appointment page) when you have one.
- `contactNote`: phone numbers are the live lines; email addresses are still placeholders.

### Connecting the contact form

`components/ContactForm.tsx` validates input and shows a success state, but does not send anything yet.
To deliver messages, replace the `setTimeout` in `onSubmit` with a `fetch` to a form service (Formspree,
Basin, Web3Forms) or a Next.js route handler (`app/api/contact/route.ts`) that sends email. Then remove the
“not yet connected” line from the success state.

## Editing copy

Service, package, approach, partner and department copy is in `lib/content.ts`. Navigation is in `lib/nav.ts`.
Page titles and meta descriptions are exported as `metadata` at the top of each `app/**/page.tsx`.

## Brand

- Colours (CSS variables in `app/globals.css`): ink `#0B1220`, ivory `#F4EFE6`, brass `#C4A574`,
  deep brass `#8C7348`, stone `#A39E94`, plus a warm dark surface `#17150F` / `#1E1B14` for the packages
  section and contact band. Brass fills primary buttons and colours eyebrows, numbers and links.
- Type: Cabinet Grotesk (Indian Type Foundry, from Fontshare, ITF Free Font License — see
  `public/fonts/CabinetGrotesk-LICENSE-FFL.txt`), one family for headlines and body. Only Regular (400) and
  Medium (500) are shipped, self-hosted from `public/fonts` and declared in `app/globals.css` — no external
  font requests. Headlines are 500, body 400 at 18px. Do not use weights above 500 unless you add the files.
- Monogram and wordmark: `components/Brand.tsx`. Favicon: `app/icon.svg`.

## Hero animation

`components/HeroField.tsx` draws an orbiting point network on a 2D canvas that tilts and warms to brass
around the pointer. It:

- shows a static CSS backdrop if canvas is unavailable;
- renders a single still frame under `prefers-reduced-motion`;
- uses fewer points, a lower pixel ratio and 30 fps on touch devices and small screens;
- pauses when scrolled off-screen or when the tab is hidden.

Smooth scrolling (Lenis) is enabled only for fine pointers without reduced motion.

## Adding a custom domain later

Nothing in the code depends on a domain. When you have one, set `NEXT_PUBLIC_SITE_URL`
(e.g. `https://ozbusinesssolutions.com`) at build time so canonical metadata, `robots.txt` and
`sitemap.xml` use it.

**Vercel (simplest for Next.js)**

1. Push this folder to a Git repository and import it in Vercel (framework preset: Next.js). The free Hobby
   tier is enough to start; it gives you a `*.vercel.app` URL immediately.
2. Project → Settings → Environment Variables: add `NEXT_PUBLIC_SITE_URL`.
3. Project → Settings → Domains → add your domain, then create the DNS records Vercel shows
   (usually an `A` record to Vercel’s IP for the apex and a `CNAME` for `www`). HTTPS is automatic.

**Any static host (Netlify, Cloudflare Pages, GitHub Pages, S3 + CloudFront)**

1. In `next.config.ts` add `output: "export"`, then run `npm run build`. The site is written to `out/`.
2. Upload `out/` (or connect the repo with build command `npm run build` and output directory `out`).
3. Add the custom domain in the host’s dashboard and point DNS at it as instructed. Enable HTTPS.

**Any Node server**

Run `npm run build && npm start` behind a reverse proxy (Nginx, Caddy) that terminates TLS for your domain.
Set `PORT` to change the port.
