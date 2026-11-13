// One downloadable calendar file per timed event: /events/<slug>.ics
import { eventBounds } from "../../eleventy.config.js";

const stamp = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const esc = (s = "") => String(s).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\;");

export default class {
  data() {
    return {
      pagination: { data: "collections.events", size: 1, alias: "ev", before: (items) => items.filter((e) => e.data.startTime) },
      permalink: (data) => `/events/${data.ev.page.fileSlug}.ics`,
      eleventyExcludeFromCollections: true,
    };
  }
  render({ ev, site }) {
    const { start, end } = eventBounds(ev.data);
    const finish = ev.data.endTime ? end : new Date(start.getTime() + 2 * 3600e3);
    return [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MSAR//Events//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${ev.page.fileSlug}@msar.rw`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(finish)}`,
      `SUMMARY:${esc(ev.data.title)}`,
      `DESCRIPTION:${esc(ev.data.summary + "\n\n" + site.url + ev.url)}`,
      `LOCATION:${esc(ev.data.location)}`,
      `URL:${site.url}${ev.url}`,
      "END:VEVENT", "END:VCALENDAR", "",
    ].join("\r\n");
  }
}
