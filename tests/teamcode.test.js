// Checks the team board's share codes: short, readable back exactly, a typo is caught, nonsense and forged values are refused, and codes from the first version still work.
// Run from the mock-prototype folder: node tests/teamcode.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };
const ctx = vm.createContext({ console, btoa, atob, escape, unescape, encodeURIComponent, decodeURIComponent });
vm.runInContext(read("progress.js").replace(/^"use strict";/, ""), ctx);
const make = (P, name) => { ctx.__P = P; ctx.__n = name; return vm.runInContext("Progress.shareCode(__P, __n)", ctx); };
const readC = c => { ctx.__c = c; return vm.runInContext("Progress.readCode(__c)", ctx); };
const levelOf = xp => { ctx.__x = xp; return vm.runInContext("levelOf(__x)", ctx); };
let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const badges = n => Array.from({ length: n }, (_, i) => "b" + i);

// ---------- short ----------
const typical = make({ xp: 520, badges: badges(5), streak: 5 }, "Taylor"), biggest = make({ xp: 1e6, badges: badges(31), streak: 1023 }, "Fourteen Chars!");
const legacy = P => "csa1." + btoa(unescape(encodeURIComponent(JSON.stringify({ n: P.n, xp: P.xp, lv: P.lv, b: P.b, s: P.s, d: "2026-10-25" })))).replace(/=+$/, "");
const old = legacy({ n: "Taylor", xp: 520, lv: 3, b: 5, s: 5 });
ok("a typical code is about 20 characters (it was about 85 or more), and the longest possible one is 35 or fewer", typical.length <= 22 && biggest.length <= 35 && old.length > 80, `(${typical.length}, longest ${biggest.length}, old ${old.length})`);
ok("it starts csa2. and then reads like csa2.<numbers and a check letter>.<name>", /^csa2\.[0-9a-z]{3,10}\.Taylor$/.test(typical));
ok("the code holds nothing but the name, XP, rank, badge count and streak: no email, no date, no answers", !/@/.test(make({ xp: 5, badges: [], streak: 1, profile: { email: "a@b.co" }, answers: [{ text: "secret" }] }, "Ann")) && !/secret/.test(make({ xp: 5, badges: [], streak: 1, answers: [{ text: "secret" }] }, "Ann")));

// ---------- read back exactly ----------
let bad = 0, n = 0;
for (let i = 0; i < 3000; i++) {
  const xp = Math.floor(rnd() * 1e6 + 1), b = Math.floor(rnd() * 32), s = Math.floor(rnd() * 1024), name = ["Ann", "Taylor", "Demo Rep", "J. Smith", "Zoë", "A", "Maria-José R."][Math.floor(rnd() * 7)];
  const r = readC(make({ xp, badges: badges(b), streak: s }, name)); n++;
  if (!r || r.n !== name || r.xp !== xp || r.lv !== levelOf(xp) || r.b !== b || r.s !== s || !/^\d{4}-\d{2}-\d{2}$/.test(r.d)) bad++;
}
ok("3000 random players come back from their code exactly: name, XP, rank, badges, streak", bad === 0, `(${bad} wrong of ${n})`);
ok("the edges work: nothing at all, the most of everything, and every rank", [[0, 0, 0], [1e6, 31, 1023], [99, 1, 1], [100, 2, 2], [250, 3, 3], [450, 4, 4], [700, 5, 5], [1000, 6, 6]].every(([xp, b, s]) => { const r = readC(make({ xp, badges: badges(b), streak: s }, "Ann")); return r && r.xp === xp && r.b === b && r.s === s && r.lv === levelOf(xp); }));
ok("a name with a dot, a space or an accent survives, and a name past 14 characters is cut to 14", ["a.b", "Demo Rep", "Zoë", ".dot."].every(nm => readC(make({ xp: 10, badges: [], streak: 0 }, nm)).n === nm) && readC(make({ xp: 10, badges: [], streak: 0 }, "Abcdefghijklmnopqrst")).n === "Abcdefghijklmn" && !/[\n\t]/.test(make({ xp: 1, badges: [], streak: 0 }, "A\nB\tC")) && readC(make({ xp: 1, badges: [], streak: 0 }, "")).n === "Rep" && readC(make({ xp: 1, badges: [], streak: 0 }, undefined)).n === "Rep");
ok("numbers too big are held at the limits instead of breaking the code: XP at a million, badges at 31, streak at 1023, nothing negative", (r => r.xp === 1e6 && r.b === 31 && r.s === 1023)(readC(make({ xp: 9e9, badges: badges(60), streak: 99999 }, "Ann"))) && (r => r.xp === 0 && r.s === 0)(readC(make({ xp: -50, badges: [], streak: -3 }, "Ann"))));
ok("whitespace around a pasted code is ignored", readC("  " + typical + "\n").n === "Taylor");

// ---------- typos and nonsense ----------
let missed = 0, tried = 0;
for (let i = 0; i < 400; i++) {
  const code = make({ xp: Math.floor(rnd() * 1e6), badges: badges(Math.floor(rnd() * 32)), streak: Math.floor(rnd() * 1024) }, "Taylor"), start = code.indexOf(".") + 1, end = code.lastIndexOf(".");
  for (let k = start; k < end; k++) {   // change one character of the numbers or the check letter
    const alt = "0123456789abcdefghijklmnopqrstuvwxyz".replace(code[k], "")[Math.floor(rnd() * 35)], mutated = code.slice(0, k) + alt + code.slice(k + 1); tried++;
    if (readC(mutated)) missed++;
  }
}
ok("a typo in the numbers or the check letter (any one wrong character) is always caught", missed === 0, `(${missed} slipped through of ${tried})`);
let cut = 0, cutTried = 0;
for (let i = 0; i < 300; i++) { const code = make({ xp: Math.floor(rnd() * 1e6), badges: badges(Math.floor(rnd() * 32)), streak: 3 }, "Taylor Swift"); cutTried++; if (readC(code.slice(0, -1))) cut++; }
ok("a code cut short by one letter is nearly always caught (the check letter has 36 values, so about 1 in 36 can slip past)", cut / cutTried < 0.08, `(${cut} of ${cutTried})`);
ok("nonsense is refused: empty, plain words, nothing, a bare prefix, a missing name, a body that is too long or has capitals", ["", "hello", "csa2.", "csa2..Ann", "csa2.abc.", "csa2.zzzzzzzzzzzz.Ann", "csa2.ABC1.Ann", "CSA2.297x1hx.Taylor", "csa3.297x1hx.Taylor", null, undefined, 42].every(c => readC(c) === null));
const forged = (xp, lv, b, s, name) => { const body = (((xp * 8 + lv) * 32 + b) * 1024 + s).toString(36); return `csa2.${body}${vm.runInContext(`Progress.check(${JSON.stringify(body + name)})`, ctx)}.${name}`; };
ok("a code made by hand with a value that can't be real is refused even with a right check letter: more than a million XP, or a rank past the top", readC(forged(1e6, 5, 5, 5, "Ann")) !== null && readC(forged(1e6 + 5, 1, 1, 1, "Ann")) === null && readC(forged(100, 6, 1, 1, "Ann")) === null && readC(forged(100, 7, 1, 1, "Ann")) === null);
ok("a name of more than 14 characters in a code is refused instead of being cut and mismatching", readC(forged(100, 1, 1, 1, "FifteenCharsLong")) === null);

// ---------- the first version's codes still work ----------
const r1 = readC(old);
ok("a code from the first version (csa1. and a long run of letters) is still read: name, XP, rank, badges, streak", r1 && r1.n === "Taylor" && r1.xp === 520 && r1.lv === 3 && r1.b === 5 && r1.s === 5 && r1.d === "2026-10-25");
ok("an old code without its csa1. prefix is read too, as before, and old XP is still held at a million with the name cut to 14", readC(old.slice(5)).xp === 520 && readC(legacy({ n: "A very long name indeed", xp: 5e7, lv: 5, b: 1, s: 1 })).xp === 1e6 && readC(legacy({ n: "A very long name indeed", xp: 5e7, lv: 5, b: 1, s: 1 })).n === "A very long na");
ok("a damaged old code is refused instead of throwing", ["csa1.@@@@", "csa1.", "csa1.e30"].every(c => { try { return readC(c) === null; } catch { return false; } }));

// ---------- on the Team tab ----------
const dash = read("dashboard.js");
ok("the Team tab makes the code with the player's name, tells people to paste one starting csa2., and describes the short code", /Progress\.shareCode\(state, repName\(\)\)/.test(dash) && /placeholder="Paste a code that starts with csa2\."/.test(dash) && /A code is short, like csa2\.2fuxlp1\.Taylor/.test(dash));
ok("adding a teammate still uses readCode, refuses what it can't read, and keeps one row for each name", /Progress\.readCode\(\$\("#tcode"\)\.value\)/.test(dash) && /That doesn't look like a valid code/.test(dash) && /state\.team\[r\.n\] = r/.test(dash));
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
