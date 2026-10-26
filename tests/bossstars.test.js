// Checks the Brand Brain boss gives stars for its score instead of always one, and that a better replay raises them.
// Run from the mock-prototype folder: node tests/bossstars.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };
const ctx = vm.createContext({ console });
const load = f => vm.runInContext(read(f).replace(/^"use strict";/, ""), ctx);
vm.runInContext(`var state = { done: {}, stars: {}, xp: 0 }, saves = 0, PROTO = () => false, tierOf = () => 0, stopRewards = () => ["A shirt"], wearFirst = () => {}, hud = () => {}, awardBadges = () => [], syncBadges = () => [];`, ctx);
load("progress.js"); load("boss.js");
vm.runInContext("Progress.save = () => { saves++; };", ctx);
const run = code => vm.runInContext(code, ctx);
const reset = () => run("state.done = {}; state.stars = {}; state.xp = 0; saves = 0;");
const boss = "{ tier: 0 }", stop = '{ id: "brandbrain" }';

ok("the quiz boss's stars follow the score: 10 of 10 is 3 stars, 9 of 10 is 2.5, 8 of 10 is 2.5, and it is never always one", run("quizStars(10, 10)") === 3 && run("quizStars(9, 10)") === 2.5 && run("quizStars(8, 10)") === 2.5 && run("quizStars(7, 10)") === 2);
ok("the same scale a mission and a lesson use (starsFor of the percentage)", /const quizStars = \(right, total\) => starsFor\(Math\.round\(right \/ total \* 100\)\);/.test(read("boss.js")));
ok("the end of the quiz hands the stars on with the rest of the result, instead of leaving them out", /stars = quizStars\(right, total\);\s*const ctx = \{[^}]*\bstars\b/.test(read("boss.js")));

reset(); const first = run(`bossApplyWin({ boss: ${boss}, stop: ${stop}, first: true, stars: quizStars(9, 10), perfect: false })`);
ok("a first win with 9 of 10 saves 2.5 stars on the map node, marks it done and gives the XP", run("state.stars.brandbrain") === 2.5 && run("state.done.brandbrain") === true && run("state.xp") === 300 && first.first === true);
reset(); run(`bossApplyWin({ boss: ${boss}, stop: ${stop}, first: true, stars: 3, perfect: true })`);
ok("a perfect first win saves 3 stars", run("state.stars.brandbrain") === 3);
reset(); run(`bossApplyWin({ boss: ${boss}, stop: ${stop}, first: true, stars: 1, perfect: false })`); const xp1 = run("state.xp");
const replay = run(`bossApplyWin({ boss: ${boss}, stop: ${stop}, first: false, stars: 3, perfect: true })`);
ok("a better replay raises the stars from 1 to 3, without a second reward or XP", run("state.stars.brandbrain") === 3 && run("state.xp") === xp1 && replay.items.length === 0 && replay.bonus === 0);
run(`bossApplyWin({ boss: ${boss}, stop: ${stop}, first: false, stars: 2, perfect: false })`);
ok("a worse replay never lowers them", run("state.stars.brandbrain") === 3);
reset(); run(`bossApplyWin({ boss: ${boss}, stop: ${stop}, first: true, stars: undefined, perfect: false })`);
ok("a win from a caller that passes no stars still shows one, as before", run("state.stars.brandbrain") === 1);
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
