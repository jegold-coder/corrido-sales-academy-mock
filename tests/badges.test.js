// Checks the boss badges: one per boss, a real medal for each, awarded once, and caught up from progress already made.
// Run from the mock-prototype folder: node tests/badges.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const html = require("./page").source();   // index.html with the page's own scripts back in place
const names = src => [...src.matchAll(/^  "([^"]+)": \{/gm)].map(m => m[1]);
const outfits = names(html.slice(html.indexOf("const OUTFITS = {"), html.indexOf("const SLEEVE = {")));
const hats = names(html.slice(html.indexOf("const HATS = {"), html.indexOf("const BODY = ")));
const ctx = vm.createContext({ console, localStorage: { setItem() {}, getItem() { return null; }, removeItem() {} }, btoa, atob: s => s, unescape, encodeURIComponent });
ctx.OUTFITS = Object.fromEntries(outfits.map(n => [n, {}])); ctx.HATS = Object.fromEntries(hats.map(n => [n, {}]));
const run = f => vm.runInContext(fs.readFileSync(path.join(root, f), "utf8").replace(/^"use strict";/, "").replace(/if \(typeof module[^\n]*/, ""), ctx);
["scenarios.js", "progress.js", "lessons.js", "tiers.js", "badges.js"].forEach(run);
vm.runInContext("var state = { ...Progress.blank(), done: {}, badges: [], proto: {} };", ctx);
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };
const ev = s => vm.runInContext(s, ctx);

ok("every boss has its own badge", ev("BOSSES.every(b => BADGES['boss-' + b.id] && BADGE_ART['boss-' + b.id].kind === 'boss')"));
ok("badge names are all different", ev("new Set(Object.values(BADGES).map(b => b[0])).size === Object.keys(BADGES).length"));
ok("every badge has art in a real metal", ev("Object.keys(BADGES).every(k => BADGE_ART[k] && METALS[BADGE_ART[k].metal] && BADGE_ART[k].ico || BADGE_ART[k] && BADGE_ART[k].kind === 'boss' && METALS[BADGE_ART[k].metal])"));
ok("each boss badge shows that boss's face (a mission) or an emblem (the quiz)", ev("BOSSES.every(b => b.quiz ? !!BADGE_ART['boss-' + b.id].ico : !!SCENARIOS.find(s => s.id === b.id))"));
ok("the boss metals get richer tier by tier", ev("BOSSES.map(b => BADGE_ART['boss-' + b.id].metal).join()") === "bronze,silver,gold,emerald,ruby,diamond");
ok("each boss badge shows its boss's own tier, matching the map", ev("BOSSES.every(b => BADGE_ART['boss-' + b.id].plate === 'TIER ' + b.tier && BADGE_ART['boss-' + b.id].tier === b.tier)"));
ok("the six boss badges cover tiers 0 to 5, one each", ev("BOSSES.map(b => BADGE_ART['boss-' + b.id].tier).join()") === "0,1,2,3,4,5");
ok("each boss badge says which tier beating it reaches", ev("BOSSES.every(b => BADGE_ART['boss-' + b.id].tierTo === Math.min(5, b.tier + 1))"));
ok("boss badges are never earned by finishing an ordinary mission", ev("Object.keys(BADGES).filter(k => k.startsWith('boss')).every(k => BADGES[k][2]({ won: true, id: 'quiet', stars: 3 }, { streak: 9, done: {} }, 16) === false)"));

ok("awarding a badge saves it once", ev("awardBadges(['boss-priya']).length === 1 && awardBadges(['boss-priya']).length === 0 && state.badges.filter(k => k === 'boss-priya').length === 1"));
ok("an unknown badge is ignored", ev("awardBadges(['nope']).length === 0"));
ev("state.badges = []; state.done = { brandbrain: true, priya: true };");
ok("badges are caught up from bosses already beaten", ev("syncBadges().sort().join()") === "boss-brandbrain,boss-priya");
ev("BOSSES.forEach(b => { state.done[b.id] = true; });");
ok("beating all six bosses gives Season Complete", ev("syncBadges().includes('bossall') && state.badges.includes('bossall')"));
ev("state.badges = []; state.done = {}; state.proto = {}");
ok("no merch badge until every piece is unlocked", ev("!syncBadges().includes('closet')"));
ev("Object.keys(REWARDS).forEach(k => { state.done[k] = true; });");
ok("the Full Closet badge comes with the last piece", ev("syncBadges().includes('closet')"));

// the Knowledge Check badge, which replaced Closer
ok("there is a Knowledge Check badge with art, and Closer is gone", ev("BADGES.check[0] === 'Knowledge Check' && !!BADGE_ART.check.ico && METALS[BADGE_ART.check.metal] && !BADGES.closer && !BADGE_ART.closer"));
ev("state.badges = []; state.done = {}; state.pre = null; state.post = null;");
ok("nothing earns it before the check is finished, and an ordinary mission does not either", !ev("syncBadges().includes('check')") && ev("BADGES.check[2]({ won: true, id: 'quiet', stars: 3 }, { streak: 9, done: {}, pre: null }, 16) === false"));
ev("state.pre = { score: 6, total: 10, date: '2026-10-24', missed: [] };");
ok("finishing the check once earns it, and only once", ev("syncBadges().join()") === "check" && ev("syncBadges().length") === 0 && ev("state.badges.filter(k => k === 'check').length") === 1);
ev("state.badges = ['closer', 'first', 'boss-priya'];");
ev("syncBadges();");
ok("a player who earned the retired Closer badge no longer has it counted, but keeps the rest", ev("state.badges.includes('closer')") === false && ev("state.badges.includes('first') && state.badges.includes('boss-priya')"));
ok("the check finishes into syncBadges and shows the medal on both result screens", /const got = syncBadges\(\);/.test(fs.readFileSync(path.join(root, "lessons.js"), "utf8")) && /\$\{badgeMedals\(fresh\)\}/.test(fs.readFileSync(path.join(root, "lessons.js"), "utf8")) && /\$\{badgeMedals\(badges\)\}/.test(fs.readFileSync(path.join(root, "onboarding.js"), "utf8")));
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
