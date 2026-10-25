// Checks the manager Coaching page: every skill maps to a topic, the stop it suggests is real and within the rep's reach, and the messages read well.
// Run from the mock-prototype folder: node tests/coaching.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };
const ctx = vm.createContext({ console, state: { done: {}, proto: {} } });
["scenarios.js", "lessons.js"].forEach(f => vm.runInContext(read(f).replace(/^"use strict";/, ""), ctx));
vm.runInContext(read("tiers.js").replace(/^"use strict";/, "").replace(/if \(typeof module[^\n]*/, ""), ctx);
const mgr = read("manager.js");
// the same stop list the page builds (index.html)
vm.runInContext("const ALL_STOPS = () => PATH.map(id => LESSONS.find(l => l.id === id) || SCENARIOS.find(m => m.id === id) || EXTRA_STOPS[id]);", ctx);
vm.runInContext(mgr.slice(mgr.indexOf("const SAMPLE_REPS"), mgr.indexOf("const SAMPLE_CLASS")), ctx);
vm.runInContext(mgr.slice(mgr.indexOf("const SAMPLE_SKILLS"), mgr.indexOf("let mgrTab")), ctx);
vm.runInContext(mgr.slice(mgr.indexOf("const COACH = ["), mgr.indexOf("function mgrCoaching")), ctx);
const ev = s => vm.runInContext(s, ctx);

// every skill a mission teaches, and every label on the manager's sample data, belongs to a coaching topic
const stepSkills = ev("[...new Set(SCENARIOS.flatMap(s => s.steps.map(t => t.skill)))]");
const unmapped = stepSkills.filter(k => !ev(`coachPlan(${JSON.stringify(k)}, 5)`));
ok("every skill taught in a mission has a coaching topic", unmapped.length === 0, unmapped.join(", "));
const labels = ev("[...new Set([...SAMPLE_REPS.map(r => r.focus), ...Object.keys(SAMPLE_SKILLS)])]");
ok("every focus skill on the sample page has a coaching topic", labels.every(k => ev(`coachPlan(${JSON.stringify(k)}, 2)`)), labels.filter(k => !ev(`coachPlan(${JSON.stringify(k)}, 2)`)).join(", "));
ok("a skill nobody has heard of gets no plan instead of a wrong one", ev("coachPlan('Juggling', 3)") === null && ev("coachPlan('', 3)") === null && ev("coachPlan(undefined, 3)") === null);

// the stop is real, within the rep's reach, and an ordinary stop whenever one practices the skill
const all = [...stepSkills, ...labels];
let bad = [];
for (const k of all) for (let t = 0; t <= 5; t++) {
  const p = ev(`coachPlan(${JSON.stringify(k)}, ${t})`);
  if (!p || !p.stop) { bad.push(`${k}@${t}: no stop`); continue; }
  const reached = ev(`reachedStops(${t})`), i = ev(`PATH.indexOf(${JSON.stringify(p.stop.id)})`);
  if (!reached.includes(p.stop.id)) bad.push(`${k}@${t}: ${p.stop.id} is out of reach`);
  const bossOk = ev(`!BOSS_BY[${JSON.stringify(p.stop.id)}]`);
  const ordinary = reached.filter(id => ev(`!BOSS_BY[${JSON.stringify(id)}]`) && ev(`(() => { const sc = SCENARIOS.find(x => x.id === ${JSON.stringify(id)}); return !!sc && sc.steps.some(st => COACH.find(c => c.name === ${JSON.stringify(p.topic.name)}).re.test(st.skill)); })()`));
  if (!bossOk && !p.topic.stop && ordinary.length) bad.push(`${k}@${t}: picked a boss though ${ordinary[0]} practices it`);
}
ok("every skill at every tier gets a real stop the rep has reached, an ordinary stop when one fits", bad.length === 0, bad.slice(0, 4).join("; "));
ok("a Tier 0 rep, who has only the lessons, is sent to a lesson", ["lineup", "brand"].includes(ev("coachPlan('Closing', 0).stop.id")));

// the sample class's numbers, as the page shows them
ok("the class's lowest skill, closing, sends a Tier 2 rep to a mission with a closing step", ev("coachPlan('Closing', 2).stop.id") === "quiet" && ev("SCENARIOS.find(s => s.id === 'quiet').steps.some(t => t.skill === 'Closing')"));
ok("objections at Tier 2 goes to the mission with an objection step", ev("coachPlan('Objections', 2).stop.id") === "priya" && ev("SCENARIOS.find(s => s.id === 'priya').steps.some(t => /Objection/.test(t.skill))"));
ok("price handling at Tier 2 goes to a mission that has a price step", ev("SCENARIOS.find(s => s.id === coachPlan('Price handling', 2).stop.id).steps.some(t => /Price/.test(t.skill))"));
ok("brand knowledge goes to the lineup lesson", ev("coachPlan('Brand knowledge', 3).stop.id") === "lineup");
ok("staying calm at Tier 3 or higher goes to the store trouble mission", ev("coachPlan('Staying calm', 4).stop.id") === "stickup");
ok("the staying-calm tip is calm compliance, never a stand-off", /calm/i.test(ev("COACH[0].tip")) && /cooperate/i.test(ev("COACH[0].tip")) && !/fight|resist|chase/i.test(ev("COACH[0].tip")));
ok("the compliance tip says no health claims and 21 and over", /health claims/i.test(ev("COACH.find(t => t.name === 'Compliance').tip")) && /21/.test(ev("COACH.find(t => t.name === 'Compliance').tip")));

// who needs one-to-one coaching, and what the message says
const need = ev("SAMPLE_REPS.filter(r => coachWhy(r)).map(r => r.name)");
ok("the sample reps to coach are the three who lost a boss 3 times or went idle 3+ days", need.join() === "Priya S.,Luis G.,Rae J.", need.join());
ok("a rep who is fine gets no coaching reason", ev("coachWhy({ lost: 0, idle: 1 })") === "" && ev("coachWhy({ lost: 2, idle: 0 })") === "" && ev("coachWhy({ lost: 0, idle: null })") === "");
const msg = ev("coachMessage(SAMPLE_REPS.find(r => r.name === 'Priya S.'), coachPlan('Objections', 2), 'Dana')");
ok("the message greets the rep by first name, names the stop and the tip, and is signed", /^Hi Priya,/.test(msg) && msg.includes("Priya's Bottle Shop") && msg.includes("Acknowledge the worry first") && /Dana$/.test(msg));
const idleMsg = ev("coachMessage(SAMPLE_REPS.find(r => r.name === 'Luis G.'), coachPlan('Brand knowledge', 1), 'Dana')");
ok("an idle rep is told how long it has been", /4 days/.test(idleMsg) && idleMsg.includes("Know the Lineup"));
ok("the message works even when there is no plan", /Please pick up your next stop/.test(ev("coachMessage({ name: 'Zed Q.', idle: 5, lost: 0 }, null, 'Dana')")));
ok("coaching messages never mention merch or clothing", !/merch|shirt|\btee\b|\bhat\b|clothing|outfit/i.test(msg + idleMsg + ev("COACH.map(t => t.tip).join(' ')")));

// the page: the tab, the missing function, and the buttons
ok("Coaching is a manager page, after Cohorts", /\["cohorts", "Cohorts"\], \["coaching", "Coaching"\]/.test(mgr) && /coaching: mgrCoaching/.test(mgr));
ok("the player's own row can find their weakest skill (the function was never defined before)", /const weakestSkill = \(\) =>/.test(mgr) && /Progress\.skillAverages\(state\)\[0\]/.test(mgr));
ok("copying a message and marking a rep coached are wired up", /\.copybtn"\)\.forEach/.test(mgr) && /\.coachedbtn"\)\.forEach/.test(mgr) && /state\.coached = /.test(mgr) && /#copyteam/.test(mgr));
ok("reps can't reach the Coaching page, because it is a manager page", !/mgrCoaching|coachPlan|coachMessage|COACH\b/.test(read("dashboard.js")) && !/mgrCoaching|coachPlan/.test(read("index.html").replace(/<script[^>]*src[^>]*><\/script>/g, "")));
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
