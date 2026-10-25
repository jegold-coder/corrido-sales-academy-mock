// Checks coach mode, the Hint button, and the second version of every question. Run from the mock-prototype folder: node tests/learning.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };
const mission = read("mission.js"), html = require("./page").source(), boss = read("boss.js"), scen = read("scenarios.js");
const ctx = vm.createContext({ console, state: { done: {}, proto: {} } });
vm.runInContext(scen.replace(/^"use strict";/, ""), ctx);
const slice = (a, b) => mission.slice(mission.indexOf(a), mission.indexOf(b));
vm.runInContext(slice("const HINT_COST", "// The Trust, Interest"), ctx);
vm.runInContext(slice("function withOpener", "\nfunction play(sc)"), ctx);
const ev = s => vm.runInContext(s, ctx);

// ---------- coach mode ----------
ok("coach mode is on by default for levels 1 and 2, off from level 3, and never in a real boss battle", ev("state.coachPref = undefined; [1, 2, 3, 4, 5].map(l => coachFor({ level: l })).join()") === "true,true,false,false,false" && ev("coachFor({ level: 1, boss: { tier: 1 } })") === false);
ok("the rep's own choice beats the default, but a boss battle still never has it", ev("state.coachPref = true; coachFor({ level: 5 })") === true && ev("state.coachPref = false; coachFor({ level: 1 })") === false && ev("state.coachPref = true; coachFor({ level: 3, boss: {} })") === false);
ev("state.coachPref = undefined");
ok("a practice run of a boss (no boss object) can use coach mode", ev("coachFor({ level: 2, rehearsal: true, boss: null })") === true);
ok("after each answer in coach mode the player sees the score, what was hit and missed, and a stronger answer, then the usual Next button", /const here = log\[log\.length - 1\], coach = coachOn \? coachCard\(here\) : ""/.test(mission) && /\$\{coach\}<div class="feed best">/.test(mission) && /r\.hits\.length/.test(slice("function coachCard", "// ---------- one question ----------")) && /r\.misses\.length/.test(mission) && /A stronger answer might sound like/.test(slice("function coachCard", "// ---------- one question ----------")));
ok("without coach mode the old behaviour stays: scores come at the end", /"Answer recorded\. Your scores come at the end\."/.test(mission));
ok("the box before a mission has a Coach mode checkbox that remembers the choice, and bosses say there is none", /id="coachOn"/.test(html) && /state\.coachPref = e\.target\.checked/.test(html) && /Boss battles are scored at the end, with no Coach mode and no hints/.test(html) && /boss: !rehearsal/.test(boss));

// ---------- hints ----------
ok("levels 3 and up, and retries, get a Hint button where the checklist is hidden, and a boss battle gets neither", /\$\{boss \? "" : L\.tips && !sc\.retry \? tips : `<div id="hintslot"><button class="btn alt" id="hintbtn"/.test(mission));
ok("a hint costs 5 XP each, counted per hint and never takes the reward below zero", ev("HINT_COST") === 5 && /Math\.max\(0, Math\.round\(\(avg \* 14 \+ \(won \? 25 : 0\)\) \* \(L\.mult \|\| 1\) \* \(cam \? 1\.25 : 1\)\) - hintsUsed \* HINT_COST\)/.test(mission));
ok("the results say how many hints were used and what they cost", /hintsUsed \? `<span class="rw">💡 \$\{hintsUsed\} hint/.test(mission) && /hintsUsed = 0; coachOn = coachFor\(sc\)/.test(mission));

// ---------- the second version of every question ----------
const alts = ev("LINE_ALTS"), missions = ev("SCENARIOS");
const skipped = { stickup: [1, 2, 3] };   // a robbery is not reworded for variety
let missing = [], same = [], lost = [], odd = [];
const facts = t => (t.replace(/<[^>]+>/g, "").match(/\$\d+(?:\.\d+)?|\b\d+\b|forty-five|Thursday|noon|'[a-z-]+'/gi) || []).map(x => x.toLowerCase()).sort().join("|");
missions.forEach(sc => sc.steps.forEach((st, k) => {
  if (k === 0) return;
  const alt = (alts[sc.id] || {})[k], skip = (skipped[sc.id] || []).includes(k);
  if (skip) { if (alt) odd.push(sc.id + ":" + k + " should stay as written"); return; }
  if (!alt) { missing.push(sc.id + ":" + k); return; }
  if (alt.trim() === st.line.trim()) same.push(sc.id + ":" + k);
  if (facts(alt) !== facts(st.line)) lost.push(sc.id + ":" + k + " " + facts(st.line) + " vs " + facts(alt));
  if (alt.length < st.line.length * 0.5 || alt.length > st.line.length * 1.6) odd.push(sc.id + ":" + k + " length");
}));
ok("every question after the opener has a second version (except the robbery's first three)", missing.length === 0, missing.join(", "));
ok("each second version is actually different", same.length === 0, same.join(", "));
ok("the facts stay the same in the second version: every price, number and day the customer mentions", lost.length === 0, lost.join("; "));
ok("none is much shorter or longer than the original, and the robbery lines are untouched", odd.length === 0, odd.join(", "));
ok("no variant mentions merch or clothing", !/merch|shirt|\btee\b|\bhat\b/i.test(JSON.stringify(alts)));
ok("every variant belongs to a real mission and a real question", Object.entries(alts).every(([id, o]) => missions.find(m => m.id === id) && Object.keys(o).every(k => missions.find(m => m.id === id).steps[k])));

// the picker: never the same version twice in a row, for any question, and nothing else about the mission changes
ev("state.opener = {}; state.variant = {}");
const marco = ev("SCENARIOS.find(m => m.id === 'marco')");
let repeats = 0, prev = null, sameShape = true, seen = new Set();
for (let run = 0; run < 24; run++) {
  const out = vm.runInContext("withOpener(SCENARIOS.find(m => m.id === 'marco'))", ctx), lines = out.steps.map(s => s.line);
  if (prev) lines.forEach((l, k) => { if (k > 0 && l === prev[k]) repeats++; });
  prev = lines; lines.forEach((l, k) => seen.add(k + ":" + l));
  sameShape = sameShape && out.steps.length === marco.steps.length && out.steps.every((s, k) => s.q === marco.steps[k].q && s.skill === marco.steps[k].skill && s.R === marco.steps[k].R);
}
ok("over 24 replays the same version of a question never comes up twice in a row", repeats === 0);
ok("both versions of each later question really get played", [1, 2, 3, 4].every(k => [...seen].filter(x => x.startsWith(k + ":")).length === 2));
ok("the question, the skill and the scoring are untouched by a variant", sameShape);
ok("the Results and the retry button use the line that was played, so they match", /line: l\.line/.test(mission) && /line: st\.line/.test(mission) === false);
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
