"use strict";
// Keeps the app and the shop photos (shirts, hats, bottles, the records background) on this device after they have loaded once, so a demo still works on bad Wi-Fi.
// The app's own files are fetched from the network first (so a new version always wins) and come from this copy only when the network fails.
// The photos never change, so they are served from the copy first. Nothing else is touched: other sites, form posts and range requests go straight through.

const IMAGES = "csa-images-v1", PAGES = "csa-pages-v1", KEEP = 150;
const IMAGE_HOSTS = ["cdn.shopify.com", "ilovetequilacorrido.com"];

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("csa-") && k !== IMAGES && k !== PAGES).map(k => caches.delete(k)))).then(() => self.clients.claim())
));

// a small cap on the app's copy, so a long run of test visits cannot grow it for ever
async function trim(cache) { const keys = await cache.keys(); await Promise.all(keys.slice(0, Math.max(0, keys.length - KEEP)).map(k => cache.delete(k))); }

async function photo(req) {
  const cache = await caches.open(IMAGES), hit = await cache.match(req.url);
  if (hit) return hit;
  try {
    const res = await fetch(req.url, { mode: "cors", credentials: "omit" });   // a normal copy (not an opaque one), so it is small to store and safe to reuse
    if (res.ok) await cache.put(req.url, res.clone());
    return res;
  } catch { return fetch(req).catch(() => Response.error()); }
}

async function app(req) {
  const cache = await caches.open(PAGES);
  try {
    const res = await fetch(req);
    if (res.ok) { await cache.put(req.url.replace(/([?&])cb=[^&]*&?/, "$1").replace(/[?&]$/, ""), res.clone()); trim(cache); }
    return res;
  } catch {
    const hit = await cache.match(req.url, { ignoreSearch: true });   // offline: any copy of this file will do
    return hit || Response.error();
  }
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || req.headers.has("range")) return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) e.respondWith(app(req));
  else if (IMAGE_HOSTS.includes(url.hostname) && req.destination === "image") e.respondWith(photo(req));
});
