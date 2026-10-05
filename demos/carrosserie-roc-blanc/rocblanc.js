/* Carrosserie Roc Blanc — interactions de la démonstration
   - la plaque : mise en forme AB-123-CD en direct, synchronisée
     entre la plaque géante et le formulaire de devis
   - statut « Ouvert / Fermé » en direct (heure de Paris)
   - jour en cours dans les horaires
   - comparateur avant / après
   - formulaire : nombre de photos choisies
   Aucune dépendance, aucun traceur. */
(function () {
  "use strict";

  /* ---------- La plaque : AB-123-CD ---------- */
  var immats = Array.prototype.slice.call(document.querySelectorAll("[data-immat]"));
  function formatImmat(raw) {
    var s = (raw || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
    var out = s.slice(0, 2);
    if (s.length > 2) out += "-" + s.slice(2, 5);
    if (s.length > 5) out += "-" + s.slice(5, 7);
    return out;
  }
  immats.forEach(function (input) {
    input.addEventListener("input", function () {
      var v = formatImmat(input.value);
      input.value = v;
      immats.forEach(function (other) { if (other !== input && other.value !== v) other.value = v; });
    });
  });

  /* Plaque géante : « Devis » amène au formulaire, immat déjà remplie */
  var plateForm = document.getElementById("plate-form");
  var devis = document.getElementById("devis");
  function goDevis(e) {
    if (!devis) return;
    if (e) e.preventDefault();
    devis.scrollIntoView({ behavior: "smooth", block: "start" });
    var target = document.getElementById(document.getElementById("d-immat") && document.getElementById("d-immat").value ? "d-nom" : "d-immat");
    if (target) window.setTimeout(function () { target.focus({ preventScroll: true }); }, 650);
  }
  if (plateForm) plateForm.addEventListener("submit", goDevis);
  document.querySelectorAll("[data-go-devis]").forEach(function (a) { a.addEventListener("click", goDevis); });

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
  function fmt(min) { var h = Math.floor(min / 60), m = min % 60; return h + " h" + (m ? " " + (m < 10 ? "0" + m : m) : ""); }
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
    var text = open ? "Ouvert · jusqu'à " + fmt(open[1]) : "Fermé · ouvre " + nextOpening(now);
    document.querySelectorAll("[data-status]").forEach(function (el) {
      el.setAttribute("data-state", open ? "open" : "closed");
      var label = el.querySelector("[data-status-text]");
      if (label) label.textContent = text;
    });
    document.querySelectorAll(".hours [data-day]").forEach(function (row) {
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
      var n = Math.max(0, Math.min(100, Number(v)));
      wrap.style.setProperty("--pos", n + "%");
      handle.style.setProperty("--pos", n + "%");
      range.setAttribute("aria-valuetext", Math.round(n) + " % avant");
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
      uploadLabel.textContent = n ? n + " photo" + (n > 1 ? "s" : "") + " sélectionnée" + (n > 1 ? "s" : "") + " · prêtes à envoyer" : "JPG ou HEIC · trois photos conseillées · 10 Mo max chacune";
    });
  }

  /* ---------- Repli si une photo distante ne charge pas ---------- */
  document.querySelectorAll(".proof img, .ba img").forEach(function (im) {
    im.addEventListener("error", function () { im.style.background = "#E9EBE4"; im.alt = ""; });
  });
})();
