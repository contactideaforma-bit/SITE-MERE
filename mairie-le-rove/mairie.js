/* Mairie du Rove — maquette IDEA : interactions
   - statut « Mairie ouverte / fermée » en direct (heure de Paris)
   - mise en avant du jour dans le tableau des horaires
   - barre d'accessibilité : taille du texte, contraste renforcé (mémorisés)
   - recherche instantanée des démarches
   - onglets « Vous êtes… »
   - bouton retour en haut
   Aucune dépendance, aucun traceur. */
(function () {
  "use strict";

  /* ---------- Horaires d'ouverture de l'accueil : 0 = dimanche … 6 = samedi ---------- */
  var OPEN = {
    1: [[8 * 60 + 30, 12 * 60], [14 * 60, 17 * 60 + 30]],
    2: [[8 * 60 + 30, 12 * 60], [14 * 60, 17 * 60 + 30]],
    3: [[8 * 60 + 30, 12 * 60], [14 * 60, 17 * 60 + 30]],
    4: [[8 * 60 + 30, 12 * 60], [14 * 60, 17 * 60 + 30]],
    5: [[8 * 60 + 30, 12 * 60], [14 * 60, 17 * 60]]
  };
  var DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

  function fmt(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return h + "h" + (m ? (m < 10 ? "0" + m : m) : "");
  }

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
      var slots = OPEN[day];
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
    var pill = document.querySelector("[data-status]");
    if (!pill) return;
    var text = pill.querySelector("[data-status-text]");
    var now = parisNow();
    var slots = OPEN[now.day] || [];
    var open = null;
    slots.forEach(function (s) { if (now.minutes >= s[0] && now.minutes < s[1]) open = s; });
    if (open) {
      pill.setAttribute("data-state", "open");
      text.textContent = "Mairie ouverte · jusqu'à " + fmt(open[1]);
    } else {
      pill.setAttribute("data-state", "closed");
      var next = nextOpening(now);
      text.textContent = "Mairie fermée" + (next ? " · ouvre " + next : "");
    }
    document.querySelectorAll(".hours-table tr[data-day]").forEach(function (row) {
      row.classList.toggle("is-today", parseInt(row.getAttribute("data-day"), 10) === now.day);
    });
  }
  updateStatus();
  setInterval(updateStatus, 60 * 1000);

  /* ---------- Accessibilité : taille du texte & contraste ---------- */
  var root = document.documentElement;
  var SIZES = ["normal", "large", "xl"];
  function readPref(key) { try { return window.localStorage.getItem(key); } catch (e) { return null; } }
  function writePref(key, val) { try { window.localStorage.setItem(key, val); } catch (e) {} }

  function applySize(size) {
    if (size === "normal") root.removeAttribute("data-fontsize"); else root.setAttribute("data-fontsize", size);
    document.querySelectorAll("[data-size]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-size") === size ? "true" : "false");
    });
  }
  function applyContrast(on) {
    if (on) root.setAttribute("data-contrast", "high"); else root.removeAttribute("data-contrast");
    var b = document.querySelector("[data-contrast-toggle]");
    if (b) b.setAttribute("aria-pressed", on ? "true" : "false");
  }
  var savedSize = readPref("rove-fontsize");
  applySize(SIZES.indexOf(savedSize) >= 0 ? savedSize : "normal");
  applyContrast(readPref("rove-contrast") === "high");

  document.querySelectorAll("[data-size]").forEach(function (b) {
    b.addEventListener("click", function () {
      var size = b.getAttribute("data-size");
      applySize(size); writePref("rove-fontsize", size);
    });
  });
  var ct = document.querySelector("[data-contrast-toggle]");
  if (ct) {
    ct.addEventListener("click", function () {
      var on = root.getAttribute("data-contrast") !== "high";
      applyContrast(on); writePref("rove-contrast", on ? "high" : "normal");
    });
  }

  /* ---------- Recherche instantanée des démarches ---------- */
  var INDEX = [
    { t: "Passeport et carte d'identité", d: "Prendre rendez-vous au service Passeport / CNI", h: "#demarches", k: "passeport cni carte identité pièce rendez-vous titre" },
    { t: "Portail famille", d: "Inscriptions cantine, centre aéré, paiement en ligne", h: "#demarches", k: "portail famille cantine inscription paiement périscolaire garderie" },
    { t: "Menus du restaurant scolaire", d: "Menus de la semaine de l'école François Bessou", h: "#parents", k: "menu cantine restaurant scolaire repas école" },
    { t: "Centre aéré municipal", d: "Accueil de loisirs 3-12 ans, vacances et mercredis", h: "#parents", k: "centre aéré accueil loisirs vacances toussaint enfants" },
    { t: "École François Bessou", d: "Inscriptions, horaires, actions éducatives", h: "#parents", k: "école maternelle primaire inscription rentrée bessou" },
    { t: "Assistantes maternelles", d: "Liste des assistantes maternelles agréées", h: "#parents", k: "assistante maternelle nounou garde bébé" },
    { t: "Déchetterie", d: "Horaires et accès à la déchetterie", h: "#quotidien", k: "déchetterie déchets tri recyclage" },
    { t: "Encombrants", d: "Demander un enlèvement d'encombrants", h: "#quotidien", k: "encombrants enlèvement meubles électroménager" },
    { t: "Ordures ménagères", d: "Jours de collecte et consignes de tri", h: "#quotidien", k: "ordures poubelle collecte tri ramassage" },
    { t: "Débroussaillement", d: "Obligations légales de débroussaillement", h: "#quotidien", k: "débroussaillement feu forêt obligation" },
    { t: "Emploi du feu", d: "Réglementation sur le brûlage et l'emploi du feu", h: "#quotidien", k: "feu brûlage barbecue réglementation" },
    { t: "Accès aux massifs", d: "Conditions d'accès aux massifs forestiers aujourd'hui", h: "#quotidien", k: "massif accès forêt randonnée calanques fermeture risque incendie" },
    { t: "Urbanisme et PLU", d: "Plan local d'urbanisme, permis, déclarations de travaux", h: "#mairie", k: "urbanisme plu permis construire travaux déclaration cadastre" },
    { t: "Renseignements cadastraux", d: "Consulter le cadastre", h: "#mairie", k: "cadastre parcelle terrain" },
    { t: "Permanence architecte conseil", d: "Conseils gratuits pour vos projets de construction", h: "#quotidien", k: "architecte conseil permanence construction" },
    { t: "Conseil municipal", d: "Composition, séances et comptes rendus", h: "#mairie", k: "conseil municipal maire élus séance compte rendu délibération" },
    { t: "Actes administratifs", d: "Arrêtés et délibérations publiés", h: "#mairie", k: "actes administratifs arrêté délibération publication" },
    { t: "Marchés publics", d: "Consultations et appels d'offres en cours", h: "#mairie", k: "marchés publics appel offres consultation" },
    { t: "Le Rove infos", d: "Bulletin municipal et archives", h: "#mairie", k: "bulletin municipal journal rove infos publication" },
    { t: "Police municipale", d: "04 91 09 91 50 — infos pratiques", h: "#contact", k: "police municipale sécurité stationnement" },
    { t: "Recensement militaire", d: "Obligatoire à 16 ans — démarche en mairie", h: "#demarches", k: "recensement militaire citoyen 16 ans jdc" },
    { t: "Seniors : OMAS et aides", d: "Office municipal d'animation des seniors, aides", h: "#seniors", k: "senior retraité omas aide âgé personne âgée" },
    { t: "Assistante sociale", d: "Permanence de l'assistante sociale", h: "#quotidien", k: "assistante sociale permanence aide social" },
    { t: "Mission locale et PLIE", d: "Emploi et insertion des jeunes et adultes", h: "#quotidien", k: "mission locale emploi plie insertion jeune travail" },
    { t: "Médiathèque René Blanc", d: "Horaires, catalogue, animations", h: "#decouvrir", k: "médiathèque bibliothèque livres lecture" },
    { t: "Associations", d: "Annuaire des associations rovenaines", h: "#associations", k: "association club sport culture annuaire" },
    { t: "Équipements sportifs", d: "Gymnase, stade, activités municipales", h: "#associations", k: "sport gymnase stade activité" },
    { t: "Don de sang", d: "Prochaines collectes au Rove", h: "#quotidien", k: "don sang collecte" },
    { t: "Bruits de voisinage", d: "Horaires autorisés pour les travaux bruyants", h: "#quotidien", k: "bruit voisinage nuisance tondeuse horaires" },
    { t: "Numéros utiles", d: "Urgences, santé, services", h: "#contact", k: "numéro utile urgence pompier samu médecin pharmacie" },
    { t: "La chèvre du Rove", d: "L'emblème de la commune", h: "#decouvrir", k: "chèvre brousse fromage emblème" },
    { t: "Patrimoine", d: "Chapelle Saint-Michel, fort de Niolon, tunnel du Rove, camp de Laure", h: "#decouvrir", k: "patrimoine chapelle fort niolon tunnel camp laure histoire" },
    { t: "Calanques", d: "Niolon, la Vesse, le littoral rovenais", h: "#decouvrir", k: "calanque plage niolon vesse mer baignade" }
  ];

  function norm(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  var ICON = '<span class="arrow" aria-hidden="true">→</span>';

  var input = document.getElementById("site-search");
  var results = document.getElementById("search-results");
  if (input && results) {
    function render(q) {
      var nq = norm(q.trim());
      if (nq.length < 2) { results.classList.remove("is-open"); results.innerHTML = ""; input.setAttribute("aria-expanded", "false"); return; }
      var words = nq.split(/\s+/);
      var hits = INDEX.filter(function (it) {
        var hay = norm(it.t + " " + it.d + " " + it.k);
        return words.every(function (w) { return hay.indexOf(w) >= 0; });
      }).slice(0, 7);
      if (!hits.length) {
        results.innerHTML = '<div class="empty">Aucun résultat. Essayez un autre mot, ou <a href="#contact" style="text-decoration:underline">contactez la mairie</a>.</div>';
      } else {
        results.innerHTML = hits.map(function (it) {
          return '<a href="' + it.h + '">' + ICON + '<span><strong>' + it.t + '</strong><small>' + it.d + '</small></span></a>';
        }).join("");
      }
      results.classList.add("is-open");
      input.setAttribute("aria-expanded", "true");
    }
    input.addEventListener("input", function () { render(input.value); });
    input.addEventListener("focus", function () { if (input.value) render(input.value); });
    document.addEventListener("click", function (e) {
      if (!results.contains(e.target) && e.target !== input) { results.classList.remove("is-open"); input.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { results.classList.remove("is-open"); input.setAttribute("aria-expanded", "false"); }
    });
    var form = input.closest("form");
    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      render(input.value);
      var first = results.querySelector("a");
      if (first) first.focus();
    });
    document.querySelectorAll("[data-search-hint]").forEach(function (b) {
      b.addEventListener("click", function () {
        input.value = b.getAttribute("data-search-hint");
        input.focus();
        render(input.value);
      });
    });
  }

  /* ---------- Onglets « Vous êtes… » ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab[role=tab]"));
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.setAttribute("tabindex", on ? "0" : "-1");
      var panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel) panel.hidden = !on;
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectTab(t); });
    t.addEventListener("keydown", function (e) {
      var j = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : -1;
      if (j < 0 && e.key === "ArrowLeft") j = tabs.length - 1;
      if (j >= tabs.length) j = 0;
      if (j >= 0) { e.preventDefault(); tabs[j].focus(); selectTab(tabs[j]); }
    });
  });
  /* Liens directs vers un profil (#parents, #seniors…) */
  document.querySelectorAll("[data-open-tab]").forEach(function (a) {
    a.addEventListener("click", function () {
      var t = document.getElementById(a.getAttribute("data-open-tab"));
      if (t) selectTab(t);
    });
  });
  function openFromHash() {
    var id = (window.location.hash || "").replace("#", "");
    var t = id ? document.querySelector('.tab[data-hash="' + id + '"]') : null;
    if (t) { selectTab(t); }
  }
  window.addEventListener("hashchange", openFromHash);
  openFromHash();

  /* ---------- Météo du Rove (Open-Meteo : gratuit, sans clé, sans traceur) ---------- */
  var weather = document.getElementById("weather");
  if (weather && window.fetch) {
    var LAT = 43.37, LON = 5.25;
    var LABELS = {
      0: ["Grand soleil", "sun"], 1: ["Ciel dégagé", "sun"], 2: ["Quelques nuages", "cloud"], 3: ["Ciel couvert", "cloud"],
      45: ["Brouillard", "cloud"], 48: ["Brouillard givrant", "cloud"],
      51: ["Bruine légère", "rain"], 53: ["Bruine", "rain"], 55: ["Bruine forte", "rain"],
      61: ["Pluie faible", "rain"], 63: ["Pluie", "rain"], 65: ["Pluie forte", "rain"],
      66: ["Pluie verglaçante", "rain"], 67: ["Pluie verglaçante", "rain"],
      71: ["Neige faible", "cloud"], 73: ["Neige", "cloud"], 75: ["Neige forte", "cloud"], 77: ["Grésil", "cloud"],
      80: ["Averses", "rain"], 81: ["Averses", "rain"], 82: ["Fortes averses", "rain"],
      85: ["Averses de neige", "cloud"], 86: ["Averses de neige", "cloud"],
      95: ["Orage", "rain"], 96: ["Orage et grêle", "rain"], 99: ["Orage et grêle", "rain"]
    };
    function q(sel) { return weather.querySelector(sel); }
    function sky(name) {
      weather.querySelectorAll("[data-sky]").forEach(function (g) { g.hidden = g.getAttribute("data-sky") !== name; });
    }
    function windLabel(speed, dir) {
      var dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
      var d = dirs[Math.round(dir / 45) % 8];
      var s = Math.round(speed);
      var txt = s + " km/h " + d;
      if (s >= 40 && (d === "NO" || d === "N" || d === "O")) txt += " · Mistral";
      return txt;
    }
    var url = "https://api.open-meteo.com/v1/forecast?latitude=" + LAT + "&longitude=" + LON +
      "&current=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min&timezone=Europe%2FParis&forecast_days=1";
    fetch(url).then(function (r) { return r.json(); }).then(function (d) {
      var c = d.current, day = d.daily;
      var code = LABELS[c.weather_code] || ["Temps variable", "cloud"];
      var windy = c.wind_speed_10m >= 45;
      q("[data-weather-temp]").textContent = Math.round(c.temperature_2m);
      q("[data-weather-desc]").textContent = windy && code[1] !== "rain" ? code[0] + ", vent fort" : code[0];
      q("[data-weather-range]").textContent = "min " + Math.round(day.temperature_2m_min[0]) + "° / max " + Math.round(day.temperature_2m_max[0]) + "°";
      q("[data-weather-wind]").textContent = windLabel(c.wind_speed_10m, c.wind_direction_10m);
      sky(windy && code[1] !== "rain" ? "wind" : code[1]);
      var t = q("[data-weather-time]");
      try { t.textContent = "à " + new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(new Date()); } catch (e) {}
      weather.classList.remove("is-loading");
    }).catch(function () {
      q("[data-weather-desc]").textContent = "Météo momentanément indisponible";
      q("[data-weather-range]").textContent = "";
      q("[data-weather-temp]").textContent = "–";
      weather.classList.remove("is-loading");
    });
    fetch("https://marine-api.open-meteo.com/v1/marine?latitude=43.35&longitude=5.25&current=sea_surface_temperature&timezone=Europe%2FParis")
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d.current && d.current.sea_surface_temperature != null) q("[data-weather-sea]").textContent = Math.round(d.current.sea_surface_temperature) + " °C"; })
      .catch(function () {});
  }

  /* ---------- Retour en haut ---------- */
  var top = document.querySelector(".back-top");
  if (top) {
    window.addEventListener("scroll", function () {
      top.classList.toggle("is-visible", window.scrollY > 600);
    }, { passive: true });
    top.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  /* ---------- Barre mobile : raccourci actif + bouton recherche ---------- */
  (function () {
    var links = document.querySelectorAll(".appbar a[href^='#']");
    if ("IntersectionObserver" in window && links.length) {
      var pairs = [];
      links.forEach(function (a) {
        var t = document.querySelector(a.getAttribute("href"));
        if (t) pairs.push({ a: a, el: t });
      });
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          pairs.forEach(function (p) { if (p.el === en.target) p.a.classList.toggle("is-active", en.isIntersecting); });
        });
      }, { rootMargin: "-40% 0px -45% 0px", threshold: 0 });
      pairs.forEach(function (p) { obs.observe(p.el); });
    }
    var sbtn = document.querySelector("[data-appbar-search]");
    var sinput = document.getElementById("site-search");
    if (sbtn && sinput) {
      sbtn.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(function () { sinput.focus(); }, 350);
      });
    }
  })();
})();
