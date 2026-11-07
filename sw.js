/*
  Service Worker: macht die App ohne Internet nutzbar.

  Die App selbst (HTML, CSS, Skripte, Schriften, Symbole) wird bei der
  Installation gespeichert. VERSION muss zur ?v=…-Nummer in index.html passen
  und bei jeder neuen Version erhöht werden – dann lädt der Browser die neue Fassung.
*/

const VERSION = "8";
const APP_CACHE = "tasterwelt-app-" + VERSION;
const MEDIA_CACHE = "tasterwelt-medien";

// Liste der Klänge (INSTRUMENTS, EFFECT_CLIPS) und der Thorsten-Texte (VOICE_CLIPS)
importScripts("js/klang.js?v=" + VERSION, "js/voice.js?v=" + VERSION);

const MEDIA_FILES = [
  ...Object.values(INSTRUMENTS).flatMap(Object.keys).map(name => "klang/" + name + ".m4a"),
  ...EFFECT_CLIPS.map(name => "klang/" + name + ".m4a"),
  ...BILDER.map(name => "bilder/" + name + ".jpg"),
  ...Object.values(VOICE_CLIPS).map(name => "stimme/" + name + ".m4a")
];

const APP_FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icon-180.png",
  "icon-512.png",
  "schriften/atkinson-400.woff2",
  "schriften/atkinson-700.woff2",
  "css/style.css?v=" + VERSION,
  "js/db.js?v=" + VERSION,
  "js/illustrations.js?v=" + VERSION,
  "js/content.js?v=" + VERSION,
  "js/theme.js?v=" + VERSION,
  "js/klang.js?v=" + VERSION,
  "js/voice.js?v=" + VERSION,
  "js/sound.js?v=" + VERSION,
  "js/fx.js?v=" + VERSION,
  "js/visual.js?v=" + VERSION,
  "js/story.js?v=" + VERSION,
  "js/reveal.js?v=" + VERSION,
  "js/build.js?v=" + VERSION,
  "js/effect.js?v=" + VERSION,
  "js/app.js?v=" + VERSION,
  "js/switch.js?v=" + VERSION,
  "js/editor.js?v=" + VERSION,
  "js/teacher.js?v=" + VERSION,
  "js/offline.js?v=" + VERSION
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(APP_CACHE)
      // "reload": am Browser-Zwischenspeicher vorbei, damit keine alte Fassung gespeichert wird
      .then(cache => cache.addAll(APP_FILES.map(file => new Request(file, { cache: "reload" }))))
      .then(() => caches.open(MEDIA_CACHE))
      .then(cache => cache.addAll(MEDIA_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith("tasterwelt-app-") && key !== APP_CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Seite selbst: zuerst aus dem Netz (für Updates), ohne Netz aus dem Speicher.
  // Bei sehr langsamer Verbindung nach 4 Sekunden die gespeicherte Fassung.
  if (request.mode === "navigate") {
    const timeout = new Promise((resolve, reject) => setTimeout(() => reject(new Error("Zeitüberschreitung")), 4000));

    event.respondWith(
      Promise.race([fetch(request.url, { cache: "no-cache", credentials: "same-origin" }), timeout])
        .then(response => {
          const copy = response.clone();
          caches.open(APP_CACHE).then(cache => cache.put("index.html", copy));
          return response;
        })
        .catch(() => caches.match("index.html", { cacheName: APP_CACHE }))
    );
    return;
  }

  // Klänge, Stimme und Bilder: aus dem Speicher, sonst aus dem Netz und merken
  if (url.pathname.includes("/klang/") || url.pathname.includes("/stimme/") || url.pathname.includes("/bilder/")) {
    event.respondWith(
      caches.open(MEDIA_CACHE).then(cache =>
        cache.match(request).then(cached => cached || fetch(request).then(response => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        }))
      )
    );
    return;
  }

  // Übrige Dateien der App: aus dem Speicher, sonst aus dem Netz
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});
