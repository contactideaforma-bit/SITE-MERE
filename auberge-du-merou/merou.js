/* Auberge du Mérou — interactions spécifiques
   - statut « Ouvert / Fermé » en direct (heure de Paris), midi et soir, 7 j/7
   - mise en avant du jour dans le tableau des horaires
   - catégorie de carte active au défilement
   - citations d'avis, une à la fois
   - barre d'actions mobile : raccourci actif selon la section visible
   Aucune dépendance, aucun traceur. */
(function () {
  "use strict";

  var SLOTS = [[690, 900], [1170, 1380]];
  var DAY_SLOTS = { 0: SLOTS, 1: SLOTS, 2: SLOTS, 3: SLOTS, 4: SLOTS, 5: SLOTS, 6: SLOTS };
  var DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

  function parisNow() {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
      var map = {};
      parts.forEach(function (p) { map[p.type] = p.value; });
      var wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(map.weekday);
      return { day: wd, minutes: parseInt(map.hour, 10) % 24 * 60 + parseInt(map.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), minutes: d.getHours() * 60 + d.getMinutes() };
    }
  }
  function fmt(min) { var h = Math.floor(min / 60), m = min % 60; return h + "h" + (m ? (m < 10 ? "0" + m : m) : ""); }
  function nextOpening(now) {
    for (var i = 0; i < 8; i++) {
      var day = (now.day + i) % 7, slots = DAY_SLOTS[day];
      if (!slots) continue;
      for (var s = 0; s < slots.length; s++) {
        if (i === 0 && now.minutes >= slots[s][0]) continue;
        var when = i === 0 ? (slots[s][0] >= 1170 ? "ce soir" : "aujourd'hui") : i === 1 ? "demain" : DAYS[day];
        return when + " à " + fmt(slots[s][0]);
      }
    }
    return "";
  }
  function updateStatus() {
    var now = parisNow(), slots = DAY_SLOTS[now.day] || [], open = null;
    slots.forEach(function (s) { if (now.minutes >= s[0] && now.minutes < s[1]) open = s; });
    var text = open ? "Ouvert · service jusqu'à " + fmt(open[1]) : "Fermé · prochain service " + nextOpening(now);
    document.querySelectorAll("[data-status]").forEach(function (el) {
      el.setAttribute("data-state", open ? "open" : "closed");
      var label = el.querySelector("[data-status-text]");
      if (label) label.textContent = text;
    });
    document.querySelectorAll(".hours-table tr[data-day]").forEach(function (row) {
      row.classList.toggle("is-today", parseInt(row.getAttribute("data-day"), 10) === now.day);
    });
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  /* ---------- Catégorie active ---------- */
  var groups = document.querySelectorAll(".menu-group");
  var catLinks = document.querySelectorAll(".cat-nav a");
  if ("IntersectionObserver" in window && groups.length) {
    var catObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        catLinks.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id); });
      });
    }, { rootMargin: "-120px 0px -60% 0px", threshold: 0 });
    groups.forEach(function (g) { catObserver.observe(g); });
  }

  /* ---------- Avis ---------- */
  var quotes = document.querySelectorAll("[data-quotes] .quote");
  var count = document.querySelector("[data-quote-count]");
  var qi = 0;
  function showQuote(i) {
    qi = (i + quotes.length) % quotes.length;
    quotes.forEach(function (q, k) { q.classList.toggle("is-current", k === qi); });
    if (count) count.textContent = (qi + 1) + " / " + quotes.length;
  }
  var prev = document.querySelector("[data-quote-prev]"), next = document.querySelector("[data-quote-next]");
  if (quotes.length && prev && next) {
    prev.addEventListener("click", function () { showQuote(qi - 1); });
    next.addEventListener("click", function () { showQuote(qi + 1); });
    setInterval(function () { showQuote(qi + 1); }, 8000);
  }

  /* ---------- Barre mobile : raccourci actif ---------- */
  var appLinks = document.querySelectorAll(".appbar a[href^='#']");
  if ("IntersectionObserver" in window && appLinks.length) {
    var sections = [];
    appLinks.forEach(function (a) { var t = document.querySelector(a.getAttribute("href")); if (t) sections.push({ link: a, el: t }); });
    var appObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { sections.forEach(function (s) { if (s.el === entry.target) s.link.classList.toggle("is-active", entry.isIntersecting); }); });
    }, { rootMargin: "-40% 0px -45% 0px", threshold: 0 });
    sections.forEach(function (s) { appObserver.observe(s.el); });
  }

  var dateField = document.getElementById("r-date");
  if (dateField) { try { dateField.min = new Date().toISOString().slice(0, 10); } catch (e) {} }
})();
