// MSAR website — Eleventy configuration
// Content lives in src/ as Markdown/JSON (editable through /admin), every page
// is generated at build time, and every <img> is optimised automatically.
import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";
import markdownIt from "markdown-it";

const TZ = "Africa/Kigali";
const md = markdownIt({ html: true, linkify: true, typographer: true });

/* ---------- date helpers (all event logic runs in Kigali time, UTC+2) ---------- */
function toISODate(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}
// Build a Date for a Kigali wall-clock time ("2026-11-17", "17:00")
function kigaliDate(dateStr, timeStr = "00:00") {
  const d = toISODate(dateStr);
  if (!d) return null;
  const t = /^\d{1,2}:\d{2}$/.test(timeStr || "") ? timeStr.padStart(5, "0") : "00:00";
  return new Date(`${d}T${t}:00+02:00`);
}
export function eventBounds(e) {
  const start = kigaliDate(e.startDate, e.startTime || "00:00");
  const endDay = e.endDate || e.startDate;
  const end = e.endTime ? kigaliDate(endDay, e.endTime) : kigaliDate(endDay, "23:59");
  return { start, end };
}
export function eventStatus(e, now = new Date()) {
  const manual = (e.status || "auto").toLowerCase();
  if (manual !== "auto") return manual; // upcoming | ongoing | completed | postponed | cancelled
  const { start, end } = eventBounds(e);
  if (!start) return "completed";
  if (now < start) return "upcoming";
  if (now <= end) return "ongoing";
  return "completed";
}
const fmt = (opts) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...opts });
function to12h(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
}

export default function (eleventyConfig) {
  /* ---------- images: every <img src="/images/..."> becomes a responsive <picture> ---------- */
  eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
    formats: ["webp", "jpeg"],
    widths: [480, 960, 1600],
    failOnError: false,
    htmlOptions: {
      imgAttributes: { loading: "lazy", decoding: "async" },
    },
    sharpJpegOptions: { quality: 78, progressive: true },
    sharpWebpOptions: { quality: 74 },
  });

  /* ---------- static files ---------- */
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/images": "images" }); // originals: social previews, downloads, CMS
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.addPassthroughCopy({ "src/static": "/" });
  eleventyConfig.addWatchTarget("src/assets/");

  /* ---------- collections ---------- */
  const byStartDesc = (a, b) => toISODate(b.data.startDate).localeCompare(toISODate(a.data.startDate));
  eleventyConfig.addCollection("events", (api) =>
    api.getFilteredByGlob("src/events/*.md").filter((p) => !p.data.draft).sort(byStartDesc)
  );
  eleventyConfig.addCollection("programs", (api) =>
    api.getFilteredByGlob("src/programs/*.md").sort((a, b) => (a.data.order || 99) - (b.data.order || 99))
  );
  eleventyConfig.addCollection("news", (api) =>
    api.getFilteredByGlob("src/news/*.md").filter((p) => !p.data.draft).sort((a, b) => b.date - a.date)
  );
  eleventyConfig.addCollection("team", (api) =>
    api.getFilteredByGlob("src/team/*.md").sort((a, b) => (a.data.order || 99) - (b.data.order || 99))
  );

  /* ---------- event filters ---------- */
  eleventyConfig.addFilter("eventStatus", (data) => eventStatus(data));
  eleventyConfig.addFilter("upcomingEvents", (events) =>
    (events || [])
      .filter((e) => !e.data.series && ["upcoming", "ongoing", "postponed"].includes(eventStatus(e.data)))
      .sort((a, b) => toISODate(a.data.startDate).localeCompare(toISODate(b.data.startDate)))
  );
  eleventyConfig.addFilter("pastEvents", (events) =>
    (events || []).filter((e) => e.data.series || ["completed", "ongoing"].includes(eventStatus(e.data)))
  );
  eleventyConfig.addFilter("eventYears", (events) =>
    [...new Set((events || []).map((e) => toISODate(e.data.startDate).slice(0, 4)).filter(Boolean))].sort().reverse()
  );
  eleventyConfig.addFilter("eventCategories", (events) =>
    [...new Set((events || []).map((e) => e.data.category).filter(Boolean))].sort()
  );
  eleventyConfig.addFilter("withGallery", (events) => (events || []).filter((e) => (e.data.gallery || []).length));
  eleventyConfig.addFilter("relatedEvents", (events, page, category, n = 3) =>
    (events || []).filter((e) => e.url !== page.url && (!category || e.data.category === category)).slice(0, n)
  );
  eleventyConfig.addFilter("eventsForProgram", (events, slug) =>
    (events || []).filter((e) => (e.data.programs || []).includes(slug))
  );
  // Structured-data breadcrumbs from the URL (Home › Section › Page)
  const SECTION_NAMES = { about: "About", leadership: "Leadership & Team", programs: "Programs", events: "Events", gallery: "Gallery", opportunities: "Opportunities", partners: "Partners", resources: "Resources", news: "News", join: "Join MSAR", contact: "Contact", register: "Register" };
  eleventyConfig.addFilter("breadcrumbs", (url, title, base) => {
    const segs = String(url || "/").split("/").filter(Boolean);
    const items = [{ "@type": "ListItem", position: 1, name: "Home", item: base + "/" }];
    segs.forEach((seg, i) => {
      const last = i === segs.length - 1;
      items.push({ "@type": "ListItem", position: i + 2, name: last ? (title || SECTION_NAMES[seg] || seg) : (SECTION_NAMES[seg] || seg.replace(/-/g, " ")), item: `${base}/${segs.slice(0, i + 1).join("/")}/` });
    });
    return items;
  });
  eleventyConfig.addFilter("faqSchema", (items) => (items || []).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })));
  // Where a "Register" button should point: an external link, or the built-in form page
  eleventyConfig.addFilter("regLink", (ev) => {
    const d = ev.data || ev;
    if (d.registrationForm && d.registrationForm.enabled) return `/events/${ev.page ? ev.page.fileSlug : ev.fileSlug}/register/`;
    return d.registrationUrl || "";
  });
  eleventyConfig.addFilter("onlyPast", (events) =>
    (events || []).filter((e) => e.data.series || ["completed", "ongoing"].includes(eventStatus(e.data)))
  );
  eleventyConfig.addFilter("startISO", (data) => eventBounds(data).start?.toISOString() || "");
  eleventyConfig.addFilter("endISO", (data) => eventBounds(data).end?.toISOString() || "");

  /* ---------- date display ---------- */
  eleventyConfig.addFilter("isoDate", toISODate);
  eleventyConfig.addFilter("year", (v) => toISODate(v).slice(0, 4));
  eleventyConfig.addFilter("day", (v) => (v ? fmt({ day: "2-digit" }).format(kigaliDate(v, "12:00")) : ""));
  eleventyConfig.addFilter("mon", (v) => (v ? fmt({ month: "short" }).format(kigaliDate(v, "12:00")) : ""));
  eleventyConfig.addFilter("weekday", (v) => (v ? fmt({ weekday: "long" }).format(kigaliDate(v, "12:00")) : ""));
  eleventyConfig.addFilter("longDate", (v) =>
    v ? fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(kigaliDate(v, "12:00")) : ""
  );
  eleventyConfig.addFilter("shortDate", (v) =>
    v ? fmt({ day: "numeric", month: "short", year: "numeric" }).format(v instanceof Date ? v : kigaliDate(v, "12:00")) : ""
  );
  eleventyConfig.addFilter("eventDateLabel", (d) => {
    if (d.dateDisplay) return d.dateDisplay;
    const s = d.startDate, e = d.endDate;
    const long = (v) => fmt({ day: "numeric", month: "long", year: "numeric" }).format(kigaliDate(v, "12:00"));
    if (e && toISODate(e) !== toISODate(s)) {
      return `${fmt({ day: "numeric", month: "short" }).format(kigaliDate(s, "12:00"))} – ${long(e)}`;
    }
    return long(s);
  });
  eleventyConfig.addFilter("timeRange", (d) => {
    if (!d.startTime) return "";
    return d.endTime ? `${to12h(d.startTime)} – ${to12h(d.endTime)}` : to12h(d.startTime);
  });
  eleventyConfig.addFilter("icsStamp", (iso) => (iso ? iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "") : ""));

  /* ---------- general helpers ---------- */
  eleventyConfig.addFilter("md", (s) => (s ? md.render(String(s)) : ""));
  eleventyConfig.addFilter("mdInline", (s) => (s ? md.renderInline(String(s)) : ""));
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v));
  eleventyConfig.addFilter("byGroup", (arr, g) => (arr || []).filter((x) => x.data.group === g));
  eleventyConfig.addFilter("exceptUrl", (arr, url) => (arr || []).filter((x) => x.url !== url));
  eleventyConfig.addFilter("limit", (arr, n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("skip", (arr, n) => (arr || []).slice(n));
  eleventyConfig.addFilter("absoluteUrl", (url, base) => {
    try { return new URL(url || "/", base).href; } catch { return url; }
  });
  eleventyConfig.addFilter("statusLabel", (s) => ({
    upcoming: "Upcoming", ongoing: "Happening now", completed: "Completed", postponed: "Postponed", cancelled: "Cancelled",
  }[s] || s));
  eleventyConfig.addFilter("findBySlug", (arr, slug) => (arr || []).find((p) => p.fileSlug === slug || p.page?.fileSlug === slug));
  eleventyConfig.addFilter("stripHtml", (s) => String(s || "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
  eleventyConfig.addFilter("truncate", (s, n = 160) => {
    s = String(s || "");
    return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s;
  });
  eleventyConfig.addFilter("initials", (name) =>
    String(name || "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("")
  );
  eleventyConfig.addFilter("allGalleryPhotos", (events, extraAlbums = []) => {
    const out = [];
    for (const e of events || []) {
      for (const g of e.data.gallery || []) {
        out.push({ image: g.image, caption: g.caption || "", album: e.data.title, albumSlug: e.page.fileSlug, url: e.url, year: toISODate(e.data.startDate).slice(0, 4) });
      }
    }
    for (const a of extraAlbums || []) {
      for (const g of a.photos || []) {
        out.push({ image: g.image, caption: g.caption || "", album: a.title, albumSlug: a.slug, url: "", year: a.year || "" });
      }
    }
    return out;
  });

  eleventyConfig.addGlobalData("build", () => ({ now: new Date().toISOString(), year: new Date().getFullYear(), version: Date.now().toString(36) }));

  eleventyConfig.setLibrary("md", md);

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html", "11ty.js"],
  };
}
