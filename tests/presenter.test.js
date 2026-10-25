// Checks presenter mode: the sample player is consistent, real progress always comes back, and it is wired in without skipping the age check.
// Run from the mock-prototype folder: node tests/presenter.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };

// a pretend browser storage, and the few things from index.html that presenter.js needs
const mem = {};
const ctx = vm.createContext({ console, setTimeout, clearTimeout, localStorage: { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } } });
const run = (f, strip) => vm.runInContext(read(f).replace(/^"use strict";/, "").replace(/if \(typeof module[^\n]*/, "") + (strip || ""), ctx);
["scenarios.js", "lessons.js", "progress.js", "criteria.js", "tone.js", "coach.js", "tiers.js"].forEach(f => run(f));
vm.runInContext(`var state = { done: {}, proto: {}, history: [] }; const DEFAULT_AVATAR = { name: "", gender: "Female" }; const cleanAvatar = a => ({ ...DEFAULT_AVATAR, ...a }); const ALL_STOPS = () => PATH.map(id => LESSONS.find(l => l.id === id) || SCENARIOS.find(m => m.id === id) || EXTRA_STOPS[id]); const DEMO_TEAM = [["Alex R.", 410, 4, 5, 3]];`, ctx);
run("presenter.js", ";globalThis.Presenter = Presenter;");
const ev = s => vm.runInContext(s, ctx);

// the sample player
const P = ev("Presenter.sampleProgress('sam')");
ok("it is a Tier 2 rep who has finished the first six stops", Object.keys(P.done).join() === ev("PATH.slice(0, 6).join()") && ev("BOSSES.filter(b => Presenter.sampleProgress('sam').done[b.id]).length") === 2);
ok("it has history for the missions and lessons played, and enough skills for the radar chart", P.history.length === 5 && ev("Progress.skillAverages(Presenter.sampleProgress('sam')).length") >= 3);
ok("there are moments to review, each with what the Review tab needs", P.mistakes.length >= 3 && P.mistakes.every(m => m.mission && m.skill && m.line && m.text && m.better && Array.isArray(m.missed) && m.score < 3.5));
ok("it has a before and after knowledge check, a streak and demo teammates", P.pre.score === 5 && P.post.score === 8 && P.streak === 5 && Object.keys(P.team).length > 0);
ok("stops stay locked until the one before is done; the sample player has unlimited boss tries so a demo can retry, but the game itself does not by default", P.proto.unlockStops === false && P.proto.unlimitedTries === true && ev("PROTO_DEFAULTS.unlockStops") === false && ev("PROTO_DEFAULTS.unlimitedTries") === false);
ok("the camera is off, so no permission prompt interrupts a demo", P.camPref === false);
const early = ev("Presenter.sampleProgress('quiet')"), start = ev("Presenter.sampleProgress('brandbrain')");
ok("a sample taken before a stop leaves that stop unplayed, so its first win looks like one", early.done.priya !== true && start.done.quiet !== true && start.done.brandbrain === true);
ok("no merch or clothing in anything the sample says", !/merch|shirt|\btee\b|\bhat\b/i.test(JSON.stringify(P.mistakes)));

// entering and leaving never costs the real player anything
const realProgress = JSON.stringify({ xp: 77, done: { brand: true }, streak: 2 }), realAvatar = JSON.stringify({ name: "Real Person", gender: "Male" });
mem.csa_progress_v1 = realProgress; mem.csa_avatar = realAvatar;
ev("Presenter.enter('sam')");
ok("on entering, the flag is set and the sample is what is saved", mem.csa_presenter === "1" && JSON.parse(mem.csa_progress_v1).xp === 520 && JSON.parse(mem.csa_avatar).name === "Demo Rep" && ev("state.xp") === 520);
ok("the real progress and character are kept in the stash, exactly as they were", JSON.parse(mem.csa_presenter_stash).progress === realProgress && JSON.parse(mem.csa_presenter_stash).avatar === realAvatar);
ev("Presenter.enter(); Presenter.enter(through = undefined)");
ok("entering again does not overwrite the stash with the sample", JSON.parse(mem.csa_presenter_stash).progress === realProgress);
ev("Presenter.restore()");
ok("leaving brings the real player back, and clears the flag and the stash", JSON.parse(mem.csa_progress_v1).xp === 77 && JSON.parse(mem.csa_avatar).name === "Real Person" && !("csa_presenter" in mem) && !("csa_presenter_stash" in mem) && ev("state.xp") === 77);
delete mem.csa_progress_v1; delete mem.csa_avatar;
ev("Presenter.enter(); Presenter.restore()");
ok("a first-time visitor who leaves goes back to a first-time visit (nothing saved, no character)", !("csa_progress_v1" in mem) && !("csa_avatar" in mem) && ev("state.avatarSaved") === false);

// random sample progress: part-way through the season every time, never nothing and never the whole game, and a different point on each press
const picks = Array.from({ length: 300 }, () => ev("Presenter.randomStop()")), idx = picks.map(id => ev("PATH").indexOf(id));
ok("a random sample stops after at least four stops and never after the last one", Math.min(...idx) >= 3 && Math.max(...idx) <= ev("PATH.length") - 2 && !picks.includes(ev("PATH[PATH.length - 1]")));
ok("it uses the whole range, and never picks the same point twice in a row", new Set(picks).size === ev("PATH.length") - 4 && picks.every((id, i) => i === 0 || id !== picks[i - 1]));
const partial = picks.slice(0, 40).map(id => ev(`Presenter.sampleProgress(${JSON.stringify(id)})`));
ok("every random sample has some stops done and some left, in order from the start, so only the next stop is open", partial.every(P => { const n = Object.keys(P.done).length; return n >= 4 && n < ev("PATH.length") && ev("PATH").slice(0, n).every(id => P.done[id]); }));
ok("every random sample has what the dashboard needs: a mission played, a radar with three skills, and a before and after check once past Priya", partial.every(P => P.history.some(h => h.mode === "typed") && ev(`Progress.skillAverages(${JSON.stringify(P)}).length`) >= 3 && P.pre && (!P.done.priya || P.post)));
ev("Presenter.enter()"); const entered = JSON.parse(mem.csa_progress_v1), nDone = Object.keys(entered.done).length; ev("Presenter.restore()");
ok("entering presenter mode without a stop gives a random sample too, part-way through", nDone >= 4 && nDone < ev("PATH.length"));
delete mem.csa_progress_v1; delete mem.csa_avatar;

// starting over from the menu: a map with nothing complete, the same character, the real progress still safe
mem.csa_progress_v1 = realProgress; mem.csa_avatar = realAvatar;
ev("Presenter.enter(); state.avatar.name = 'Edited Demo'; Presenter.reset()");
const fresh = JSON.parse(mem.csa_progress_v1);
ok("start over leaves nothing complete: no stops done, no XP, no history, no badges, no mistakes", Object.keys(fresh.done).length === 0 && fresh.xp === 0 && fresh.history.length === 0 && fresh.badges.length === 0 && fresh.mistakes.length === 0 && ev("Object.keys(state.done).length") === 0 && ev("state.xp") === 0);
ok("start over keeps the character, skips the tutorial and camera prompt, and does not unlock every stop", JSON.parse(mem.csa_avatar).name === "Edited Demo" && fresh.tutorialSeen === true && fresh.camPref === false && !fresh.proto.unlockStops);
ok("start over is still presenter mode, and the real progress is still in the stash", mem.csa_presenter === "1" && JSON.parse(mem.csa_presenter_stash).progress === realProgress);

// completing the game: everything done, the top tier and level, every badge, strong skills; and it also keeps the real progress safe
ev("Presenter.finish()");
const all = JSON.parse(mem.csa_progress_v1);
ok("complete the game finishes every stop and all six bosses at three stars", ev("PATH").every(id => all.done[id] && all.stars[id] === 3) && ev("BOSSES").every(b => all.done[b.id]));
ok("it reaches the top level and the highest tier", all.xp >= ev("LEVELS[LEVELS.length - 1][1]") && ev("levelOf(state.xp)") === ev("LEVELS.length - 1") && ev("tierOf()") === 5);
ok("it has every badge the game knows (the boss ones are added by badges.js, which the page loads before this)", ev("Object.keys(BADGES)").every(k => all.badges.includes(k)));
ok("its skills are all strong, with no weak spot left on the radar", ev("Progress.skillAverages(state)").length >= 3 && ev("Progress.skillAverages(state)").every(s => s[1] >= 4));
ok("it keeps the character, is still presenter mode and the real progress is still in the stash", JSON.parse(mem.csa_avatar).name === "Edited Demo" && mem.csa_presenter === "1" && JSON.parse(mem.csa_presenter_stash).progress === realProgress);
ev("Presenter.sample()");
ok("a random sample can be loaded again afterwards, part-way through, and keeps the character", Object.keys(JSON.parse(mem.csa_progress_v1).done).length < ev("PATH.length") && JSON.parse(mem.csa_progress_v1).xp < all.xp && JSON.parse(mem.csa_avatar).name === "Edited Demo");
ev("Presenter.restore()");
ok("leaving after a start over still brings the real player back", JSON.parse(mem.csa_progress_v1).xp === 77 && JSON.parse(mem.csa_avatar).name === "Real Person");
delete mem.csa_progress_v1; delete mem.csa_avatar;

// the menu and how it is wired in
const menu = ev("Presenter.MENU().flatMap(([, items]) => items.map(i => i[0]))");
ok("the menu reaches the game, the dashboard, the character, the brand page, all five manager pages and the four avatar check sheets", menu.length === 30 && ["Map", "Results: a win", "Tier Up", "Dashboard: Settings", "Character", "Who is Tequila Corrido?", "Manager: Grader", "Shirts: arms and sleeves", "Hair on every head shape"].every(l => menu.includes(l)), menu.length + " jumps");
const code = [require("./page").source(), ...["dashboard.js", "manager.js", "mission.js", "boss.js", "onboarding.js", "lessons.js"].map(read)].join("\n");
ok("every page the menu calls exists", ["creator", "tutorial", "home", "openDiff", "play", "quiz", "bossIntro", "dashboard", "explorer", "managerMode"].every(f => new RegExp(`function ${f}\\(`).test(code)));
const html = require("./page").source(), pres = read("presenter.js"), dash = read("dashboard.js");
ok("the menu footer has buttons to start over, load a random sample and complete the game, and each one goes back to the map", ["prreset", "prsample", "prfinish"].every(id => new RegExp(`id="${id}"`).test(pres) && new RegExp(`q\\("#${id}"\\)\\.onclick = jump\\(`).test(pres)) && /const jump = \(fn, msg\) => \(\) => \{ fn\(\); close\(\);[^}]*home\(\)/.test(pres));
const tags = read("index.html");   // the real script tags, not the page with its scripts put back
ok("it loads after the manager script and before the page's own scripts", tags.indexOf('<script src="manager.js') < tags.indexOf('<script src="presenter.js') && tags.indexOf('<script src="presenter.js') < tags.indexOf('<script src="app.js'));
ok("the way in sits on the sign-in screen, and only turns on after the age check", /<p class="presentrow"><button type="button" class="linkbtn" id="presentGo" disabled>/.test(html) && /\["#guest", "#email", "#sendlink", "#presentGo"\]\.forEach\(x => \{ \$\(x\)\.disabled = false; \}\)/.test(html));
ok("the menu itself only appears once the age gate has been passed", /MutationObserver/.test(pres) && /gate\.classList\.contains\("hidden"\)/.test(pres));
ok("Settings has a button to start it, with a warning first, and to leave it", /id="gopresent"/.test(dash) && /confirm\("Presenter mode loads sample progress/.test(dash) && /Leave presenter mode/.test(dash));
ok("clicking the menu never counts as a click outside a panel (that would close the page you jumped to)", /closest\("header, footer, #tabbar, #presenter, dialog/.test(html));
ok("a jump closes any dialog left open, and a manager jump turns manager mode on or off", /querySelectorAll\("dialog\[open\]"\)\.forEach\(d => d\.close\(\)\)/.test(pres) && /classList\.toggle\("mgr", !!manager\)/.test(pres));
ok("a sample run puts the speaking function back when it finishes, even if it fails", /window\.lipTalk = \(\) => sleep\(120\)/.test(pres) && /finally \{ window\.lipTalk = real; busy\(false\); \}/.test(pres));
ok("presenter.js adds one new global name", (pres.match(/^const [A-Za-z]+ =/gm) || []).length === 1 && /^const Presenter = /m.test(pres));
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
