// Checks the surprise customer: ten curveball questions in five kinds, each with a right answer the real coach scores high and wrong answers it scores low, a tone and
// a customer; a round is one of each kind; and the mission screen handles a curveball (a shorter timer, a silent customer, a note about it).
// Run from the mock-prototype folder: node tests/surprise.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };
const ctx = vm.createContext({ console, shuffle: a => [...a].sort(() => Math.random() - .5) });
for (const f of ["scenarios.js", "criteria.js", "tone.js", "coach.js", "surprise.js"]) vm.runInContext(read(f).replace(/^"use strict";/, "").replace(/if \(typeof module[^\n]*/, ""), ctx);
const ev = s => vm.runInContext(s, ctx);
const strip = t => String(t).replace(/^"|"$/g, "");

// ---------- the ten questions ----------
const N = ev("SURPRISE.length"), kinds = ev("SURPRISE.map(s => s.kind)");
ok("there are ten questions, two of each of the five kinds", N === 10 && ["interrupt", "quiet", "topic", "push", "stall"].every(k => kinds.filter(x => x === k).length === 2));
ok("each has an id of its own, and a skill, question, hint, customer line, curveball note and replies", ev(`(() => { const ids = new Set(); return SURPRISE.every(s => { ids.add(s.id); return [s.skill, s.q, s.hint, s.line, s.twist, s.R[0], s.R[1], s.RH, s.E[0][0], s.E[0][1], s.reply.best, s.reply.mid, s.reply.bad].every(x => typeof x === "string" && x.length > 5) && s.H.length === 3 && s.H.every(h => h[0] && h[1]); }) && ids.size === SURPRISE.length; })()`));
ok("each has scoring rules in CRITERIA under surprise:<id>, with at least three things to cover and a mistake to catch", ev(`SURPRISE.every(s => CRITERIA["surprise:" + s.id] === s.crit && s.crit.need.length >= 3 && s.crit.bad.length >= 1)`));
ok("a silent customer says nothing (the quiet ones), and only those", ev(`SURPRISE.every(s => !!s.silent === (s.kind === "quiet"))`) && !/"[^"]+"/.test(ev(`SURPRISE.filter(s => s.silent).map(s => s.line).join(" ")`)));
ok("a curveball can give less time than the level (30 to 40 seconds, under the level's 60), never more", ev(`SURPRISE.filter(s => s.secs).every(s => s.secs >= 30 && s.secs <= 40 && s.secs < MLEVEL[4].secs)`) && ev(`SURPRISE.filter(s => s.kind === "interrupt").every(s => s.secs)`));

// ---------- the real coach scores them ----------
const rows = ev(`SURPRISE.map(s => { const key = "surprise:" + s.id, tone = TONE_FOR[s.view.id], sc = t => Coach.score(key, t.replace(/^"|"$/g, ""), 4, { tone });
  return { id: s.id, R: sc(s.R[0]).score, RH: sc(s.RH).score, E: sc(s.E[0][0]).score, H: s.H.map(h => sc(h[0]).score), flags: Coach.HEALTH.test(s.R[0] + s.RH) }; })`);
const low = rows.filter(r => r.R < 4.2 || r.RH < 4.2), high = rows.filter(r => r.E > 3.4 || r.H.some(h => h > 3.4));
ok("every right answer (and its plainer wording) scores 4.2 or more out of 5", low.length === 0, JSON.stringify(low));
ok("every wrong answer scores 3.4 or less, and clearly below the right one", high.length === 0 && rows.every(r => Math.max(r.E, ...r.H) <= Math.min(r.R, r.RH) - 1.5), JSON.stringify(high));
ok("no right answer makes a health claim", rows.every(r => !r.flags));
ok("a right answer is never pushy, combative or grovelling: its tone is full marks", ev(`SURPRISE.every(s => [s.R[0], s.RH].every(t => Tone.score(t.replace(/^"|"$/g, ""), TONE_FOR[s.view.id], null).pts === 1))`));
ok("a wrong answer that is short on the facts can't win on tone alone: no wrong answer reaches 3.4", rows.every(r => r.H.every(h => h < 3.4) && r.E < 3.4));

// ---------- the customers ----------
const cust = ev("Object.values(SURPRISE_CUSTOMERS)");
ok("six new customers, each with a name, role, look and a scene the map already has", cust.length === 6 && cust.every(v => v.cust.name && v.cust.role && typeof v.cust.male === "boolean" && v.cust.meter && ["skin", "hair", "hairStyle", "shirt", "top"].every(k => v.cust.look[k]) && ["bar", "lounge", "restaurant", "shop", "venue", "warehouse"].includes(v.theme)));
ok("none of them is a customer from the missions, so a rep meets someone new", ev(`Object.values(SURPRISE_CUSTOMERS).every(v => !SCENARIOS.some(m => m.cust.name === v.cust.name || m.id === v.id))`));
ok("each has a tone profile, at level 4 (hard), with its own id", ev(`Object.values(SURPRISE_CUSTOMERS).every(v => v.level === 4 && TONE_FOR[v.id] && TONE_FOR[v.id].pace && TONE_FOR[v.id].cue)`));
ok("every question belongs to one of them", ev(`SURPRISE.every(s => Object.values(SURPRISE_CUSTOMERS).includes(s.view))`));
ok("the customers' hair styles and beards are ones the drawing code has", (() => {
  const hair = new Set(read("avatar.js").match(/HAIR_BY = \{[\s\S]*?\};/)[0].match(/"[A-Za-z ]+"/g).map(strip)), beards = new Set(["Stubble", "Beard", "Mustache"]);
  return cust.every(v => hair.has(v.cust.look.hairStyle) && (!v.cust.look.beard || beards.has(v.cust.look.beard)));
})());

// ---------- the rules of the house ----------
const text = ev("JSON.stringify(SURPRISE.map(s => ({ ...s, crit: 0, view: 0 })))");
ok("no merch or clothing anywhere in the questions", !/\b(merch|shirt|tee|tees|hat|hats|hoodie|polo|jacket|cap)\b/i.test(text));
ok("the only price is the public Añejo price, and no wholesale terms, margins or sales numbers are invented", [...text.matchAll(/\$[\d.,]+/g)].every(m => m[0] === "$89.99") && !/margin|wholesale price|sell-through|sold \d/i.test(ev(`SURPRISE.map(s => [s.R[0], s.RH].join(" ")).join(" ")`)));
ok("every right answer keeps to what is public: no celebrity, health or shipping claims", !/celebrit|cure|healthy|shipping/i.test(ev(`SURPRISE.map(s => [s.R[0], s.RH].join(" ")).join(" ")`)));
ok("the under-21 question never has the rep serve him: it names the 21 rule in both right answers", ev(`(s => /21/.test(s.R[0]) && /21/.test(s.RH))(SURPRISE.find(x => x.id === "walt-nephew"))`));
ok("every skill is one the Skills chart and the Coaching page already know", (() => {
  const fam = new Set(vm.runInNewContext(read("dashboard.js").match(/const SKILL_FAMILIES = \[[\s\S]*?\n\];/)[0] + ";SKILL_FAMILIES.flatMap(f => f[1])"));
  const coach = vm.runInNewContext(read("manager.js").match(/const COACH = \[[\s\S]*?\n\];/)[0] + ";COACH");
  return ev("[...new Set(SURPRISE.map(s => s.skill))]").every(k => fam.has(k) && coach.some(t => t.re.test(k)));
})());

// ---------- a round ----------
let sizes = new Set(), firsts = new Set(), used = new Set(), good = true;
for (let i = 0; i < 300; i++) {
  const r = ev("(() => { const sc = surpriseScenario(); return { n: sc.steps.length, kinds: sc.steps.map(s => s.kind), ids: sc.steps.map(s => s.id), keys: sc.steps.every(s => CRITERIA[s.ckey] && s.src && s.src.cust), practice: sc.practice, surprise: sc.surprise, level: sc.level, pass: sc.passMark, cust: sc.cust.name === sc.steps[0].src.cust.name }; })()");
  sizes.add(r.n); firsts.add(r.kinds[0]); r.ids.forEach(x => used.add(x));
  if (new Set(r.kinds).size !== 5 || new Set(r.ids).size !== 5 || !r.keys || !r.practice || !r.surprise || r.level !== 4 || r.pass !== 3.2 || !r.cust) good = false;
}
ok("a round is five questions, one of each kind, each from a different question, and it is practice (it never marks a stop done)", good && sizes.size === 1 && [...sizes][0] === 5);
ok("the kinds come in a different order each time, and over many rounds every question is asked", firsts.size >= 4 && used.size === 10);

// ---------- how the mission screen and the rest of the page handle it ----------
const mission = read("mission.js"), dash = read("dashboard.js"), pres = read("presenter.js"), html = read("index.html"), voices = read("voices.js");
ok("the mission screen uses a curveball's own time limit, goes quiet for a silent customer, and shows a note and a chip", /const secs = S\.secs \|\| L\.secs/.test(mission) && (mission.slice(mission.indexOf("function question("), mission.indexOf("// ---------- the scorecard")).match(/L\.secs/g) || []).length === 1 && /if \(!S\.silent\) lipTalk/.test(mission) && /S\.twist/.test(mission) && /twistchip/.test(mission));
ok("each customer speaks in their own voice, including the ones who are only in a practice or surprise round", /opt\.view \|\| state\.sc/.test(mission) && /\{ view \}/.test(mission) && /SURPRISE_CUSTOMERS/.test(voices));
ok("'Try this question again' works for a surprise question", /SURPRISE\.find\(x => "surprise:" \+ x\.id === l\.ck\)/.test(mission));
ok("a surprise round has a pass mark of its own and is logged as 'Surprise round', so it can't earn Tough Crowd (a Level 4 or 5 pass)", /sc\.passMark \|\| 2\.8/.test(mission) && /sc\.surprise \? "Surprise round"/.test(mission) && !/Level [45]/.test("Surprise round"));
ok("the Progress tab has the card, and the Presenter menu has a jump to it", /Surprise\.card\(\)/.test(dash) && /Surprise\.wire\(el\)/.test(dash) && /\["Surprise customer", \(\) => play\(surpriseScenario\(\)\)\]/.test(pres));
ok("the script loads after the scoring rules and before the review page", html.indexOf('<script src="criteria.js') < html.indexOf('<script src="surprise.js') && html.indexOf('<script src="surprise.js') < html.indexOf('<script src="callcard.js'));
ok("the card opens once The Quiet Bar is done, or in Presenter mode", /!!state\.done\.quiet \|\| \(typeof Presenter !== "undefined" && Presenter\.active\(\)\)/.test(read("surprise.js")));
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
