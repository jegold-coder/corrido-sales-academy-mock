"use strict";
// Rep dashboard: progress, skills, badges, team board and settings. Uses globals from index.html at call time.

let dashTab = "progress";

function dashboard(tab = dashTab) {
  stopAll(); Cam.stop(); Sound.stop();
  dashTab = tab;
  const lv = levelOf(state.xp), cur = LEVELS[lv][1], nxt = LEVELS[lv + 1];
  const pctNext = nxt ? Math.round((state.xp - cur) / (nxt[1] - cur) * 100) : 100;
  const tabs = [["progress", "Progress"], ["badges", "Badges"], ["team", "Team"], ["review", "Review" + ((state.mistakes || []).length ? ` (${state.mistakes.length})` : "")], ["check", "Knowledge check"], ["settings", "Settings"]];
  app.innerHTML = `<section class="view sheet dash">
    <div class="dhead">
      <div class="dav"><svg viewBox="26 -6 68 84" aria-hidden="true">${person(repLook())}</svg></div>
      <div class="dwho"><h1>${esc(repName())}</h1><p>Level ${lv + 1}: ${LEVELS[lv][0]} · ${state.xp} XP · 🔥 ${state.streak || 0}-day streak</p>
        <div class="bar" aria-label="Progress to the next level"><i style="width:${pctNext}%"></i></div><small>${nxt ? `${nxt[1] - state.xp} XP to ${nxt[0]}` : "Top level reached"}</small></div>
      <button class="btn alt" id="dback" type="button">← Map</button>
    </div>
    <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" class="tab" data-t="${k}" aria-selected="${k === tab}">${l}</button>`).join("")}</div>
    <div id="dbody" role="tabpanel"></div></section>`;
  $("#dback").onclick = home;
  app.querySelectorAll(".tab").forEach(b => b.onclick = () => dashboard(b.dataset.t));
  const body = $("#dbody");
  ({ progress: dashProgress, badges: dashBadges, team: dashTeam, review: dashReview, check: dashCheck, settings: dashSettings })[tab](body);
  if (tab === "progress") {
    body.insertAdjacentHTML("afterbegin", `<div class="savenote"><span><b>Your progress is saved only in this browser.</b> Clearing browser data, or opening the game on another computer, starts you over. Download a backup to keep it safe.</span><button class="btn alt" id="bak" type="button">Download backup</button></div>`);
    $("#bak").onclick = exportProgress;
  }
}

// Saves progress as a file, and reads one back, since nothing is stored anywhere but this browser.
function exportProgress() {
  const blob = new Blob([JSON.stringify({ ...state, hearts: undefined, avatar: undefined, sc: undefined }, null, 2)], { type: "application/json" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "corrido-academy-progress.json"; a.click(); URL.revokeObjectURL(a.href);
}
function importProgress(file, done) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (!d || typeof d !== "object" || typeof d.xp !== "number" || !Array.isArray(d.history)) throw new Error("not a backup");
      const keep = { ...Progress.blank(), ...d };
      Object.assign(state, keep, { hearts: D().hearts }); Progress.save(state); hud(); done(true);
    } catch { done(false); }
  };
  r.readAsText(file);
}

function dashProgress(el) {
  const H = state.history, wins = H.filter(h => h.won).length;
  const avg = H.length ? Math.round(H.reduce((a, h) => a + h.pct, 0) / H.length) : 0;
  const skills = Progress.skillAverages(state);
  const weak = skills[0];
  const done = ALL_STOPS().filter(x => state.done[x.id]).length;
  const rec = !H.length ? "Start with the two lessons, Meet Corrido and Know the Lineup, then The Quiet Bar."
    : weak ? `Your lowest skill is <b>${weak[0]}</b> (${weak[1]}%). <button class="btn" id="pweak" type="button">Practice ${weak[0]}</button> A short mix of moments from different customers, picked to train it.` : "";
  const wirePractice = () => { if ($("#pweak")) $("#pweak").onclick = () => playPractice(weak[0]); };
  el.innerHTML = `<div class="stats3"><div><b>${done}/${ALL_STOPS().length}</b><span>stops finished</span></div><div><b>${wins}</b><span>missions won</span></div><div><b>${H.length ? (avg / 20).toFixed(1) + " / 5" : "–"}</b><span>average score</span></div></div>
    ${tierCard()}
    <p class="learn">${rec}</p>
    <div class="card"><h3>Skills</h3>${skills.length ? skills.map(([k, v, n], i) => `<div class="row"><span>${k}</span><div class="bar"><i style="width:${v}%"></i></div><b>${v}%</b>${i === 0 && skills.length > 1 ? '<small class="focus">focus here</small>' : ""}</div>`).join("") : '<p class="note2">Finish a mission to see your skills.</p>'}</div>
    ${cameraDash(H)}
    <div class="card"><h3>Recent missions</h3>${H.length ? `<table class="hist"><thead><tr><th>Date</th><th>Mission</th><th>Level</th><th>Score</th><th>Stars</th></tr></thead><tbody>${H.slice(-10).reverse().map(h => `<tr><td>${esc(h.date)}</td><td>${esc(h.title)}</td><td>${esc(h.diff)}${h.mode === "speak" ? " · spoken" : h.mode === "type" ? " · typed" : h.mode === "choice" ? " · quiz" : ""}</td><td>${(h.pct / 20).toFixed(1)} / 5</td><td>${"★".repeat(h.stars)}${"☆".repeat(3 - h.stars)}</td></tr>`).join("")}</tbody></table>` : '<p class="note2">Nothing yet.</p>'}</div>`;
  wirePractice();
}

function dashReview(el) {
  const list = state.mistakes || [];
  if (!list.length) { el.innerHTML = `<div class="card"><h3>Nothing to review</h3><p class="note2">Any answer that scores under 3.5 out of 5 lands here, with what you missed and a stronger answer next to it. Score 3.5 or more on the same moment later and it clears itself.</p></div>`; return; }
  const by = {}; list.forEach(m => (by[m.skill] = by[m.skill] || []).push(m));
  el.innerHTML = `<p class="note2">${list.length} moment${list.length === 1 ? "" : "s"} to review, grouped by skill. Practice a skill to clear them.</p>` +
    Object.entries(by).sort((a, b) => b[1].length - a[1].length).map(([sk, ms]) => `<div class="card"><h3>${esc(sk)} <span class="chip">${ms.length}</span><button class="btn alt pskill" data-s="${esc(sk)}" type="button">Practice this</button></h3>${ms.map(m => `<div class="mistake"><small>${esc(m.mission)} · ${esc(m.date)}</small><p><b>Customer:</b> ${esc(m.line)}</p><p class="bad"><b>You said</b> (${(+m.score || 0).toFixed(1)} / 5): ${esc(m.text)}</p>${(m.missed || []).length ? `<p class="note2"><b>You missed:</b> ${m.missed.map(esc).join("; ")}.</p>` : ""}${(m.flags || []).length ? `<p class="note2"><b>Knocked points off:</b> ${m.flags.map(esc).join(" ")}</p>` : ""}<p class="better"><b>A stronger answer:</b> <i>${esc(m.better)}</i></p></div>`).join("")}</div>`).join("") +
    `<p><button class="btn alt" id="clrrev" type="button">Clear the whole list</button></p>`;
  el.querySelectorAll(".pskill").forEach(b => b.onclick = () => playPractice(b.dataset.s));
  $("#clrrev").onclick = () => { if (confirm("Clear every moment from your review list?")) { state.mistakes = []; Progress.save(state); dashboard("review"); } };
}

// Where the rep is on the six tiers, the bosses beaten and how much merch is unlocked.
function tierCard() {
  const t = tierOf(), got = merchEarned().size, total = Object.keys(OUTFITS).length + Object.keys(HATS).length;
  return `<div class="card tiercard"><h3>Your tier</h3>
    <div class="tierrow dark">${TIERS.map((n, i) => `<div class="tierdot ${i < t ? "done" : i === t ? "now" : ""}" title="Tier ${i}: ${n}"><b>${i}</b></div>`).join('<i class="tl"></i>')}</div>
    <p class="tiernow"><b>Tier ${t} · ${TIERS[t]}</b> <span>${bossesBeaten()} of 6 bosses beaten</span></p>
    ${bossBadgeRow()}
    <div class="row"><span>Merch unlocked</span><div class="bar"><i style="width:${Math.round(got / total * 100)}%"></i></div><b>${got}/${total}</b></div>
    <p class="note2">Beat a level to unlock its merch. Beat a boss to move up a tier. ${state.done.mean ? "You have the Legend frame." : ""}</p></div>`;
}

function cameraDash(H) {
  const cs = H.filter(h => h.camera);
  if (!cs.length) return "";
  const avg = k => Math.round(cs.reduce((a, h) => a + (h.camera[k] || 0), 0) / cs.length);
  return `<div class="card"><h3>Delivery (camera coach)</h3>${[["Eye contact", "eye"], ["Posture", "posture"], ["Presence", "presence"], ["Expression", "smile"]].map(([l, k]) => `<div class="row"><span>${l}</span><div class="bar"><i style="width:${avg(k)}%"></i></div><b>${avg(k)}%</b></div>`).join("")}<p class="note2">Averages over ${cs.length} mission${cs.length > 1 ? "s" : ""}. Video never leaves your device.</p></div>`;
}

function dashBadges(el) {
  syncBadges();
  const keys = Object.keys(BADGES), have = keys.filter(k => state.badges.includes(k)).length;
  const special = keys.filter(k => BADGE_ART[k].kind !== "mission"), plain = keys.filter(k => BADGE_ART[k].kind === "mission");
  el.innerHTML = `<div class="badgehead"><b>${have} of ${keys.length} badges earned</b><div class="bar" aria-hidden="true"><i style="width:${Math.round(have / keys.length * 100)}%"></i></div></div>
    <h3 class="bsec">Boss badges</h3><p class="note2">One for every boss, with that boss's face on the medal. The metal gets richer with every tier. Beat all six to finish the season.</p>
    <div class="badgegrid bossgrid">${special.map(badgeCard).join("")}</div>
    <h3 class="bsec">Mission badges</h3><div class="badgegrid">${plain.map(badgeCard).join("")}</div>`;
}

const DEMO_TEAM = [["Alex R.", 410, 4, 5, 3], ["Sam T.", 295, 3, 4, 2], ["Jordan K.", 180, 2, 3, 1], ["Mia L.", 120, 2, 2, 5]];
function dashTeam(el) {
  const me = { n: repName(), xp: state.xp, lv: levelOf(state.xp), b: state.badges.length, s: state.streak || 0, me: true };
  const rows = [me, ...Object.values(state.team || {})].sort((a, b) => b.xp - a.xp);
  const code = Progress.shareCode(state, repName());
  el.innerHTML = `<p class="note2">No server and no cost: each rep copies their code and shares it in the team chat. Paste a teammate's code to add them. Codes are just a name, XP and level, and they only update when a teammate shares a new one.</p>
    <div class="card"><h3>Leaderboard</h3><ol class="lb">${rows.map((r, i) => `<li class="${r.me ? "me" : ""}"><span>${i + 1}. ${esc(r.n)}${r.demo ? " <small>(demo)</small>" : ""}</span><span>Lv ${r.lv + 1} · ${r.xp} XP · 🔥 ${r.s}${r.me ? "" : ` <button class="x2" data-k="${esc(r.n)}" aria-label="Remove ${esc(r.n)}">✕</button>`}</span></li>`).join("")}</ol></div>
    <div class="card"><h3>Your code</h3><input id="mycode" readonly value="${code}" aria-label="Your share code"><button class="btn alt" id="cpycode" type="button">Copy</button></div>
    <div class="card"><h3>Add a teammate</h3><input id="tcode" placeholder="Paste a code that starts with csa1." aria-label="Teammate code"><button class="btn" id="addcode" type="button">Add</button><p class="note2" id="tmsg"></p>
      <button class="btn alt" id="demo" type="button">Add demo teammates (for presenting)</button></div>
    <div class="card"><h3>Managing a team?</h3><p class="note2">Manager mode shows a class's progress, invites reps from a CSV and ranks them. It is a prototype, open to anyone with the link, and uses sample data.</p><button class="btn alt" id="gomgr3" type="button">👔 Open manager mode</button></div>`;
  $("#gomgr3").onclick = () => managerMode();
  $("#cpycode").onclick = () => { navigator.clipboard?.writeText(code).then(() => { $("#cpycode").textContent = "Copied"; }).catch(() => { $("#mycode").select(); }); };
  $("#addcode").onclick = () => {
    const r = Progress.readCode($("#tcode").value);
    if (!r) { $("#tmsg").textContent = "That doesn't look like a valid code."; return; }
    state.team[r.n] = r; Progress.save(state); dashboard("team");
  };
  $("#demo").onclick = () => { DEMO_TEAM.forEach(([n, xp, lv, b, s]) => { state.team[n] = { n, xp, lv, b, s, demo: true }; }); Progress.save(state); dashboard("team"); };
  el.querySelectorAll(".x2").forEach(b => b.onclick = () => { delete state.team[b.dataset.k]; Progress.save(state); dashboard("team"); });
}

const ACCENTS = { "en-US": "American", "en-GB": "British", "en-AU": "Australian", "en-IE": "Irish", "en-IN": "Indian", "en-ZA": "South African", "en-CA": "Canadian", "en-NZ": "New Zealand", "en-scotland": "Scottish" };
const voiceLabel = v => `${v.name.replace(/\s*\(.*$/, "").replace(/^Microsoft\s+/, "").replace(/\s+Online.*$/, "")} · ${ACCENTS[String(v.lang).replace("_", "-")] || v.lang}`;

function dashSettings(el) {
  el.innerHTML = `<div class="card"><h3>Sound</h3><button class="btn alt" id="snd" type="button">${Sound.on ? "🔊 Sound is on. Mute" : "🔇 Sound is off. Turn on"}</button><p class="note2">Background vinyl and guitar, plus short effects. You can also use the speaker button in the bottom-left corner.</p></div>
    <div class="card"><h3>Prototype tools</h3><p class="note2">The game is in prototype, so these switches make it easy to test everything. Turn them off to play it the way it will really work.</p>
      ${[["unlockStops", "Every stop is open (no need to beat the one before)"], ["unlockMerch", "Every piece of merch is unlocked"], ["unlimitedTries", "Unlimited boss tries (otherwise 3 a day per boss)"]].map(([k, l]) => `<label class="protorow"><input type="checkbox" data-p="${k}" ${PROTO(k) ? "checked" : ""}> ${l}</label>`).join("")}
      <button class="btn alt" id="gomgr2" type="button">Open manager mode</button></div>
    <div class="card"><h3>Customer voices</h3><p class="note2">Every customer has their own voice and accent, picked from the voices installed in this browser, and speaks a little warmer or colder depending on how you did. Press play to hear each one.</p>
      <div class="vlist">${SCENARIOS.map((sc, i) => { const v = Voices.voice(sc); return `<div class="vrow"><span><b>${esc(sc.cust.name)}</b> <small>${esc(sc.cust.role)}</small></span><span class="vname">${v ? esc(voiceLabel(v)) : "Browser default"}</span><button class="btn alt vplay" data-i="${i}" type="button" aria-label="Hear ${esc(sc.cust.name)}">▶ Play</button></div>`; }).join("")}</div>
      <p class="note2">For the most human sound use Microsoft Edge (its free "Natural" voices) or, on a Mac, add a Premium voice in System Settings, Accessibility, Spoken Content, then reload this page.</p></div>
    <div class="card"><h3>Help</h3><button class="btn alt" id="replay" type="button">Replay the tutorial</button></div>
    <div class="card"><h3>Your data</h3><p class="note2">Everything is saved only in this browser, and nothing is uploaded. Clearing browser data erases it, so download a backup now and then.</p>
      <button class="btn alt" id="exp" type="button">Download a backup (JSON)</button>
      <label class="btn alt filebtn">Restore from a backup<input type="file" id="imp" accept="application/json,.json" hidden></label>
      <button class="btn alt" id="rst" type="button">Reset all progress</button><p class="note2" id="smsg"></p></div>
    <div class="card"><h3>The real brand</h3><p class="note2">See the real Tequila Corrido website. It opens in a new tab, so Sales Academy stays open.</p><a class="btn alt sitelink" href="https://ilovetequilacorrido.com" target="_blank" rel="noopener noreferrer">🌐 ilovetequilacorrido.com ↗</a></div>
    <div class="card"><h3>About this mock</h3><p class="note2">Free and offline: no accounts, no paid services. The AI coach is a built-in rule checker, with an optional free Gemini key for typed answers. Mission scripts are draft ideas for the team, not approved by Tequila Corrido.</p></div>`;
  $("#snd").onclick = () => { Sound.init(); Sound.setOn(!Sound.on); paintSound(); dashboard("settings"); };
  el.querySelectorAll("[data-p]").forEach(c => c.onchange = () => { state.proto = { ...(state.proto || {}), [c.dataset.p]: c.checked }; Progress.save(state); state.avatar = cleanAvatar(state.avatar); hud(); });
  $("#gomgr2").onclick = () => managerMode();
  $("#replay").onclick = () => tutorial(() => dashboard("settings"));
  $("#exp").onclick = exportProgress;
  $("#imp").onchange = e => { const f = e.target.files[0]; if (f) importProgress(f, ok => { $("#smsg").textContent = ok ? "Backup restored." : "That file isn't a Corrido Academy backup."; if (ok) dashboard("settings"); }); };
  $("#rst").onclick = () => { if (confirm("Reset XP, badges, history and the team board?")) { Progress.reset(); Object.assign(state, Progress.blank()); state.hearts = D().hearts; hud(); dashboard("settings"); } };
}
