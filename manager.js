"use strict";
// Manager mode (prototype). Open to anyone with the link while the game is a prototype: there is no sign-in or permission check.
// Pages from the journey: Cohorts (class dashboard), Invite (set up a sales class from a CSV) and Leaderboards.
// There is no server yet, so:
//   - the class on the Cohorts page is SAMPLE DATA (labelled), plus the player on this device as one extra row;
//   - a class created on the Invite page is saved on this device only, and invites are NOT emailed (you copy an invite message);
//   - Nudge only records the nudge on this device.
// A real version needs a shared database and company sign-in. Uses globals from index.html and tiers.js at call time.

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
  const pages = [["cohorts", "Cohorts"], ["invite", "Invite"], ["leaderboards", "Leaderboards"]];
  app.innerHTML = `<div class="mgrwrap">
    <div class="mgrbar"><div class="mlogo">Tequila Corrido<small>SALES ACADEMY · MANAGER</small></div>
      <nav class="mnav" aria-label="Manager pages">${pages.map(([k, l]) => `<button type="button" class="mnavbtn ${k === mgrTab ? "on" : ""}" data-p="${k}" ${k === mgrTab ? 'aria-current="page"' : ""}>${l}</button>`).join("")}</nav>
      <div class="muser"><span>${esc(state.mgrName || "Manager")}</span><button type="button" class="mback" id="mback">← Back to the game</button></div></div>
    <p class="mproto" role="note"><b>Prototype.</b> Manager mode is open to anyone with the link, and the class below is sample data. Nothing here is saved to a server.</p>
    <div id="mbody"></div></div>`;
  app.querySelectorAll(".mnavbtn").forEach(b => b.onclick = () => managerMode(b.dataset.p));
  $("#mback").onclick = leaveManager;
  ({ cohorts: mgrCohorts, invite: mgrInvite, leaderboards: mgrBoards })[mgrTab]($("#mbody"));
  window.scrollTo(0, 0);
}
function leaveManager() {
  document.body.classList.remove("mgr");
  if (location.hash === "#manager") history.replaceState(null, "", location.pathname + location.search);
  if (state.avatarSaved) home(); else { $("#gate").classList.remove("hidden"); }
}

// ----- the data behind the pages -----
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
const csvCell = v => `"${String(v).replace(/"/g, '""')}"`;
function download(name, text, type = "text/csv") {
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
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
        <button class="mbtn alt" id="mexp" type="button">Export CSV</button><button class="mbtn" id="minv" type="button">Invite reps</button></div></div>
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
    </tbody></table></div></div>`;
  if ($("#mclass")) $("#mclass").onchange = e => { mgrClass = e.target.value; managerMode("cohorts"); };
  $("#minv").onclick = () => managerMode("invite");
  $("#mexp").onclick = () => download(`${c.name.replace(/\W+/g, "-").toLowerCase()}-roster.csv`, ["Rep,Team,Tier,XP,Streak,Bosses,Focus skill,Last active", ...reps.map(r => [r.name, r.team, `${r.tier} ${TIERS[r.tier]}`, r.xp, r.streak, `${r.bosses}/6`, r.focus, lastActive(r)].map(csvCell).join(","))].join("\n"));
  el.querySelectorAll(".nudgebtn").forEach(b => b.onclick = () => { state.nudged = { ...(state.nudged || {}), [b.dataset.n]: Progress.today() }; Progress.save(state); b.textContent = "Nudged ✓"; b.disabled = true; toast(`Nudge recorded for ${b.dataset.n} (prototype: not delivered).`); });
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
        <label class="mlab">Journey</label><div class="mjourney"><b>Season 1: Trainee to Seasoned Seller</b><small>Six tiers, six boss battles. Custom journeys arrive in Release 2.</small></div></div>
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
