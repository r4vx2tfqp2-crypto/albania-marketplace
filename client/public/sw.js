// Tregu service worker: push notifications + a light "already-visited
// pages still work offline" cache. Deliberately NOT a full precache/
// build-manifest setup (no vite-plugin-pwa) -- Vite content-hashes every
// JS/CSS filename per build, so a hardcoded precache list would go stale
// the moment the next deploy ships. Runtime caching (cache what's been
// fetched, serve it back if the network fails) gets most of the same
// benefit without that staleness problem.

// Bump this on any deploy where stale cached pages/assets could cause a
// real visible bug (not just routine content updates) -- the activate
// handler below deletes any cache whose name doesn't match this string,
// so changing it forces every installed app to discard its old cache on
// next launch instead of continuing to serve stale HTML/JS behind the
// new deploy. Bumped here because Search/Profile could otherwise keep
// serving a pre-safe-area-fix cached version indefinitely.
const CACHE_NAME = "tregu-v3";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Runtime cache: GET requests for our own origin's static assets and
// navigations. Supabase API calls (a different origin) are never cached
// here -- this is about the app shell rendering offline, not offline
// data, which this app doesn't attempt.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const fresh = await fetch(request);
        if (fresh.ok) cache.put(request, fresh.clone());
        return fresh;
      } catch (err) {
        const cached = await cache.match(request);
        if (cached) return cached;
        // Navigating to a page never visited before, with no network --
        // fall back to the cached app shell so the user gets the app
        // (which can show its own "you're offline" state) instead of the
        // browser's blank offline error page.
        if (request.mode === "navigate") {
          const shell = await cache.match("/");
          if (shell) return shell;
        }
        throw err;
      }
    })
  );
});

// ---- Push notifications ----
// Payload shape sent by supabase/functions/send-push: { title, body, url }
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { /* non-JSON payload, ignore */ }

  const title = data.title || "Tregu";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.url || "/" },
    tag: data.tag || undefined, // same tag replaces an unread notification instead of stacking duplicates
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clients) => {
      // Focus an already-open Tregu tab/window instead of opening a new
      // one, navigating it to the relevant page. navigate() can reject
      // (e.g. the client navigated away/closed between matchAll() and
      // here) -- previously unawaited, so a failure there silently left
      // an unhandled rejection AND still returned client.focus()
      // unconditionally, meaning the openWindow() fallback below could
      // never run as long as any focusable client existed, even one
      // navigate() had just failed on.
      for (const client of clients) {
        if ("focus" in client) {
          try {
            await client.navigate(targetUrl);
            return client.focus();
          } catch {
            continue; // try the next open client, or fall through to openWindow
          }
        }
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
