/* Carrosserie Onyx — interactions propres à la maquette :
   poussière d'or du premier écran, en-tête qui se densifie, comparateur
   avant / après, pastille d'action en éventail, immatriculation mise en
   forme, menu mobile (burger propre au site). Aucun envoi réel. */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Menu mobile --- */
  var burger = document.querySelector(".burger");
  var mnav = document.getElementById("mnav");
  if (burger && mnav) {
    var closeMenu = function () { burger.setAttribute("aria-expanded", "false"); mnav.hidden = true; document.body.style.overflow = ""; };
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      if (open) { closeMenu(); return; }
      burger.setAttribute("aria-expanded", "true"); mnav.hidden = false; document.body.style.overflow = "hidden";
    });
    mnav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeMenu); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
  }

  /* --- En-tête dense au défilement --- */
  var top = document.querySelector(".top");
  var onScroll = function () { if (top) top.classList.toggle("is-solid", window.scrollY > 40); };
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* --- Poussière d'or (canvas) --- */
  var canvas = document.querySelector(".hero__gold");
  if (canvas && !reduced && canvas.getContext) {
    var ctx = canvas.getContext("2d"), parts = [], W = 0, H = 0, raf;
    var resize = function () {
      var r = canvas.getBoundingClientRect(); var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(140, W / 9)); parts = [];
      for (var i = 0; i < n; i++) parts.push(seed(true));
    };
    var seed = function (anywhere) {
      return { x: Math.random() * W, y: anywhere ? Math.random() * H : H + 10, r: Math.random() * 1.8 + 0.4, vx: (Math.random() - 0.5) * 0.25, vy: -(Math.random() * 0.35 + 0.12), a: Math.random(), da: (Math.random() * 0.012 + 0.004) * (Math.random() < 0.5 ? 1 : -1) };
    };
    var draw = function () {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i]; p.x += p.vx; p.y += p.vy; p.a += p.da;
        if (p.a <= 0 || p.a >= 1) p.da *= -1;
        if (p.y < -10) parts[i] = p = seed(false);
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        g.addColorStop(0, "rgba(248,231,168," + (0.9 * p.a) + ")"); g.addColorStop(1, "rgba(212,175,55,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    resize(); draw();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", function () { if (document.hidden) cancelAnimationFrame(raf); else draw(); });
  }

  /* --- Avant / après --- */
  document.querySelectorAll("[data-ba]").forEach(function (box) {
    var range = box.querySelector(".ba__range");
    var set = function (v) { box.style.setProperty("--pos", v + "%"); };
    range.addEventListener("input", function () { set(range.value); });
    set(range.value);
  });

  /* --- Pastille d'action en éventail --- */
  var coin = document.querySelector("[data-coin]");
  if (coin) {
    var btn = coin.querySelector(".coin__btn");
    btn.addEventListener("click", function () {
      var open = coin.classList.toggle("is-open"); btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    coin.querySelectorAll(".coin__item").forEach(function (a) { a.addEventListener("click", function () { coin.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); }); });
    document.addEventListener("click", function (e) { if (!coin.contains(e.target)) { coin.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); } });
  }

  /* --- Immatriculation AB-123-CD en direct --- */
  var immat = document.querySelector('input[name="immat"]');
  if (immat) immat.addEventListener("input", function () {
    var v = immat.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7);
    var out = v.slice(0, 2); if (v.length > 2) out += "-" + v.slice(2, 5); if (v.length > 5) out += "-" + v.slice(5, 7);
    immat.value = out;
  });

  /* --- Validation du formulaire (main.js affiche le message de maquette) --- */
  var form = document.querySelector("form[data-demo-form]");
  if (form) {
    form.addEventListener("submit", function (e) {
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (f) {
        var bad = f.type === "checkbox" ? !f.checked : !f.value.trim();
        if (f.type === "tel" && f.value.trim() && !/^(\+33|0)[1-9](\s?\d{2}){4}$/.test(f.value.trim())) bad = true;
        f.classList.toggle("is-invalid", bad); if (bad) ok = false;
      });
      if (!ok) { e.preventDefault(); e.stopImmediatePropagation(); var m = form.querySelector(".form__err"); m.hidden = false; m.textContent = "Merci de compléter les champs en rouge (nom, téléphone à 10 chiffres, description et consentement)."; }
    }, true);
  }
})();
