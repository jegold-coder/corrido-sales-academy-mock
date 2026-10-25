// Checks the offline copy (sw.js): shop photos are kept after the first load and served when the network fails, the app's own files always come from
// the network first, and anything else is left alone. Run from the mock-prototype folder: node tests/offline.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };

// a pretend browser: a network that can be switched off, caches that remember, and the handlers the worker registers
class Res { constructor(body, o = {}) { this.body = body; this.ok = o.ok !== false; this.status = o.status || 200; } clone() { return new Res(this.body, this); } static error() { const r = new Res("", { ok: false, status: 0 }); r.isError = true; return r; } }
const store = {}, net = { on: true, log: [] }, handlers = {};
const caches = {
  keys: async () => Object.keys(store), delete: async k => { delete store[k]; return true; },
  open: async name => { const m = store[name] = store[name] || new Map(); return { match: async (k, o = {}) => { if (m.has(k)) return m.get(k); if (o.ignoreSearch) { const base = String(k).split("?")[0]; for (const [kk, v] of m) if (kk.split("?")[0] === base) return v; } return undefined; }, put: async (k, v) => { m.delete(k); m.set(k, v); }, keys: async () => [...m.keys()], delete: async k => m.delete(k) }; },
};
const fetchFn = async (req, init) => { const url = typeof req === "string" ? req : req.url; net.log.push({ url, mode: init && init.mode }); if (!net.on) throw new TypeError("offline"); return new Res("net:" + url); };
const self = { location: { origin: "https://corrido.example" }, addEventListener: (t, f) => { handlers[t] = f; }, skipWaiting() {}, clients: { claim: async () => {} } };
const ctx = vm.createContext({ self, caches, fetch: fetchFn, Response: Res, URL, console });
vm.runInContext(read("sw.js").replace(/^"use strict";/, ""), ctx);

const ask = async (url, o = {}) => { let out; const e = { request: { url, method: o.method || "GET", destination: o.destination || "", headers: { has: h => !!(o.headers || {})[h] } }, respondWith: p => { out = p; } }; handlers.fetch(e); return out ? await out : "ignored"; };

(async () => {
  const photo = "https://cdn.shopify.com/s/files/1/x/files/shirt_600x.png?v=1";
  let r = await ask(photo, { destination: "image" });
  ok("a shop photo is fetched with a normal (CORS) request the first time, so the copy is not an opaque one", r.body === "net:" + photo && net.log[0].mode === "cors" && net.log[0].url === photo);
  net.on = false;
  r = await ask(photo, { destination: "image" });
  ok("with the network off the same photo still comes back, from the copy", r.body === "net:" + photo && !r.isError);
  r = await ask("https://cdn.shopify.com/s/files/1/x/files/other.png", { destination: "image" });
  ok("a photo that was never loaded fails cleanly offline instead of hanging", r.isError === true);
  net.on = true; net.log.length = 0;
  r = await ask(photo, { destination: "image" });
  ok("once a photo is kept it is served without asking the network again", net.log.length === 0 && r.body === "net:" + photo);

  ok("only the shop's own hosts are kept: another site's image is not touched", await ask("https://example.org/pic.png", { destination: "image" }) === "ignored");
  ok("only images from those hosts: a script from the shop's CDN goes straight through", await ask("https://cdn.shopify.com/app.js", { destination: "script" }) === "ignored");
  ok("posts and range requests go straight through", await ask("https://corrido.example/index.html", { method: "POST" }) === "ignored" && await ask(photo, { destination: "image", headers: { range: 1 } }) === "ignored");

  // the app's own files: network first, so a new version always wins; the copy is only for when the network fails
  net.on = true;
  r = await ask("https://corrido.example/index.html?cb=111");
  ok("the app's own file comes from the network when it is online", r.body === "net:https://corrido.example/index.html?cb=111");
  ok("the cache-busting ?cb= is left out of the saved copy's name, so test visits do not pile up copies", [...store["csa-pages-v1"].keys()].every(k => !/cb=/.test(k)) && store["csa-pages-v1"].size === 1);
  net.on = false;
  r = await ask("https://corrido.example/index.html?cb=222");
  ok("offline, the app's file comes from the saved copy even with a different ?cb=", r.body === "net:https://corrido.example/index.html?cb=111");
  r = await ask("https://corrido.example/never-loaded.js?v=3");
  ok("offline, a file that was never loaded fails cleanly", r.isError === true);

  // the copy stays small, and old copies from an earlier version of the worker are cleaned up
  net.on = true;
  for (let i = 0; i < 170; i++) await ask(`https://corrido.example/f${i}.js?v=1`);
  ok("the app's copy is capped (about 150 files), dropping the oldest", store["csa-pages-v1"].size <= 151, "size " + store["csa-pages-v1"].size);
  store["csa-old-thing"] = new Map(); store["other-site-cache"] = new Map();
  await handlers.activate({ waitUntil: p => p });   // the handler hands its work to waitUntil, which here returns it
  ok("on activate, old csa- caches are deleted and other caches are left alone", !("csa-old-thing" in store) && "other-site-cache" in store && "csa-images-v1" in store);

  // how it is wired in
  const html = read("index.html");
  ok("the page registers the worker only on http(s), and a failure to register never breaks the page", /if \("serviceWorker" in navigator && \/\^https\?:\$\/\.test\(location\.protocol\)\) navigator\.serviceWorker\.register\("sw\.js"\)\.catch\(\(\) => \{\}\);/.test(html));
  console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
})();
