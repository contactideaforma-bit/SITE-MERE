/* Écurie du Faraon — interactions spécifiques
   - sélecteur « Trouvez votre formule » (onglets accessibles, clavier compris)
   - lien de navigation actif selon la section visible
   - formulaire de cours d'essai : pas de backend, validation côté client
     puis message de confirmation (à brancher sur Netlify Forms / Formspree)
   Aucune dépendance, aucun traceur. */
(function () {
  "use strict";

  /* ---------- Onglets « pour qui ? » ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".picker [role=tab]"));
  var panels = Array.prototype.slice.call(document.querySelectorAll(".panel[role=tabpanel]"));
  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach(function (p) {
      p.hidden = p.id !== tab.getAttribute("aria-controls");
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () { select(tab, false); });
    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === "Home") next = tabs[0];
      if (e.key === "End") next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); select(next, true); }
    });
  });

  /* ---------- Lien actif dans la navigation ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav a[href^='#']"));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute("href")); }).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    var current = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) current = en.target.id; });
      links.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === "#" + current); });
    }, { rootMargin: "-40% 0px -50% 0px" });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------- Formulaire de cours d'essai ---------- */
  var form = document.querySelector(".essai-form");
  if (form) {
    var msg = form.querySelector(".form-msg");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var nom = form.nom.value.trim();
      var tel = form.tel.value.replace(/[\s.\-]/g, "");
      var ok = nom.length >= 2 && /^(\+33|0)[1-9]\d{8}$/.test(tel) && form.consent.checked;
      msg.classList.toggle("is-error", !ok);
      if (!ok) {
        msg.textContent = "Merci d'indiquer votre nom, un numéro de téléphone valide et de cocher la case de consentement.";
        return;
      }
      /* Maquette : aucune donnée n'est envoyée. En production, remplacer par
         l'envoi vers Netlify Forms, Formspree ou une fonction serverless. */
      msg.textContent = "Merci " + nom + " ! Demande bien notée (maquette : aucun envoi réel). L'écurie vous rappelle au " + form.tel.value.trim() + ".";
      form.reset();
    });
  }
})();
