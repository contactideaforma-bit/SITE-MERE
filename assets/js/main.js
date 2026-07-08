/* IDEA — main.js
   Interactions partagées : menu mobile, bannière cookies,
   année du footer, mise en avant du lien actif. Aucune
   dépendance externe, aucun traceur. */
(function () {
  "use strict";

  /* --- Menu mobile --- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* --- Année dans le footer --- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* --- Lien de navigation actif --- */
  var here = window.location.pathname.replace(/index\.html$/, "");
  document.querySelectorAll(".nav a[href]").forEach(function (link) {
    var href = link.getAttribute("href");
    if (!href || href.charAt(0) === "#") return;
    var normalized = href.replace(/index\.html$/, "");
    if (normalized === here || (normalized !== "/" && here.indexOf(normalized) === 0)) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });

  /* --- Bannière cookies (aucun cookie de suivi déposé par ce site) --- */
  var COOKIE_KEY = "idea-cookie-consent";
  var banner = document.getElementById("cookie-banner");
  if (banner) {
    var stored = null;
    try { stored = window.localStorage.getItem(COOKIE_KEY); } catch (e) { stored = null; }
    if (!stored) {
      banner.classList.add("is-visible");
    }
    banner.querySelectorAll("[data-consent]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        try { window.localStorage.setItem(COOKIE_KEY, btn.getAttribute("data-consent")); } catch (e) {}
        banner.classList.remove("is-visible");
      });
    });
  }

  /* --- Formulaires de démonstration : pas de backend, on informe l'utilisateur --- */
  document.querySelectorAll("form[data-demo-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var feedback = form.querySelector("[data-form-feedback]");
      if (feedback) {
        feedback.hidden = false;
        feedback.focus({ preventScroll: true });
      }
      form.reset();
    });
  });

  /* --- Révélation en douceur au défilement --- */
  var revealTargets = document.querySelectorAll(".reveal");
  var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (revealTargets.length && "IntersectionObserver" in window && !prefersReducedMotion) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealTargets.forEach(function (el) { observer.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  }
})();
