# MSAR Website — Handoff Notes

A 9-page static site for MSAR (Mathematics and Statistics Students' Association
of Rwanda), built from your brief and your real media folder. Plain HTML/CSS/JS
— no build step, no framework. Open `index.html` in a browser to preview, or
drag the whole folder into Netlify/Vercel/GitHub Pages to go live in minutes.

## Pages
`index.html` (Home) · `about.html` · `activities.html` · `events.html` ·
`resources.html` · `news.html` · `gallery.html` · `join.html` · `contact.html`

## What's real vs. placeholder

Per your brief's rule against fabricating content, everything below is grounded
in your actual media — nothing invented is presented as fact:

**Real / verified:**
- Logo, colors (navy + crimson sampled straight from your emblem and the
  MSAR Dinner flyer), and ~35 real photos from your media folder
- The "MSAR Yearly Dinner" event (About timeline + Events + News) — date,
  venue, and framing all come from your actual dinner invitation
- The About page timeline dates — pulled from the photos' own capture dates
- The homepage recap video — your real `linkedify` clip, now at
  `assets/video/msar-session-recap.mp4`
- Gallery captions/categories — based on what's actually visible in each photo

**Placeholder — replace before publishing** (all marked with `PLACEHOLDER` in
the HTML source, or with a visible amber note on the page itself):
- **Impact numbers** (home page, "2+ years / 100+ students / 25+ sessions /
  15+ events") — only "2+ years" is evidence-based (earliest dated photo is
  Oct 2024); the other three are illustrative and need real figures
- **Upcoming events** (4 of the 9 event cards) — dates, times, and topics are
  template examples, not scheduled events
- **Resource files** — all 18 resource cards are real topic titles you'd
  plausibly want, but there are no files behind them yet; buttons read
  "Coming soon" rather than faking a download
- **Contact details** — email, phone, and all four social links are
  placeholders (`contact.html`, footer, floating WhatsApp button)
- **Member stories** — deliberately left as an honest "coming soon" empty
  state rather than inventing quotes attached to real people's photos
- **Forms** (Join + Contact) — client-side only right now (validates input,
  shows a success state). Needs a backend or a form service (e.g. Formspree,
  Google Forms, or a proper endpoint) wired into `assets/js/main.js` before
  submissions actually go anywhere

## What's not built: the admin dashboard

The brief asks for an admin dashboard so MSAR can publish events/news/resources
without a developer. That needs a real backend (WordPress, a headless CMS like
Sanity/Strapi, or a small custom app) — not something a static HTML site can
do on its own. To keep this easy to hand off to whichever route you pick,
all content lives in one place, `data.py` (used to generate the site) — every
event, news post, resource, and gallery photo is a plain list of fields, which
maps cleanly onto a CMS content model whenever you're ready for that step.

## Structure
```
assets/css/style.css   — design system (colors, type, components)
assets/js/main.js      — nav, scroll reveal, counters, filters, lightbox, modals, forms
assets/img/            — all photos, organized by type
assets/video/          — the recap video + poster frame
*.html                 — the 9 pages
```

## Notes on a few deliberate calls
- **Event/news "detail pages"**: instead of building 9+ separate HTML files
  per event, clicking a card opens a detail modal with the same information a
  dedicated page would have. Easy to switch to real subpages later if you move
  to a CMS.
- **Register buttons** on upcoming events point to the Join form rather than a
  fake external registration link.
- **Logo**: the badge in the nav/footer is cropped from your dinner flyer
  photo, so it's a little soft at large sizes. If you have the original
  vector/PNG logo file, swapping it in at `assets/img/brand/logo-badge.png`
  (and `favicon.png`) will sharpen it up.
