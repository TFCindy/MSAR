/* MSAR — site behaviour (no dependencies).
   Everything here is progressive enhancement: pages are complete without JS. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- header: scrolled state + hide on scroll down ---------- */
  var header = $(".site-header");
  var lastY = window.scrollY;
  function onScroll() {
    var y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 24);
      var goingDown = y > lastY + 4, goingUp = y < lastY - 4;
      if (goingDown && y > 640 && !document.body.classList.contains("menu-open")) header.classList.add("is-hidden");
      if (goingUp || y < 200) header.classList.remove("is-hidden");
    }
    lastY = y;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  // keep header visible while keyboard users tab through it
  if (header) header.addEventListener("focusin", function () { header.classList.remove("is-hidden"); });

  /* ---------- desktop dropdowns ---------- */
  $$(".nav-item[data-dropdown]").forEach(function (item) {
    var btn = $("button", item);
    if (!btn) return;
    function set(open) { item.setAttribute("data-open", open ? "true" : "false"); btn.setAttribute("aria-expanded", open ? "true" : "false"); }
    btn.addEventListener("click", function (e) { e.stopPropagation(); set(item.getAttribute("data-open") !== "true"); });
    item.addEventListener("keydown", function (e) { if (e.key === "Escape") { set(false); btn.focus(); } });
    item.addEventListener("focusout", function (e) { if (!item.contains(e.relatedTarget)) set(false); });
    document.addEventListener("click", function (e) { if (!item.contains(e.target)) set(false); });
  });

  /* ---------- mobile drawer ---------- */
  var toggle = $(".menu-toggle"), drawer = $("#drawer"), main = $("#main");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (open) { drawer.removeAttribute("inert"); if (main) main.setAttribute("inert", ""); setTimeout(function () { var f = $("a", drawer); if (f) f.focus(); }, 300); }
    else { drawer.setAttribute("inert", ""); if (main) main.removeAttribute("inert"); }
  }
  if (toggle && drawer) {
    drawer.setAttribute("inert", "");
    toggle.addEventListener("click", function () { setMenu(!document.body.classList.contains("menu-open")); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && document.body.classList.contains("menu-open")) { setMenu(false); toggle.focus(); } });
    $$("a", drawer).forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    window.addEventListener("resize", function () { if (window.innerWidth > 1180 && document.body.classList.contains("menu-open")) setMenu(false); });
  }

  /* ---------- reveal on scroll ---------- */
  $$("[data-reveal-group]").forEach(function (g) {
    $$("[data-reveal]", g).forEach(function (el, i) { el.style.setProperty("--i", i % 6); });
  });
  var revealTargets = $$("[data-reveal], .mark, [data-inview]");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- animated counters ---------- */
  function animateCount(el) {
    var to = parseFloat(el.getAttribute("data-count")) || 0, suffix = el.getAttribute("data-suffix") || "";
    if (reduce) { el.textContent = to + suffix; return; }
    var start = null, dur = 1600;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1), eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(eased * to) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { animateCount(en.target); cio.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { c.textContent = "0" + (c.getAttribute("data-suffix") || ""); cio.observe(c); });
  }

  /* ---------- statement: words light up as you scroll ---------- */
  var statements = $$(".statement[data-scrub]");
  statements.forEach(function (st) {
    if (reduce) return;
    var walker = document.createTreeWalker(st, NodeFilter.SHOW_TEXT), nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var s = document.createElement("span"); s.className = "w"; s.textContent = part; frag.appendChild(s);
      });
      node.parentNode.replaceChild(frag, node);
    });
  });
  var words = statements.map(function (s) { return { el: s, w: $$(".w", s) }; });

  /* ---------- parallax + scroll-linked effects (one rAF loop) ---------- */
  var parallax = $$("[data-parallax]");
  var timeline = $(".timeline");
  var ticking = false;
  function frame() {
    ticking = false;
    var vh = window.innerHeight;
    if (!reduce) {
      parallax.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0.15;
        el.style.transform = "translate3d(0," + (-r.top * speed).toFixed(1) + "px,0)";
      });
      words.forEach(function (o) {
        var r = o.el.getBoundingClientRect();
        var p = Math.min(Math.max((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0), 1);
        var lit = Math.round(p * o.w.length);
        o.w.forEach(function (w, i) { w.classList.toggle("is-lit", i < lit); });
      });
    }
    if (timeline) {
      var tr = timeline.getBoundingClientRect();
      var tp = Math.min(Math.max((vh * 0.6 - tr.top) / tr.height, 0), 1);
      timeline.style.setProperty("--progress", (tp * 100).toFixed(1) + "%");
    }
  }
  function requestFrame() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  if (parallax.length || words.length || timeline) {
    window.addEventListener("scroll", requestFrame, { passive: true });
    window.addEventListener("resize", requestFrame);
    frame();
  }

  /* ---------- event status: re-evaluated in the browser so pages never go stale ---------- */
  var LABELS = { upcoming: "Upcoming", ongoing: "Happening now", completed: "Completed" };
  var now = Date.now();
  $$("[data-event-start]").forEach(function (el) {
    if (el.getAttribute("data-status-mode") !== "auto") return;
    var s = Date.parse(el.getAttribute("data-event-start")), e = Date.parse(el.getAttribute("data-event-end"));
    if (isNaN(s)) return;
    var status = now < s ? "upcoming" : now <= e ? "ongoing" : "completed";
    el.setAttribute("data-status", status);
    $$("[data-status-badge]", el).concat(el.matches("[data-status-badge]") ? [el] : []).forEach(function (b) {
      b.className = b.className.replace(/status--\w+/, "status--" + status);
      b.textContent = LABELS[status];
    });
  });
  $$("[data-upcoming-list]").forEach(function (list) {
    var items = $$("[data-event-start]", list), visible = 0;
    items.forEach(function (it) {
      var gone = it.getAttribute("data-status") === "completed";
      it.hidden = gone; if (!gone) visible++;
    });
    if (!items.length) return; // build-time empty state already rendered
    var empty = list.parentElement.querySelector("[data-upcoming-empty]");
    list.hidden = visible === 0;
    if (empty) empty.hidden = visible > 0;
  });
  $$("[data-hide-when-started]").forEach(function (el) {
    var s = Date.parse(el.getAttribute("data-hide-when-started"));
    if (!isNaN(s) && now >= s) el.hidden = true;
  });
  var announce = $(".announce");
  if (announce && announce.hidden) document.body.classList.remove("has-announce");

  /* ---------- countdowns ---------- */
  $$("[data-countdown]").forEach(function (el) {
    var target = Date.parse(el.getAttribute("data-countdown"));
    if (isNaN(target)) return;
    var parts = { d: $("[data-d]", el), h: $("[data-h]", el), m: $("[data-m]", el), s: $("[data-s]", el) };
    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) { el.hidden = true; return false; }
      var d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24, m = Math.floor(diff / 6e4) % 60, s = Math.floor(diff / 1e3) % 60;
      if (parts.d) parts.d.textContent = d;
      if (parts.h) parts.h.textContent = String(h).padStart(2, "0");
      if (parts.m) parts.m.textContent = String(m).padStart(2, "0");
      if (parts.s) parts.s.textContent = String(s).padStart(2, "0");
      return true;
    }
    el.hidden = false;
    if (tick()) setInterval(tick, 1000);
  });

  /* ---------- filters (events + gallery) ---------- */
  $$("[data-filter-root]").forEach(function (root) {
    var target = $(root.getAttribute("data-filter-root"));
    if (!target) return;
    var items = $$("[data-filter-item]", target);
    var count = $("[data-filter-count]", root);
    var empty = $(root.getAttribute("data-filter-empty") || "#__none");
    var state = { cat: "all", year: "all" };
    var params = new URLSearchParams(location.search);
    if (params.get("category")) state.cat = params.get("category");
    if (params.get("year")) state.year = params.get("year");
    var btns = $$("[data-filter-cat]", root), sel = $("[data-filter-year]", root);

    function apply(push) {
      var shown = 0;
      items.forEach(function (it) {
        var ok = (state.cat === "all" || it.getAttribute("data-cat") === state.cat) && (state.year === "all" || it.getAttribute("data-year") === state.year);
        it.classList.toggle("is-filtered-out", !ok);
        if (ok) shown++;
      });
      btns.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-filter-cat") === state.cat ? "true" : "false"); });
      if (sel) sel.value = state.year;
      if (count) count.textContent = shown + (shown === 1 ? " item" : " items");
      if (empty) empty.hidden = shown !== 0;
      if (push && history.replaceState) {
        var p = new URLSearchParams(location.search);
        state.cat === "all" ? p.delete("category") : p.set("category", state.cat);
        state.year === "all" ? p.delete("year") : p.set("year", state.year);
        var q = p.toString();
        history.replaceState(null, "", location.pathname + (q ? "?" + q : "") + location.hash);
      }
      document.dispatchEvent(new CustomEvent("msar:filtered"));
    }
    btns.forEach(function (b) { b.addEventListener("click", function () { state.cat = b.getAttribute("data-filter-cat"); apply(true); }); });
    if (sel) sel.addEventListener("change", function () { state.year = sel.value; apply(true); });
    apply(false);
  });

  /* ---------- lightbox ---------- */
  var lb = $("#lightbox");
  if (lb) {
    var lbImg = $("img", lb), lbCap = $(".lb-cap", lb), lbCount = $(".lb-count", lb);
    var list = [], idx = 0, lastFocus = null;
    function bestSrc(item) {
      var src = $("source[type='image/webp']", item) || $("source", item);
      var img = $("img", item);
      var set = (src && src.getAttribute("srcset")) || (img && img.getAttribute("srcset"));
      if (set) {
        var cands = set.split(",").map(function (c) { var p = c.trim().split(/\s+/); return { u: p[0], w: parseInt(p[1], 10) || 0 }; });
        cands.sort(function (a, b) { return b.w - a.w; });
        return cands[0].u;
      }
      return img ? img.currentSrc || img.src : "";
    }
    function show(i) {
      idx = (i + list.length) % list.length;
      var item = list[idx], img = $("img", item);
      lbImg.classList.add("is-swapping");
      var url = bestSrc(item);
      var pre = new Image();
      pre.onload = pre.onerror = function () { lbImg.src = url; lbImg.alt = img ? img.alt : ""; lbImg.classList.remove("is-swapping"); };
      pre.src = url;
      var cap = item.getAttribute("data-caption") || "", href = item.getAttribute("data-href"), album = item.getAttribute("data-album");
      lbCap.innerHTML = "";
      lbCap.appendChild(document.createTextNode(cap));
      if (album && href) {
        lbCap.appendChild(document.createTextNode(" · "));
        var a = document.createElement("a"); a.href = href; a.textContent = album; lbCap.appendChild(a);
      }
      lbCount.textContent = (idx + 1) + " / " + list.length;
    }
    function open(group, item) {
      list = $$(".m-item", group).filter(function (el) { return !el.classList.contains("is-filtered-out") && el.offsetParent !== null; });
      lastFocus = document.activeElement;
      lb.hidden = false;
      requestAnimationFrame(function () { lb.classList.add("is-open"); });
      document.body.style.overflow = "hidden";
      show(Math.max(list.indexOf(item), 0));
      $(".lb-close", lb).focus();
    }
    function close() {
      lb.classList.remove("is-open");
      document.body.style.overflow = "";
      setTimeout(function () { lb.hidden = true; lbImg.removeAttribute("src"); }, 300);
      if (lastFocus) lastFocus.focus();
    }
    $$("[data-lightbox]").forEach(function (group) {
      group.addEventListener("click", function (e) {
        var item = e.target.closest(".m-item");
        if (!item || !group.contains(item)) return;
        e.preventDefault(); open(group, item);
      });
    });
    $(".lb-close", lb).addEventListener("click", close);
    $(".lb-prev", lb).addEventListener("click", function () { show(idx - 1); });
    $(".lb-next", lb).addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lb-stage")) close(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(idx - 1);
      else if (e.key === "ArrowRight") show(idx + 1);
      else if (e.key === "Tab") { // keep focus inside the dialog
        var f = $$("button, a[href]", lb).filter(function (x) { return x.offsetParent !== null; });
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    var tx = null;
    lb.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (tx === null) return;
      var dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      tx = null;
    });
  }

  /* ---------- share ---------- */
  $$("[data-share]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var data = { title: document.title, url: location.href };
      if (navigator.share) { navigator.share(data).catch(function () {}); return; }
      if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(function () {
        var old = btn.getAttribute("aria-label"); btn.setAttribute("aria-label", "Link copied"); btn.title = "Link copied";
        setTimeout(function () { btn.setAttribute("aria-label", old); btn.title = old; }, 2000);
      });
    });
  });

  /* ---------- forms → Supabase ---------- */
  var SB_SRC = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js";
  var sbPromise = null;
  function loadSupabase() {
    if (sbPromise) return sbPromise;
    sbPromise = new Promise(function (resolve, reject) {
      if (window.supabase) return resolve(window.supabase);
      var s = document.createElement("script"); s.src = SB_SRC; s.async = true;
      s.onload = function () { resolve(window.supabase); }; s.onerror = reject;
      document.head.appendChild(s);
    });
    return sbPromise;
  }
  var MAPPERS = {
    join_requests: function (fd) {
      return {
        full_name: fd.get("fullname"), email: fd.get("email"), phone: fd.get("phone"),
        institution: fd.get("institution"), programme: fd.get("programme"), year_of_study: fd.get("year"),
        interests: fd.getAll("interests"), why_join: fd.get("why")
      };
    },
    contact_messages: function (fd) {
      return { name: fd.get("name"), email: fd.get("email"), subject: fd.get("subject"), message: fd.get("message") };
    },
    event_registrations: function (fd, form) {
      var answers = {};
      fd.forEach(function (v, k) {
        if (k.indexOf("q_") !== 0) return;
        var key = k.slice(2), all = fd.getAll(k);
        answers[key] = form.querySelector('input[type="checkbox"][name="' + k + '"]') ? all : all[0];
      });
      return {
        event_slug: form.getAttribute("data-event-slug"), event_title: form.getAttribute("data-event-title"),
        full_name: fd.get("fullname"), email: fd.get("email"), phone: fd.get("phone"),
        institution: fd.get("institution"), program: fd.get("programme"), academic_year: fd.get("year") || null,
        answers: answers
      };
    }
  };
  $$("form[data-supabase-table]").forEach(function (form) {
    var table = form.getAttribute("data-supabase-table");
    var status = $(".form-status", form);
    form.addEventListener("focusin", function () { loadSupabase().catch(function () {}); }, { once: true });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      $$("[aria-invalid]", form).forEach(function (f) { f.removeAttribute("aria-invalid"); });
      if (!form.checkValidity()) {
        var bad = $$(":invalid", form);
        bad.forEach(function (f) { f.setAttribute("aria-invalid", "true"); });
        if (bad[0]) bad[0].focus();
        if (status) { status.hidden = false; status.className = "form-status form-status--error"; status.textContent = "Please complete the highlighted fields."; }
        return;
      }
      if (form.elements["company"] && form.elements["company"].value) return; // honeypot
      var btn = $("button[type='submit']", form);
      btn.classList.add("is-loading"); btn.disabled = true;
      if (status) status.hidden = true;
      var fd = new FormData(form);
      loadSupabase().then(function (lib) {
        var client = lib.createClient(form.getAttribute("data-sb-url"), form.getAttribute("data-sb-key"));
        return client.from(table).insert(MAPPERS[table](fd, form));
      }).then(function (res) {
        if (res && res.error) throw res.error;
        var wrap = form.closest("[data-form-wrap]");
        form.hidden = true;
        var ok = wrap && $(".form-success", wrap);
        if (ok) { ok.hidden = false; ok.setAttribute("tabindex", "-1"); ok.focus(); }
      }).catch(function (err) {
        if (window.console) console.error(err);
        btn.classList.remove("is-loading"); btn.disabled = false;
        if (status) {
          var mail = form.getAttribute("data-fallback-email") || "info@msar.rw";
          status.hidden = false; status.className = "form-status form-status--error";
          status.innerHTML = "Sorry — we couldn't send that just now. Please try again, or email us at <a href=\"mailto:" + mail + "\">" + mail + "</a>.";
        }
      });
    });
  });

  /* ---------- registration closes automatically once the event has ended ---------- */
  $$("[data-close-when]").forEach(function (wrap) {
    var end = Date.parse(wrap.getAttribute("data-close-when"));
    if (isNaN(end) || Date.now() < end) return;
    var form = $("form", wrap), closedMsg = $(".reg-closed", wrap);
    if (form) form.hidden = true;
    if (closedMsg) closedMsg.hidden = false;
  });

  /* ---------- copyright year ---------- */
  $$("[data-current-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
