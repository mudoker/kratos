const CACHE_NAME = "kratos-v5.1.0";
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/logo.png",
  "/favicon.svg",
];

// Install Event — do NOT skip waiting automatically; let the user trigger it
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(err => console.warn("PWA: Pre-caching failed", err));
    })
  );
  // Do NOT call self.skipWaiting() here — we want the update banner to control this
});

// Message listener — React app sends SKIP_WAITING when user taps "Update"
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Activate Event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests or APIs/Auth requests
  if (request.method !== "GET" || url.pathname.startsWith("/api") || url.pathname.includes("/_next/webpack-hmr")) {
    return;
  }

  // Cache-First for static assets: fonts, images, css, js
  const isStaticAsset =
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/) ||
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, cacheCopy);
            });
          }
          return networkResponse;
        }).catch(() => {
          return new Response("Offline resource", { status: 503, statusText: "Offline" });
        });
      })
    );
  } else {
    // Network-First for pages/documents
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, cacheCopy);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return caches.match("/dashboard") || caches.match("/");
          });
        })
    );
  }
});
