/* Pizza al dente — interactions spécifiques
   - statut « Ouvert / Fermé » en direct (heure de Paris)
   - mise en avant du jour dans le tableau des horaires
   - filtres et recherche dans la carte
   Aucune dépendance, aucun traceur. */
(function () {
  "use strict";

  /* ---------- Horaires : 0 = dimanche ... 6 = samedi ---------- */
  var OPEN = { 0: [17, 22], 2: [17, 22], 3: [17, 22], 4: [17, 22], 5: [17, 22], 6: [17, 22] };
  var DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

  function parisNow() {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Paris", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
      }).formatToParts(new Date());
      var map = {};
      parts.forEach(function (p) { map[p.type] = p.value; });
      var wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(map.weekday);
      return { day: wd, minutes: parseInt(map.hour, 10) % 24 * 60 + parseInt(map.minute, 10) };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), minutes: d.getHours() * 60 + d.getMinutes() };
    }
  }

  function nextOpening(now) {
    for (var i = 0; i < 8; i++) {
      var day = (now.day + i) % 7;
      var slot = OPEN[day];
      if (!slot) continue;
      if (i === 0 && now.minutes >= slot[0] * 60) continue;
      var when = i === 0 ? "aujourd'hui" : i === 1 ? "demain" : DAYS[day];
      return when + " à " + slot[0] + "h";
    }
    return "";
  }

  function updateStatus() {
    var now = parisNow();
    var slot = OPEN[now.day];
    var isOpen = !!slot && now.minutes >= slot[0] * 60 && now.minutes < slot[1] * 60;
    var text = isOpen
      ? "Ouvert maintenant · jusqu'à " + slot[1] + "h"
      : "Fermé · ouvre " + nextOpening(now);
    document.querySelectorAll("[data-status]").forEach(function (el) {
      el.setAttribute("data-state", isOpen ? "open" : "closed");
      var label = el.querySelector("[data-status-text]");
      if (label) label.textContent = text;
    });
    document.querySelectorAll(".hours-table tr[data-day]").forEach(function (row) {
      row.classList.toggle("is-today", parseInt(row.getAttribute("data-day"), 10) === now.day);
    });
  }

  updateStatus();
  setInterval(updateStatus, 60000);

  /* ---------- Carte : filtres + recherche ---------- */
  var chips = document.querySelectorAll(".chip[data-filter]");
  var search = document.getElementById("menu-q");
  var dishes = document.querySelectorAll(".dish");
  var groups = document.querySelectorAll(".menu-group");
  var empty = document.getElementById("menu-empty");
  var live = document.getElementById("menu-live");
  var current = "all";

  function norm(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function apply() {
    var q = norm(search ? search.value.trim() : "");
    var shown = 0;
    dishes.forEach(function (d) {
      var tags = (d.getAttribute("data-tags") || "").split(" ");
      var okFilter = current === "all" || tags.indexOf(current) !== -1;
      var okSearch = !q || norm(d.textContent).indexOf(q) !== -1;
      var visible = okFilter && okSearch;
      d.hidden = !visible;
      if (visible) shown++;
    });
    groups.forEach(function (g) {
      g.hidden = !g.querySelector(".dish:not([hidden])");
    });
    if (empty) empty.hidden = shown !== 0;
    if (live) live.textContent = shown + " pizza" + (shown > 1 ? "s" : "") + " affichée" + (shown > 1 ? "s" : "");
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      current = chip.getAttribute("data-filter");
      chips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
      apply();
    });
  });
  if (search) search.addEventListener("input", apply);

  /* ---------- Repli si une photo distante ne charge pas ---------- */
  document.querySelectorAll("img[data-fallback]").forEach(function (img) {
    function swap() {
      if (img.dataset.swapped) return;
      img.dataset.swapped = "1";
      img.src = img.getAttribute("data-fallback");
    }
    img.addEventListener("error", swap);
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) swap();
  });
})();
