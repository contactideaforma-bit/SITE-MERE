/* AUTO ROUSSILLON — roussillon.js
   Menu mobile, signet de raccourcis, onglets d'index actifs,
   indicateur ouvert / fermé calculé sur les horaires, validation
   du formulaire (maquette : aucun envoi réel). Aucun traceur. */
(function () {
  "use strict";

  /* --- Menu mobile plein écran --- */
  var burger = document.querySelector(".burger");
  var mnav = document.getElementById("mnav");
  function fermerMenu() {
    if (!mnav || !burger) return;
    mnav.hidden = true;
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Ouvrir le menu");
    document.body.style.overflow = "";
  }
  if (burger && mnav) {
    burger.addEventListener("click", function () {
      var ouvert = mnav.hidden;
      mnav.hidden = !ouvert;
      burger.setAttribute("aria-expanded", ouvert ? "true" : "false");
      burger.setAttribute("aria-label", ouvert ? "Fermer le menu" : "Ouvrir le menu");
      document.body.style.overflow = ouvert ? "hidden" : "";
      if (ouvert) fermerSignet();
    });
    mnav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", fermerMenu); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") { fermerMenu(); fermerSignet(); } });
  }

  /* --- Signet mobile (Appeler / Itinéraire / Rendez-vous) --- */
  var signetTab = document.querySelector(".signet__tab");
  var signetPanel = document.getElementById("signet-panel");
  function fermerSignet() {
    if (!signetTab || !signetPanel) return;
    signetPanel.hidden = true;
    signetTab.setAttribute("aria-expanded", "false");
  }
  if (signetTab && signetPanel) {
    var signet = document.getElementById("signet");
    var montrerSignet = function () {
      var visible = window.scrollY > 90;
      signet.classList.toggle("is-visible", visible);
      if (!visible) fermerSignet();
    };
    montrerSignet();
    window.addEventListener("scroll", montrerSignet, { passive: true });
    signetTab.addEventListener("click", function () {
      var ouvrir = signetPanel.hidden;
      signetPanel.hidden = !ouvrir;
      signetTab.setAttribute("aria-expanded", ouvrir ? "true" : "false");
      if (ouvrir) fermerMenu();
    });
    signetPanel.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", fermerSignet); });
    document.addEventListener("click", function (e) {
      if (!signetPanel.hidden && !e.target.closest(".signet")) fermerSignet();
    });
  }

  /* --- Onglet d'index et lien de navigation actifs --- */
  var sections = Array.prototype.slice.call(document.querySelectorAll("main section[id]"));
  var onglets = document.querySelectorAll(".onglets a, .top__nav a");
  function marquerActif(id) {
    onglets.forEach(function (a) {
      var cible = a.getAttribute("href") === "#" + id;
      a.classList.toggle("is-active", cible);
      if (cible) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
  }
  if (sections.length && "IntersectionObserver" in window) {
    var visibles = {};
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visibles[en.target.id] = en.isIntersecting ? en.intersectionRatio : 0; });
      var meilleur = null, score = 0;
      Object.keys(visibles).forEach(function (k) { if (visibles[k] > score) { score = visibles[k]; meilleur = k; } });
      if (meilleur) marquerActif(meilleur);
    }, { threshold: [0.2, 0.5, 0.8], rootMargin: "-15% 0px -35% 0px" });
    sections.forEach(function (s) { obs.observe(s); });
  }

  /* --- Ouvert / fermé, calculé sur les horaires affichés --- */
  var HORAIRES = { 1: [[8, 0, 12, 0], [14, 0, 18, 30]], 2: [[8, 0, 12, 0], [14, 0, 18, 30]], 3: [[8, 0, 12, 0], [14, 0, 18, 30]], 4: [[8, 0, 12, 0], [14, 0, 18, 30]], 5: [[8, 0, 12, 0], [14, 0, 18, 30]] };
  function etatOuverture() {
    var now = new Date();
    var jour = now.getDay();
    var minutes = now.getHours() * 60 + now.getMinutes();
    var plages = HORAIRES[jour] || [];
    for (var i = 0; i < plages.length; i++) {
      var d = plages[i][0] * 60 + plages[i][1], f = plages[i][2] * 60 + plages[i][3];
      if (minutes >= d && minutes < f) {
        var reste = f - minutes;
        return { ouvert: true, texte: reste <= 30 ? "Ferme bientôt" : "Ouvert · jusqu'à " + fmt(plages[i][2], plages[i][3]) };
      }
      if (minutes < d) return { ouvert: false, texte: "Fermé · ouvre à " + fmt(plages[i][0], plages[i][1]) };
    }
    return { ouvert: false, texte: jour === 5 || jour === 6 || jour === 0 ? "Fermé · ouvre lundi 8 h" : "Fermé · ouvre demain 8 h" };
  }
  function fmt(h, m) { return h + " h" + (m ? " " + (m < 10 ? "0" + m : m) : ""); }
  function majStatut() {
    var etat = etatOuverture();
    document.querySelectorAll("[data-status]").forEach(function (el) {
      el.textContent = etat.texte;
      el.classList.toggle("is-open", etat.ouvert);
      el.classList.toggle("is-closed", !etat.ouvert);
    });
  }
  majStatut();
  setInterval(majStatut, 60000);

  /* --- Formulaire de rendez-vous : validation, aucun envoi réel --- */
  var form = document.querySelector("form[data-rdv-form]");
  if (form) {
    var erreur = form.querySelector("[data-form-error]");
    var ok = form.querySelector("[data-form-feedback]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valide = true;
      form.querySelectorAll("[required]").forEach(function (champ) {
        var vide = champ.type === "checkbox" ? !champ.checked : !champ.value.trim();
        if (champ.type === "tel" && !vide) vide = !/^[+\d][\d\s.-]{8,}$/.test(champ.value.trim());
        champ.closest(".champ").classList.toggle("is-invalid", vide);
        champ.setAttribute("aria-invalid", vide ? "true" : "false");
        if (vide) valide = false;
      });
      if (!valide) {
        if (erreur) erreur.hidden = false;
        if (ok) ok.hidden = true;
        var premier = form.querySelector(".is-invalid input, .is-invalid select, .is-invalid textarea");
        if (premier) premier.focus();
        return;
      }
      if (erreur) erreur.hidden = true;
      if (ok) { ok.hidden = false; ok.focus({ preventScroll: false }); }
      form.reset();
      form.querySelectorAll(".is-invalid").forEach(function (c) { c.classList.remove("is-invalid"); });
    });
    form.querySelectorAll("input, select, textarea").forEach(function (champ) {
      champ.addEventListener("input", function () { champ.closest(".champ").classList.remove("is-invalid"); });
    });
  }
})();
