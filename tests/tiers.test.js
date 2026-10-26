// Checks the tier, boss and merch data line up. Run from the mock-prototype folder: node tests/tiers.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const ctx = vm.createContext({ console, state: { done: {}, proto: {} } });
// pull the OUTFITS and HATS names out of index.html without running the page
const html = require("./page").source();   // index.html with the page's own scripts back in place
const names = src => [...src.matchAll(/^  "([^"]+)": \{/gm)].map(m => m[1]);
const outfits = names(html.slice(html.indexOf("const OUTFITS = {"), html.indexOf("const SLEEVE = {")));
const hats = names(html.slice(html.indexOf("const HATS = {"), html.indexOf("const BODY = ")));
// the pieces with the gender each one is cut for, which is all the merch totals need
const cut = Object.fromEntries([...html.slice(html.indexOf("const OUTFITS = {"), html.indexOf("const SLEEVE = {")).matchAll(/^  "([^"]+)": \{ g: "(\w)"/gm)].map(m => [m[1], { g: m[2] }]));
ctx.OUTFITS = cut; ctx.HATS = Object.fromEntries(hats.map(n => [n, {}]));
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

// the Military Green Era tee is the men's cut only: a woman never sees it, and gets a different shirt at that stop instead
const MG = "In My Tequila Era Tee (Military Green)", men = outfits.filter(n => !new RegExp(`"${n.replace(/[()]/g, "\\$&")}": \\{ g: "f"`).test(html));
ok("the Military Green Era tee is marked men's only, and no longer asks to sit behind the grey one (it sits where it unlocks)", new RegExp(`"${MG.replace(/[()]/g, "\\$&")}": \\{ g: "m", price:`).test(html) && !/\bafter: "/.test(html.slice(html.indexOf("const OUTFITS = {"), html.indexOf("const SLEEVE = {"))));
// the picker's order: what you can wear first, and inside each half the pieces in the order they unlock (starters, then the map's stops in order), so Military Green sits next to the shirt earned at the same stop
vm.runInContext("globalThis.ALL_STOPS = () => PATH.map(id => ({ id }))", ctx);
vm.runInContext(html.match(/const unlockOrder = name => \{[\s\S]*?\n\};\nconst unlockedFirst = list => \{[\s\S]*?\n\};/)[0], ctx);
const stopAt = n => { const st = vm.runInContext(`merchStop(${JSON.stringify(n)})`, ctx); return st ? R.PATH.indexOf(st) : -1; };
const picker = (done, gender, names) => { ctx.state.done = done; ctx.state.avatar = { gender }; const r = vm.runInContext(`unlockedFirst(${JSON.stringify(names)})`, ctx), have = r.map(n => vm.runInContext(`merchUnlocked(${JSON.stringify(n)})`, ctx)), at = r.map(stopAt); ctx.state.done = {}; ctx.state.avatar = undefined; return { r, have, at }; };   // the stop of each piece is read while this player's gender is set (a woman's Priya stop gives a different shirt)
const DGH = "Corrido Logo Tee (Dark Grey Heather)", nondecreasing = a => a.every((v, i) => !i || v >= a[i - 1]);
const start = picker({}, "Male", men), startOrder = men.filter(n => stopAt(n) === -1);
ok("for a man at the start the free starters come first in their usual order, then the locked pieces in the order the map unlocks them", start.have.slice(0, startOrder.length).every(Boolean) && start.have.slice(startOrder.length).every(h => !h) && start.r.slice(0, startOrder.length).join() === startOrder.join() && nondecreasing(start.at.slice(startOrder.length)));
ok("Military Green sits right behind the other piece from Priya's stop, the Dark Grey Heather logo tee, so the shirts read in unlock order", start.r.indexOf(MG) === start.r.indexOf(DGH) + 1 && start.r.indexOf(DGH) > startOrder.length);
const mid = picker({ brand: true, lineup: true, brandbrain: true, quiet: true, priya: true }, "Male", men), nUn = mid.have.filter(Boolean).length;
ok("after five stops the earned pieces follow the starters in the order they were earned, with the Priya pair side by side, and the still-locked ones carry on in map order", mid.have.slice(0, nUn).every(Boolean) && mid.have.slice(nUn).every(h => !h) && nondecreasing(mid.at.slice(0, nUn)) && nondecreasing(mid.at.slice(nUn)) && mid.r.indexOf(MG) === mid.r.indexOf(DGH) + 1 && mid.r.indexOf(MG) < nUn);
const women = outfits.filter(n => !new RegExp(`"${n.replace(/[()]/g, "\\$&")}": \\{ g: "m"`).test(html)), wmn = picker({}, "Female", women);
ok("for a woman (no Military Green in her list) the order is the same idea: starters, then the locked pieces in map order", !wmn.r.includes(MG) && nondecreasing(wmn.r.map((n, i) => (wmn.have[i] ? 0 : 1) * 1000 + wmn.at[i] + 1)) && wmn.r.length === women.length);
const F = vm.runInContext("({ f: rewardsFor('Female'), m: rewardsFor('Male'), unknown: rewardsFor(''), total: g => merchTotal(g) })", ctx);
const givenF = Object.values(F.f).flat(), onceF = [...R.STARTER_MERCH, ...givenF], allF = all.filter(m => m !== MG);
ok("men still get Military Green at Priya's stop, as before", F.m.priya.includes(MG) && F.m === R.REWARDS && F.unknown === R.REWARDS);
ok("women do not get it: they get another shirt at that stop", !givenF.includes(MG) && F.f.priya.length === 2 && F.f.priya[1] !== MG && all.includes(F.f.priya[1]));
ok("for women every piece they can wear is still unlocked exactly once (the swapped shirt is taken out of the stop it came from)", allF.every(m => onceF.filter(x => x === m).length === 1) && !onceF.includes(MG), allF.filter(m => onceF.filter(x => x === m).length !== 1).join(", "));
ok("the same stops give something to women as to men, so no stop is left empty", Object.keys(R.REWARDS).every(id => F.f[id].length >= 1));
ok("the merch total is 42 for a man and 41 for a woman, so 'Full Closet' can still be earned", F.total("Male") === 42 && F.total("Female") === 41, `${F.total("Male")} / ${F.total("Female")}`);
const earnedF = vm.runInContext("(() => { state.avatar = { gender: 'Female' }; state.done = Object.fromEntries(Object.keys(REWARDS).map(k => [k, true])); const n = merchEarned().size, has = merchEarned().has('In My Tequila Era Tee (Military Green)'); state.avatar = { gender: 'Male' }; const m = merchEarned().size; state.avatar = undefined; state.done = {}; return { n, m, has }; })()", ctx);
ok("a woman who finishes every stop has all 41 of her pieces and not the men's tee; a man has all 42", earnedF.n === 41 && !earnedF.has && earnedF.m === 42, JSON.stringify(earnedF));

// a boss gives three tries a day unless the prototype switch (or Presenter mode) says otherwise
const bossCtx = vm.createContext({ console, state: { done: {}, proto: {}, bossTries: {} }, Progress: { today: () => "2026-10-25", save() {} } });
vm.runInContext(fs.readFileSync(path.join(root, "tiers.js"), "utf8").replace(/^"use strict";/, "").replace(/if \(typeof module[^\n]*/, ""), bossCtx);
vm.runInContext(fs.readFileSync(path.join(root, "boss.js"), "utf8").match(/const todayKey[\s\S]*?function useBossTry\(id\) \{[\s\S]*?\n\}/)[0], bossCtx);
const tries = () => vm.runInContext("bossTriesLeft('priya')", bossCtx);
ok("by default a boss gives three tries a day, and each fight uses one", tries() === 3 && (vm.runInContext("useBossTry('priya')", bossCtx), tries() === 2) && (vm.runInContext("useBossTry('priya'); useBossTry('priya')", bossCtx), tries() === 0));
ok("the tries of one boss do not use up another's, and a new day gives three again", vm.runInContext("bossTriesLeft('mia')", bossCtx) === 3 && (vm.runInContext("Progress.today = () => '2026-10-26'", bossCtx), tries() === 3));
ok("the Presenter sample (or the Settings switch) makes them unlimited", (vm.runInContext("state.proto = { unlimitedTries: true }", bossCtx), tries() === Infinity));
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
