"use strict";
// Manager mode (prototype). Open to anyone with the link while the game is a prototype: there is no sign-in or permission check.
// Pages: Cohorts (class dashboard), Invite (set up a sales class from a CSV) and Leaderboards, plus Coaching (what to
// work on, with whom, and what to say, and the team huddle), Answers (what reps actually said, with notes: mgranswers.js), Assign (a stop with a
// due date: assign.js), Brand facts (prices and wording: facts.js) and the answer Grader.
// There is no server yet, so:
//   - the class on the Cohorts page is SAMPLE DATA (labelled), plus the player on this device as one extra row;
//   - a class created on the Invite page is saved on this device only, and invites are NOT emailed (you copy an invite message);
//   - Nudge only records the nudge on this device, and so do notes, assignments and brand facts.
// A real version needs a shared database and company sign-in. Uses globals from the page's own scripts (app.js onward) and tiers.js at call time.

const SAMPLE_REPS = [
  // name, team, tier, xp, streak, bosses beaten, focus skill, days idle, boss losses
  ["Ava R.", "Miami", 4, 2540, 12, 4, "Distributor pricing", 0, 0], ["Sam L.", "Tampa", 3, 2310, 9, 3, "Discovery", 0, 0],
  ["Theo N.", "Orlando", 3, 1900, 5, 3, "Closing", 1, 0], ["Jordan K.", "Miami", 3, 1860, 7, 3, "Closing", 0, 0],
  ["Priya S.", "Tampa", 2, 1505, 2, 2, "Objections", 0, 3], ["Luis G.", "Orlando", 1, 1240, 0, 1, "Brand knowledge", 4, 0],
  ["Maya C.", "Tampa", 2, 1180, 0, 2, "Discovery", 1, 0], ["Dev P.", "Orlando", 0, 220, 1, 0, "Brand knowledge", 0, 0],
  ["Noah B.", "Miami", 1, 640, 3, 1, "Price handling", 1, 0], ["Zoe T.", "Tampa", 1, 710, 4, 1, "Introduction", 0, 0],
  ["Eli W.", "Orlando", 2, 1320, 6, 2, "Closing", 0, 0], ["Isa M.", "Miami", 2, 1400, 3, 2, "Objections", 0, 0],
  ["Omar F.", "Tampa", 2, 1260, 2, 2, "Price handling", 0, 2], ["Kai D.", "Orlando", 2, 1090, 1, 2, "Discovery", 0, 0],
  ["Rae J.", "Miami", 2, 1210, 4, 2, "Compliance", 5, 1], ["Jun Y.", "Tampa", 3, 2050, 8, 3, "Closing", 0, 0],
  ["Tess O.", "Orlando", 3, 1700, 6, 3, "Product knowledge", 1, 0], ["Ben H.", "Miami", 3, 1980, 5, 3, "Discovery", 0, 0],
  ["Lia V.", "Orlando", 4, 2400, 10, 4, "Price handling", 0, 0], ["Max R.", "Tampa", 5, 3200, 15, 6, "Staying calm", 0, 0],
].map(([name, team, tier, xp, streak, bosses, focus, idle, lost]) => ({ name, team, tier, xp, streak, bosses, focus, idle, lost }));
const SAMPLE_CLASS = { id: "sample", name: "Florida new hires", sample: true, week: "Season 1 · Week 3 of 8" };
const SAMPLE_SKILLS = { Closing: 46, Objections: 52, "Price handling": 55, Discovery: 58, "Brand knowledge": 63, Introduction: 71 };

let mgrTab = "cohorts", mgrClass = "sample", mgrDraft = null;

function managerMode(tab) {
  document.body.classList.add("mgr");
  mgrTab = tab || mgrTab || "cohorts";
  stopAll(); Cam.stop(); Sound.stop();
  const pages = [["cohorts", "Cohorts"], ["coaching", "Coaching"], ["answers", "Answers"], ["assign", "Assign"], ["facts", "Brand facts"], ["invite", "Invite"], ["leaderboards", "Leaderboards"], ["grader", "Grader"]];
  app.innerHTML = `<div class="mgrwrap">
    <div class="mgrbar"><div class="mlogo"><img class="brandlogo" src="https://ilovetequilacorrido.com/cdn/shop/files/tequila-corrido-logo-wht.png?v=1723729407" width="735" height="325" alt="" decoding="async" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add('nologo')"><span class="brandtext">Tequila Corrido</span><small>SALES ACADEMY<span class="mdot" aria-hidden="true">·</span><span class="mrole">Manager</span></small></div>
      <nav class="mnav" aria-label="Manager pages">${pages.map(([k, l]) => `<button type="button" class="mnavbtn ${k === mgrTab ? "on" : ""}" data-p="${k}" ${k === mgrTab ? 'aria-current="page"' : ""}>${l}</button>`).join("")}</nav>
      <div class="muser">${state.mgrName && state.mgrName !== "Manager" ? `<span>${esc(state.mgrName)}</span>` : ""}<button type="button" class="mback" id="mback" aria-label="Back to the game">← <span class="mbtext">Back to the game</span></button></div></div>
    <div class="mgrpage">
    <p class="mproto" role="note"><b>Prototype.</b> Manager mode is open to anyone with the link, and the class below is sample data. Nothing here is saved to a server.</p>
    <div id="mbody"></div></div></div>`;   // the bar runs edge to edge; mgrpage is the column under it
  app.querySelectorAll(".mnavbtn").forEach(b => b.onclick = () => managerMode(b.dataset.p));
  $("#mback").onclick = leaveManager;
  ({ cohorts: mgrCohorts, coaching: mgrCoaching, answers: mgrAnswers, assign: mgrAssign, facts: mgrFacts, invite: mgrInvite, leaderboards: mgrBoards, grader: mgrGrader })[mgrTab]($("#mbody"));
  window.scrollTo(0, 0);
}
function leaveManager() {
  document.body.classList.remove("mgr");
  if (location.hash === "#manager") history.replaceState(null, "", location.pathname + location.search);
  if (state.avatarSaved) home(); else { $("#gate").classList.remove("hidden"); }
}

// ----- the data behind the pages -----
const weakestSkill = () => (Progress.skillAverages(state)[0] || [])[0];   // the player's own lowest skill, for their row on the Cohorts page
const allClasses = () => [SAMPLE_CLASS, ...(state.cohorts || [])];
function classReps(c) {
  if (c.sample) {
    const reps = SAMPLE_REPS.map(r => ({ ...r }));
    if (state.xp > 0 || (state.history || []).length) reps.push({ name: `${repName()} (you)`, team: "—", tier: tierOf(), xp: state.xp, streak: state.streak || 0, bosses: bossesBeaten(), focus: weakestSkill() || "—", idle: 0, lost: 0, you: true });
    return reps;
  }
  return (c.reps || []).map(r => ({ name: r.name, team: r.team || "—", tier: 0, xp: 0, streak: 0, bosses: 0, focus: "—", idle: null, lost: 0, invited: true }));
}
const lastActive = r => (r.idle == null ? "Invited" : r.idle === 0 ? "Today" : r.idle === 1 ? "Yesterday" : `${r.idle} days ago`);
const csvCell = v => { let t = String(v); if (typeof v === "string" && /^[=+\-@\t\r]/.test(t)) t = "'" + t; return `"${t.replace(/"/g, '""')}"`; };   // text that starts with = + - or @ would run as a formula in a spreadsheet
function download(name, text, type = "text/csv") {
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// ----- spreadsheets: a progress report, the skills for each rep, and every answer -----
const ownAnswers = (c, r) => AnswerLog.classAnswers(c).filter(a => a.rep === r.name);
function progressCsv(c, reps) {
  const head = "Rep,Team,Tier,XP,Streak,Bosses beaten,Stops finished,Answers scored,Average score (out of 5),Weakest skill,Average pace (words a minute),Filler words an answer,Last active,Assigned stops done,Coached,Nudged";
  return [head, ...reps.map(r => {
    const a = AnswerLog.summary(ownAnswers(c, r)), mine = Assign.classList(c).filter(x => Assign.covers(x, [r]).length), done = mine.filter(x => Assign.repDone(x, r)).length;
    return [r.name, r.team, `${r.tier} ${TIERS[r.tier]}`, r.xp, r.streak, `${r.bosses}/6`, r.you ? Object.keys(state.done).length : r.invited ? 0 : Assign.stopsDone(r).size, a.n, a.avg == null ? "" : a.avg.toFixed(1), a.weakest || r.focus,
      a.wpm == null ? "" : a.wpm, a.fillers == null ? "" : a.fillers.toFixed(1), lastActive(r), mine.length ? `${done}/${mine.length}` : "", (state.coached || {})[r.name] || "", (state.nudged || {})[r.name] || ""].map(csvCell).join(",");
  })].join("\n");
}
function skillsCsv(c, reps) {
  const fams = SKILL_FAMILIES.map(f => f[0]);
  return [["Rep", ...fams.map(f => f + " (percent)")].map(csvCell).join(","), ...reps.map(r => { const m = new Map(AnswerLog.familyScores(ownAnswers(c, r))); return [r.name, ...fams.map(f => (m.has(f) ? m.get(f) : ""))].map(csvCell).join(","); })].join("\n");
}

// ----- Cohorts: how the class is doing -----
function mgrCohorts(el) {
  const c = allClasses().find(x => x.id === mgrClass) || SAMPLE_CLASS, reps = classReps(c), cls = reps.filter(r => !r.you);   // the player's own row is shown but not counted in the class numbers
  const n = cls.length, active = cls.filter(r => r.idle != null && r.idle < 3).length, idle3 = cls.filter(r => r.idle != null && r.idle >= 3).length;
  const avgTier = n ? cls.reduce((a, r) => a + r.tier, 0) / n : 0;
  const counts = TIERS.map((_, t) => cls.filter(r => r.tier === t).length), top = Math.max(1, ...counts);
  const lowest = c.sample ? Object.entries(SAMPLE_SKILLS).sort((a, b) => a[1] - b[1])[0] : null;
  const nudges = cls.filter(r => !r.invited).map(r => {
    if (r.idle != null && r.idle >= 3) return { r, why: `No practice in ${r.idle} days; Tier ${r.tier}` };
    if (r.lost >= 3) return { r, why: `Lost the Tier ${r.tier} boss ${r.lost} times; focus: ${r.focus.toLowerCase()}` };
    if (r.streak === 0 && r.idle === 1) return { r, why: "Streak ended yesterday" };
    return null;
  }).filter(Boolean).slice(0, 5);
  el.innerHTML = `<div class="mhead"><div><h1 class="mtitle">${esc(c.name)}</h1><p class="msub">${c.sample ? `${c.week} · ${n} reps · Sample data` : `${n} invited · starts ${esc(c.start || "soon")} · saved on this device`}</p></div>
      <div class="mactions">${allClasses().length > 1 ? `<select id="mclass" aria-label="Choose a class">${allClasses().map(x => `<option value="${x.id}" ${x.id === c.id ? "selected" : ""}>${esc(x.name)}${x.sample ? " (sample)" : ""}</option>`).join("")}</select>` : ""}
        <button class="mbtn alt" id="mexp" type="button">Export progress (CSV)</button><button class="mbtn" id="minv" type="button">Invite reps</button></div></div>
    <div class="mstats">
      <div class="mstat"><b>${active} / ${n}</b><span>Active this week</span><small>${idle3} rep${idle3 === 1 ? "" : "s"} idle 3+ days</small></div>
      <div class="mstat"><b>${avgTier.toFixed(1)}</b><span>Average tier</span><small>${c.sample ? "Up from 1.6 last week" : "Everyone starts at Tier 0"}</small></div>
      <div class="mstat"><b>${c.sample ? 11 : 0}</b><span>Bosses beaten this week</span><small>${c.sample ? "4 at Tier 3 or higher" : "None yet"}</small></div>
      <div class="mstat"><b>${lowest ? lowest[1] : "–"}</b><span>${lowest ? `Lowest class skill: ${lowest[0]}` : "Class skills appear once reps practice"}</span><small>${lowest ? "Suggest a team drill" : "&nbsp;"}</small></div></div>
    <div class="mrow2">
      <div class="mcard"><h2>Where the class is</h2><div class="mchart" role="img" aria-label="Reps at each tier">${counts.map((k, t) => `<div class="mcol"><b>${k}</b><i class="${t === 5 ? "gold" : ""}" style="height:${Math.max(6, k / top * 150)}px"></i><span>T${t} ${["Trainee", "Associate", "Field Rep", "Senior Rep", "Key Account", "Seasoned"][t]}</span></div>`).join("")}</div></div>
      <div class="mcard"><h2>Needs a nudge</h2>${nudges.length ? nudges.map(({ r, why }) => `<div class="mnudge"><div><b>${esc(r.name)}</b><small>${esc(why)}</small></div><button type="button" class="mbtn alt nudgebtn" data-n="${esc(r.name)}" ${(state.nudged || {})[r.name] ? "disabled" : ""}>${(state.nudged || {})[r.name] ? "Nudged ✓" : "Nudge"}</button></div>`).join("") : '<p class="note2">Nobody needs a nudge right now.</p>'}
        <p class="note2">Prototype: a nudge is only recorded on this device. Sending real nudges needs company sign-in.</p></div></div>
    <div class="mcard"><h2>Roster</h2>${reps.some(r => r.you) ? '<p class="note2">Your own row is highlighted. It is not counted in the class numbers above.</p>' : ""}<div class="mtablewrap"><table class="mtable"><thead><tr><th>Rep</th><th>Tier</th><th>XP</th><th>Streak</th><th>Bosses</th><th>Focus skill</th><th>Last active</th></tr></thead><tbody>
      ${[...reps].sort((a, b) => b.xp - a.xp || b.tier - a.tier).map(r => `<tr class="${r.you ? "you" : ""}"><td><b>${esc(r.name)}</b></td><td>${r.tier} · ${TIERS[r.tier]}</td><td>${r.xp.toLocaleString()}</td><td>${r.streak} day${r.streak === 1 ? "" : "s"}</td><td>${r.bosses} / 6</td><td>${esc(r.focus)}</td><td class="${r.idle == null ? "" : r.idle >= 3 ? "bad" : "good"}">${lastActive(r)}</td></tr>`).join("")}
    </tbody></table></div>
      <div class="mcbtns"><button class="mbtn alt" id="mexp2" type="button">Progress report (CSV)</button><button class="mbtn alt" id="mexpskills" type="button">Skills for each rep (CSV)</button><button class="mbtn alt" id="mexpans" type="button">Every answer (CSV)</button></div>
      <p class="note2">The progress report has a row for each rep: stops finished, answers scored, average score, weakest skill, pace, filler words, assignments and last active. Spreadsheets run text that starts with = + - or @ as a formula, so the file puts a quote in front of it.</p></div>`;
  if ($("#mclass")) $("#mclass").onchange = e => { mgrClass = e.target.value; managerMode("cohorts"); };
  $("#minv").onclick = () => managerMode("invite");
  const slug = c.name.replace(/\W+/g, "-").toLowerCase();
  $("#mexp").onclick = $("#mexp2").onclick = () => download(`${slug}-progress.csv`, progressCsv(c, reps));
  $("#mexpskills").onclick = () => download(`${slug}-skills.csv`, skillsCsv(c, reps));
  $("#mexpans").onclick = () => download(`${slug}-answers.csv`, AnswerLog.csvRows(AnswerLog.classAnswers(c)));
  el.querySelectorAll(".nudgebtn").forEach(b => b.onclick = () => { state.nudged = { ...(state.nudged || {}), [b.dataset.n]: Progress.today() }; Progress.save(state); b.textContent = "Nudged ✓"; b.disabled = true; toast(`Nudge recorded for ${b.dataset.n} (prototype: not delivered).`); });
}

// ----- Coaching: what to work on, with whom, and what to say -----
// Each topic knows which skill names it covers (the step skills in scenarios.js and the focus labels on the Cohorts page), one thing worth
// telling a rep, and sometimes a fixed stop. Otherwise the stop to practice is found in the real missions: the first one, in path order, that
// practices the skill and that the rep has reached, preferring an ordinary stop to a boss. So it stays right when the missions change.
// Order matters: the first topic whose pattern matches the skill wins.
const COACH = [
  { name: "Staying calm", re: /calm|safety|support|follow-up|trust to/i, tip: "If something goes wrong in a store, stay calm and cooperate, keep people safe, and report it once it is over. Nothing in the bag is worth risking anyone." },
  { name: "Compliance", re: /compli|health|underage|shipping|marketing/i, tip: "No health claims, 21 and over only, and never promise shipping you have not confirmed. When you are not sure, say you will check and confirm in writing." },
  { name: "Product and brand knowledge", re: /product|brand|stor|plain/i, stop: "lineup", tip: "Use the brand's own words: additive-free, only three ingredients, no fake flavors. Give one true difference, then invite a taste." },
  { name: "Price and margin", re: /pric|margin/i, tip: "Never guess a number. Make the price concrete per pour, and offer to confirm wholesale terms in writing." },
  { name: "Handling objections", re: /objection|persist|credib|trust/i, tip: "Acknowledge the worry first, then make the first step small and low-risk. Do not argue, and do not promise what you cannot prove." },
  { name: "Closing", re: /clos|follow/i, tip: "Ask for one small, dated next step: a tasting on a named day, or two bottles by Friday. A vague follow-up lets the deal die." },
  { name: "Discovery", re: /discover|rapport|respect|intro|reading|decision|audience|message/i, tip: "Ask about their guests and what they measure before you pitch, and respect their time in your first sentence." },
];
// the stops a rep at this tier has reached: everything up to and including the boss of their tier (a boss can be practiced before the real fight)
const reachedStops = tier => PATH.slice(0, PATH.indexOf(BOSSES[Math.min(5, tier)].id) + 1);
function coachPlan(skill, tier) {
  const topic = COACH.find(t => t.re.test(skill || ""));
  if (!topic) return null;
  const reached = reachedStops(tier), has = sid => { const sc = SCENARIOS.find(x => x.id === sid); return sc && sc.steps.some(st => topic.re.test(st.skill)); };
  const id = topic.stop || reached.find(sid => !BOSS_BY[sid] && has(sid)) || reached.find(has) || reached.filter(sid => !BOSS_BY[sid]).pop();
  return { topic, stop: ALL_STOPS().find(x => x.id === id) };
}
const coachWhy = r => r.lost >= 3 ? `Lost the Tier ${r.tier} boss ${r.lost} times` : r.idle != null && r.idle >= 3 ? `No practice in ${r.idle} days` : "";
function coachMessage(r, plan, manager) {
  const first = r.name.split(" ")[0], lead = r.lost >= 3 ? `The Tier ${r.tier} boss has been tough lately. That happens, and it is fixable.` : `It has been ${r.idle} days since your last practice, and a few short sessions will get you back on track.`;
  return `Hi ${first},\n\n${lead}${plan ? ` Your focus skill is ${plan.topic.name.toLowerCase()}.\n\nPlease practice "${plan.stop.title}" this week. One tip: ${plan.topic.tip}` : "\n\nPlease pick up your next stop this week."}\n\nIt takes about ten minutes. Tell me how it goes.\n\n${manager}`;
}
function mgrCoaching(el) {
  const c = allClasses().find(x => x.id === mgrClass) || SAMPLE_CLASS, reps = classReps(c).filter(r => !r.you && !r.invited), manager = state.mgrName && state.mgrName !== "Manager" ? state.mgrName : "[Your name]";   // the message is from them, so sign it with their name or leave a gap to fill
  const avgTier = reps.length ? Math.round(reps.reduce((a, r) => a + r.tier, 0) / reps.length) : 0;
  const skills = c.sample ? Object.entries(SAMPLE_SKILLS).sort((a, b) => a[1] - b[1]) : [];
  const lowest = skills[0], drill = lowest && coachPlan(lowest[0], avgTier);
  const team = drill && `Hi team,\n\nThis week's drill is ${drill.topic.name.toLowerCase()}. The class average is ${lowest[1]}%, our lowest skill.\n\nPractice "${drill.stop.title}" and aim for three stars. One tip: ${drill.topic.tip}\n\n${manager}`;
  const list = reps.map(r => ({ r, why: coachWhy(r), plan: coachPlan(r.focus, r.tier) })).filter(x => x.why), huddle = huddleStat(c);
  el.innerHTML = `<div class="mhead"><div><h1 class="mtitle">Coaching</h1><p class="msub">${esc(c.name)}${c.sample ? " · Sample data" : ""} · what to work on, with whom, and what to say</p></div></div>
    ${skills.length && drill ? `<div class="mrow2">
      <div class="mcard"><h2>Class skills, lowest first</h2>${skills.map(([k, v], i) => { const p = coachPlan(k, avgTier); return `<div class="cskill ${i === 0 ? "low" : ""}"><span>${esc(k)}</span><span class="cb" aria-hidden="true"><i style="width:${v}%"></i></span><b>${v}</b>${p ? `<small>Practice: ${esc(p.stop.title)}</small>` : ""}</div>`; }).join("")}
        <p class="note2">The stop is the first one that practices the skill, for a rep at the class's average tier (Tier ${avgTier}).</p></div>
      <div class="mcard"><h2>This week's team drill</h2><p><b>${esc(drill.topic.name)}</b>, class average ${lowest[1]}.</p><p>Practice <b>${esc(drill.stop.title)}</b>.</p><p class="mtip">${esc(drill.topic.tip)}</p>
        <div class="mcbtns"><button class="mbtn" id="copyteam" type="button">Copy the team message</button><button class="mbtn alt" id="assignteam" type="button">Assign this stop to the class</button></div></div></div>`
      : `<div class="mcard"><p>Class skills appear once reps start practicing. Switch to the sample class on the Cohorts page to see how this page looks.</p></div>`}
    ${huddle ? huddleCard(c, huddle) : ""}
    <div class="mcard"><h2>Reps to coach one-to-one</h2>${list.length ? list.map(({ r, why, plan }, i) => `<div class="mcoach"><div class="mcwho"><b>${esc(r.name)}</b><span class="mtag">Tier ${r.tier} · ${TIERS[r.tier]}</span><small>${esc(why)} · focus: ${esc(r.focus.toLowerCase())}</small></div>
        <p>${plan ? `Work on <b>${esc(plan.topic.name.toLowerCase())}</b>. Practice <b>${esc(plan.stop.title)}</b>.` : "Pick up the next stop on the map."}</p>${plan ? `<p class="mtip">${esc(plan.topic.tip)}</p>` : ""}
        <div class="mcbtns"><button class="mbtn alt copybtn" type="button" data-i="${i}">Copy message to ${esc(r.name.split(" ")[0])}</button>${plan && plan.stop ? `<button class="mbtn alt assignbtn" type="button" data-i="${i}">Assign this stop</button>` : ""}<button class="mbtn coachedbtn" type="button" data-n="${esc(r.name)}" ${(state.coached || {})[r.name] ? "disabled" : ""}>${(state.coached || {})[r.name] ? "Coached ✓" : "Mark as coached"}</button></div></div>`).join("") : '<p class="note2">Nobody needs one-to-one coaching this week.</p>'}
      <p class="note2">Prototype: a message is copied for you to send yourself, and "coached" is only recorded on this device.</p></div>`;
  const copy = (text, what) => navigator.clipboard?.writeText(text).then(() => toast(`${what} copied.`)).catch(() => toast("Copy did not work. Select the text and press Ctrl+C."));
  if ($("#copyteam")) $("#copyteam").onclick = () => copy(team, "Team message");
  if ($("#assignteam")) $("#assignteam").onclick = () => { Assign.setDraft({ stop: drill.stop.id, who: "class" }); managerMode("assign"); };
  if ($("#copyhuddle")) $("#copyhuddle").onclick = () => copy(huddleText(huddle, manager), "Huddle plan");
  if ($("#assignhuddle")) $("#assignhuddle").onclick = () => { Assign.setDraft({ stop: huddle.mid, who: "class" }); managerMode("assign"); };
  el.querySelectorAll(".assignbtn").forEach(b => b.onclick = () => { const x = list[+b.dataset.i]; Assign.setDraft({ stop: x.plan.stop.id, who: "rep:" + x.r.name }); managerMode("assign"); });
  el.querySelectorAll(".copybtn").forEach(b => b.onclick = () => { const x = list[+b.dataset.i]; copy(coachMessage(x.r, x.plan, manager), "Message"); });
  el.querySelectorAll(".coachedbtn").forEach(b => b.onclick = () => { state.coached = { ...(state.coached || {}), [b.dataset.n]: Progress.today() }; Progress.save(state); b.textContent = "Coached ✓"; b.disabled = true; toast(`Marked ${b.dataset.n} as coached (recorded on this device).`); });
}

// ----- Invite: set up a sales class from a CSV -----
const SAMPLE_CSV = "name,email,team\nAva Ramos,ava.r@example.com,Miami\nSam Lee,sam.l@example.com,Tampa\nTheo Nash,theo.n@example.com,Orlando\nJordan Kim,jordan.k@example.com,Miami\nPriya Shah,,Tampa\nLuis Garcia,luis.g@example.com,Orlando\n";
function parseCsv(text) {
  const rows = []; let cur = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true; else if (ch === ",") { cur.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; cur.push(cell); cell = ""; if (cur.some(x => x.trim())) rows.push(cur); cur = []; }
    else cell += ch;
  }
  cur.push(cell); if (cur.some(x => x.trim())) rows.push(cur);
  if (!rows.length) return [];
  const head = rows[0].map(h => h.trim().toLowerCase()), hasHead = head.includes("email") || head.includes("name");
  const col = k => (hasHead ? head.indexOf(k) : ["name", "email", "team"].indexOf(k));
  return (hasHead ? rows.slice(1) : rows).map(r => ({ name: (r[col("name")] || "").trim(), email: (r[col("email")] || "").trim(), team: (r[col("team")] || "").trim() }));
}
const checkRows = rows => rows.map((r, i) => {
  const dup = r.email && rows.findIndex(x => x.email.toLowerCase() === r.email.toLowerCase()) !== i;
  const status = !r.name ? "Missing name" : !r.email ? "Missing email" : !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email) ? "Invalid email" : dup ? "Duplicate" : "Ready";
  return { ...r, status };
});

function mgrInvite(el) {
  const d = mgrDraft = mgrDraft || { name: "", start: "", manager: state.mgrName || "Manager", file: "", rows: [], done: null };
  if (d.done) return mgrInvited(el, d.done);
  const rows = checkRows(d.rows), ready = rows.filter(r => r.status === "Ready"), bad = rows.length - ready.length;
  el.innerHTML = `<p class="mstep">NEW COHORT</p><h1 class="mtitle">Set up a sales class</h1>
    <div class="minvgrid">
      <div class="mcard"><h2>Class details</h2>
        <label class="mlab" for="cname2">Cohort name</label><input id="cname2" class="minput" value="${esc(d.name)}" placeholder="Florida new hires" maxlength="60">
        <label class="mlab" for="cstart">Start date</label><input id="cstart" class="minput" type="date" value="${esc(d.start)}">
        <label class="mlab" for="cmgr">Instructor or manager</label><input id="cmgr" class="minput" value="${esc(d.manager)}" maxlength="40">
        <label class="mlab">Journey</label><div class="mjourney"><b>Season 1: Trainee to Seasoned Seller</b><small>Six tiers, six boss battles. Custom journeys come later.</small></div></div>
      <div class="mcard"><h2>Add reps</h2>
        <div class="mdrop" id="mdrop"><div><b id="mfile">${d.file ? esc(d.file) + " · " + d.rows.length + " rows" : "Drop a CSV here"}</b><small>Columns: name, email, team. Drop a new file to replace it.</small></div>
          <label class="mbtn alt mfilebtn">Choose file<input type="file" id="mfileinput" accept=".csv,text/csv" hidden></label></div>
        <p class="note2"><button type="button" class="linkbtn dark" id="msample">Use a sample file</button> · <button type="button" class="linkbtn dark" id="mtemplate">Download a template</button></p>
        ${rows.length ? `<div class="mtablewrap"><table class="mtable"><thead><tr><th>Name</th><th>Email</th><th>Team</th><th>Check</th></tr></thead><tbody>${rows.map(r => `<tr><td><b>${esc(r.name || "—")}</b></td><td>${esc(r.email || "—")}</td><td>${esc(r.team || "—")}</td><td class="${r.status === "Ready" ? "good" : "bad"}">${r.status}</td></tr>`).join("")}</tbody></table></div>` : '<p class="note2">No reps yet. Choose a file or use the sample.</p>'}
        <p class="note2">Use sample or test emails while this is a prototype. A class is saved on this device only, and nothing is emailed.</p>
        <div class="mfoot"><span><b>${ready.length} ready</b>${bad ? ` · ${bad} to fix` : ""}</span><span><button class="mbtn alt" id="mclear" type="button">Back</button> <button class="mbtn" id="msend" type="button" ${ready.length ? "" : "disabled"}>Create class with ${ready.length} rep${ready.length === 1 ? "" : "s"}</button></span></div></div></div>`;
  const keep = () => { d.name = $("#cname2").value; d.start = $("#cstart").value; d.manager = $("#cmgr").value; };
  const load = (text, name) => { keep(); d.rows = parseCsv(text); d.file = name; mgrInvite(el); };
  $("#mfileinput").onchange = e => { const f = e.target.files[0]; if (f) f.text().then(t => load(t, f.name)); };
  const drop = $("#mdrop");
  ["dragover", "dragenter"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", e => { const f = e.dataTransfer.files[0]; if (f) f.text().then(t => load(t, f.name)); });
  $("#msample").onclick = () => load(SAMPLE_CSV, "sample-reps.csv");
  $("#mtemplate").onclick = () => download("sales-class-template.csv", "name,email,team\n");
  $("#mclear").onclick = () => { mgrDraft = null; managerMode("cohorts"); };
  $("#msend").onclick = () => {
    keep();
    if (!d.name.trim()) { toast("Give the class a name first."); $("#cname2").focus(); return; }
    const cohort = { id: "c" + Date.now().toString(36), name: d.name.trim(), start: d.start, manager: d.manager.trim() || "Manager", reps: ready.map(({ name, email, team }) => ({ name, email, team })), created: Progress.today() };
    state.cohorts = [...(state.cohorts || []), cohort]; state.mgrName = cohort.manager; Progress.save(state); mgrClass = cohort.id;
    d.done = cohort; mgrInvite(el);
  };
}
function mgrInvited(el, c) {
  const link = location.origin + location.pathname, msg = `Hi! You're invited to the Tequila Corrido Sales Academy class "${c.name}"${c.start ? `, starting ${c.start}` : ""}.\n\nOpen ${link}, continue as guest (or enter your company email) and start with the two lessons. Your manager is ${c.manager}.\n\nYou must be 21 or older.`;
  el.innerHTML = `<p class="mstep">NEW COHORT · DONE</p><h1 class="mtitle">${esc(c.name)} is set up</h1>
    <div class="mcard"><h2>${c.reps.length} rep${c.reps.length === 1 ? "" : "s"} added</h2>
      <p><b>Invites were not emailed.</b> This is a prototype with no server, so the class is saved on this device only. Copy the message below into an email or Teams chat to invite your reps.</p>
      <label class="mlab" for="minvmsg">Invite message</label><textarea id="minvmsg" class="minput" rows="6" readonly>${esc(msg)}</textarea>
      <div class="mfoot"><span><button class="mbtn alt" id="mcopy" type="button">Copy the message</button> <button class="mbtn alt" id="mdl" type="button">Download the invite list</button></span><span><button class="mbtn" id="mview" type="button">View the class</button></span></div></div>`;
  $("#mcopy").onclick = () => { navigator.clipboard?.writeText(msg).then(() => toast("Invite message copied.")).catch(() => { $("#minvmsg").select(); toast("Press Ctrl+C to copy."); }); };
  $("#mdl").onclick = () => download(`${c.name.replace(/\W+/g, "-").toLowerCase()}-invites.csv`, ["name,email,team", ...c.reps.map(r => [r.name, r.email, r.team].map(csvCell).join(","))].join("\n"));
  $("#mview").onclick = () => { mgrDraft = null; managerMode("cohorts"); };
}

// ----- Leaderboards -----
function mgrBoards(el) {
  const c = allClasses().find(x => x.id === mgrClass) || SAMPLE_CLASS, reps = classReps(c).filter(r => !r.invited), by = [...reps].sort((a, b) => b.xp - a.xp);
  const teams = {}; reps.forEach(r => { if (r.team === "—") return; const t = teams[r.team] = teams[r.team] || { n: 0, xp: 0, tier: 0 }; t.n++; t.xp += r.xp; t.tier += r.tier; });
  const medal = i => ["🥇", "🥈", "🥉"][i] || `${i + 1}`;
  el.innerHTML = `<div class="mhead"><div><h1 class="mtitle">Leaderboards</h1><p class="msub">${esc(c.name)}${c.sample ? " · Sample data" : ""}</p></div></div>
    ${reps.length ? `<div class="mrow2"><div class="mcard"><h2>Top reps by XP</h2><ol class="mboard">${by.slice(0, 10).map((r, i) => `<li class="${r.you ? "you" : ""}"><span class="mrank">${medal(i)}</span><span class="mname"><b>${esc(r.name)}</b><small>Tier ${r.tier} · ${TIERS[r.tier]}</small></span><span class="mxp">${r.xp.toLocaleString()} XP</span></li>`).join("")}</ol></div>
      <div class="mcard"><h2>Teams</h2>${Object.keys(teams).length ? Object.entries(teams).sort((a, b) => b[1].xp / b[1].n - a[1].xp / a[1].n).map(([k, t], i) => `<div class="mteam"><span class="mrank">${medal(i)}</span><span><b>${esc(k)}</b><small>${t.n} reps · average tier ${(t.tier / t.n).toFixed(1)}</small></span><span class="mxp">${Math.round(t.xp / t.n).toLocaleString()} avg XP</span></div>`).join("") : '<p class="note2">Teams appear when reps have a team.</p>'}</div></div>`
    : '<div class="mcard"><p>No reps have started yet. The leaderboard fills in as invited reps practice. Switch to the sample class on the Cohorts page to see how it looks.</p></div>'}`;
}
