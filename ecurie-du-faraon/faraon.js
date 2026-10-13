/* Écurie du Faraon — interactions spécifiques
   - menu mobile plein écran
   - tableau des cours : la photo épinglée change au survol / au focus d'une ligne
   - portes de box dessinées sur le plan du domaine
   - fiche de cours d'essai : validation côté client, confirmation (aucun envoi réel)
   Aucune dépendance, aucun traceur. */
(function () {
  "use strict";

  /* ---------- Menu mobile ---------- */
  var burger = document.querySelector(".burger");
  var menu = document.getElementById("mobile-menu");
  if (burger && menu) {
    function setMenu(open) {
      menu.hidden = !open;
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
      document.body.classList.toggle("menu-open", open);
    }
    burger.addEventListener("click", function () { setMenu(menu.hidden); });
    menu.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) setMenu(false); });
  }

  /* ---------- Photo épinglée du tableau des cours ---------- */
  var rows = Array.prototype.slice.call(document.querySelectorAll(".menu-board .row[data-photo]"));
  var pin = document.querySelector(".board-photo");
  var pinImg = pin ? pin.querySelector("img") : null;
  var pinCap = pin ? pin.querySelector("figcaption") : null;
  var swapTimer = null;
  function showRow(row) {
    rows.forEach(function (r) { r.classList.toggle("is-on", r === row); });
    if (!pinImg) return;
    var src = row.getAttribute("data-photo");
    if (pinImg.getAttribute("src") === src) return;
    pin.classList.add("is-swapping");
    clearTimeout(swapTimer);
    swapTimer = setTimeout(function () {
      pinImg.setAttribute("src", src);
      pinImg.onload = function () { pin.classList.remove("is-swapping"); };
      if (pinCap) pinCap.textContent = row.querySelector("h3").childNodes[0].textContent.trim();
    }, 250);
  }
  rows.forEach(function (row) {
    row.setAttribute("tabindex", "0");
    row.addEventListener("mouseenter", function () { showRow(row); });
    row.addEventListener("focus", function () { showRow(row); });
  });
  if (rows.length) showRow(rows[0]);

  /* ---------- Portes de box sur le plan ---------- */
  var doors = document.querySelector(".m-box-doors");
  if (doors) {
    var ns = "http://www.w3.org/2000/svg";
    for (var i = 0; i < 22; i++) {
      var r = document.createElementNS(ns, "rect");
      r.setAttribute("x", 386 + i * 13.6); r.setAttribute("y", 334); r.setAttribute("width", 10); r.setAttribute("height", 10);
      doors.appendChild(r);
    }
  }

  /* ---------- Fiche de cours d'essai ---------- */
  var form = document.querySelector(".sheet-form");
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
      /* Maquette : aucune donnée n'est envoyée. En production, brancher Netlify Forms,
         Formspree ou une fonction serverless. */
      msg.textContent = "Merci " + nom + ", demande bien notée (maquette : aucun envoi réel). L'écurie vous rappelle au " + form.tel.value.trim() + ".";
      form.reset();
    });
  }

  /* ---------- Année ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
