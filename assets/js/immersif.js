/* MyEasyDev — expérience immersive de la page d'accueil.
   Smooth scroll (Lenis), animations au défilement (GSAP ScrollTrigger), fond WebGL.
   Aucun cookie, aucun traceur. */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const isDesktop = () => window.matchMedia("(min-width: 861px)").matches;
  const lowPower = window.matchMedia("(max-width: 860px), (pointer: coarse)").matches;
  if (lowPower) document.documentElement.classList.add("low-power");

  /* ---------- Fond WebGL : lumière qui dérive ---------- */
  const sky = document.getElementById("sky");
  const initSky = () => {
    if (!sky || reduceMotion || lowPower) return null;
    const gl = sky.getContext("webgl", { antialias: false, alpha: false, powerPreference: "low-power" });
    if (!gl) return null;

    const vs = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
    const fs = `
      precision mediump float;
      uniform vec2 r; uniform float t; uniform vec2 m; uniform float s;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
      float noise(vec2 p){
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
      }
      float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int k = 0; k < 4; k++) { v += a * noise(p); p = p * 2.03 + 11.7; a *= 0.5; } return v; }
      void main(){
        vec2 uv = gl_FragCoord.xy / r;
        float asp = r.x / r.y;
        vec2 q = vec2((uv.x - 0.5) * asp, uv.y - 0.5);
        float tt = t * 0.05;
        vec3 col = vec3(0.0);

        /* Projecteur principal : halo chaud en haut, légèrement décalé vers la souris */
        vec2 key = vec2(0.18 + (m.x - 0.5) * 0.25, 0.72 + s * 0.15 + (m.y - 0.5) * 0.1);
        float dk = length(q - vec2((key.x) * asp - 0.5 * asp, key.y - 0.5));
        float keyL = exp(-dk * dk * 2.2);
        col += vec3(0.95, 0.78, 0.52) * keyL * 0.26;

        /* Contre-jour bleu froid à droite */
        vec2 rim = vec2(0.86 - (m.x - 0.5) * 0.15, 0.35 - s * 0.2);
        float dr = length(q - vec2(rim.x * asp - 0.5 * asp, rim.y - 0.5));
        float rimL = exp(-dr * dr * 1.6);
        col += vec3(0.33, 0.42, 1.0) * rimL * 0.2;

        /* Cyclorama : le sol se relève doucement, comme un fond de studio */
        float floorL = smoothstep(0.55, 0.0, uv.y) * 0.05;
        col += vec3(0.86, 0.80, 0.70) * floorL;

        /* Volutes de brume très douces */
        float n = fbm(q * 1.6 + vec2(tt * 0.5, -tt * 0.3));
        col += vec3(0.6, 0.62, 0.78) * smoothstep(0.55, 0.95, n) * 0.06;

        float v = length(vec2(q.x / asp, q.y));
        col *= 1.0 - smoothstep(0.3, 0.9, v) * 0.5;
        col += (hash(gl_FragCoord.xy + t) - 0.5) * 0.01;
        gl_FragColor = vec4(col, 1.0);
      }`;
    const sh = (type, src) => { const o = gl.createShader(type); gl.shaderSource(o, src); gl.compileShader(o); return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null; };
    const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog); gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(prog, "r"), uT = gl.getUniformLocation(prog, "t"), uM = gl.getUniformLocation(prog, "m"), uS = gl.getUniformLocation(prog, "s");

    const state = { mx: 0.5, my: 0.5, tx: 0.5, ty: 0.5, scroll: 0, visible: true };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * 0.5;
      sky.width = Math.floor(innerWidth * dpr); sky.height = Math.floor(innerHeight * dpr);
      gl.viewport(0, 0, sky.width, sky.height);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", (e) => { state.tx = e.clientX / innerWidth; state.ty = 1 - e.clientY / innerHeight; }, { passive: true });
    document.addEventListener("visibilitychange", () => { state.visible = !document.hidden; });

    const start = performance.now();
    const frame = () => {
      if (state.visible) {
        state.mx += (state.tx - state.mx) * 0.04; state.my += (state.ty - state.my) * 0.04;
        const sc = Math.min(1, (window.scrollY || 0) / Math.max(1, innerHeight * 2));
        state.scroll += (sc - state.scroll) * 0.08;
        gl.uniform2f(uR, sky.width, sky.height);
        gl.uniform1f(uT, (performance.now() - start) / 1000);
        gl.uniform2f(uM, state.mx, state.my);
        gl.uniform1f(uS, state.scroll);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    return state;
  };
  if (!initSky() && sky) sky.style.background = "radial-gradient(70% 55% at 18% 10%, rgba(242,180,92,0.22), transparent 60%), radial-gradient(60% 60% at 88% 60%, rgba(93,109,255,0.2), transparent 60%), #000";

  /* ---------- Photo de studio : locale si présente, sinon Unsplash ; parallaxe lente ---------- */
  const photo = document.getElementById("photo");
  if (photo) {
    const LOCAL = "/assets/img/studio.jpg";
    const REMOTE = "https://images.unsplash.com/photo-1761998535969-11ca31e89f78?ixlib=rb-4.1.0&q=78&fm=jpg&w=2400&fit=max";
    const show = (src) => { photo.style.backgroundImage = `url("${src}")`; photo.classList.add("is-ready"); };
    const probe = new Image();
    probe.onload = () => show(LOCAL);
    probe.onerror = () => { const r = new Image(); r.onload = () => show(REMOTE); r.src = REMOTE; };
    probe.src = LOCAL;
    if (!reduceMotion && !lowPower) {
      let px = 0, py = 0, tx = 0, ty = 0;
      window.addEventListener("pointermove", (e) => { tx = (e.clientX / innerWidth - 0.5) * 14; ty = (e.clientY / innerHeight - 0.5) * 10; }, { passive: true });
      const loop = () => {
        px += (tx - px) * 0.03; py += (ty - py) * 0.03;
        const sc = Math.min(1, (window.scrollY || 0) / Math.max(1, document.documentElement.scrollHeight - innerHeight));
        photo.style.transform = `translate3d(${px}px, ${py - sc * 40}px, 0) scale(${1.04 + sc * 0.06})`;
        requestAnimationFrame(loop);
      };
      loop();
    }
  }

  /* ---------- Galerie horizontale : défilement natif, glisser, flèches ---------- */
  const gtrack = document.querySelector(".gallery__track");
  if (gtrack) {
    const gbar = document.querySelector(".gallery__progress i");
    const arrows = document.querySelectorAll(".gallery__arrow");
    const update = () => {
      const max = gtrack.scrollWidth - gtrack.clientWidth;
      if (gbar) gbar.style.transform = `scaleX(${max > 0 ? gtrack.scrollLeft / max : 1})`;
      arrows.forEach((a) => { const d = Number(a.dataset.dir); a.disabled = d < 0 ? gtrack.scrollLeft <= 2 : gtrack.scrollLeft >= max - 2; });
    };
    gtrack.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
    arrows.forEach((a) => a.addEventListener("click", () => {
      const card = gtrack.querySelector(".work:not([hidden])");
      const step = card ? card.getBoundingClientRect().width + 28 : gtrack.clientWidth * 0.6;
      gtrack.scrollBy({ left: Number(a.dataset.dir) * step, behavior: reduceMotion ? "auto" : "smooth" });
    }));
    /* Molette verticale sur la galerie : on laisse la page défiler (pas de piège) ; glisser à la souris */
    let down = false, startX = 0, startLeft = 0, moved = false;
    gtrack.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; down = true; moved = false; startX = e.clientX; startLeft = gtrack.scrollLeft; });
    window.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) { moved = true; gtrack.classList.add("is-dragging"); }
      if (moved) gtrack.scrollLeft = startLeft - dx;
    });
    window.addEventListener("pointerup", () => { down = false; setTimeout(() => gtrack.classList.remove("is-dragging"), 50); });
    document.querySelectorAll(".filters button").forEach((b) => b.addEventListener("click", () => { gtrack.scrollTo({ left: 0 }); requestAnimationFrame(update); }));
  }

  /* ---------- En-tête : se cache en descendant, revient en remontant ---------- */
  const top = document.getElementById("top");
  if (top) {
    let last = window.scrollY || 0;
    window.addEventListener("scroll", () => {
      const y = window.scrollY || 0;
      if (y > 140 && y > last + 4) top.classList.add("is-hidden");
      else if (y < last - 4 || y <= 140) top.classList.remove("is-hidden");
      last = y;
    }, { passive: true });
  }

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (typeof window.Lenis !== "undefined" && !reduceMotion && !lowPower) {
    lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true });
    if (hasGsap) {
      lenis.on("scroll", window.ScrollTrigger.update);
      window.gsap.ticker.add((t) => lenis.raf(t * 1000));
      window.gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  const scrollTo = (target, opts) => {
    if (lenis) lenis.scrollTo(target, Object.assign({ offset: -70, duration: 1.4 }, opts || {}));
    else if (typeof target !== "number") target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    else window.scrollTo({ top: target, behavior: reduceMotion ? "auto" : "smooth" });
  };
  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href").slice(1);
    const el = id && document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    scrollTo(el);
    history.replaceState(null, "", "#" + id);
  }));
  document.querySelectorAll("[data-pick]").forEach((btn) => btn.addEventListener("click", () => {
    const target = document.getElementById("composer");
    if (target && lenis) setTimeout(() => scrollTo(target), 0);
  }));

  if (!hasGsap) {
    document.documentElement.classList.add("no-gsap");
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in"));
    document.querySelectorAll(".lines .line > span, .hero__title .line > span").forEach((el) => (el.style.transform = "none"));
    document.querySelectorAll(".app__visual").forEach((el) => (el.style.clipPath = "none"));
    const intro = document.querySelector(".intro");
    if (intro) intro.classList.add("is-done");
    return;
  }

  const gsap = window.gsap, ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);
  gsap.defaults({ ease: "expo.out" });

  /* ---------- Intro + entrée du hero ---------- */
  const intro = document.querySelector(".intro");
  const heroTl = gsap.timeline({ paused: true });
  heroTl
    .to(".hero__title .line > span", { y: 0, duration: 1.4, stagger: 0.09 }, 0)
    .fromTo(".hero__lead, .hero__actions, .hero__meta", { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: 0.08 }, 0.35)
    .fromTo(".hero__stage", { y: 70, rotateX: 14, opacity: 0, transformPerspective: 1200 }, { y: 0, rotateX: 0, opacity: 1, duration: 1.8 }, 0.25)
    .fromTo(".top", { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 0.4);

  let played = null;
  try { played = sessionStorage.getItem("mymy-intro"); } catch (e) {}
  if (intro && !reduceMotion && !played) {
    document.documentElement.classList.add("lenis-stopped");
    const count = intro.querySelector(".intro__count");
    const num = { v: 0 };
    gsap.timeline({ onComplete: () => { intro.classList.add("is-done"); document.documentElement.classList.remove("lenis-stopped"); heroTl.play(); try { sessionStorage.setItem("mymy-intro", "1"); } catch (e) {} } })
      .to(".intro__word span", { y: 0, duration: 1.1, stagger: 0.12 }, 0)
      .to(num, { v: 100, duration: 1.5, ease: "power2.inOut", onUpdate: () => { if (count) count.textContent = String(Math.round(num.v)).padStart(3, "0"); } }, 0)
      .to(".intro__word span", { y: "-110%", duration: 0.8, ease: "expo.in", stagger: 0.06 }, 1.5)
      .to(intro, { yPercent: -100, duration: 1, ease: "expo.inOut" }, 1.9);
  } else {
    if (intro) intro.classList.add("is-done");
    heroTl.play();
  }

  /* Parallaxe souris sur la scène */
  const stage = document.querySelector(".stage");
  if (stage && isDesktop()) {
    const qrx = gsap.quickTo(stage, "rotateX", { duration: 1.4, ease: "power3" });
    const qry = gsap.quickTo(stage, "rotateY", { duration: 1.4, ease: "power3" });
    gsap.set(stage, { transformPerspective: 1600, transformOrigin: "50% 60%" });
    window.addEventListener("pointermove", (e) => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      qry(nx * 7); qrx(-ny * 5);
    }, { passive: true });
  }
  gsap.to(".hero__inner, .hero__below", { yPercent: -12, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  /* ---------- Bandeau ---------- */
  const track = document.querySelector(".ticker__track");
  if (track && !reduceMotion) {
    const tween = gsap.to(track, { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
    ST.create({ trigger: ".ticker", start: "top bottom", end: "bottom top", onUpdate: (self) => { tween.timeScale(1 + Math.min(4, Math.abs(self.getVelocity()) / 400)); } });
  }

  /* ---------- Manifeste : mots qui s'allument ---------- */
  document.querySelectorAll(".manifesto p").forEach((p) => {
    const out = [];
    p.childNodes.forEach((n) => {
      const em = n.nodeType === 1 && n.tagName === "EM";
      const text = n.textContent;
      text.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { out.push(" "); return; }
        out.push(`<span class="w${em ? " em" : ""}">${part}</span>`);
      });
    });
    p.innerHTML = out.join("");
    const words = p.querySelectorAll(".w");
    ST.create({
      trigger: p, start: "top 78%", end: "bottom 42%", scrub: 0.3,
      onUpdate: (self) => { const n = Math.round(self.progress * words.length); words.forEach((w, i) => w.classList.toggle("is-lit", i < n)); }
    });
  });

  /* ---------- Titres en lignes ---------- */
  gsap.utils.toArray(".lines").forEach((el) => {
    gsap.to(el.querySelectorAll(".line > span"), { y: 0, duration: 1.4, stagger: 0.1, scrollTrigger: { trigger: el, start: "top 86%" } });
  });
  gsap.utils.toArray(".reveal").forEach((el, i) => {
    ST.create({ trigger: el, start: "top 90%", onEnter: () => el.classList.add("is-in") });
  });
  gsap.utils.toArray(".rule").forEach((el) => {
    gsap.to(el, { scaleX: 1, duration: 1.6, scrollTrigger: { trigger: el, start: "top 92%" } });
  });

  /* ---------- Applications : révélation en rideau + zoom ---------- */
  gsap.utils.toArray(".app__visual").forEach((v) => {
    const site = v.querySelector(".window--static");
    if (site) {
      gsap.to(site, { clipPath: "inset(0 0 0% 0 round 12px)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: v, start: "top 78%" } });
      const mascot = v.querySelector(".mascot");
      if (mascot) gsap.fromTo(mascot, { scale: 0, rotate: -30 }, { scale: 1, rotate: -6, duration: 1.2, ease: "back.out(1.7)", scrollTrigger: { trigger: v, start: "top 60%" } });
      return;
    }
    const phone = v.querySelector(".phone");
    if (phone) {
      gsap.to(phone, { clipPath: "inset(0 0 0% 0 round 40px)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: v, start: "top 78%" } });
      gsap.fromTo(phone, { y: 40 }, { y: -40, ease: "none", scrollTrigger: { trigger: v, start: "top bottom", end: "bottom top", scrub: true } });
      const waty = v.querySelector(".waty");
      if (waty) gsap.fromTo(waty, { scale: 0, rotate: -30 }, { scale: 1, rotate: -8, duration: 1.2, ease: "back.out(1.7)", scrollTrigger: { trigger: v, start: "top 60%" } });
      return;
    }
    gsap.to(v, { clipPath: "inset(0 0 0% 0 round 12px)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: v, start: "top 80%" } });
    const img = v.querySelector("img");
    if (img) gsap.fromTo(img, { scale: 1.18 }, { scale: 1, ease: "none", scrollTrigger: { trigger: v, start: "top bottom", end: "bottom top", scrub: true } });
  });

  /* ---------- Méthode : compteur collant ---------- */
  const counter = document.querySelector(".steps__counter b");
  if (counter) {
    gsap.utils.toArray(".step").forEach((s, i) => {
      ST.create({ trigger: s, start: "top 55%", end: "bottom 55%", onToggle: (self) => { if (self.isActive) { counter.textContent = String(i + 1).padStart(2, "0"); } } });
      gsap.fromTo(s, { opacity: 0.25, x: 30 }, { opacity: 1, x: 0, duration: 1.2, scrollTrigger: { trigger: s, start: "top 70%" } });
    });
  }

  /* ---------- Pied de page : mot géant ---------- */
  const giant = document.querySelector(".foot__giant");
  if (giant) gsap.fromTo(giant, { xPercent: 6 }, { xPercent: -6, ease: "none", scrollTrigger: { trigger: giant, start: "top bottom", end: "bottom top", scrub: true } });

  window.addEventListener("load", () => ST.refresh());
  document.fonts && document.fonts.ready.then(() => ST.refresh());
})();
