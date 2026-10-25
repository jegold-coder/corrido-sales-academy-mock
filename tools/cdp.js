"use strict";
// A tiny Chrome DevTools client with no installs: it starts Chrome with no window, opens one page, and lets a script drive it (Node 22 or newer has WebSocket built in).
// Used by smoke.js. Set CHROME to Chrome's path if it is not in one of the usual places.
const { spawn } = require("child_process"), os = require("os"), fs = require("fs"), path = require("path");
const CHROMES = [process.env.CHROME, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].filter(Boolean);
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function launch({ width = 1280, height = 900 } = {}) {
  const bin = CHROMES.find(p => fs.existsSync(p));
  if (!bin) throw new Error("Chrome was not found. Set the CHROME environment variable to its path.");
  const port = 9300 + Math.floor(Math.random() * 600), dir = fs.mkdtempSync(path.join(os.tmpdir(), "csa-chrome-"));
  const proc = spawn(bin, ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, "--no-first-run", "--no-default-browser-check", "--disable-gpu", `--window-size=${width},${height}`, "about:blank"], { stdio: "ignore" });
  let page = null;
  for (let i = 0; i < 80 && !page; i++) {
    try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === "page"); } catch { /* not up yet */ }
    if (!page) await sleep(150);
  }
  if (!page) { proc.kill(); throw new Error("Chrome did not start."); }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error("Could not connect to Chrome.")); });
  let id = 0; const pending = new Map(), listeners = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
    else listeners.forEach(f => f(m));
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const api = {
    send, sleep, on: f => listeners.push(f),
    // run a piece of JavaScript in the page and hand back its value (promises are awaited)
    eval: async expression => {
      const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception && r.exceptionDetails.exception.description) || r.exceptionDetails.text);
      return r.result.value;
    },
    // load a page and wait until it has finished loading
    go: async url => { const loaded = new Promise(res => { const f = m => { if (m.method === "Page.loadEventFired") res(); }; listeners.push(f); }); await send("Page.navigate", { url }); await Promise.race([loaded, sleep(15000)]); },
    // wait until a piece of JavaScript is truthy in the page
    waitFor: async (expression, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { try { if (await api.eval(expression)) return true; } catch { /* the page is changing */ } await sleep(80); } return false; },
    close: async () => { try { await send("Browser.close"); } catch { /* already gone */ } ws.close(); proc.kill(); try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ } },
  };
  await send("Runtime.enable"); await send("Log.enable"); await send("Page.enable");
  return api;
}

module.exports = { launch, sleep };
