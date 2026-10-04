/* Auberge du Mérou — interactions spécifiques
   - statut « Ouvert / Fermé » en direct (heure de Paris), midi et soir, 7 j/7
   - mise en avant du jour dans le tableau des horaires
   - carte : sur grand écran, navigation par catégorie avec repère au défilement ;
     sur mobile, la carte se parcourt par onglets (une catégorie à la fois, Précédent / Suivant)
   - galerie plein écran
   - barre d'actions mobile : raccourci actif selon la section visible
   Aucune dépendance, aucun traceur. */
(function () {
  "use strict";

  /* ---------- Horaires : 0 = dimanche ... 6 = samedi, créneaux en minutes ---------- */
  var SLOTS = [[690, 900], [1170, 1380]];
  var DAY_SLOTS = { 0: SLOTS, 1: SLOTS, 2: SLOTS, 3: SLOTS, 4: SLOTS, 5: SLOTS, 6: SLOTS };
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
        var when = i === 0 ? (slots[s][0] >= 1170 ? "ce soir" : "aujourd'hui") : i === 1 ? "demain" : DAYS[day];
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
      ? "Ouvert · service jusqu'à " + fmt(open[1])
      : "Fermé · prochain service " + nextOpening(now);
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

  /* ---------- Carte : catégories ---------- */
  var groups = Array.prototype.slice.call(document.querySelectorAll(".menu-group"));
  var catLinks = Array.prototype.slice.call(document.querySelectorAll(".cat-nav a"));
  var tabsNav = document.querySelector("[data-tabs-nav]");
  var mobile = window.matchMedia("(max-width: 760px)");
  var carte = document.getElementById("carte");
  var currentIndex = 0;

  function setActiveLink(id) {
    catLinks.forEach(function (a) {
      var active = a.getAttribute("href") === "#" + id;
      a.classList.toggle("is-active", active);
      if (active && a.scrollIntoView) {
        try { a.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" }); } catch (e) {}
      }
    });
  }

  /* Mode onglets (mobile) : une seule catégorie visible */
  function showTab(index, scroll) {
    currentIndex = (index + groups.length) % groups.length;
    groups.forEach(function (g, i) { g.classList.toggle("is-current", i === currentIndex); });
    setActiveLink(groups[currentIndex].id);
    if (tabsNav) {
      var prev = tabsNav.querySelector("[data-tab-prev]");
      var next = tabsNav.querySelector("[data-tab-next]");
      if (prev) prev.disabled = currentIndex === 0;
      if (next) next.disabled = currentIndex === groups.length - 1;
    }
    if (scroll && carte) {
      var top = carte.getBoundingClientRect().top + window.pageYOffset + 1;
      try { window.scrollTo({ top: top, behavior: "smooth" }); } catch (e) { window.scrollTo(0, top); }
    }
  }

  function applyMode() {
    var isMobile = mobile.matches;
    document.body.classList.toggle("menu-tabs", isMobile);
    if (tabsNav) tabsNav.hidden = !isMobile;
    if (isMobile) showTab(currentIndex, false);
  }

  catLinks.forEach(function (a, i) {
    a.addEventListener("click", function (e) {
      if (!mobile.matches) return;
      e.preventDefault();
      showTab(i, true);
    });
  });
  if (tabsNav) {
    var prevBtn = tabsNav.querySelector("[data-tab-prev]");
    var nextBtn = tabsNav.querySelector("[data-tab-next]");
    if (prevBtn) prevBtn.addEventListener("click", function () { showTab(currentIndex - 1, true); });
    if (nextBtn) nextBtn.addEventListener("click", function () { showTab(currentIndex + 1, true); });
  }
  /* Un lien d'ancre vers une catégorie (ex. « Bouillabaisse & bourride ») ouvre le bon onglet */
  document.querySelectorAll('a[href^="#carte-"]:not(.cat-nav a)').forEach(function (a) {
    a.addEventListener("click", function () {
      if (!mobile.matches) return;
      var idx = groups.findIndex(function (g) { return "#" + g.id === a.getAttribute("href"); });
      if (idx !== -1) showTab(idx, false);
    });
  });
  if (mobile.addEventListener) mobile.addEventListener("change", applyMode);
  else if (mobile.addListener) mobile.addListener(applyMode);
  applyMode();

  /* Mode défilement (grand écran) : catégorie active selon la position */
  if ("IntersectionObserver" in window && groups.length) {
    var catObserver = new IntersectionObserver(function (entries) {
      if (mobile.matches) return;
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActiveLink(entry.target.id);
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

  /* ---------- Formulaire : date minimale = aujourd'hui ---------- */
  var dateField = document.getElementById("r-date");
  if (dateField) {
    try { dateField.min = new Date().toISOString().slice(0, 10); } catch (e) {}
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
  document.querySelectorAll(".dish-photo img, .sig-photo img, .g-item img, .formule-photo img").forEach(function (im) {
    im.addEventListener("error", function () {
      var wrap = im.parentElement;
      im.remove();
      wrap.classList.add("dish-photo--empty");
      wrap.innerHTML = "<span>M</span>";
    });
  });
})();
