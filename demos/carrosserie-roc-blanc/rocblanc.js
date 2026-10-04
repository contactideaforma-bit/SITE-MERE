/* Carrosserie Roc Blanc — interactions de la démonstration
   - statut « Ouvert / Fermé » en direct (heure de Paris)
   - jour en cours dans le tableau des horaires
   - comparateur avant / après au curseur
   - formulaire : nombre de photos choisies
   - barre d'actions mobile : raccourci actif selon la section visible
   Aucune dépendance, aucun traceur. */
(function () {
  "use strict";

  /* ---------- Horaires : 0 = dimanche ... 6 = samedi, créneaux en minutes ---------- */
  var WEEK = [[480, 720], [840, 1080]];
  var DAY_SLOTS = { 1: WEEK, 2: WEEK, 3: WEEK, 4: WEEK, 5: [[480, 720], [840, 1020]], 6: [[480, 720]] };
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
        return (i === 0 ? "aujourd'hui" : i === 1 ? "demain" : DAYS[day]) + " à " + fmt(slots[s][0]);
      }
    }
    return "";
  }
  function updateStatus() {
    var now = parisNow(), slots = DAY_SLOTS[now.day] || [], open = null;
    slots.forEach(function (s) { if (now.minutes >= s[0] && now.minutes < s[1]) open = s; });
    var text = open ? "Atelier ouvert · jusqu'à " + fmt(open[1]) : "Atelier fermé · ouvre " + nextOpening(now);
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

  /* ---------- Avant / après ---------- */
  var ba = document.getElementById("ba");
  if (ba) {
    var range = ba.querySelector("input[type=range]");
    var wrap = ba.querySelector(".ba-before-wrap");
    var handle = ba.querySelector(".ba-handle");
    function setPos(v) {
      var pos = Math.max(0, Math.min(100, v)) + "%";
      wrap.style.setProperty("--pos", pos);
      handle.style.setProperty("--pos", pos);
    }
    range.addEventListener("input", function () { setPos(range.value); });
    setPos(range.value);
  }

  /* ---------- Formulaire : photos choisies ---------- */
  var photos = document.getElementById("d-photos");
  var uploadLabel = document.querySelector("[data-upload-label]");
  if (photos && uploadLabel) {
    photos.addEventListener("change", function () {
      var n = photos.files ? photos.files.length : 0;
      uploadLabel.textContent = n ? n + " photo" + (n > 1 ? "s" : "") + " sélectionnée" + (n > 1 ? "s" : "") : "JPG ou HEIC, 3 photos conseillées, 10 Mo max chacune";
    });
  }
  var immat = document.getElementById("d-immat");
  if (immat) immat.addEventListener("input", function () { immat.value = immat.value.toUpperCase(); });

  /* ---------- Barre mobile : raccourci actif ---------- */
  var appLinks = document.querySelectorAll(".appbar a[href^='#']");
  if ("IntersectionObserver" in window && appLinks.length) {
    var sections = [];
    appLinks.forEach(function (a) {
      var target = document.querySelector(a.getAttribute("href"));
      if (target) sections.push({ link: a, el: target });
    });
    var appObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        sections.forEach(function (s) { if (s.el === entry.target) s.link.classList.toggle("is-active", entry.isIntersecting); });
      });
    }, { rootMargin: "-40% 0px -45% 0px", threshold: 0 });
    sections.forEach(function (s) { appObserver.observe(s.el); });
  }

  /* ---------- Repli si une photo distante ne charge pas ---------- */
  document.querySelectorAll(".svc-photo img, .hero-visual img").forEach(function (im) {
    im.addEventListener("error", function () { im.style.background = "#E6E9ED"; im.alt = ""; });
  });
})();
