// Checks that the room music only plays during a mission and goes quiet when the page is hidden. Run: node tests/sound.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };

// a pretend audio system: every node accepts whatever the sound code asks of it
const node = () => new Proxy(function () {}, { get: (t, k) => (k === "connect" ? a => a : k === "then" ? undefined : node()), set: () => true, apply: () => node() });
class FakeAudio { constructor() { this.currentTime = 0; this.state = "running"; this.sampleRate = 44100; this.destination = node(); }
  createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; } resume() {} }
["createGain", "createBufferSource", "createBiquadFilter", "createOscillator", "createDynamicsCompressor", "createStereoPanner", "createDelay"].forEach(k => { FakeAudio.prototype[k] = () => node(); });
const ctx = vm.createContext({ console, setTimeout, clearTimeout, window: { AudioContext: FakeAudio }, localStorage: { getItem() { return null; }, setItem() {} } });
vm.runInContext(fs.readFileSync(path.join(root, "sound.js"), "utf8").replace(/^"use strict";/, "") + ";globalThis.S = Sound;", ctx);
const S = ctx.S, nodes = () => S.nodes.length;

S.start("bar"); ok("a mission starts the room music", nodes() > 0 && S.theme === "bar");
S.pause(); ok("hiding the page silences it", nodes() === 0 && S.timers.length === 0 && S.paused);
S.start("shop"); ok("nothing starts while the page is hidden", nodes() === 0);
S.resume(); ok("coming back restores the room, because the mission is still on", nodes() > 0 && S.theme === "shop" && !S.paused);
S.stop(); ok("leaving the mission stops it for good", nodes() === 0 && S.timers.length === 0 && S.theme === null);
S.pause(); S.stop(); S.resume(); ok("leaving while the page is hidden keeps the home page silent when you return", nodes() === 0 && S.theme === null && !S.paused);
let played = 0; S.SFX.test = () => { played++; }; S.pause(); S.sfx("test"); ok("no sound effects while hidden", played === 0); S.resume(); S.sfx("test"); ok("sound effects are back when visible", played === 1);
S.stop(); S.setOn(false); S.setOn(true); ok("turning sound on from the home page doesn't start any music", nodes() === 0);
S.theme = "bar"; S.stop(); S.setOn(true); ok("after leaving, switching sound on does not bring the music back", nodes() === 0);

// the page wires it up: a screen change that is not a mission stops the music, and the page hiding pauses it
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
ok("any screen that is not a mission scene stops the music", /if \(Sound\.theme && !app\.querySelector\("#pc"\)\) Sound\.stop\(\)/.test(html));
ok("hiding the page pauses it and showing it resumes", /visibilitychange", \(\) => \{ if \(document\.hidden\) Sound\.pause\(\); else Sound\.resume\(\)/.test(html));
ok("going home still stops it", /function home\(\) \{\n\s+stopAll\(\); Cam\.stop\(\); Sound\.stop\(\)/.test(html));
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
