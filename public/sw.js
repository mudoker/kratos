const SW_VERSION = "5.1.46";
const CACHE_NAME = `kratos-v${SW_VERSION}`;
const STATIC_ASSETS = [
  "/logo.png",
  "/favicon.svg",
];

// Install Event — do NOT skip waiting automatically; let the user trigger it
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(err => console.warn("PWA: Pre-caching failed", err));
    }).then(() => {
      if (!self.registration.active) return;
      return self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "SW_UPDATE_READY", version: SW_VERSION });
        });
      });
    })
  );
  // Do NOT call self.skipWaiting() here — we want the update banner to control this
});

// Message listener — React app sends SKIP_WAITING when user taps "Update"
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "GET_VERSION") {
    event.source?.postMessage({ type: "SW_VERSION", version: SW_VERSION });
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

  const isAuthSensitivePath =
    url.pathname === "/login" ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/train") ||
    url.pathname.startsWith("/planner") ||
    url.pathname.startsWith("/workouts") ||
    url.pathname.startsWith("/progress") ||
    url.pathname.startsWith("/settings") ||
    url.pathname.startsWith("/coach") ||
    url.pathname.startsWith("/exercises");

  // Skip non-GET, API/auth, HMR, and app document navigations. Dynamic pages
  // depend on fresh auth cookies; caching them can strand installed PWAs on /login.
  if (
    request.method !== "GET" ||
    isAuthSensitivePath ||
    request.mode === "navigate" ||
    url.pathname.includes("/_next/webpack-hmr")
  ) {
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
          if (networkResponse && networkResponse.status === 200 && !url.pathname.startsWith("/_next/static/")) {
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
    // Network-First for non-auth documents.
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
