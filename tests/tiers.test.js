// Checks the tier, boss and merch data line up. Run from the mock-prototype folder: node tests/tiers.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const ctx = vm.createContext({ console, state: { done: {}, proto: {} } });
// pull the OUTFITS and HATS names out of index.html without running the page
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const names = src => [...src.matchAll(/^  "([^"]+)": \{/gm)].map(m => m[1]);
const outfits = names(html.slice(html.indexOf("const OUTFITS = {"), html.indexOf("const SLEEVE = {")));
const hats = names(html.slice(html.indexOf("const HATS = {"), html.indexOf("const BODY = ")));
for (const f of ["scenarios.js", "lessons.js"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8").replace(/^"use strict";/, ""), ctx);
vm.runInContext(fs.readFileSync(path.join(root, "tiers.js"), "utf8").replace(/^"use strict";/, "").replace(/if \(typeof module[^\n]*/, ""), ctx);
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };
const R = vm.runInContext("({ REWARDS, STARTER_MERCH, BOSSES, PATH, ids: SCENARIOS.map(s => s.id), lessons: LESSONS.map(l => l.id), extra: Object.keys(EXTRA_STOPS) })", ctx);
const all = [...outfits, ...hats], given = Object.values(R.REWARDS).flat(), once = [...R.STARTER_MERCH, ...given];
ok(`${all.length} pieces of merch found`, all.length >= 25, `(${outfits.length} shirts, ${hats.length} hats)`);
ok("every piece of merch is unlocked exactly once (or is the free starter)", all.every(m => once.filter(x => x === m).length === 1), all.filter(m => once.filter(x => x === m).length !== 1).join(", "));
ok("every reward is a real piece of merch", given.every(m => all.includes(m)), given.filter(m => !all.includes(m)).join(", "));
const stops = [...R.ids, ...R.lessons, ...R.extra];
ok("every reward belongs to a real stop on the map", Object.keys(R.REWARDS).every(id => R.PATH.includes(id) && stops.includes(id)));
ok("every stop on the map exists", R.PATH.every(id => stops.includes(id)), R.PATH.filter(id => !stops.includes(id)).join(", "));
ok("six bosses, one per tier 0 to 5", R.BOSSES.length === 6 && R.BOSSES.every((b, i) => b.tier === i));
ok("each boss is on the map", R.BOSSES.every(b => R.PATH.includes(b.id)));
ok("bosses come in order on the map", R.BOSSES.map(b => R.PATH.indexOf(b.id)).every((v, i, a) => !i || v > a[i - 1]));
const LV = vm.runInContext("LEVEL_OF", ctx);
ok("each boss is the last stop of its difficulty level", R.BOSSES.filter(b => !b.quiz).every(b => R.PATH.slice(R.PATH.indexOf(b.id) + 1).every(id => LV[id] !== LV[b.id])));
ok("each tier boss ends its own level, one level per tier", R.BOSSES.filter(b => !b.quiz).every(b => LV[b.id] === b.tier));
ok("boss pass marks only go up", R.BOSSES.filter(b => !b.quiz).every((b, i, a) => !i || b.pass >= a[i - 1].pass));
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
