/* Pizza Maracana — interactions de la maquette
   - tableau d'affichage « Ouvert / Fermé » en direct (heure de Paris), soir uniquement
   - jour en cours dans le tableau des horaires
   - barre d'actions mobile : raccourci actif
   Aucune dépendance, aucun traceur. */
(function () {
  "use strict";
  var EVE = [[1080, 1320]];
  var DAY_SLOTS = { 0: EVE, 2: EVE, 3: EVE, 4: EVE, 5: EVE, 6: EVE };
  var DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  function parisNow() {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
      var map = {}; parts.forEach(function (p) { map[p.type] = p.value; });
      return { day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(map.weekday), minutes: parseInt(map.hour, 10) % 24 * 60 + parseInt(map.minute, 10) };
    } catch (e) { var d = new Date(); return { day: d.getDay(), minutes: d.getHours() * 60 + d.getMinutes() }; }
  }
  function fmt(min) { var h = Math.floor(min / 60), m = min % 60; return h + "h" + (m ? (m < 10 ? "0" + m : m) : ""); }
  function nextOpening(now) {
    for (var i = 0; i < 8; i++) {
      var day = (now.day + i) % 7, slots = DAY_SLOTS[day];
      if (!slots) continue;
      for (var s = 0; s < slots.length; s++) {
        if (i === 0 && now.minutes >= slots[s][0]) continue;
        return (i === 0 ? "ce soir" : i === 1 ? "demain" : DAYS[day]) + " à " + fmt(slots[s][0]);
      }
    }
    return "";
  }
  function updateStatus() {
    var now = parisNow(), slots = DAY_SLOTS[now.day] || [], open = null;
    slots.forEach(function (s) { if (now.minutes >= s[0] && now.minutes < s[1]) open = s; });
    var text = open ? "Ouvert · jusqu'à " + fmt(open[1]) : "Fermé · ouvre " + nextOpening(now);
    document.querySelectorAll("[data-status]").forEach(function (el) {
      el.setAttribute("data-state", open ? "open" : "closed");
      var label = el.querySelector("[data-status-text]"); if (label) label.textContent = text;
    });
    document.querySelectorAll(".hours-table tr[data-day]").forEach(function (row) {
      row.classList.toggle("is-today", parseInt(row.getAttribute("data-day"), 10) === now.day);
    });
  }
  updateStatus(); setInterval(updateStatus, 60000);

  var appLinks = document.querySelectorAll(".appbar a[href^='#']");
  if ("IntersectionObserver" in window && appLinks.length) {
    var sections = [];
    appLinks.forEach(function (a) { var t = document.querySelector(a.getAttribute("href")); if (t) sections.push({ link: a, el: t }); });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { sections.forEach(function (s) { if (s.el === entry.target) s.link.classList.toggle("is-active", entry.isIntersecting); }); });
    }, { rootMargin: "-40% 0px -45% 0px", threshold: 0 });
    sections.forEach(function (s) { obs.observe(s.el); });
  }
})();
/* en-tête : transparent sur la photo, plein une fois qu'on a défilé */
(function () {
  function onScroll() { document.body.classList.toggle("scrolled", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
})();
/* mobile : la carte en accordéon (une catégorie ouverte à la fois) */
(function () {
  var mobile = window.matchMedia("(max-width: 760px)");
  var groups = Array.prototype.slice.call(document.querySelectorAll(".group"));
  groups.forEach(function (g) {
    var btn = g.querySelector(".group-head button");
    if (!btn) return;
    btn.addEventListener("click", function () {
      if (!mobile.matches) return;
      var open = !g.classList.contains("is-open");
      groups.forEach(function (o) { o.classList.remove("is-open"); var b = o.querySelector(".group-head button"); if (b) b.setAttribute("aria-expanded", "false"); });
      if (open) { g.classList.add("is-open"); btn.setAttribute("aria-expanded", "true"); g.scrollIntoView({ block: "start", behavior: "smooth" }); }
    });
  });
  /* hors mobile, tout est visible : on force l'état ouvert */
  function sync() { if (!mobile.matches) groups.forEach(function (g) { g.classList.add("is-open"); }); else { groups.forEach(function (g, i) { g.classList.toggle("is-open", i === 0); }); } }
  if (mobile.addEventListener) mobile.addEventListener("change", sync); sync();
})();
