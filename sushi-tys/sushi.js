/* Sushi Ty's — interactions spécifiques
   - statut « Ouvert / Fermé » en direct (heure de Paris), midi et soir
   - mise en avant du jour dans le tableau des horaires
   - filtres, recherche et navigation par catégorie dans la carte
   - galerie plein écran
   - barre d'actions mobile : raccourci actif selon la section visible
   Aucune dépendance, aucun traceur. */
(function () {
  "use strict";

  /* ---------- Horaires : 0 = dimanche ... 6 = samedi, créneaux en minutes ---------- */
  var DAY_SLOTS = {
    2: [[660, 810], [1080, 1320]],
    3: [[660, 810], [1080, 1320]],
    4: [[660, 810], [1080, 1320]],
    5: [[660, 810], [1080, 1320]],
    6: [[1080, 1320]]
  };
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

  function fmt(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return h + "h" + (m ? (m < 10 ? "0" + m : m) : "");
  }

  function nextOpening(now) {
    for (var i = 0; i < 8; i++) {
      var day = (now.day + i) % 7;
      var slots = DAY_SLOTS[day];
      if (!slots) continue;
      for (var s = 0; s < slots.length; s++) {
        if (i === 0 && now.minutes >= slots[s][0]) continue;
        var when = i === 0 ? "aujourd'hui" : i === 1 ? "demain" : DAYS[day];
        return when + " à " + fmt(slots[s][0]);
      }
    }
    return "";
  }

  function updateStatus() {
    var now = parisNow();
    var slots = DAY_SLOTS[now.day] || [];
    var open = null;
    slots.forEach(function (s) { if (now.minutes >= s[0] && now.minutes < s[1]) open = s; });
    var text = open
      ? "Ouvert · jusqu'à " + fmt(open[1])
      : "Fermé · ouvre " + nextOpening(now);
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

  /* ---------- Carte : filtres + recherche ---------- */
  var chips = document.querySelectorAll(".chip[data-filter]");
  var search = document.getElementById("menu-q");
  var dishes = document.querySelectorAll(".dish");
  var groups = document.querySelectorAll(".menu-group");
  var empty = document.getElementById("menu-empty");
  var live = document.getElementById("menu-live");
  var catLinks = document.querySelectorAll(".cat-nav a");
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
      var has = !!g.querySelector(".dish:not([hidden])");
      g.hidden = !has;
      var link = document.querySelector('.cat-nav a[href="#' + g.id + '"]');
      if (link) link.hidden = !has;
    });
    if (empty) empty.hidden = shown !== 0;
    if (live) live.textContent = shown + " recette" + (shown > 1 ? "s" : "") + " affichée" + (shown > 1 ? "s" : "");
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      current = chip.getAttribute("data-filter");
      chips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
      apply();
    });
  });
  if (search) search.addEventListener("input", apply);

  /* ---------- Catégorie active pendant le défilement ---------- */
  if ("IntersectionObserver" in window && groups.length) {
    var catObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        catLinks.forEach(function (a) {
          var active = a.getAttribute("href") === "#" + entry.target.id;
          a.classList.toggle("is-active", active);
          if (active && a.scrollIntoView) {
            try { a.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" }); } catch (e) {}
          }
        });
      });
    }, { rootMargin: "-120px 0px -70% 0px", threshold: 0 });
    groups.forEach(function (g) { catObserver.observe(g); });
  }

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
        sections.forEach(function (s) {
          if (s.el === entry.target) s.link.classList.toggle("is-active", entry.isIntersecting);
        });
      });
    }, { rootMargin: "-40% 0px -45% 0px", threshold: 0 });
    sections.forEach(function (s) { appObserver.observe(s.el); });
  }

  /* ---------- Galerie plein écran ---------- */
  var items = Array.prototype.slice.call(document.querySelectorAll(".g-item"));
  var box = document.getElementById("lightbox");
  if (box && items.length) {
    var img = box.querySelector("img");
    var cap = box.querySelector("figcaption");
    var index = 0;
    function show(i) {
      index = (i + items.length) % items.length;
      img.src = items[index].getAttribute("href");
      img.alt = items[index].getAttribute("data-caption") || "";
      cap.textContent = img.alt;
      box.hidden = false;
      document.body.style.overflow = "hidden";
      box.querySelector(".lb-close").focus();
    }
    function hide() {
      box.hidden = true;
      document.body.style.overflow = "";
    }
    items.forEach(function (a, i) {
      a.addEventListener("click", function (e) { e.preventDefault(); show(i); });
    });
    box.querySelector(".lb-close").addEventListener("click", hide);
    box.querySelector(".lb-prev").addEventListener("click", function () { show(index - 1); });
    box.querySelector(".lb-next").addEventListener("click", function () { show(index + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) hide(); });
    document.addEventListener("keydown", function (e) {
      if (box.hidden) return;
      if (e.key === "Escape") hide();
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
    });
    var startX = null;
    box.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(dx < 0 ? index + 1 : index - 1);
      startX = null;
    });
  }

  /* ---------- Repli si une photo distante ne charge pas ---------- */
  document.querySelectorAll(".dish-photo img, .sig-photo img, .g-item img").forEach(function (im) {
    im.addEventListener("error", function () {
      var wrap = im.parentElement;
      im.remove();
      wrap.classList.add("dish-photo--empty");
      wrap.innerHTML = "<span>Ty's</span>";
    });
  });
})();
