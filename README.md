# MSAR website — msar.rw

The official website of the **Mathematics and Statistics Students' Association of Rwanda (MSAR)**.

- **Static site generator:** [Eleventy](https://www.11ty.dev/) 3. Pages are built from Markdown and JSON content.
- **Hosting:** Vercel. Builds run automatically on every push to `master` (settings in `vercel.json`).
- **Content management:** [Sveltia CMS](https://github.com/sveltia/sveltia-cms) at **`/admin/`**. It edits the content files in this GitHub repository, so there is no database and no extra server.
- **Forms:** Supabase (`join_requests`, `contact_messages`). Same project as before.
- **Images:** every `<img>` is automatically converted to responsive WebP/JPEG at build time.

---

## 1. Managing content (no code needed)

### Signing in

1. Go to **https://msar.rw/admin/**.
2. Choose **Sign in with token** and paste a GitHub *fine-grained personal access token*:
   - GitHub → Settings → Developer settings → Fine-grained tokens → **Generate new token**
   - Repository access: **Only select repositories → TFCindy/MSAR**
   - Permissions: **Contents: Read and write**
3. Every save becomes a commit. Vercel rebuilds the site in about 1–2 minutes.

> Any GitHub account with write access to the repository can edit. Remove an editor's
> access by removing them as a collaborator (or revoking their token).
> To offer a "Sign in with GitHub" button instead of tokens, deploy the free
> [sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) worker and add its URL
> as `base_url` under `backend:` in `src/admin/config.yml`.

### Publishing an event (publish once, appears everywhere)

**Events → New Event**, then fill in title, summary, category, dates, location and cover photo.

| You set… | The site automatically… |
|---|---|
| **Status: Automatic** *(recommended)* | shows *Upcoming* before the start time, *Happening now* during, and *Completed* after. The event moves from **Upcoming** into **Recent activities** and the **Events archive** on its own. Photos and details are kept. |
| Start/End **time** | shows a live countdown and an **Add to calendar** (.ics) button |
| **Registration link** | shows a **Register now** button while the event is upcoming |
| No registration link | shows your *registration note* and a "Join MSAR to get updates" button |
| **Photo gallery** items | adds an album to the event page *and* to the Photo Gallery page |
| **Flyer / poster** | shows the flyer on the homepage feature, the event page and the top announcement bar |
| **Draft** | hides the event everywhere |

Statuses are re-checked **in the visitor's browser** on every page view, so an event never shows as "upcoming" after it has ended. The optional daily rebuild (section 4) also refreshes the static pages.

Use **Status: Postponed / Cancelled** to override the automatic status. Use **Ongoing series** for recurring activities without a single date (e.g. fellowship sessions).

### Other content

| Section in the CMS | Controls |
|---|---|
| **News & announcements** | `/news/` posts, which can link to an event |
| **Programs** | the six program pages and the homepage program cards |
| **Leadership & team** | founder, presidents by year, and *current committee* (the committee section appears as soon as one person is added) |
| **Site settings → Contact details & impact numbers** | email, phone, WhatsApp, LinkedIn, mission/vision, and the **impact numbers** (bar chart) |
| **Site settings → Partners** | partner cards and logos. *Only list relationships that are formally established.* |
| **Site settings → FAQs / Resources / Extra photo albums** | FAQ accordions, the Resources page (including uploading MSAR session materials) and gallery albums not tied to one event |

**Photos:** upload JPG/PNG straight from your phone. The build resizes, compresses and converts them automatically. Always add a short description (alt text) for accessibility.

---

## 2. Site structure

| URL | Page |
|---|---|
| `/` | Home: hero, next event, about, mission, programs, impact chart, upcoming, recent activities, photo moments, founder's voice, partners, FAQ |
| `/about/` | Story, mission & vision, what makes MSAR different, timeline |
| `/leadership/` | Founder, presidents by year, committee |
| `/programs/` + `/programs/<slug>/` | Program overview and six program pages, each with related events |
| `/events/` + `/events/<slug>/` | Upcoming events, filterable archive (category and year); event pages with gallery, countdown, registration, calendar file and sharing |
| `/gallery/` | Albums, filterable masonry gallery with lightbox, session video |
| `/opportunities/` | Career development, specialist training, what's in the pipeline |
| `/partners/` | Partner profiles and ways to partner |
| `/resources/` | MSAR materials and curated official learning links |
| `/news/` + `/news/<slug>/` | Announcements and recaps |
| `/join/` | Benefits, steps and the membership form (Supabase) |
| `/contact/` | Contact details and the contact form (Supabase) |

Old URLs (`/about.html`, `/events.html`, `/activities.html` …) permanently redirect to the new pages (`vercel.json`).

```
src/
  _data/        site.json (contact, stats), nav.json, partners.json, faqs.json, resources.json, albums.json
  _includes/    layouts (base, event, program, post) and partials (header, footer, macros, icons)
  events/       one Markdown file per event        ← CMS
  news/         one Markdown file per post         ← CMS
  programs/     one Markdown file per program      ← CMS
  team/         one Markdown file per person       ← CMS
  pages/        page templates
  images/       original photos (events/, archive/, team/, brand/, uploads/)
  assets/       css/main.css, js/main.js, video/, files/
  admin/        CMS (index.html, config.yml)
eleventy.config.js   build config, event-status logic, filters
supabase/forms.sql   database tables and security policies for the forms
```

---

## 3. Developing locally

```bash
npm install
npm start          # http://localhost:8080 with live reload
npm run build      # production build into _site/
```

Node 20 or newer is required.

### Design system (in `src/assets/css/main.css`)

- **Colours:** MSAR navy `#1E3A66` (primary) with deeper navies, warm paper neutrals (`#F6F3EC`), and one signal accent, amber `#F2B33D`. Use `--amber-700` for amber text on light backgrounds (meets WCAG AA).
- **Type:** *Bricolage Grotesque* (headlines), *Instrument Serif* italic (emphasis words), *Figtree* (body), *JetBrains Mono* (labels, dates, data).
- **Motifs:** amber "plotted" underlines, coordinate dot-grids, and impact shown as a real bar chart.
- **Motion:** scroll reveals, a hero entrance, light parallax, counters, bars that grow, a statement whose words light up on scroll, and page transitions. All motion is disabled for visitors who prefer reduced motion.

---

## 4. One-time setup checklist

1. **Vercel:** nothing to change. `vercel.json` sets the build command (`npm run build`) and output folder (`_site`).
2. **Supabase:** open the SQL editor and run `supabase/forms.sql`. This creates `contact_messages` (new) and makes sure both tables accept *insert-only* submissions from the website.
3. **Daily rebuild (optional):** create a Vercel Deploy Hook for `master`, then add it as the GitHub Actions secret `VERCEL_DEPLOY_HOOK`. `.github/workflows/daily-rebuild.yml` then rebuilds nightly.
4. **Logo:** the badge in `src/images/brand/msar-badge.png` comes from a low-resolution source. Replace it with the original vector/PNG logo for perfectly sharp rendering, and regenerate `src/static/favicon-64.png` and `apple-touch-icon.png`.

---

## 5. Content to confirm before or after launch

Everything on the site is based on MSAR's own website, photographs and the brief. Please confirm these points:

- **Exact dates** for the Data Skills Training Program, its certificate ceremony, the Gikondo fellowship sessions and the DATA+ geospatial training. These are shown as "2026" (or "Ongoing series") until updated in the CMS. Each event file has `dateConfirmed: false` to mark this.
- **Photo grouping:** WhatsApp photos were grouped by venue and content into Data Skills labs, the certificate ceremony, and Gikondo fellowship sessions. Please check the fellowship album in particular.
- **Jobra registration link:** add it to the event's *Registration link* field as soon as it is ready. Until then the page shows the "will be shared on official channels" note.
- **Impact numbers:** 100+ members, 55+ training participants and 47 alumni (historical figures from the brief). Update them under *Site settings*.
- **Partner logos and websites:** official logo files for UR, DATA+ Rwanda and Jobra, plus DATA+ and Jobra website links. Until then partners show as clean text wordmarks.
- **Committee:** add current committee members under *Leadership & team*.
