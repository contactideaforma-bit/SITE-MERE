/* Trinapoli Marseille — appli de commande (maquette)
   Panier, fiche produit, créneaux de retrait, suivi de commande,
   fidélité, installation PWA. Les commandes passent par le
   navigateur (localStorage + BroadcastChannel) pour être vues en
   direct par l'espace comptoir : aucune donnée n'est envoyée. */
(function () {
  "use strict";

  var IMG = "https://trinapoli59.fr/wp-content/uploads/";
  var UNS = "https://images.unsplash.com/";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var euro = function (n) { return n.toFixed(2).replace(".", ",") + " €"; };
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var hhmm = function (d) { return pad(d.getHours()) + ":" + pad(d.getMinutes()); };

  /* --- stockage tolérant --- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var bc = null; try { bc = new BroadcastChannel("trinapoli"); } catch (e) {}
  function emit(type) { if (bc) { try { bc.postMessage({ type: type }); } catch (e) {} } }

  /* --- la carte (contenu repris de trinapoli59.fr ; prix de démonstration) --- */
  var PANUOZZI = [
    { id: "trinapoli", n: 1, name: "Le Trinapoli", tag: "La signature", price: 11.9, img: IMG + "2026/10/trinapoli-11-10-2026-a-22.56.07-67.png",
      ing: ["Pesto genovese", "Salade", "Poivrons grillés", "Crème balsamique", "Stracciatella", "Oignons caramélisés", "Bacon de dinde", "Dinde aurora"] },
    { id: "portofino", n: 2, name: "Le Portofino", price: 10.9, img: IMG + "2026/10/trinapoli-11-10-2026-a-22.56.07-63.png",
      ing: ["Bacon de dinde", "Jambon de dinde fumé", "Provola fumée", "Crème balsamique", "Crème de poivrons", "Salade de mesclun"] },
    { id: "truffe", n: 3, name: "Le Truffé", tag: "Le plus commandé", price: 12.9, img: IMG + "2026/10/trinapoli-11-10-2026-a-22.56.07-72.png",
      ing: ["Crème à la truffe", "Dinde à la truffe", "Stracciatella", "Roquette", "Parmesan", "Filet d'huile d'olive", "Crème balsamique"] },
    { id: "veau", n: 4, name: "Le Veau", price: 12.5, img: IMG + "2026/10/trinapoli-11-10-2026-a-22.56.07-73.png",
      ing: ["Base huile d'olive", "Jambon de veau", "Raclette", "Aubergines grillées", "Oignons caramélisés", "Poivrons grillés", "Roquette", "Balsamique"] },
    { id: "mortadella", n: 5, name: "La Mortadella pistache", price: 12.5, img: IMG + "2026/10/trinapoli-11-10-2026-a-22.56.07-35.png",
      ing: ["Mortadelle", "Pistache", "Stracciatella"], note: "composition à confirmer" },
    { id: "pastrami", n: 6, name: "Le Pastrami", price: 12.9, img: IMG + "2026/10/trinapoli-11-10-2026-a-22.56.07-19.png",
      ing: ["Crème de poivrons", "Pastrami bœuf et veau", "Raclette", "Provolone", "Oignons caramélisés", "Roquette", "Huile d'olive", "Balsamique"] }
  ];
  var BEV = [
    ["cedrata", "Cedrata", "cedrata"], ["citron", "Citron", "Citron"], ["cola", "Cola", "cola"],
    ["gazeuse", "Gazeuse citronnée", "Gazeuse-citronne"], ["grenade", "Grenade", "GRENADE"],
    ["mandarine", "Mandarine verte", "MANDARINE-VERTE"], ["orange-rouge", "Orange rouge", "Orange-rouge"],
    ["orange", "Orange", "orange"], ["the-limone", "Thé limone", "the-limone"],
    ["the-peche", "Thé pêche melon", "The-peche-melon"], ["the-verde", "Thé verde", "the-verde"], ["tonica", "Tonica", "TONICA"]
  ].map(function (b) { return { id: b[0], name: b[1], price: 3.2, img: IMG + "2026/09/" + b[2] + "-300x300.png", cat: "bevande" }; });
  var DOL = [
    ["tiramisu", "Tiramisu fait maison", UNS + "photo-1560745373-dbc6c3f97194?auto=format&fit=crop&w=200&h=200&q=70"],
    ["speculos", "Spéculos", IMG + "2026/09/SPECULOS-300x300.png"],
    ["pannacotta", "Pannacotta mangue passion coco", IMG + "2026/09/pannacotta-mangue-passion-coco-300x300.png"],
    ["mousse", "Mousse au chocolat", IMG + "2026/09/mousse-au-chocolat-300x300.png"],
    ["matcha", "Matcha framboise", IMG + "2026/09/matcha-framboise-300x300.png"],
    ["liegeois", "Liégeois", IMG + "2026/09/liegois-300x300.png"],
    ["cheesecake-citron", "Cheesecake citron vert", IMG + "2026/09/Cheese-cake-citron-vert-300x300.png"],
    ["cheesecake-fruits", "Cheesecake fruits rouges", IMG + "2026/09/cheescake-fruits-rouge-300x300.png"]
  ].map(function (d) { return { id: d[0], name: d[1], price: 4.5, img: d[2], cat: "dolci" }; });
  var EXTRAS = [{ id: "stracciatella", name: "Stracciatella", price: 2 }, { id: "provola", name: "Provola fumée", price: 1.5 }, { id: "truffe", name: "Crème de truffe", price: 2 }, { id: "pistache", name: "Crème de pistache", price: 1.5 }];
  var FORMULE_PRICE = 5.9; /* boisson + dessert au lieu de 7,70 € */
  var ALL = {};
  PANUOZZI.forEach(function (p) { p.cat = "panuozzi"; ALL[p.id] = p; });
  BEV.forEach(function (p) { ALL[p.id] = p; });
  DOL.forEach(function (p) { ALL[p.id] = p; });

  function isOut(id) { return (store.get("trinapoli-stock", []) || []).indexOf(id) > -1; }
  function isPaused() { return !!store.get("trinapoli-pause", false); }

  /* ================== RENDU DE LA CARTE ================== */
  function renderBoard() {
    var ul = $("[data-list='panuozzi']"); if (!ul) return;
    ul.innerHTML = PANUOZZI.map(function (p) {
      var out = isOut(p.id);
      return '<li class="dish' + (out ? " is-out" : "") + '" data-id="' + p.id + '" tabindex="0">' +
        '<img class="dish-img" src="' + p.img + '" alt="" loading="lazy" width="150" height="170">' +
        '<div class="dish-body"><h3>' + p.name + (p.tag ? '<span class="dish-tag">' + p.tag + '</span>' : "") + '</h3>' +
        '<p class="dish-ing">' + p.ing.join(", ") + (p.note ? ' <span class="placeholder-flag">' + p.note + '</span>' : "") + '</p>' +
        '<div class="dish-foot"><span class="price">' + euro(p.price) + '</span>' +
        (out ? '<span class="out-flag">Épuisé aujourd\'hui</span>' : '<button class="add" type="button" data-add="' + p.id + '" aria-label="Composer ' + p.name + '">Ajouter</button>') + '</div></div></li>';
    }).join("");
  }
  function renderFormules() {
    var el = $("[data-panel='formules']"); if (!el) return;
    el.innerHTML =
      '<article class="formule"><span class="save">La plus prise</span><h3>Formule Trinapoli</h3><p>Le panuozzo de votre choix, une bouteille italienne et un dessert maison.</p><span class="price">Panuozzo + ' + euro(FORMULE_PRICE) + '</span><button class="btn-rose" type="button" data-formule="truffe">Composer ma formule</button></article>' +
      '<article class="formule"><span class="save">Pour deux</span><h3>Duo à partager</h3><p>Deux panuozzi au choix, deux boissons : idéal pour la pause du midi au bureau.</p><span class="price">dès ' + euro(2 * 10.9 + 2 * 3.2 - 2) + '</span><button class="btn-line" type="button" data-tab-go="panuozzi">Choisir mes panuozzi</button></article>' +
      '<article class="formule"><span class="save">Équipes &amp; événements</span><h3>Plateau bureau</h3><p>Panuozzi coupés en bouchées, préparés à l\'avance, prêts à partager pour 8 à 20 personnes.</p><span class="price"><span class="placeholder-flag">sur devis</span></span><a class="btn-line" href="mailto:trinapoli59@gmail.com?subject=Plateau%20bureau%20Marseille">Demander un devis</a></article>';
  }
  function renderShelf() {
    var ul = $("[data-list='bevande']"); if (!ul) return;
    ul.innerHTML = BEV.map(function (b) {
      return '<li class="bottle" data-id="' + b.id + '"><button type="button" data-quick="' + b.id + '" aria-label="Ajouter ' + b.name + ' au sac"><img src="' + b.img + '" alt="" loading="lazy" width="150" height="150"><b>' + b.name + '</b><span>' + euro(b.price) + '</span></button></li>';
    }).join("");
  }
  function renderDolci() {
    var ul = $("[data-list='dolci']"); if (!ul) return;
    ul.innerHTML = DOL.map(function (d) {
      return '<li class="dolce" data-quick="' + d.id + '" tabindex="0" role="button" aria-label="Ajouter ' + d.name + ' au sac"><img src="' + d.img + '" alt="" loading="lazy" width="72" height="72"><div><b>' + d.name + '</b><span>' + euro(d.price) + '</span></div></li>';
    }).join("");
  }

  /* onglets */
  function showTab(name) {
    $$(".tabs [data-tab]").forEach(function (b) { b.setAttribute("aria-selected", b.getAttribute("data-tab") === name ? "true" : "false"); });
    $$("[data-panel]").forEach(function (p) { p.hidden = p.getAttribute("data-panel") !== name; });
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-tab]"); if (t) { showTab(t.getAttribute("data-tab")); }
    var g = e.target.closest("[data-tab-go]"); if (g) { showTab(g.getAttribute("data-tab-go")); }
  });

  /* vitrine : la grande photo suit le panuozzo survolé */
  var vImg = $("[data-vitrine-img]"), vCap = $("[data-vitrine-cap]"), vCurrent = "trinapoli";
  function setVitrine(id) {
    if (!vImg || id === vCurrent) return; vCurrent = id; var p = ALL[id];
    $$(".dish").forEach(function (d) { d.classList.toggle("is-active", d.getAttribute("data-id") === id); });
    vImg.classList.add("swap");
    setTimeout(function () { vImg.src = p.img; vCap.textContent = "N°" + p.n + " · " + p.name; vImg.classList.remove("swap"); }, 220);
  }
  document.addEventListener("mouseover", function (e) { var d = e.target.closest && e.target.closest(".dish"); if (d) setVitrine(d.getAttribute("data-id")); });
  document.addEventListener("focusin", function (e) { var d = e.target.closest && e.target.closest(".dish"); if (d) setVitrine(d.getAttribute("data-id")); });

  /* ================== FICHE PRODUIT ================== */
  var sheet = $("[data-sheet]"), sheetBody = $("[data-sheet-body]"), draft = null, lastFocus = null;
  function openSheet(id, withFormule) {
    var p = ALL[id]; if (!p || isOut(id)) return;
    lastFocus = document.activeElement;
    draft = { id: id, minus: [], plus: [], formule: !!withFormule, drink: "cedrata", dessert: "tiramisu", qty: 1 };
    sheetBody.innerHTML =
      '<div class="sheet-photo"><img src="' + p.img + '" alt="' + p.name + ', photo Trinapoli" width="600" height="600"></div>' +
      '<form class="sheet-form" data-sheet-form>' +
      '<h2 id="sheet-title">' + p.name + '</h2><p class="lede">Pain sorti du four, ouvert à la main et garni à la commande. ' + (p.note ? '<span class="placeholder-flag">' + p.note + '</span>' : "") + '</p>' +
      '<div class="group"><p>Sans… <small>touchez pour retirer</small></p><div class="chips">' +
      p.ing.map(function (i) { return '<button type="button" class="chip minus" aria-pressed="false" data-minus="' + i + '">' + i + '</button>'; }).join("") + '</div></div>' +
      '<div class="group"><p>En plus <small>options à valider</small></p><div class="chips">' +
      EXTRAS.map(function (x) { return '<button type="button" class="chip plus" aria-pressed="false" data-plus="' + x.id + '">+ ' + x.name + '<em>' + euro(x.price) + '</em></button>'; }).join("") + '</div></div>' +
      '<label class="formule-toggle"><input type="checkbox" data-formule-toggle' + (withFormule ? " checked" : "") + '><span><b>Passer en formule · + ' + euro(FORMULE_PRICE) + '</b><br><small>Boisson italienne + dessert maison (au lieu de ' + euro(7.7) + ')</small></span></label>' +
      '<div class="formule-picks" data-picks' + (withFormule ? "" : " hidden") + '>' +
      '<div class="field"><label for="pick-drink">Boisson</label><select id="pick-drink" data-drink>' + BEV.map(function (b) { return '<option value="' + b.id + '">' + b.name + '</option>'; }).join("") + '</select></div>' +
      '<div class="field"><label for="pick-dessert">Dessert</label><select id="pick-dessert" data-dessert>' + DOL.map(function (d) { return '<option value="' + d.id + '">' + d.name + '</option>'; }).join("") + '</select></div></div>' +
      '<div class="sheet-foot"><div class="qty"><button type="button" data-q="-1" aria-label="Moins">−</button><output data-qty>1</output><button type="button" data-q="1" aria-label="Plus">+</button></div>' +
      '<button class="btn-rose" type="submit" data-sheet-add>Ajouter · ' + euro(p.price) + '</button></div></form>';
    sheet.hidden = false; document.body.style.overflow = "hidden";
    updateSheetPrice();
    setTimeout(function () { var x = $(".sheet-panel .x"); if (x) x.focus(); }, 30);
  }
  function lineUnit(d) {
    var p = ALL[d.id], u = p.price;
    d.plus.forEach(function (x) { EXTRAS.forEach(function (e) { if (e.id === x) u += e.price; }); });
    if (d.formule) u += FORMULE_PRICE;
    return u;
  }
  function updateSheetPrice() { var b = $("[data-sheet-add]"); if (b && draft) b.textContent = "Ajouter · " + euro(lineUnit(draft) * draft.qty); }
  function closeSheet() { sheet.hidden = true; document.body.style.overflow = ""; draft = null; if (lastFocus) lastFocus.focus(); }
  sheet.addEventListener("click", function (e) {
    if (e.target.closest("[data-close-sheet]")) return closeSheet();
    var m = e.target.closest("[data-minus]"), pl = e.target.closest("[data-plus]"), q = e.target.closest("[data-q]");
    if (m) { var v = m.getAttribute("data-minus"), on = m.getAttribute("aria-pressed") !== "true"; m.setAttribute("aria-pressed", on); draft.minus = on ? draft.minus.concat(v) : draft.minus.filter(function (x) { return x !== v; }); }
    if (pl) { var w = pl.getAttribute("data-plus"), on2 = pl.getAttribute("aria-pressed") !== "true"; pl.setAttribute("aria-pressed", on2); draft.plus = on2 ? draft.plus.concat(w) : draft.plus.filter(function (x) { return x !== w; }); }
    if (q) { draft.qty = Math.max(1, Math.min(20, draft.qty + Number(q.getAttribute("data-q")))); $("[data-qty]").textContent = draft.qty; }
    updateSheetPrice();
  });
  sheet.addEventListener("change", function (e) {
    if (e.target.matches("[data-formule-toggle]")) { draft.formule = e.target.checked; $("[data-picks]").hidden = !draft.formule; }
    if (e.target.matches("[data-drink]")) draft.drink = e.target.value;
    if (e.target.matches("[data-dessert]")) draft.dessert = e.target.value;
    updateSheetPrice();
  });
  sheet.addEventListener("submit", function (e) {
    e.preventDefault(); if (!draft) return;
    var img = $(".sheet-photo img");
    addLine({ id: draft.id, minus: draft.minus, plus: draft.plus, formule: draft.formule ? { drink: draft.drink, dessert: draft.dessert } : null, qty: draft.qty }, img);
    closeSheet();
  });

  /* ================== PANIER ================== */
  var cart = store.get("trinapoli-cart", []) || [];
  var checkout = { step: "bag", mode: "emporter", slot: null, pay: "comptoir", name: "", phone: "", note: "" };
  function saveCart() { store.set("trinapoli-cart", cart); refreshBadges(); }
  function key(l) { return [l.id, l.minus.join("|"), l.plus.join("|"), l.formule ? l.formule.drink + l.formule.dessert : ""].join("#"); }
  function unitOf(l) { return lineUnit({ id: l.id, plus: l.plus || [], formule: !!l.formule }); }
  function totalOf() { return cart.reduce(function (s, l) { return s + unitOf(l) * l.qty; }, 0); }
  function countOf() { return cart.reduce(function (s, l) { return s + l.qty; }, 0); }
  function addLine(line, fromImg) {
    if (isPaused()) { toast("Le restaurant a mis les commandes en ligne en pause quelques minutes. Réessayez très vite."); return; }
    line.minus = line.minus || []; line.plus = line.plus || [];
    var k = key(line), found = null;
    cart.forEach(function (l) { if (key(l) === k) found = l; });
    if (found) found.qty += line.qty; else cart.push(line);
    saveCart(); fly(fromImg);
    toast(ALL[line.id].name + " ajouté à votre commande");
  }
  function fly(img) {
    var target = window.innerWidth <= 960 ? $(".widget-btn") : $(".top-bag");
    if (!img || !target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { bump(); return; }
    var a = img.getBoundingClientRect(), b = target.getBoundingClientRect();
    var f = document.createElement("img"); f.src = img.src; f.className = "flyer"; f.alt = "";
    f.style.left = (a.left + a.width / 2 - 32) + "px"; f.style.top = (a.top + a.height / 2 - 32) + "px";
    document.body.appendChild(f);
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      f.style.transform = "translate(" + (b.left + b.width / 2 - a.left - a.width / 2) + "px," + (b.top + b.height / 2 - a.top - a.height / 2) + "px) scale(.3)"; f.style.opacity = ".2";
    }); });
    setTimeout(function () { f.remove(); bump(); }, 720);
  }
  function bump() { var s = $(".top-bag"); if (s) { s.classList.remove("bump"); void s.offsetWidth; s.classList.add("bump"); } }
  function refreshBadges() {
    var c = countOf(), t = totalOf();
    $$("[data-cart-count]").forEach(function (el) { el.textContent = c; });
    var pala = $("[data-pala]"); if (!pala) return;
    pala.classList.toggle("has-items", c > 0);
    $("[data-pala-title]").textContent = c ? (c > 1 ? c + " articles · " + euro(t) : "1 article · " + euro(t)) : "Votre commande est vide";
    $("[data-pala-total]").textContent = c ? "Commander" : "La carte";
  }
  function describe(l) {
    var bits = [];
    if (l.minus && l.minus.length) bits.push("sans " + l.minus.join(", ").toLowerCase());
    if (l.plus && l.plus.length) bits.push("+ " + l.plus.map(function (x) { var n = x; EXTRAS.forEach(function (e) { if (e.id === x) n = e.name; }); return n.toLowerCase(); }).join(", "));
    if (l.formule) bits.push("formule : " + ALL[l.formule.drink].name + " + " + ALL[l.formule.dessert].name);
    return bits.join(" · ");
  }

  var cartEl = $("[data-cart]"), cartBody = $("[data-cart-body]"), cartTitle = $("[data-cart-title]");
  function openCart() {
    if (!countOf()) {
      var cur = null, cid = currentOrderId(); orders().forEach(function (o) { if (o.id === cid && o.status !== "remise") cur = o; });
      if (cur) checkout.step = "done";
      else { document.getElementById("carte").scrollIntoView({ behavior: "smooth" }); return; }
    } else if (checkout.step === "done") checkout.step = "bag";
    lastFocus = document.activeElement; cartEl.hidden = false; document.body.style.overflow = "hidden"; renderCart();
    setTimeout(function () { var x = $(".cart-head .x"); if (x) x.focus(); }, 30);
  }
  function closeCart() { cartEl.hidden = true; document.body.style.overflow = ""; if (checkout.step === "done") { checkout.step = "bag"; } if (lastFocus) lastFocus.focus(); }
  function stepsBar(n) { var s = ["Ma commande", "Retrait", "Suivi"]; return '<div class="steps-bar">' + s.map(function (x, i) { return '<span class="' + (i <= n ? "on" : "") + '">' + x + '</span>'; }).join("") + '</div>'; }

  function slotsList() {
    var now = new Date(), base = new Date(now.getTime() + 15 * 60000);
    base.setMinutes(Math.ceil(base.getMinutes() / 10) * 10, 0, 0);
    var out = [];
    for (var i = 0; i < 8; i++) {
      var d = new Date(base.getTime() + i * 10 * 60000);
      var seed = (d.getHours() * 7 + d.getMinutes() * 3) % 9;
      out.push({ t: hhmm(d), left: i === 2 ? 0 : Math.max(1, 8 - seed) });
    }
    return out;
  }

  function renderCart() {
    var s = checkout.step;
    if (s === "bag") {
      cartTitle.textContent = "Ma commande";
      var hasFormule = cart.some(function (l) { return l.formule; });
      var hasDrink = cart.some(function (l) { return ALL[l.id].cat === "bevande"; });
      cartBody.innerHTML = stepsBar(0) + cart.map(function (l, i) {
        var p = ALL[l.id];
        return '<div class="line-item"><img src="' + p.img + '" alt="" width="64" height="64"><div><b>' + p.name + '</b><small>' + (describe(l) || "Comme sur la carte") + '</small>' +
          '<div class="qty"><button type="button" data-line="' + i + '" data-d="-1" aria-label="Retirer un">−</button><output>' + l.qty + '</output><button type="button" data-line="' + i + '" data-d="1" aria-label="Ajouter un">+</button></div></div>' +
          '<span class="line-price">' + euro(unitOf(l) * l.qty) + '</span></div>';
      }).join("") +
      (!hasFormule && !hasDrink ? '<div class="upsell"><img src="' + BEV[0].img + '" alt=""><p>Une <b>Cedrata</b> bien fraîche avec votre commande ?</p><button class="add" type="button" data-quick="cedrata">+ ' + euro(3.2) + '</button></div>' : "") +
      '<div class="totals"><div><span>Articles</span><span>' + countOf() + '</span></div><div class="grand"><span>Total</span><span>' + euro(totalOf()) + '</span></div><div><small>Prix de démonstration, à confirmer · commission plateforme : 0 €</small></div></div>' +
      '<div class="cart-actions"><button class="btn-rose" type="button" data-next>Choisir mon heure de retrait</button><button class="linkish" type="button" data-close-cart>Continuer mes choix</button></div>';
    } else if (s === "details") {
      cartTitle.textContent = "Retrait";
      var sl = slotsList(); if (!checkout.slot) { sl.some(function (x) { if (x.left) { checkout.slot = x.t; return true; } return false; }); }
      cartBody.innerHTML = stepsBar(1) +
        '<div class="group"><p>Sur place ou à emporter</p><div class="seg"><button type="button" data-mode="emporter" aria-pressed="' + (checkout.mode === "emporter") + '">À emporter</button><button type="button" data-mode="place" aria-pressed="' + (checkout.mode === "place") + '">Sur place</button></div></div>' +
        '<div class="group"><p>Heure de retrait <small>places restantes</small></p><div class="slots">' + sl.map(function (x) {
          return '<button type="button" class="slot" data-slot="' + x.t + '" aria-pressed="' + (checkout.slot === x.t) + '"' + (x.left ? "" : " disabled") + '><b>' + x.t + '</b><small>' + (x.left ? x.left + " place" + (x.left > 1 ? "s" : "") : "complet") + '</small></button>';
        }).join("") + '</div></div>' +
        '<form data-details novalidate class="group" style="display:grid;gap:.8rem"><p>Mes coordonnées</p>' +
        '<div class="field"><label for="c-name">Prénom</label><input id="c-name" name="name" autocomplete="given-name" value="' + esc(checkout.name) + '" required></div>' +
        '<div class="field"><label for="c-phone">Téléphone (pour te prévenir)</label><input id="c-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" value="' + esc(checkout.phone) + '" required></div>' +
        '<div class="field"><label for="c-note">Un mot pour le comptoir</label><input id="c-note" name="note" value="' + esc(checkout.note) + '" placeholder="Bien chaud, coupé en deux…"></div>' +
        '<div class="pay"><label><input type="radio" name="pay" value="comptoir"' + (checkout.pay === "comptoir" ? " checked" : "") + '><span>Je paie au comptoir<small>Carte, espèces ou titres-restaurant <span class="placeholder-flag">à confirmer</span></small></span></label>' +
        '<label><input type="radio" name="pay" value="carte"' + (checkout.pay === "carte" ? " checked" : "") + '><span>Je paie maintenant par carte<small>Paiement sécurisé Stripe dans la version finale (inactif ici)</small></span></label></div>' +
        '<label class="consent"><input type="checkbox" name="consent" required><span>J\'accepte que mon prénom et mon téléphone servent uniquement au traitement de cette commande. <a href="mentions-legales.html#donnees">En savoir plus</a></span></label>' +
        '<p class="form-msg err" data-err hidden tabindex="-1"></p>' +
        '<div class="totals"><div class="grand"><span>À régler</span><span>' + euro(totalOf()) + '</span></div></div>' +
        '<div class="cart-actions"><button class="btn-rose" type="submit">Envoyer ma commande</button><button class="linkish" type="button" data-back>← Revenir au sac</button></div></form>';
    } else if (s === "done") {
      renderTracking();
    }
  }
  function esc(v) { return String(v || "").replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  cartEl.addEventListener("click", function (e) {
    if (e.target.closest("[data-close-cart]")) return closeCart();
    var d = e.target.closest("[data-d]");
    if (d) { var i = Number(d.getAttribute("data-line")); cart[i].qty += Number(d.getAttribute("data-d")); if (cart[i].qty <= 0) cart.splice(i, 1); saveCart(); if (!cart.length) { closeCart(); return; } renderCart(); }
    if (e.target.closest("[data-next]")) { checkout.step = "details"; renderCart(); }
    if (e.target.closest("[data-back]")) { keepFields(); checkout.step = "bag"; renderCart(); }
    var m = e.target.closest("[data-mode]"); if (m) { keepFields(); checkout.mode = m.getAttribute("data-mode"); renderCart(); }
    var sl = e.target.closest("[data-slot]"); if (sl && !sl.disabled) { keepFields(); checkout.slot = sl.getAttribute("data-slot"); renderCart(); }
    if (e.target.closest("[data-sim]")) { advance(currentOrderId()); }
    if (e.target.closest("[data-again]")) { checkout.step = "bag"; closeCart(); document.getElementById("carte").scrollIntoView({ behavior: "smooth" }); }
  });
  function keepFields() {
    var f = $("[data-details]"); if (!f) return;
    checkout.name = f.name.value; checkout.phone = f.phone.value; checkout.note = f.note.value;
    var p = f.querySelector("input[name=pay]:checked"); if (p) checkout.pay = p.value;
  }
  cartEl.addEventListener("submit", function (e) {
    if (!e.target.matches("[data-details]")) return;
    e.preventDefault(); keepFields();
    var f = e.target, err = $("[data-err]"), problems = [];
    f.name.classList.toggle("invalid", !checkout.name.trim()); if (!checkout.name.trim()) problems.push("votre prénom");
    var okPhone = /^(\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}$/.test(checkout.phone.trim());
    f.phone.classList.toggle("invalid", !okPhone); if (!okPhone) problems.push("un numéro de téléphone français valide");
    if (!f.consent.checked) problems.push("votre accord pour l'utilisation de vos coordonnées");
    if (!checkout.slot) problems.push("une heure de retrait");
    if (problems.length) { err.hidden = false; err.textContent = "Il manque " + problems.join(", ") + "."; err.focus(); return; }
    if (isPaused()) { err.hidden = false; err.textContent = "Le restaurant a mis les commandes en ligne en pause. Réessayez dans quelques minutes."; err.focus(); return; }
    placeOrder();
  });

  /* ================== COMMANDES & SUIVI ================== */
  var STATUS = ["recue", "four", "prete", "remise"];
  function orders() { return store.get("trinapoli-orders", []) || []; }
  function saveOrders(list) { store.set("trinapoli-orders", list); emit("orders"); }
  function currentOrderId() { return store.get("trinapoli-current", null); }
  function placeOrder() {
    var list = orders(), num = "T-" + (400 + list.length + 27);
    var o = {
      id: num, at: Date.now(), slot: checkout.slot, mode: checkout.mode, pay: checkout.pay,
      name: checkout.name.trim(), phone: checkout.phone.trim(), note: checkout.note.trim(),
      lines: cart.map(function (l) { return { id: l.id, name: ALL[l.id].name, qty: l.qty, detail: describe(l), total: unitOf(l) * l.qty }; }),
      total: totalOf(), status: "recue"
    };
    list.push(o); saveOrders(list); store.set("trinapoli-current", num);
    var stamps = store.get("trinapoli-stamps", 0) || 0;
    cart.forEach(function (l) { if (ALL[l.id].cat === "panuozzi") stamps += l.qty; });
    store.set("trinapoli-stamps", stamps);
    store.set("trinapoli-habituel", cart);
    cart = []; saveCart();
    checkout.step = "done"; checkout.slot = null; renderCart();
  }
  function advance(id) {
    var list = orders(); list.forEach(function (o) { if (o.id === id) { var i = STATUS.indexOf(o.status); if (i < 2) o.status = STATUS[i + 1]; } }); saveOrders(list);
    if (!cartEl.hidden && checkout.step === "done") renderTracking();
  }
  function renderTracking() {
    var id = currentOrderId(), o = null; orders().forEach(function (x) { if (x.id === id) o = x; });
    if (!o) return;
    cartTitle.textContent = "Ma commande";
    var idx = STATUS.indexOf(o.status), labels = ["Reçue", "En préparation", "Prête"];
    var stamps = (store.get("trinapoli-stamps", 0) || 0) % 10;
    cartBody.innerHTML = stepsBar(2) +
      '<div class="ticket"><small>Commande envoyée</small><div class="num">' + o.id + '</div><p><b>' + esc(o.name) + '</b> · retrait à <b>' + o.slot + '</b> · ' + (o.mode === "place" ? "sur place" : "à emporter") + '</p><p>' + euro(o.total) + ' · ' + (o.pay === "carte" ? "payé en ligne (maquette)" : "à régler au comptoir") + '</p>' +
      '<ol class="track">' + labels.map(function (l, i) { return '<li class="' + (i < idx || o.status === "remise" ? "done" : i === idx ? "now" : "") + '"><i></i>' + l + '</li>'; }).join("") + '</ol></div>' +
      '<p class="hint">Maquette : aucune commande réelle n\'est envoyée. Le statut avance quand le commerçant clique dans <a href="comptoir.html" target="_blank" rel="noopener">l\'espace comptoir</a> (ouvrez-le dans un autre onglet), ou <button class="linkish" type="button" data-sim style="min-height:0;padding:0">simulez l\'étape suivante</button>.</p>' +
      '<div class="loyal"><p>Ma carte fidélité · ' + stamps + '/10</p><div class="stamps">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (i) { return '<i class="' + (i === 9 ? "gift" : i < stamps ? "on" : "") + '"></i>'; }).join("") + '</div></div>' +
      '<div class="cart-actions"><button class="btn-line" type="button" data-again>Commander autre chose</button></div>';
  }
  function onSync() {
    renderBoard(); refreshBadges();
    if (!cartEl.hidden && checkout.step === "done") renderTracking();
  }
  if (bc) bc.onmessage = onSync;
  window.addEventListener("storage", function (e) { if (e.key && e.key.indexOf("trinapoli-") === 0) { if (e.key === "trinapoli-cart") cart = store.get("trinapoli-cart", []); onSync(); } });

  /* ================== CLICS GÉNÉRAUX ================== */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-add]"); if (a) { e.stopPropagation(); openSheet(a.getAttribute("data-add")); return; }
    var fo = e.target.closest("[data-formule]"); if (fo) { openSheet(fo.getAttribute("data-formule"), true); return; }
    var q = e.target.closest("[data-quick]");
    if (q) {
      var id = q.getAttribute("data-quick"); var img = q.querySelector("img");
      addLine({ id: id, qty: 1 }, img);
      var li = q.closest(".bottle"); if (li) { li.classList.remove("added"); void li.offsetWidth; li.classList.add("added"); }
      if (!cartEl.hidden) renderCart();
      return;
    }
    var d = e.target.closest(".dish"); if (d && !e.target.closest("a")) { openSheet(d.getAttribute("data-id")); return; }
    if (e.target.closest("[data-open-cart]")) openCart();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { if (!sheet.hidden) closeSheet(); else if (!cartEl.hidden) closeCart(); else if (menu && !menu.hidden) toggleMenu(false); }
    if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches(".dish, .dolce")) {
      e.preventDefault(); if (e.target.matches(".dish")) openSheet(e.target.getAttribute("data-id")); else e.target.click();
    }
  });

  /* ================== TOAST ================== */
  var toastEl = $("[data-toast]"), toastT;
  function toast(msg) { if (!toastEl) return; toastEl.textContent = msg; toastEl.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("show"); }, 2600); }

  /* ================== MENU MOBILE ================== */
  var burger = $(".tn-burger"), menu = $("#tn-menu");
  function toggleMenu(open) { if (!menu) return; menu.hidden = !open; burger.setAttribute("aria-expanded", open); burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu"); document.body.style.overflow = open ? "hidden" : ""; document.body.classList.toggle("menu-open", open); }
  if (burger) burger.addEventListener("click", function () { toggleMenu(menu.hidden); });
  if (menu) menu.addEventListener("click", function (e) { if (e.target.closest("a")) toggleMenu(false); });

  /* ================== EN-TÊTE : transparent puis crème ================== */
  var top = $("[data-top]"), ribbon = $(".demo-ribbon");
  function placeTop() {
    var rh = ribbon ? ribbon.offsetHeight : 0, y = window.scrollY || 0;
    if (y > rh) { top.classList.add("solid"); top.style.position = "fixed"; top.style.top = "0px"; }
    else { top.classList.remove("solid"); top.style.position = "absolute"; top.style.top = rh + "px"; }
  }
  if (top) { placeTop(); window.addEventListener("scroll", placeTop, { passive: true }); window.addEventListener("resize", placeTop); }

  /* la pala se cache quand la carte de pied de page est visible */
  var pala = $("[data-pala]"), foot = $(".foot");
  if (pala && foot && "IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { pala.classList.toggle("hide", en[0].isIntersecting); }).observe(foot);
  }

  /* ================== LISTE D'ATTENTE ================== */
  var wl = $("[data-waitlist]");
  if (wl) wl.addEventListener("submit", function (e) {
    e.preventDefault();
    var msg = wl.querySelector("[data-msg]"), ok = wl.name.value.trim() && wl.contact.value.trim().length > 5 && wl.consent.checked;
    wl.name.classList.toggle("invalid", !wl.name.value.trim()); wl.contact.classList.toggle("invalid", wl.contact.value.trim().length <= 5);
    msg.hidden = false; msg.classList.toggle("err", !ok);
    msg.textContent = ok ? "Merci " + wl.name.value.trim() + " ! Vous serez prévenu(e) de l'ouverture. (Maquette : aucun envoi réel.)" : "Merci de renseigner votre prénom, un contact et de cocher la case d'accord.";
    msg.focus(); if (ok) wl.reset();
  });

  /* ================== PWA : installation + service worker ================== */
  var deferred = null, isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent), standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; var b = $("[data-install]"); if (b) b.hidden = false; });
  function install() {
    if (standalone) { toast("L'appli Trinapoli est déjà installée sur cet appareil."); return; }
    if (deferred) { deferred.prompt(); deferred.userChoice.then(function () { deferred = null; }); return; }
    toast(isIOS ? "Sur iPhone : touchez Partager puis « Sur l'écran d'accueil »." : "Ouvrez le menu du navigateur puis « Installer l'application ».");
  }
  $$("[data-install], [data-install-main], [data-install-menu]").forEach(function (b) { b.addEventListener("click", function () { if (menu && !menu.hidden) toggleMenu(false); install(); }); });
  var hint = $("[data-install-hint]"); if (hint && !isIOS) hint.innerHTML = "Sur Android : le bouton ouvre directement l'installation. Sur iPhone : <b>Partager</b> puis <b>Sur l'écran d'accueil</b>.";
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
  }

  /* raccourci d'appli : ?commande ouvre directement le sac */
  if (/[?&]commande/.test(location.search)) setTimeout(openCart, 600);

  /* « mon habituel » : la dernière commande se refait en une touche */
  function habituel() {
    var h = store.get("trinapoli-habituel", null), zone = $(".banner-cta"); if (!h || !h.length || !zone || $("[data-habituel]")) return;
    var b = document.createElement("button"); b.type = "button"; b.className = "btn-ghost-w"; b.setAttribute("data-habituel", "");
    b.textContent = "Recommander mon habituel"; zone.appendChild(b);
    b.addEventListener("click", function () { h.forEach(function (l) { cart.push(JSON.parse(JSON.stringify(l))); }); saveCart(); toast("Votre habituel est dans la commande"); openCart(); });
  }

  /* ================== INIT ================== */
  renderBoard(); renderFormules(); renderShelf(); renderDolci(); refreshBadges(); habituel();
})();
