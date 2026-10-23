"use strict";
// Rep dashboard: progress, skills, badges, team board and settings. Uses globals from index.html at call time.

let dashTab = "progress";

function dashboard(tab = dashTab) {
  stopAll(); Cam.stop(); Sound.stop();
  dashTab = tab;
  const lv = levelOf(state.xp), cur = LEVELS[lv][1], nxt = LEVELS[lv + 1];
  const pctNext = nxt ? Math.round((state.xp - cur) / (nxt[1] - cur) * 100) : 100;
  const tabs = [["progress", "Progress"], ["badges", "Badges"], ["team", "Team"], ["check", "Knowledge check"], ["settings", "Settings"]];
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
  ({ progress: dashProgress, badges: dashBadges, team: dashTeam, check: dashCheck, settings: dashSettings })[tab](body);
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
  const rec = !H.length ? "Start with Meet Corrido, then Marco's Bar."
    : weak ? `Your lowest skill is <b>${weak[0]}</b> (${weak[1]}%). Replay a mission that tests it, ideally by typing your answers.` : "";
  el.innerHTML = `<div class="stats3"><div><b>${done}/${ALL_STOPS().length}</b><span>stops finished</span></div><div><b>${wins}</b><span>missions won</span></div><div><b>${H.length ? avg + "%" : "–"}</b><span>average score</span></div></div>
    <p class="learn">${rec}</p>
    <div class="card"><h3>Skills</h3>${skills.length ? skills.map(([k, v, n], i) => `<div class="row"><span>${k}</span><div class="bar"><i style="width:${v}%"></i></div><b>${v}%</b>${i === 0 && skills.length > 1 ? '<small class="focus">focus here</small>' : ""}</div>`).join("") : '<p class="note2">Finish a mission to see your skills.</p>'}</div>
    ${cameraDash(H)}
    <div class="card"><h3>Recent missions</h3>${H.length ? `<table class="hist"><thead><tr><th>Date</th><th>Mission</th><th>Level</th><th>Score</th><th>Stars</th></tr></thead><tbody>${H.slice(-10).reverse().map(h => `<tr><td>${esc(h.date)}</td><td>${esc(h.title)}</td><td>${esc(h.diff)} · ${h.mode === "type" ? "typed" : "choice"}</td><td>${h.pct}%</td><td>${"★".repeat(h.stars)}${"☆".repeat(3 - h.stars)}</td></tr>`).join("")}</tbody></table>` : '<p class="note2">Nothing yet.</p>'}</div>`;
}

function cameraDash(H) {
  const cs = H.filter(h => h.camera);
  if (!cs.length) return "";
  const avg = k => Math.round(cs.reduce((a, h) => a + (h.camera[k] || 0), 0) / cs.length);
  return `<div class="card"><h3>Delivery (camera coach)</h3>${[["Eye contact", "eye"], ["Posture", "posture"], ["Presence", "presence"], ["Expression", "smile"]].map(([l, k]) => `<div class="row"><span>${l}</span><div class="bar"><i style="width:${avg(k)}%"></i></div><b>${avg(k)}%</b></div>`).join("")}<p class="note2">Averages over ${cs.length} mission${cs.length > 1 ? "s" : ""}. Video never leaves your device.</p></div>`;
}

function dashBadges(el) {
  el.innerHTML = `<div class="badgegrid">${Object.entries(BADGES).map(([k, b]) => { const on = state.badges.includes(k); return `<div class="bcard ${on ? "on" : ""}"><span class="bi">${on ? "🏅" : "🔒"}</span><b>${b[0]}</b><small>${b[1]}</small></div>`; }).join("")}</div>`;
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
      <button class="btn alt" id="demo" type="button">Add demo teammates (for presenting)</button></div>`;
  $("#cpycode").onclick = () => { navigator.clipboard?.writeText(code).then(() => { $("#cpycode").textContent = "Copied"; }).catch(() => { $("#mycode").select(); }); };
  $("#addcode").onclick = () => {
    const r = Progress.readCode($("#tcode").value);
    if (!r) { $("#tmsg").textContent = "That doesn't look like a valid code."; return; }
    state.team[r.n] = r; Progress.save(state); dashboard("team");
  };
  $("#demo").onclick = () => { DEMO_TEAM.forEach(([n, xp, lv, b, s]) => { state.team[n] = { n, xp, lv, b, s, demo: true }; }); Progress.save(state); dashboard("team"); };
  el.querySelectorAll(".x2").forEach(b => b.onclick = () => { delete state.team[b.dataset.k]; Progress.save(state); dashboard("team"); });
}

function dashSettings(el) {
  el.innerHTML = `<div class="card"><h3>Sound</h3><button class="btn alt" id="snd" type="button">${Sound.on ? "🔊 Sound is on. Mute" : "🔇 Sound is off. Turn on"}</button><p class="note2">Background vinyl and guitar, plus short effects. You can also use the speaker button in the bottom-left corner.</p></div>
    <div class="card"><h3>Help</h3><button class="btn alt" id="replay" type="button">Replay the tutorial</button></div>
    <div class="card"><h3>Your data</h3><p class="note2">Everything is saved only in this browser, and nothing is uploaded. Clearing browser data erases it, so download a backup now and then.</p>
      <button class="btn alt" id="exp" type="button">Download a backup (JSON)</button>
      <label class="btn alt filebtn">Restore from a backup<input type="file" id="imp" accept="application/json,.json" hidden></label>
      <button class="btn alt" id="rst" type="button">Reset all progress</button><p class="note2" id="smsg"></p></div>
    <div class="card"><h3>About this mock</h3><p class="note2">Free and offline: no accounts, no paid services. The AI coach is a built-in rule checker, with an optional free Gemini key for typed answers. Mission scripts are draft ideas for the team, not approved by Tequila Corrido.</p></div>`;
  $("#snd").onclick = () => { Sound.init(); Sound.setOn(!Sound.on); paintSound(); dashboard("settings"); };
  $("#replay").onclick = () => tutorial(() => dashboard("settings"));
  $("#exp").onclick = exportProgress;
  $("#imp").onchange = e => { const f = e.target.files[0]; if (f) importProgress(f, ok => { $("#smsg").textContent = ok ? "Backup restored." : "That file isn't a Corrido Academy backup."; if (ok) dashboard("settings"); }); };
  $("#rst").onclick = () => { if (confirm("Reset XP, badges, history and the team board?")) { Progress.reset(); Object.assign(state, Progress.blank()); state.hearts = D().hearts; hud(); dashboard("settings"); } };
}
