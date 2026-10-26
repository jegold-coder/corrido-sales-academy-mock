// Checks the answer log and the manager pages built on it: answers are kept (words only), the sample class has real scored answers made the same way every time,
// "the question the class misses most" is worked out right, a manager's note reaches the rep, and the spreadsheets are safe and complete.
// Run from the mock-prototype folder: node tests/answers.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

function makeCtx(over = {}) {
  const c = vm.createContext({ console, esc, fmt: n => (Math.round(n * 10) / 10).toFixed(1), repName: () => "Taylor", toast() {}, $: () => null,
    state: { done: {}, proto: {}, xp: 0, history: [], answers: [], notes: {}, assignments: [], coached: {}, nudged: {}, streak: 0, cohorts: [], mgrName: "Manager", avatar: { name: "Taylor" }, ...over } });
  for (const f of ["progress.js", "scenarios.js", "criteria.js", "tone.js", "coach.js", "lessons.js", "tiers.js", "dashboard.js", "manager.js", "answers.js", "mgranswers.js", "assign.js"]) vm.runInContext(read(f).replace(/^"use strict";/, "").replace(/if \(typeof module[^\n]*/, ""), c);
  vm.runInContext("const ALL_STOPS = () => PATH.map(id => LESSONS.find(l => l.id === id) || SCENARIOS.find(m => m.id === id) || EXTRA_STOPS[id]);", c);
  return c;
}
// a plain spreadsheet reader (manager.js's parseCsv is the Invite page's: it keeps only name, email and team)
function table(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true; else if (ch === ",") { row.push(cell); cell = ""; } else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; } else cell += ch;
  }
  row.push(cell); rows.push(row);
  return rows;
}
const c1 = makeCtx(), c2 = makeCtx(), ev = s => vm.runInContext(s, c1), ev2 = s => vm.runInContext(s, c2);

// ---------- keeping answers ----------
ev(`state.answers = []; for (let i = 0; i < 100; i++) AnswerLog.add(state, { ck: "q:" + i, text: "answer " + i, score: 4 })`);
ok("an answer is saved newest first, with an id and a date, and only the last 80 are kept", ev("state.answers.length") === 80 && ev("state.answers[0].ck") === "q:99" && ev("state.answers[79].ck") === "q:20" && ev("new Set(state.answers.map(a => a.id)).size") === 80 && /^\d{4}-\d{2}-\d{2}$/.test(ev("state.answers[0].date")));
ev("state.answers = []");
const mission = read("mission.js"), call = mission.slice(mission.indexOf("AnswerLog.add("), mission.indexOf("Progress.save(state);", mission.indexOf("AnswerLog.add(")));
ok("what is kept is the words and the scores, never the recording (the only mention of the recording is whether the answer was spoken)", /AnswerLog\.add\(state/.test(mission) && (call.match(/blob/g) || []).length === 1 && /spoke: !!blob/.test(call) && ["text,", "score:", "misses:", "better:", "wpm:", "fillers:"].every(k => call.includes(k)));
ok("the log is saved with the rest of the progress, starts empty, and settings can clear it", /answers: \[\], notes: \{\}/.test(read("progress.js")) && /id="clrans"/.test(read("dashboard.js")) && /state\.answers = \[\]; state\.notes = \{\}/.test(read("dashboard.js")));

// ---------- the sample class ----------
const reps = ev("SAMPLE_REPS");
const A1 = ev("SAMPLE_REPS.flatMap(r => AnswerLog.sampleAnswers(r))"), A2 = ev2("SAMPLE_REPS.flatMap(r => AnswerLog.sampleAnswers(r))");
ok("the sample answers are the same every time (so the numbers on a page don't change when it reloads)", A1.length > 100 && JSON.stringify(A1) === JSON.stringify(A2));
ok("a sample rep with no boss beaten yet has no answers, and the others have a real number of them", ev("AnswerLog.sampleAnswers(SAMPLE_REPS.find(r => r.tier === 0)).length") === 0 && reps.filter(r => r.tier > 0).every(r => { const n = ev(`AnswerLog.sampleAnswers(SAMPLE_REPS.find(x => x.name === ${JSON.stringify(r.name)})).length`); return n >= 8 && n <= 15; }));
ok("every sample answer is a real answer from a mission, scored by the real coach", ev(`AnswerLog.classAnswers(SAMPLE_CLASS).filter(a => a.sample).every(a => { const m = SCENARIOS.find(x => x.id === a.mid), st = m.steps[+a.ck.split(":")[1]], t = a.text, all = [st.R[0], st.RH, ...st.H.map(h => h[0]), ...st.E.map(e => e[0])].map(x => x.replace(/^"|"$/g, "")); return all.includes(t) && Coach.score(a.ck, t, m.level, { tone: TONE_FOR[m.id], voice: null }).score === a.score && a.better === st.R[0].replace(/^"|"$/g, "") && a.mission === m.title; })`));
ok("a sample rep only has answers from the last three missions they have reached", ev(`SAMPLE_REPS.every(r => { const reached = reachedStops(r.tier), last3 = SCENARIOS.filter(m => reached.includes(m.id)).sort((a, b) => reached.indexOf(a.id) - reached.indexOf(b.id)).slice(-3).map(m => m.id); return AnswerLog.sampleAnswers(r).every(a => last3.includes(a.mid)); })`));
ok("answers are newest first and dated going back from the rep's last day of practice", ev(`SAMPLE_REPS.filter(r => r.tier).every(r => { const a = AnswerLog.sampleAnswers(r); return a.every((x, i) => !i || a[i - 1].date >= x.date) && a[0].date >= Progress.today().slice(0, 4); })`));
// a rep does worse in their focus skill than elsewhere
const topic = k => ev(`(COACH.find(t => t.re.test(${JSON.stringify(k)})) || {}).name`), mean = l => l.reduce((s, a) => s + a.score, 0) / l.length;
const inFocus = [], elsewhere = [];
A1.forEach(a => { const r = reps.find(x => x.name === a.rep); (topic(a.skill) === topic(r.focus) ? inFocus : elsewhere).push(a); });
ok("a sample rep scores lower in their focus skill than in their other skills", inFocus.length > 20 && mean(inFocus) + .5 < mean(elsewhere), `(${mean(inFocus).toFixed(2)} against ${mean(elsewhere).toFixed(2)})`);
ok("spoken answers have a pace and long pauses, typed ones don't, and filler words are small numbers", A1.every(a => a.spoke ? a.wpm >= 112 && a.wpm <= 184 && a.pauses >= 0 && a.pauses <= 2 : a.wpm === null && a.pauses === null) && A1.every(a => a.fillers >= 0 && a.fillers <= 3));
ok("a class made on the Invite page has only the player's own answers, and the sample class adds them to the sample reps'", ev(`(() => { state.answers = [{ id: "m1", ck: "quiet:0", text: "hi", score: 2, date: Progress.today() }]; const n = AnswerLog.classAnswers({ id: "c1" }), s = AnswerLog.classAnswers(SAMPLE_CLASS); return n.length === 1 && n[0].rep === "Taylor (you)" && n[0].you === true && s.length === ${A1.length} + 1 && s.filter(a => a.you).length === 1; })()`));
ev("state.answers = []");

// ---------- the question the class misses most ----------
const stats = ev("AnswerLog.questionStats(AnswerLog.classAnswers(SAMPLE_CLASS), 4)");
ok("each question's numbers are right: reps who answered it (their latest), reps under 3.5, the share, and what those answers missed", (() => {
  const by = {}; A1.forEach(a => { (by[a.ck] = by[a.ck] || {})[a.rep] = by[a.ck][a.rep] || a; });
  return stats.every(g => { const es = Object.values(by[g.ck]), low = es.filter(e => e.score < 3.5); return g.n === es.length && g.low === low.length && g.pct === Math.round(low.length / es.length * 100) && g.reps.length === low.length && low.every(e => g.reps.includes(e.rep)); });
})());
ok("they come worst first, and only questions at least four reps answered are in it", stats.length > 5 && stats.every((g, i) => g.n >= 4 && (!i || stats[i - 1].pct >= g.pct)));
ok("what was missed most is the most common thing the low answers missed, with how many", stats.some(g => g.missed.length) && stats.every(g => g.missed.every((m, i) => m.count >= 1 && (!i || g.missed[i - 1].count >= m.count))) && (g => g.missed.length === 0 || g.missed[0].count <= g.low)(stats[0]));
const h = ev("huddleStat(SAMPLE_CLASS)");
ok("the huddle is the question the most reps missed, and it is a question the class really answered", h && h.low > 0 && h.pct === stats[0].pct && ev("SCENARIOS.some(m => m.id === huddleStat(SAMPLE_CLASS).mid)"), JSON.stringify(h && [h.mission, h.skill, h.low + " of " + h.n]));
const minutes = ev("HUDDLE").map(r => r[0].split(":").reduce((m, x) => m * 60 + Number(x), 0));
ok("the huddle plan is five steps that add up to exactly five minutes (each starts when the last one ends)", ev("HUDDLE.length") === 5 && minutes.join() === "0,30,120,180,270" && 270 + 30 === 300);
const text = ev("huddleText(huddleStat(SAMPLE_CLASS), 'Dana')");
ok("the huddle text has the question, the customer's line, a timed plan, what was missed and a stronger answer, signed", text.includes(h.mission) && text.includes(h.line) && /0:00 {2}Read it out loud/.test(text) && /4:30 {2}One line to keep/.test(text) && text.includes(h.better) && /\nDana$/.test(text) && /\d+ of \d+ reps scored under 3\.5/.test(text));
ok("a class with nobody who has answered has no huddle, and a class of one uses the player's own low answers", ev(`huddleStat({ id: "c1" })`) === null && ev(`(() => { state.answers = [{ id: "m1", ck: "quiet:0", mid: "quiet", mission: "The Quiet Bar", skill: "Rapport", cname: "Jess", line: "hi", q: "How?", text: "no", score: 1.5, misses: ["a"], better: "b", date: Progress.today() }]; const g = huddleStat({ id: "c1" }); state.answers = []; return !!g && g.n === 1 && g.low === 1; })()`));
ok("the card has buttons to copy the plan and to assign the stop, and the Coaching page wires both", /id="copyhuddle"/.test(read("mgranswers.js")) && /id="assignhuddle"/.test(read("mgranswers.js")) && /\$\("#copyhuddle"\)\.onclick/.test(read("manager.js")) && /\$\("#assignhuddle"\)\.onclick/.test(read("manager.js")) && /\$\{huddle \? huddleCard\(c, huddle\) : ""\}/.test(read("manager.js")));

// ---------- one rep's numbers ----------
const mine = [{ skill: "Closing", score: 2, wpm: 150, fillers: 2 }, { skill: "Closing", score: 3, wpm: 130, fillers: 0 }, { skill: "Rapport", score: 5, wpm: null, fillers: 1 }];
const sm = ev(`AnswerLog.summary(${JSON.stringify(mine)})`);
ok("a summary has the count, the average score, the average pace of spoken answers only, fillers an answer and the lowest skill", sm.n === 3 && Math.abs(sm.avg - 10 / 3) < 1e-9 && sm.wpm === 140 && Math.abs(sm.fillers - 1) < 1e-9 && sm.weakest === "Closing" && ev("AnswerLog.summary([]).n") === 0 && ev("AnswerLog.summary([]).avg") === null);
ok("skill families are an average out of 100, in the order of a sales call", JSON.stringify(ev(`AnswerLog.familyScores(${JSON.stringify(mine)})`)) === JSON.stringify([["Opening", 100], ["Closing", 50]]));

// ---------- notes from a manager ----------
ev(`state.answers = [{ id: "a1", ck: "quiet:0", mission: "The Quiet Bar", date: "2026-10-20", text: "mine", better: "b", score: 2 }, { id: "a2", ck: "quiet:1", mission: "The Quiet Bar", date: "2026-10-21", text: "two", better: "b", score: 4 }]; state.notes = {};`);
ok("a note is trimmed, cut to 300 letters, and an empty one is refused", ev(`AnswerLog.addNote("a1", "   ") === null && AnswerLog.notesOf("a1").length === 0`) && ev(`AnswerLog.addNote("a1", "  Good pause.  ", "Dana").text`) === "Good pause." && ev(`AnswerLog.addNote("a2", "x".repeat(400), "Dana").text.length`) === 300);
ok("a note starts unread, and the rep's page counts them and then marks them read", ev("AnswerLog.unseen()") === 2 && ev("AnswerLog.playerNotes().length") === 2 && (ev("AnswerLog.markSeen()"), ev("AnswerLog.unseen()") === 0) && ev(`AnswerLog.notesOf("a1")[0].seen`) === true);
ok("a note can be deleted, and a answer with no notes left drops out", ev(`(AnswerLog.removeNote("a2", 0), AnswerLog.playerNotes().map(x => x.answer.id).join())`) === "a1" && ev(`AnswerLog.notesOf("a2").length`) === 0);
ok("notes on sample reps' answers are kept for the manager but never reach the rep's page", ev(`(AnswerLog.addNote("s-Ava R.-0", "hello", "Dana"), AnswerLog.playerNotes().every(x => x.answer.id !== "s-Ava R.-0") && AnswerLog.unseen() === 0)`));
ok("the rep's Review page shows the notes, then marks them read and drops the dot on the tab; the Progress tab tells them", /function notesCard\(\)/.test(read("dashboard.js")) && /AnswerLog\.markSeen\(\); document\.querySelectorAll\("\.ndot"\)/.test(read("dashboard.js")) && /AnswerLog\.unseen\(\) \? ' <span class="ndot"/.test(read("dashboard.js")) && /id="pnote"/.test(read("dashboard.js")));
ev("state.answers = []; state.notes = {}");

// ---------- what a page shows is escaped ----------
ev(`state.notes = { x1: [{ text: "<img src=x onerror=alert(1)>", from: "<b>Dana</b>", date: "2026-10-20", seen: false }] }`);
const card = ev(`answerCard({ id: "x1", rep: "Ava <i>R.</i>", skill: "S", mission: "M", date: "d", cname: "C", line: "<script>1</script>", q: "<b>q</b>", text: "<img src=x onerror=alert(2)>", better: "<u>b</u>", score: 2, content: 1, tone: .5, misses: ["<m>"], hits: ["<h>"], flags: ["<f>"], spoke: true, wpm: 100, fillers: 1, sample: false, you: true }, true)`);
ok("everything a rep or a manager typed is escaped on the Answers page", !/<img|<script|<i>|<m>|<h>|<f>|<u>/.test(card) && /&lt;img src=x onerror=alert\(2\)&gt;/.test(card) && /&lt;b&gt;Dana&lt;\/b&gt;/.test(card));
ev("state.notes = {}");

// ---------- spreadsheets ----------
const csv = ev(`AnswerLog.csvRows([{ rep: "Ava R.", date: "2026-10-20", mission: "M", skill: "S", q: "How?", line: "Hi, there", text: '=HYPERLINK("http://evil.example","click")', score: 2.5, content: 2, tone: .5, misses: ["a", "b"], wpm: 140, fillers: 1, pauses: 0, id: "z" },
  { rep: "Sam L.", date: "2026-10-21", mission: "M", skill: "S", q: "How?", line: "Hi", text: "+1 and -2 and @here\\nsecond line", score: 4, content: 3, tone: 1, misses: [], wpm: null, fillers: 0, pauses: null, id: "y" }])`);
const rows = table(csv);
ok("the answers spreadsheet has one header and a row for each answer, the same number of columns in each, with commas, quotes and new lines kept inside their cell", rows.length === 3 && rows.every(r => r.length === rows[0].length && r.length === 15) && rows[1][5] === "Hi, there" && rows[2][6].includes("\nsecond line"));
ok("text that starts with = + - or @ gets a quote in front, so a spreadsheet can't run it as a formula", rows[1][6] === `'=HYPERLINK("http://evil.example","click")` && rows[2][6].startsWith("'+1") && ev(`csvCell("-5")`) === `"'-5"` && ev(`csvCell("@x")`) === `"'@x"` && ev('csvCell("\\tx")') === '"\'\tx"');
ok("numbers are left alone, even negative ones, and ordinary text is untouched", ev(`csvCell(-3)`) === '"-3"' && ev(`csvCell(2.5)`) === '"2.5"' && ev(`csvCell("Miami")`) === '"Miami"' && ev(`csvCell('say "hi"')`) === '"say ""hi"""');
ev(`state.xp = 300; state.streak = 2; state.done = { brand: true, lineup: true }; state.history = [{ skills: { Closing: 3 }, pct: 60 }]; state.answers = [{ id: "m1", ck: "quiet:0", mid: "quiet", mission: "The Quiet Bar", skill: "Closing", cname: "Jess", line: "hi", q: "How?", text: "ok", score: 2, content: 1, tone: 1, misses: [], better: "b", date: Progress.today(), wpm: 150, fillers: 2 }]; state.coached = { "Ava R.": "2026-10-20" };`);
const sample = ev(`classReps(SAMPLE_CLASS)`), pr = table(ev(`progressCsv(SAMPLE_CLASS, classReps(SAMPLE_CLASS))`)), sk = table(ev(`skillsCsv(SAMPLE_CLASS, classReps(SAMPLE_CLASS))`));
ok("the progress report has a row for every rep and the player, with the same columns throughout", pr.length === sample.length + 1 && pr.every(r => r.length === 16) && pr[0][0] === "Rep" && pr[0].includes("Average score (out of 5)") && pr[0].includes("Filler words an answer") && pr[0].includes("Assigned stops done"));
ok("each row has the rep's numbers: stops finished, answers scored, their average, pace, and when they were coached", (r => r && Number(r[6]) > 0 && Number(r[7]) > 8 && /^\d\.\d$/.test(r[8]) && Number(r[10]) > 100 && r[14] === "2026-10-20")(pr.find(r => r[0] === "Ava R.")) && (y => y[6] === "2" && y[7] === "1" && y[8] === "2.0" && y[10] === "150" && y[11] === "2.0")(pr.find(r => /\(you\)/.test(r[0]))));
ok("a rep with no answers has blank numbers, not zeros or NaN", (r => r[7] === "0" && r[8] === "" && r[10] === "" && !/NaN|undefined/.test(r.join()))(pr.find(r => r[0] === "Dev P.")) && !/NaN|undefined/.test(pr.flat().join()));
ok("the skills spreadsheet has a column for every skill family and a percent for the families a rep has answered", sk.length === sample.length + 1 && sk.every(r => r.length === 8) && sk[0][1] === "Opening (percent)" && (r => r.slice(1).some(x => /^\d+$/.test(x)) && r.slice(1).every(x => x === "" || /^\d+$/.test(x)))(sk.find(r => r[0] === "Ava R.")));
ok("the Cohorts page has the three downloads and the Answers page has its own", /id="mexp2"/.test(read("manager.js")) && /id="mexpskills"/.test(read("manager.js")) && /id="mexpans"/.test(read("manager.js")) && /id="ansexp"/.test(read("mgranswers.js")));

// ---------- where it is wired in ----------
const mgr = read("manager.js");
ok("Answers, Assign and Brand facts are manager pages, after Coaching", /\["coaching", "Coaching"\], \["answers", "Answers"\], \["assign", "Assign"\], \["facts", "Brand facts"\]/.test(mgr) && /answers: mgrAnswers, assign: mgrAssign, facts: mgrFacts/.test(mgr));
ok("reps can't reach them: the rep's dashboard has no manager page code", !/mgrAnswers|mgrAssign|mgrFacts|answerCard/.test(read("dashboard.js") + read("mission.js")));
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
