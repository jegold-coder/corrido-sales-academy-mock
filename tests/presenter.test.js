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
ok("every stop is open and boss tries are unlimited, so any page can be shown", P.proto.unlockStops === true && P.proto.unlimitedTries === true);
ok("the camera is off, so no permission prompt interrupts a demo", P.camPref === false);
const early = ev("Presenter.sampleProgress('quiet')"), start = ev("Presenter.sampleProgress('brandbrain')");
ok("a sample taken before a stop leaves that stop unplayed, so its first win looks like one", early.done.priya !== true && start.done.quiet !== true && start.done.brandbrain === true);
ok("no merch or clothing in anything the sample says", !/merch|shirt|\btee\b|\bhat\b/i.test(JSON.stringify(P.mistakes)));

// entering and leaving never costs the real player anything
const realProgress = JSON.stringify({ xp: 77, done: { brand: true }, streak: 2 }), realAvatar = JSON.stringify({ name: "Real Person", gender: "Male" });
mem.csa_progress_v1 = realProgress; mem.csa_avatar = realAvatar;
ev("Presenter.enter()");
ok("on entering, the flag is set and the sample is what is saved", mem.csa_presenter === "1" && JSON.parse(mem.csa_progress_v1).xp === 520 && JSON.parse(mem.csa_avatar).name === "Demo Rep" && ev("state.xp") === 520);
ok("the real progress and character are kept in the stash, exactly as they were", JSON.parse(mem.csa_presenter_stash).progress === realProgress && JSON.parse(mem.csa_presenter_stash).avatar === realAvatar);
ev("Presenter.enter(); Presenter.enter(through = undefined)");
ok("entering again does not overwrite the stash with the sample", JSON.parse(mem.csa_presenter_stash).progress === realProgress);
ev("Presenter.restore()");
ok("leaving brings the real player back, and clears the flag and the stash", JSON.parse(mem.csa_progress_v1).xp === 77 && JSON.parse(mem.csa_avatar).name === "Real Person" && !("csa_presenter" in mem) && !("csa_presenter_stash" in mem) && ev("state.xp") === 77);
delete mem.csa_progress_v1; delete mem.csa_avatar;
ev("Presenter.enter(); Presenter.restore()");
ok("a first-time visitor who leaves goes back to a first-time visit (nothing saved, no character)", !("csa_progress_v1" in mem) && !("csa_avatar" in mem) && ev("state.avatarSaved") === false);

// the menu and how it is wired in
const menu = ev("Presenter.MENU().flatMap(([, items]) => items.map(i => i[0]))");
ok("the menu reaches the game, the dashboard, the character, the brand page and all five manager pages", menu.length === 26 && ["Map", "Results: a win", "Tier Up", "Dashboard: Settings", "Character", "Who is Tequila Corrido?", "Manager: Grader"].every(l => menu.includes(l)), menu.length + " jumps");
const code = ["index.html", "dashboard.js", "manager.js", "mission.js", "boss.js", "onboarding.js", "lessons.js"].map(read).join("\n");
ok("every page the menu calls exists", ["creator", "tutorial", "home", "openDiff", "play", "quiz", "bossIntro", "dashboard", "explorer", "managerMode"].every(f => new RegExp(`function ${f}\\(`).test(code)));
const html = read("index.html"), pres = read("presenter.js"), dash = read("dashboard.js");
ok("it loads after the manager script and before the page's own script", html.indexOf('<script src="manager.js') < html.indexOf('<script src="presenter.js') && html.indexOf('<script src="presenter.js') < html.indexOf("const enterGame"));
ok("the way in sits on the sign-in screen, and only turns on after the age check", /<p class="presentrow"><button type="button" class="linkbtn" id="presentGo" disabled>/.test(html) && /\["#guest", "#email", "#sendlink", "#presentGo"\]\.forEach\(x => \{ \$\(x\)\.disabled = false; \}\)/.test(html));
ok("the menu itself only appears once the age gate has been passed", /MutationObserver/.test(pres) && /gate\.classList\.contains\("hidden"\)/.test(pres));
ok("Settings has a button to start it, with a warning first, and to leave it", /id="gopresent"/.test(dash) && /confirm\("Presenter mode loads sample progress/.test(dash) && /Leave presenter mode/.test(dash));
ok("clicking the menu never counts as a click outside a panel (that would close the page you jumped to)", /closest\("header, footer, #tabbar, #presenter, dialog/.test(html));
ok("a jump closes any dialog left open, and a manager jump turns manager mode on or off", /querySelectorAll\("dialog\[open\]"\)\.forEach\(d => d\.close\(\)\)/.test(pres) && /classList\.toggle\("mgr", !!manager\)/.test(pres));
ok("a sample run puts the speaking function back when it finishes, even if it fails", /window\.lipTalk = \(\) => sleep\(120\)/.test(pres) && /finally \{ window\.lipTalk = real; busy\(false\); \}/.test(pres));
ok("presenter.js adds one new global name", (pres.match(/^const [A-Za-z]+ =/gm) || []).length === 1 && /^const Presenter = /m.test(pres));
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
