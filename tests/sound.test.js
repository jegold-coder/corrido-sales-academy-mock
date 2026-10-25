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
ok("any screen that is not the one the music belongs to stops it", /if \(Sound\.theme && !app\.querySelector\(Sound\.theme === "boss" \? "\.bossintro" : "#pc"\)\) Sound\.stop\(\)/.test(html));
ok("hiding the page pauses it and showing it resumes", /visibilitychange", \(\) => \{ if \(document\.hidden\) Sound\.pause\(\); else Sound\.resume\(\)/.test(html));
ok("going home still stops it", /function home\(\) \{\n\s+stopAll\(\); Cam\.stop\(\); Sound\.stop\(\)/.test(html));

// the boss battle theme: it starts on the boss screen, and stops going back, going anywhere else, or starting the battle
S.stop(); S.start("boss"); ok("the boss theme starts", nodes() > 0 && S.theme === "boss" && S.timers.length > 0);
S.pause(); ok("it goes quiet when the page is hidden", nodes() === 0); S.resume(); ok("and comes back with the page while you are still on the boss screen", nodes() > 0 && S.theme === "boss");
S.stop(); ok("leaving the boss screen stops it for good", nodes() === 0 && S.timers.length === 0 && S.theme === null);
S.start("boss"); S.start("bar"); ok("a mission's room replaces the boss theme, never layers on it", S.theme === "bar" && nodes() > 0); S.stop();
const boss = fs.readFileSync(path.join(root, "boss.js"), "utf8");
ok("the boss screen starts the theme", /function bossIntro\(stop\) \{\n\s+Sound\.start\("boss"\)/.test(boss));
ok("starting the battle or a practice run stops it first", /function startBoss\(stop, boss, rehearsal\) \{\n\s+Sound\.stop\(\)/.test(boss));
ok("the boss screen's back arrow goes home, which stops all sound", /\$\("#bback"\)\.onclick = home/.test(boss));
// the tune itself is music, not noise: eight bars, every chord defined, the trumpet line in A minor (plus the G sharp of the E chord), never overlapping itself
const B = ctx.S; const near = (a, b) => Math.abs(a - b) < 0.3;
ok("eight bars and every chord has a bass and a strum", B.BOSS_BARS.length === 8 && B.BOSS_BARS.every(n => B.BOSS_CHORDS[n] && B.BOSS_BASS[n]));
ok("each bass note is the chord's root, an octave down", B.BOSS_BARS.every(n => near(B.BOSS_BASS[n][0] * 2, B.BOSS_CHORDS[n][0])));
const scale = [523.25, 587.33, 659.25, 698.46, 783.99, 830.61, 880, 987.77];
ok("every trumpet note is in A minor (or the G sharp that E major needs)", B.BOSS_LINE.flat().every(([f]) => scale.some(x => near(f, x))));
ok("the trumpet line fits its bars and never overlaps itself", B.BOSS_LINE.length === 8 && B.BOSS_LINE.every(bar => bar.every(([, s, d], i) => s >= 0 && s + d <= 4.001 && (i === 0 || bar[i - 1][1] + bar[i - 1][2] <= s + 0.001))));
ok("the line ends on the home note and keeps the tension on the last bar", near(B.BOSS_LINE[7].at(-1)[0], 659.25) && B.BOSS_BARS[7] === "E");
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
