/* MyEasyDev — expérience immersive de la page d'accueil.
   Smooth scroll (Lenis), animations au défilement (GSAP ScrollTrigger), fond WebGL.
   Aucun cookie, aucun traceur. */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const isDesktop = () => window.matchMedia("(min-width: 861px)").matches;

  /* ---------- Fond WebGL : lumière qui dérive ---------- */
  const sky = document.getElementById("sky");
  const initSky = () => {
    if (!sky || reduceMotion) return null;
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
        vec2 q = uv; q.x *= r.x / r.y;
        float tt = t * 0.06;
        vec2 drift = vec2(tt * 0.6, -tt * 0.4) + (m - 0.5) * 0.35;
        float n1 = fbm(q * 1.4 + drift);
        float n2 = fbm(q * 2.2 - drift * 1.3 + n1 * 1.5);
        vec3 ink = vec3(0.027, 0.035, 0.055);
        vec3 blue = vec3(0.36, 0.43, 1.0);
        vec3 amber = vec3(0.95, 0.70, 0.36);
        float glow = smoothstep(0.35, 0.95, n2);
        float warm = smoothstep(0.55, 0.98, n1 + 0.15 * sin(tt * 3.0));
        vec3 col = ink;
        col += blue * glow * 0.32;
        col += amber * warm * 0.22;
        float v = length(uv - vec2(0.5, 0.45 - s * 0.25));
        col *= 1.0 - smoothstep(0.35, 1.15, v) * 0.75;
        col += (hash(gl_FragCoord.xy + t) - 0.5) * 0.015;
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
  if (!initSky() && sky) sky.style.background = "radial-gradient(60% 50% at 50% 35%, #1a2140 0%, #07090e 70%)";

  /* ---------- Curseur ---------- */
  const cursor = document.querySelector(".cursor");
  if (cursor && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let cx = -100, cy = -100, x = -100, y = -100;
    window.addEventListener("pointermove", (e) => { cx = e.clientX; cy = e.clientY; document.body.classList.add("has-cursor"); }, { passive: true });
    const loop = () => { x += (cx - x) * 0.22; y += (cy - y) * 0.22; cursor.style.transform = `translate(${x}px, ${y}px)${cursor.classList.contains("is-link") ? " scale(2.2)" : cursor.classList.contains("is-drag") ? " scale(6)" : ""}`; requestAnimationFrame(loop); };
    loop();
    document.addEventListener("pointerover", (e) => {
      const t = e.target.closest("a, button, label, input, textarea, .gallery__pin");
      cursor.classList.toggle("is-drag", !!(t && t.classList.contains("gallery__pin") && isDesktop()));
      cursor.classList.toggle("is-link", !!(t && !t.classList.contains("gallery__pin")));
    });
    document.addEventListener("pointerleave", () => document.body.classList.remove("has-cursor"));
  }

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (typeof window.Lenis !== "undefined" && !reduceMotion) {
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
    .fromTo(".window", { y: 80, rotateX: 18, opacity: 0 }, { y: 0, rotateX: 0, opacity: 1, duration: 1.8, stagger: 0.12 }, 0.2)
    .fromTo(".sticker", { scale: 0, rotate: -30 }, { scale: 1, rotate: 0, duration: 1.2, ease: "back.out(1.6)" }, 0.9)
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
  const stage = document.querySelector(".hero__stage");
  if (stage && isDesktop()) {
    const wins = gsap.utils.toArray(".window");
    const qx = wins.map((w) => gsap.quickTo(w, "x", { duration: 1.2, ease: "power3" }));
    const qy = wins.map((w) => gsap.quickTo(w, "y", { duration: 1.2, ease: "power3" }));
    const qr = wins.map((w) => gsap.quickTo(w, "rotateY", { duration: 1.2, ease: "power3" }));
    window.addEventListener("pointermove", (e) => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      wins.forEach((w, i) => { const d = (i + 1) * 9; qx[i](nx * d * 1.6); qy[i](ny * d); qr[i](-nx * 6); });
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

  /* ---------- Galerie horizontale épinglée ---------- */
  const gallery = document.querySelector(".gallery");
  const gtrack = document.querySelector(".gallery__track");
  const gbar = document.querySelector(".gallery__progress i");
  const mm = gsap.matchMedia();
  mm.add("(min-width: 861px)", () => {
    if (!gallery || !gtrack) return;
    const getDist = () => Math.max(0, gtrack.scrollWidth - innerWidth);
    const tween = gsap.to(gtrack, {
      x: () => -getDist(), ease: "none",
      scrollTrigger: {
        trigger: gallery, start: "top 12%", end: () => "+=" + getDist(), pin: ".gallery__pin", scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (self) => { if (gbar) gbar.style.transform = `scaleX(${self.progress})`; }
      }
    });
    const cards = gsap.utils.toArray(".work__frame");
    cards.forEach((c) => {
      gsap.fromTo(c, { rotateY: 10, scale: 0.96 }, { rotateY: -4, scale: 1, ease: "none", scrollTrigger: { trigger: c, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
    });
    return () => { gsap.set(gtrack, { x: 0 }); };
  });
  document.querySelectorAll(".filters button").forEach((b) => b.addEventListener("click", () => {
    requestAnimationFrame(() => { ST.refresh(); if (gallery) scrollTo(gallery, { offset: -40 }); });
  }));

  /* ---------- Applications : révélation en rideau + zoom ---------- */
  gsap.utils.toArray(".app__visual").forEach((v) => {
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
