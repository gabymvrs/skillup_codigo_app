/* Build replaces the constants. No API, credentials, private files or responses are cached. */
const CACHE = "skillup-shell-__VERSION__";
const PRECACHE = __PRECACHE__;
self.addEventListener("install", (event) =>
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (k) =>
              k !== CACHE &&
              (k.startsWith("skillup-") || k.startsWith("skillup_")),
          )
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("fetch", (event) => {
  const request = event.request,
    url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/code-sandbox/")) return;
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) =>
          response.ok
            ? response
            : caches
                .match("/index.html", { cacheName: CACHE })
                .then((c) => c || response),
        )
        .catch(() => caches.match("/index.html", { cacheName: CACHE })),
    );
    return;
  }
  if (PRECACHE.includes(url.pathname))
    event.respondWith(
      caches
        .match(url.pathname, { cacheName: CACHE })
        .then((cached) => cached || fetch(request)),
    );
});
