"use strict";
// Test the grader (Dashboard > Grader). Type any answer to any question and see how the game scores it and why. It runs the same
// scoring the missions use (Coach.score), so the team and the client can check the grading against their own judgement. The tone
// here comes from the words only: in a real mission the recording also adds pace, pauses and loudness. The customer's face shows
// the reaction that answer would get.

// The arithmetic behind a score, in the order the game does it: what you mentioned, minus mistakes, then the tone point.
const gradeMath = (res, n) => ({
  raw: Math.round(4 * res.hits.length / n * 10) / 10,
  taken: Math.min(3, Math.round(res.flags.reduce((a, f) => a + f.pts, 0) * 10) / 10),
  content: res.content, tone: res.tone.pts, total: res.score,
});
// How the customer takes an answer, the same rule the missions use.
const gradeTier = res => { const t = res.score >= 4 ? "best" : res.score >= 2.5 ? "mid" : "bad"; return t === "best" && res.tone.pts < .6 ? "mid" : t; };

function dashGrader(el) {
  const g = (dashGrader.st = dashGrader.st || { id: SCENARIOS[0].id, step: 0, lvl: 0, text: "", why: "" });
  const sc = () => SCENARIOS.find(s => s.id === g.id) || SCENARIOS[0], lvl = () => g.lvl || sc().level;
  const plain = t => String(t || "").replace(/<[^>]+>/g, "").replace(/^"|"$/g, "");
  const S = sc().steps[Math.min(g.step, sc().steps.length - 1)], cust = sc().cust;
  const sorted = [...SCENARIOS].sort((a, b) => a.level - b.level);
  const example = (kind) => ({ strong: S.R && S.R[0], so: S.H && S.H[0] && S.H[0][0], weak: S.E && S.E[0] && S.E[0][0] })[kind];
  el.innerHTML = `<div class="grader">
    <p class="note2">Type any answer and see exactly how the game would score it. This is the same grader the missions use: 4 points for what you say and 1 for tone, with points knocked off for mistakes. Here the tone comes from the words only; in a mission your recording also adds pace, pauses and loudness.</p>
    <div class="card">
      <div class="grow">
        <label>Customer<select id="gmis">${sorted.map(s => `<option value="${s.id}" ${s.id === g.id ? "selected" : ""}>Level ${s.level} · ${esc(s.title)} (${esc(s.cust.name)})</option>`).join("")}</select></label>
        <label>Question<select id="gstep">${sc().steps.map((st, i) => `<option value="${i}" ${i === g.step ? "selected" : ""}>${i + 1}. ${esc(st.skill)}: ${esc(plain(st.q))}</option>`).join("")}</select></label>
        <label>Difficulty<select id="glvl">${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${n === lvl() ? "selected" : ""}>Level ${n} · ${MLEVEL[n].name} (pass mark ${MLEVEL[n].pass})</option>`).join("")}</select></label>
      </div>
      <p class="gr-says"><b>${esc(cust.name)} says:</b> ${esc(spoken(S.line).slice(0, 400))}</p>
      <p class="note2"><b>The question:</b> ${esc(plain(S.q))} <b>Hint:</b> ${esc(plain(S.hint || ""))}</p>
      <label>Your answer<textarea id="gtxt" rows="4" placeholder="Type what you would say…">${esc(g.text)}</textarea></label>
      <div class="gr-btns"><button class="btn" id="gscore" type="button">Score it</button>
        ${example("strong") ? '<button class="btn alt" id="gstrong" type="button">Try a strong example</button>' : ""}${example("so") ? '<button class="btn alt" id="gso" type="button">Try a so-so one</button>' : ""}${example("weak") ? '<button class="btn alt" id="gweak" type="button">Try a weak one</button>' : ""}</div>
      <p class="gr-why" id="gwhy">${esc(g.why)}</p>
    </div>
    <div id="gres" aria-live="polite"></div></div>`;
  const paint = () => {
    const out = $("#gres"), text = g.text.trim();
    if (!text) { out.innerHTML = '<p class="note2">Type an answer, or try one of the examples, and the score appears here.</p>'; return; }
    const sci = sc(), key = sci.id + ":" + Math.min(g.step, sci.steps.length - 1), K = CRITERIA[key];
    const res = Coach.score(key, text, lvl(), { tone: TONE_FOR[sci.id], voice: null }), m = gradeMath(res, K.need.length), tier = gradeTier(res), pass = MLEVEL[lvl()].pass;
    const face = { best: "delighted", mid: "unsure", bad: "annoyed" }[tier], idx = Math.min(g.step, sci.steps.length - 1);
    const reply = S.reply && (S.reply[tier] || (tier === "mid" ? (MIDS[sci.id] || [])[idx] : null) || S.reply[tier === "mid" ? "bad" : tier]);
    const cls = res.score >= 4 ? "hi" : res.score >= 2.5 ? "mid" : "lo", f1 = n => n.toFixed(1);
    out.innerHTML = `<div class="card"><div class="gr-top"><div class="gr-face"><svg viewBox="14 -2 92 112" aria-hidden="true"><g data-x="${face}">${person(custLook(sci))}</g></svg></div>
      <div><div class="gr-score ${cls}">${f1(res.score)}<small> out of 5</small></div><p class="note2">${esc(cust.name)} ${tier === "best" ? "is won over." : tier === "mid" ? "isn't sure yet." : "isn't impressed."} At Level ${lvl()} a mission needs ${pass} on average to pass, so on its own this answer ${res.score >= pass ? "would help you clear" : "falls short of"} that.</p></div></div>
      ${reply ? `<p class="gr-reply"><b>${esc(cust.name)} would say:</b> ${esc(spoken(reply))}</p>` : ""}
      ${res.compliance ? '<p class="gr-reply" style="border-color:#9a2f2f;background:#fdeceb"><b>⛔ Compliance miss.</b> A health claim or a pressure tactic loses a boss battle instantly.</p>' : ""}
      <h3>How the score adds up</h3>
      <table class="gr-math"><tr><td>Mentioned ${res.hits.length} of ${K.need.length} things the answer should cover</td><td>${f1(m.raw)} of 4</td></tr>
        <tr><td>Points knocked off for mistakes</td><td>${m.taken ? "−" + f1(m.taken) : "0.0"}</td></tr>
        <tr><td><b>Content</b></td><td>${f1(m.content)} of 4</td></tr>
        <tr><td><b>Tone</b> (${esc(res.tone.name || "natural and polite")})</td><td>${f1(m.tone)} of 1</td></tr>
        <tr><td><b>Total</b></td><td>${f1(m.total)} of 5</td></tr></table>
      <h3>What this question looks for <small class="note2">(${f1(res.per)} each)</small></h3>
      <ul class="gr-list">${K.need.map(([re, label]) => `<li class="${re.test(text) ? "yes" : "no"}">${esc(label)}</li>`).join("")}</ul>
      <h3>Mistakes</h3>
      <ul class="gr-list">${res.flags.length ? res.flags.map(f => `<li class="no">${esc(f.msg)}${f.pts ? ` (−${f1(f.pts)})` : ""}</li>`).join("") : '<li class="yes">None found.</li>'}</ul>
      <h3>Tone</h3>
      <p class="note2">${esc((TONE_FOR[sci.id] || {}).cue || "")}</p>
      <ul class="gr-list">${res.tone.notes.length ? res.tone.notes.map(n => `<li class="${n.ok ? "yes" : "no"}">${esc(n.msg)}${!n.ok && n.pts ? ` (−${f1(n.pts)})` : ""}</li>`).join("") : '<li class="neu">Nothing to flag in the words.</li>'}</ul>
      <p class="note2">${res.words} words. This is a rule-based draft, so the team should check it against their own judgement and tell me what to change.</p></div>`;
  };
  let timer = null;
  const set = (t, why = "") => { g.text = t; g.why = why; $("#gtxt").value = t; $("#gwhy").textContent = why; paint(); };
  $("#gmis").onchange = e => { g.id = e.target.value; g.step = 0; g.lvl = 0; g.text = ""; g.why = ""; dashGrader(el); };
  $("#gstep").onchange = e => { g.step = Number(e.target.value); g.text = ""; g.why = ""; dashGrader(el); };
  $("#glvl").onchange = e => { g.lvl = Number(e.target.value); paint(); };
  $("#gtxt").oninput = e => { g.text = e.target.value; g.why = ""; $("#gwhy").textContent = ""; clearTimeout(timer); timer = setTimeout(paint, 350); };
  $("#gtxt").onkeydown = e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); paint(); } };
  $("#gscore").onclick = paint;
  if ($("#gstrong")) $("#gstrong").onclick = () => set(plain(example("strong")), "A strong example: " + plain(S.R[1] || ""));
  if ($("#gso")) $("#gso").onclick = () => set(plain(example("so")), "A so-so example. " + plain(S.H[0][1] || ""));
  if ($("#gweak")) $("#gweak").onclick = () => set(plain(example("weak")), "A weak example. " + plain(S.E[0][1] || ""));
  paint();
}
if (typeof module !== "undefined") module.exports = { gradeMath, gradeTier };
