// Checks assignments: a manager picks a stop, who it is for and a due date; the sample reps' progress against it is worked out from the sample data; the rep sees one slim
// line on the map until it is done; and nothing a manager types can inject markup. Run from the mock-prototype folder: node tests/assign.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

const clicks = [], homes = [];
const node = { click() { clicks.push("node"); } };
let mapUp = false;
const ctx = vm.createContext({ console, esc, fmt: n => n, repName: () => "Taylor", toast() {}, home() { homes.push(1); mapUp = true; }, $: sel => (sel === ".map" ? (mapUp ? {} : null) : /data-id="quiet"/.test(sel) ? node : null),
  state: { done: {}, proto: {}, xp: 0, history: [], answers: [], notes: {}, assignments: [], coached: {}, nudged: {}, streak: 0, cohorts: [], mgrName: "Manager", avatar: { name: "Taylor" } } });
for (const f of ["progress.js", "scenarios.js", "lessons.js", "tiers.js", "dialog.js", "manager.js", "assign.js"]) vm.runInContext(read(f).replace(/^"use strict";/, "").replace(/if \(typeof module[^\n]*/, ""), ctx);
vm.runInContext("const ALL_STOPS = () => PATH.map(id => LESSONS.find(l => l.id === id) || SCENARIOS.find(m => m.id === id) || EXTRA_STOPS[id]);", ctx);
const ev = s => vm.runInContext(s, ctx), reset = () => ev("state.assignments = []; state.done = {}; state.proto = {}; state.xp = 0");

// ---------- making and removing ----------
reset();
const a = ev(`Assign.add({ stop: "quiet", who: "class", due: Assign.inDays(5), note: "  ${"x".repeat(200)}  ", cls: "sample" })`);
ok("an assignment keeps the stop, who, due date, who made it, and a note cut to 160 letters", a.stop === "quiet" && a.who === "class" && /^\d{4}-\d{2}-\d{2}$/.test(a.due) && a.by === "Manager" && a.note.length === 160 && a.cls === "sample" && ev("state.assignments.length") === 1);
ev(`Assign.add({ stop: "priya", who: "team:Miami", due: Assign.inDays(2) })`);
ok("each has an id of its own, and one can be removed", ev("new Set(state.assignments.map(x => x.id)).size") === 2 && (ev(`Assign.remove("${a.id}")`), ev("state.assignments.length") === 1 && ev("state.assignments[0].stop") === "priya"));
ok("they are saved with the rest of the progress, starting empty", /assignments: \[\]/.test(read("progress.js")));
ok("a class list shows only that class's assignments, soonest due first", ev(`(() => { state.assignments = []; Assign.add({ stop: "sam", who: "class", due: Assign.inDays(9), cls: "sample" }); Assign.add({ stop: "mia", who: "class", due: Assign.inDays(2), cls: "sample" }); Assign.add({ stop: "gas", who: "class", due: Assign.inDays(1), cls: "c9" }); return Assign.classList({ id: "sample" }).map(x => x.stop).join() + "|" + Assign.classList({ id: "c9" }).map(x => x.stop).join(); })()`) === "mia,sam|gas");
reset();

// ---------- who it is for ----------
ok("who is described in words", ev(`[Assign.whoLabel("class"), Assign.whoLabel("team:Miami"), Assign.whoLabel("rep:Ava R."), Assign.whoLabel("rep:you")].join("|")`) === "The whole class|Team Miami|Ava R.|You");
const reps = ev("SAMPLE_REPS"), cover = w => ev(`Assign.covers({ who: ${JSON.stringify(w)} }, SAMPLE_REPS.concat([{ name: "Taylor (you)", team: "—", you: true }])).map(r => r.name)`);
ok("the whole class covers every rep and the player, a team only its reps, one rep only that rep, and 'you' only the player", cover("class").length === reps.length + 1 && cover("team:Miami").length === reps.filter(r => r.team === "Miami").length && cover("team:Miami").every(n => reps.find(r => r.name === n).team === "Miami") && cover("rep:Ava R.").join() === "Ava R." && cover("rep:you").join() === "Taylor (you)");

// ---------- the sample reps' progress ----------
const done = n => ev(`[...Assign.stopsDone(SAMPLE_REPS.find(r => r.name === ${JSON.stringify(n)}))]`), PATH = ev("PATH"), BOSSES = ev("BOSSES.map(b => b.id)");
ok("a rep has finished everything up to the last boss they beat", reps.filter(r => r.bosses > 0).every(r => done(r.name).join() === PATH.slice(0, PATH.indexOf(BOSSES[Math.min(BOSSES.length, r.bosses) - 1]) + 1).join()));
ok("a rep with no boss yet has finished about one stop for every 110 XP, and the finished ones are always the first stops in a row", done("Dev P.").length === 2 && done("Dev P.").join() === PATH.slice(0, 2).join() && done("Max R.").length === PATH.length);
const p = ev(`Assign.progress({ id: "t", stop: "mia", who: "class", due: Assign.inDays(3) }, SAMPLE_CLASS)`), want = reps.filter(r => done(r.name).includes("mia"));
ok("progress counts the reps who have finished the stop, and names the ones still to do", p.total === reps.length && p.done === want.length && p.left.length === reps.length - want.length && p.left.every(n => !want.some(r => r.name === n)));
ev(`state.xp = 50; state.done = { mia: true }`);
const p2 = ev(`Assign.progress({ id: "t", stop: "mia", who: "rep:you", due: Assign.inDays(3) }, SAMPLE_CLASS)`), p3 = ev(`(state.done = {}, Assign.progress({ id: "t", stop: "mia", who: "rep:you", due: Assign.inDays(3) }, SAMPLE_CLASS))`);
ok("the player's own row counts from their real progress", p2.total === 1 && p2.done === 1 && p3.total === 1 && p3.done === 0 && p3.left[0] === "Taylor (you)");
ok("in a class made on the Invite page nobody has done anything yet", (q => q.done === 0 && q.total === 2)(ev(`Assign.progress({ id: "t", stop: "quiet", who: "class" }, { id: "c1", reps: [{ name: "A B", email: "a@x.co", team: "T" }, { name: "C D", email: "c@x.co", team: "T" }] })`)));
reset();

// ---------- due dates ----------
const due = n => ev(`Assign.dueText(Assign.inDays(${n}))`);
ok("due dates are said in words: overdue, today, tomorrow, in days", due(-2) === "overdue by 2 days" && due(-1) === "overdue by 1 day" && due(0) === "due today" && due(1) === "due tomorrow" && due(5) === "due in 5 days");
ok("a date reads like 'Fri, Oct 30'", /^[A-Z][a-z]{2}, [A-Z][a-z]{2} \d{1,2}$/.test(ev(`Assign.dateLabel("2026-10-30")`)) && ev(`Assign.dateLabel("2026-10-30")`) === "Fri, Oct 30");

// ---------- what the rep sees ----------
ev(`Assign.add({ stop: "quiet", who: "class", due: Assign.inDays(3), note: "Aim for <b>3</b> stars", cls: "sample" }); Assign.add({ stop: "priya", who: "team:Miami", due: Assign.inDays(2) }); Assign.add({ stop: "sam", who: "rep:Ava R.", due: Assign.inDays(2) }); Assign.add({ stop: "mia", who: "rep:you", due: Assign.inDays(1) });`);
ok("the rep sees what is for the whole class or for them, not a team's or another rep's, soonest first", ev(`Assign.forPlayer().map(a => a.stop).join()`) === "mia,quiet");
ev(`state.done = { quiet: true }`);
ok("a finished stop leaves the list of what is still to do, but stays on the Progress card as done", ev(`Assign.pending().map(a => a.stop).join()`) === "mia" && /Done ✓/.test(ev(`Assign.card()`)) && ev(`Assign.card().match(/<li class="done"/g).length`) === 1);
reset();
ok("nothing assigned means no strip at all", (reset(), ev("Assign.strip()")) === "" && ev("Assign.card()") === "");
ev(`state.done = { brandbrain: true }; Assign.add({ stop: "quiet", who: "class", due: Assign.inDays(3), note: "Aim for <b>3</b> stars", cls: "sample" }); state.assignments[0].by = "<i>Dana</i>"`);   // the stop before it is done, so it is open
const s1 = ev("Assign.strip()");
ok("the strip is one line with who assigned it, the stop and when it is due, and a button to go to it when the stop is open", /<i>Dana|&lt;i&gt;Dana/.test(s1) === true && /The Quiet Bar|Quiet/.test(s1) && /due in 3 days/.test(s1) && /class="btn alt agostart"[^>]*data-id="quiet"/.test(s1) && (s1.match(/<p>/g) || []).length === 1);
ok("what a manager typed (their name and the note) is escaped", !/<b>3<\/b>|<i>Dana<\/i>/.test(s1) && /&lt;b&gt;3&lt;\/b&gt;/.test(s1) && /&lt;i&gt;Dana&lt;\/i&gt;/.test(s1));
reset();
ev(`Assign.add({ stop: "mia", who: "class", due: Assign.inDays(3) })`);
ok("a stop that is still locked says what opens it, with no button", (t => !/agostart/.test(t) && /It opens after/.test(t) && /Sam/.test(t.replace(/&#39;/g, "'")) || /It opens after/.test(t))(ev("Assign.strip()")) && !/agostart/.test(ev("Assign.strip()")));
ev(`state.proto = { unlockStops: true }`);
ok("with every stop open (the prototype switch) the button is there", /agostart/.test(ev("Assign.strip()")));
reset();
ev(`["quiet", "priya", "sam", "mia"].forEach((s, i) => Assign.add({ stop: s, who: "class", due: Assign.inDays(i + 1) })); state.proto = { unlockStops: true }`);
const s4 = ev("Assign.strip()");
ok("at most two stops show on the map, with a count of the rest", (s4.match(/<p>/g) || []).length === 2 && /2 more in your progress/.test(s4));
ev(`state.assignments = [{ id: "g1", stop: "no-such-stop", who: "class", due: Assign.inDays(1), by: "Manager" }]`);
ok("an assignment for a stop that no longer exists is ignored", ev("Assign.forPlayer().length") === 0 && ev("Assign.strip()") === "");
reset();
ev(`Assign.add({ stop: "mia", who: "class", due: Assign.inDays(-2) })`);
ok("an overdue one is marked in red on the strip and the card", /class="late"/.test(ev("Assign.strip()")) && /<li class="late"/.test(ev("Assign.card()")));
reset(); mapUp = false; clicks.length = 0; homes.length = 0;
ev(`Assign.start("quiet")`);
ok("'Go to it' opens the map if it is not up, then taps the stop, so the usual rules and dialogs apply", homes.length === 1 && clicks.length === 1);
mapUp = true; ev(`Assign.start("quiet")`);
ok("and it does not reload the map when it is already there", homes.length === 1 && clicks.length === 2);

// ---------- the message ----------
reset();
const m = ev(`Assign.message({ stop: "quiet", who: "class", due: "2026-10-30", note: "Aim for three stars." }, "Dana")`), m2 = ev(`Assign.message({ stop: "mia", who: "rep:Ava R.", due: "2026-10-30", note: "" }, "Dana")`);
ok("the message to copy names the stop, the due date, the note and how long it takes, and is signed", /^Hi team,/.test(m) && /"The Quiet Bar"/.test(m) && /Fri, Oct 30/.test(m) && /Aim for three stars\./.test(m) && /about \d+ minutes/.test(m) && /\nDana$/.test(m));
ok("a message to one rep uses their first name and leaves out an empty note", /^Hi Ava,/.test(m2) && !/\n\n\n/.test(m2));

// ---------- the page ----------
const mgr = read("manager.js"), map = read("map.js"), asg = read("assign.js"), pres = read("presenter.js"), dash = read("dashboard.js");
ok("a draft from the Coaching page opens the Assign page filled in, once", ev(`(Assign.setDraft({ stop: "mia", who: "class" }), [Assign.takeDraft().stop, Assign.takeDraft()].join())`) === "mia,");
ok("the Coaching page has Assign buttons for the team drill, the huddle and each rep's suggested stop", /id="assignteam"/.test(mgr) && /class="mbtn alt assignbtn"/.test(mgr) && /Assign\.setDraft\(\{ stop: x\.plan\.stop\.id, who: "rep:" \+ x\.r\.name \}\)/.test(mgr));
ok("the Assign page won't accept a missing or past due date, and asks before removing one", /Pick a due date/.test(asg) && /due < Progress\.today\(\)/.test(asg) && /confirm\("Remove this assignment\?"\)/.test(asg));
ok("the map shows the strip under the greeting and wires its button; the Progress tab shows the card", /\$\{Assign\.strip\(\)\}/.test(map) && /Assign\.wire\(app\)/.test(map) && /Assign\.card\(\)/.test(dash) && /Assign\.wire\(el\)/.test(dash));
ok("Presenter mode's sample player has one assignment due in three days, so the demo shows it", /P\.assignments = \[\{ id: "g-sample", stop: upNext, who: "class", due: Assign\.inDays\(3\)/.test(pres));
// ---------- the layout: the button stays on the line, the card is slim, the skill button sits beside its text ----------
const page = read("index.html"), pcss = page.slice(page.indexOf("<style>"), page.indexOf("</style>"));
reset(); ev(`state.done = { brandbrain: true }; Assign.add({ stop: "quiet", who: "class", due: Assign.inDays(3), note: "Aim for three stars." })`);   // the stop before it is done, so it is open
const strip1 = ev("Assign.strip()");
ok("on the map the text sits in its own box and the Go to it button is beside it in the same row, never on a line of its own", /<p><span class="atext">[\s\S]*<\/span><button class="btn alt agostart"/.test(strip1) && /\.assigned p\{[^}]*display:flex;[^}]*justify-content:space-between\}/.test(pcss) && !/\.assigned p\{[^}]*flex-wrap:wrap/.test(pcss) && /\.assigned \.atext\{flex:1;min-width:0\}/.test(pcss) && /\.assigned \.btn\{flex:none;padding:\.2rem \.85rem;font-size:\.8rem\}/.test(pcss));
ok("the Assigned to you card on the Progress tab is a slim card: a small title, tight rows, a small button, and the button stays on the row", /<div class="card acard"><h3>Assigned to you<\/h3>/.test(ev("Assign.card()")) && /\.acard\{padding:\.55rem \.9rem;margin-bottom:\.6rem\}/.test(pcss) && /\.acard h3\{font-size:\.95rem;margin:0 0 \.1rem\}/.test(pcss) && /\.acard \.alist li\{padding:\.25rem 0;flex-wrap:nowrap\}/.test(pcss) && /\.acard \.btn\{padding:\.2rem \.85rem;font-size:\.8rem\}/.test(pcss));
ok("the lowest-skill line has its text in one box and the Practice button after it (not in the middle of the sentence), laid out as a row that stacks on a narrow screen; the knowledge-check line does the same", /<span>Your lowest skill is <b>\$\{weak\[0\]\}<\/b> \(\$\{weak\[1\]\}%\)\. A short mix of moments from different customers, picked to train it\.<\/span><button class="btn" id="pweak"/.test(dash) && /<p class="learn withbtn"><span>Optional: the 2-minute <b>knowledge check<\/b>[^<]*<\/span><button class="btn alt" id="pcheck"/.test(dash) && /\.learn\.withbtn\{display:flex;align-items:center;justify-content:space-between;gap:\.5rem 1rem;flex-wrap:wrap\}/.test(pcss) && /\.learn\.withbtn>span\{flex:1 1 18rem\}/.test(pcss));

ok("the Next up bar on the map is slim: small padding and text, a small Start button on the same row, and the mission label kept together on one line, on a phone too", /\.nextup\{display:flex;justify-content:space-between;align-items:center;gap:\.6rem;[^}]*padding:\.3rem \.7rem;margin:\.3rem 0 \.6rem;font-size:\.9rem\}/.test(pcss) && /\.nextup>span\{flex:1;min-width:0\}\.nextup \.btn\{flex:none;padding:\.2rem \.85rem;font-size:\.8rem\}/.test(pcss) && /\.nextup small\{[^}]*font-size:\.7rem;white-space:nowrap\}/.test(pcss) && !/\.nextup\{flex-wrap:wrap\}/.test(pcss));

console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
