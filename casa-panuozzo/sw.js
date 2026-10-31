/* Casa Panuozzo Marseille — service worker (maquette)
   Garde la coquille de l'appli en cache pour l'ouvrir même avec
   une connexion faible ; les photos sont mises en cache au passage. */
var CACHE = "casa-panuozzo-v1";
var SHELL = ["./", "./index.html", "./casa-panuozzo.css", "./casa-panuozzo.js", "./manifest.webmanifest", "./icons/icon-192.png", "/assets/css/base.css", "/assets/js/main.js"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  if (url.origin === location.origin) {
    /* réseau d'abord pour les pages, cache en secours */
    e.respondWith(fetch(e.request).then(function (r) {
      var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); return r;
    }).catch(function () { return caches.match(e.request).then(function (m) { return m || caches.match("./"); }); }));
  } else if (e.request.destination === "image") {
    /* photos : cache d'abord */
    e.respondWith(caches.match(e.request).then(function (m) {
      return m || fetch(e.request).then(function (r) { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); return r; });
    }));
  }
});
