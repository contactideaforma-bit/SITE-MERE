/* MyEasyDev — interactions. Aucun cookie, aucun traceur. */
(() => {
  "use strict";

  const CONTACT_EMAIL = "contact@ideaforma.fr"; // à remplacer par l'adresse MyEasyDev quand le domaine sera acheté
  const DISCOUNT = 0.15;
  const PLANS = {
    vitrine:  { label: "Vitrine", price: 1000, month: 39 },
    autonome: { label: "Vitrine autonome", price: 1600, month: 29 },
    commerce: { label: "Commerce connecté", price: 2800, month: 49 }
  };
  const MAIL_PRICE = 5;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const euro = (n) => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n) + " €";

  /* Année du pied de page */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* En-tête : bordure au défilement + menu mobile */
  const top = document.getElementById("top");
  const onScroll = () => top && top.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const toggle = document.querySelector(".top__toggle");
  const menu = document.getElementById("menu");
  if (toggle && menu) {
    const close = () => { menu.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); toggle.textContent = "Menu"; };
    toggle.addEventListener("click", () => {
      const open = !menu.classList.contains("is-open");
      menu.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Fermer" : "Menu";
    });
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  }

  /* Aperçus : iframe chargée à l'approche, mise à l'échelle du cadre */
  const fit = (box) => {
    const frame = box.querySelector("iframe");
    if (!frame) return;
    const scale = box.clientWidth / 1280;
    frame.style.transform = `scale(${scale})`;
    frame.style.height = Math.max(800, Math.ceil(box.clientHeight / scale)) + "px";
  };
  const resizer = "ResizeObserver" in window ? new ResizeObserver((entries) => entries.forEach((en) => fit(en.target))) : null;

  const mount = (box) => {
    if (box.dataset.loaded) return;
    box.dataset.loaded = "1";
    const frame = document.createElement("iframe");
    frame.src = box.dataset.src;
    frame.loading = "lazy";
    frame.tabIndex = -1;
    frame.title = "Aperçu du site";
    frame.setAttribute("aria-hidden", "true");
    frame.setAttribute("scrolling", "no");
    box.appendChild(frame);
    fit(box);
    if (resizer) resizer.observe(box);
  };

  const previews = document.querySelectorAll(".preview[data-src]");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { mount(en.target); io.unobserve(en.target); } });
    }, { rootMargin: "300px 0px" });
    previews.forEach((p) => io.observe(p));
  } else {
    previews.forEach(mount);
  }
  window.addEventListener("resize", () => previews.forEach(fit));

  /* Scène du hero : rotation des fenêtres */
  const windows = Array.from(document.querySelectorAll(".stage .window"));
  const tabs = Array.from(document.querySelectorAll(".stage__tabs button"));
  let front = 0;
  const show = (i) => {
    front = (i + windows.length) % windows.length;
    windows.forEach((w, k) => { w.dataset.pos = String((k - front + windows.length) % windows.length); });
    tabs.forEach((t, k) => t.setAttribute("aria-pressed", String(k === front)));
  };
  let timer = null;
  const start = () => { if (!reduceMotion && windows.length && !timer) timer = setInterval(() => show(front + 1), 5500); };
  const stop = () => { clearInterval(timer); timer = null; };
  tabs.forEach((t) => t.addEventListener("click", () => { stop(); show(Number(t.dataset.show)); }));
  const stage = document.querySelector(".hero__stage");
  if (stage) {
    stage.addEventListener("mouseenter", stop);
    stage.addEventListener("focusin", stop);
  }
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : null));
  start();

  /* Filtres des réalisations */
  const filterBtns = document.querySelectorAll(".filters button");
  const works = document.querySelectorAll(".work");
  filterBtns.forEach((btn) => btn.addEventListener("click", () => {
    const f = btn.dataset.filter;
    filterBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    works.forEach((w) => { w.hidden = f !== "tous" && w.dataset.cat !== f; });
  }));

  /* Simulateur de tarif */
  const planInputs = document.querySelectorAll('input[name="plan"]');
  const optInputs = document.querySelectorAll("input[data-opt]");
  const mails = document.getElementById("mails");
  const out = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  let lastSelection = "";

  const compute = () => {
    const key = (document.querySelector('input[name="plan"]:checked') || {}).value || "autonome";
    const plan = PLANS[key];
    const chosen = Array.from(optInputs).filter((o) => o.checked);
    const gross = plan.price + chosen.reduce((s, o) => s + Number(o.dataset.price), 0);
    const off = Math.round(gross * DISCOUNT * 100) / 100;
    const nbMails = Math.max(0, Math.min(20, parseInt(mails && mails.value, 10) || 0));
    const month = plan.month + nbMails * MAIL_PRICE;

    out("s-plan", plan.label);
    out("s-gross", euro(gross));
    out("s-off", "-" + euro(off));
    out("s-total", euro(gross - off));
    out("s-month", euro(month));

    const optNames = chosen.map((o) => o.closest("label").textContent.trim());
    lastSelection = [
      `Formule : ${plan.label}`,
      optNames.length ? `Options : ${optNames.join(", ")}` : "Options : aucune",
      nbMails ? `Adresses e-mail pro : ${nbMails}` : "",
      `Estimation : ${euro(gross - off)} pour la création (offre de lancement), puis ${euro(month)} par mois`
    ].filter(Boolean).join("\n");
  };
  planInputs.forEach((i) => i.addEventListener("change", compute));
  optInputs.forEach((i) => i.addEventListener("change", compute));
  if (mails) mails.addEventListener("input", compute);
  compute();

  document.querySelectorAll("[data-pick]").forEach((btn) => btn.addEventListener("click", () => {
    const input = document.querySelector(`input[name="plan"][value="${btn.dataset.pick}"]`);
    if (input) { input.checked = true; compute(); }
    const target = document.getElementById("composer");
    if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    if (input) input.focus({ preventScroll: true });
  }));

  const send = document.getElementById("s-send");
  const msg = document.getElementById("f-msg");
  if (send && msg) send.addEventListener("click", () => {
    const intro = "Bonjour, je souhaite un devis pour la sélection suivante :\n";
    if (!msg.value.includes("Formule :")) msg.value = intro + lastSelection + (msg.value ? "\n\n" + msg.value : "\n\nMon commerce : ");
  });

  /* Formulaire : prépare un e-mail, rien n'est stocké */
  const form = document.getElementById("form");
  const err = document.getElementById("f-error");
  if (form) form.addEventListener("submit", (e) => {
    e.preventDefault();
    const fields = Array.from(form.querySelectorAll("[required]"));
    let firstBad = null;
    fields.forEach((f) => {
      const ok = f.type === "checkbox" ? f.checked : f.value.trim() !== "" && (f.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value.trim()));
      f.setAttribute("aria-invalid", String(!ok));
      if (!ok && !firstBad) firstBad = f;
    });
    if (firstBad) {
      err.hidden = false;
      err.textContent = firstBad.type === "checkbox"
        ? "Cochez la case d'accord pour que je puisse vous répondre."
        : firstBad.type === "email" && firstBad.value.trim()
          ? "L'adresse e-mail semble incomplète. Vérifiez-la, par exemple nom@domaine.fr."
          : "Complétez les champs nom, commerce, e-mail et projet.";
      firstBad.focus();
      return;
    }
    err.hidden = true;
    const v = (n) => (form.elements[n] ? form.elements[n].value.trim() : "");
    const subject = `Demande de devis site internet : ${v("commerce")}`;
    const body = [
      `Nom : ${v("nom")}`,
      `Commerce : ${v("commerce")}`,
      `E-mail : ${v("mail")}`,
      v("tel") ? `Téléphone : ${v("tel")}` : "",
      "",
      v("message")
    ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();
