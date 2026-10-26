"use strict";
// The answer grader (manager mode > Grader). It is for managers, so they can see what a good answer looks like and what is not
// good, and check how the game scores any answer. Reps don't see it, because it shows the model answers. It runs the same scoring
// the missions use (Coach.score). The tone here comes from the words only: in a real mission the recording also adds pace, pauses
// and loudness. The customer's face shows the reaction that answer would get.

// The arithmetic behind a score, in the order the game does it: what you mentioned, minus mistakes, then the tone point.
const gradeMath = (res, n) => ({
  raw: Math.round(4 * res.hits.length / n * 10) / 10,
  taken: Math.min(3, Math.round(res.flags.reduce((a, f) => a + f.pts, 0) * 10) / 10),
  content: res.content, tone: res.tone.pts, total: res.score,
});
// How the customer takes an answer, the same rule the missions use.
const gradeTier = res => { const t = res.score >= 4 ? "best" : res.score >= 2.5 ? "mid" : "bad"; return t === "best" && res.tone.pts < .6 ? "mid" : t; };

function mgrGrader(el) {
  const g = (mgrGrader.st = mgrGrader.st || { id: SCENARIOS[0].id, step: 0, lvl: 0, text: "" });
  const sc = () => SCENARIOS.find(s => s.id === g.id) || SCENARIOS[0], lvl = () => g.lvl || sc().level;
  const plain = t => String(t || "").replace(/<[^>]+>/g, "").replace(/^"|"$/g, "");
  const idx = Math.min(g.step, sc().steps.length - 1), S = sc().steps[idx], cust = sc().cust, K0 = CRITERIA[sc().id + ":" + idx];
  const sorted = [...SCENARIOS].sort((a, b) => a.level - b.level);
  // the guide: what a good answer is, and the answers that are not good, each with the reason the game gives
  const good = S.R ? [[S.R[0], S.R[1]]] : [], shorter = S.RH ? plain(S.RH) : "";
  const sosos = (S.H || []).map(([t, w]) => [t, w]), weak = (S.E || []).map(([t, w]) => [t, w]);
  const ex = (cls, label, items) => items.length ? `<h3 class="gr-h">${label}</h3>${items.map(([t, w], i) => `<div class="gr-ex ${cls}"><p>“${esc(plain(t))}”</p><p class="gr-why">${esc(plain(w))}</p><button class="btn alt gr-try" type="button" data-k="${cls}" data-i="${i}">Score this one</button></div>`).join("")}` : "";
  el.innerHTML = `<div class="mhead"><div><h1 class="mtitle">Answer grader</h1><p class="msub">See what a good answer looks like, what isn't good, and how the game scores any answer you type. Reps don't see this page.</p></div></div>
    <div class="gr-cols grader">
      <div>
        <div class="mcard">
          <div class="grow">
            <label>Customer<select id="gmis">${sorted.map(s => `<option value="${s.id}" ${s.id === g.id ? "selected" : ""}>${MLEVEL[s.level].name} · ${esc(s.title)} (${esc(s.cust.name)})</option>`).join("")}</select></label>
            <label>Question<select id="gstep">${sc().steps.map((st, i) => `<option value="${i}" ${i === idx ? "selected" : ""}>${i + 1}. ${esc(st.skill)}: ${esc(plain(st.q))}</option>`).join("")}</select></label>
            <label>Difficulty<select id="glvl">${[1, 2, 3, 4, 5].map(n => `<option value="${n}" ${n === lvl() ? "selected" : ""}>${MLEVEL[n].name} (pass mark ${MLEVEL[n].pass})</option>`).join("")}</select></label>
          </div>
          <p class="gr-says"><b>${esc(cust.name)} says:</b> ${esc(spoken(S.line).slice(0, 400))}</p>
          <p class="note2"><b>The question:</b> ${esc(plain(S.q))}</p>
        </div>
        <div class="mcard"><h2>What a good answer looks like</h2>
          ${good.map(([t, w]) => `<div class="gr-ex good"><p>“${esc(plain(t))}”</p><p class="gr-why">${esc(plain(w))}</p><button class="btn alt gr-try" type="button" data-k="good" data-i="0">Score this one</button></div>`).join("") || '<p class="note2">No model answer for this question.</p>'}
          ${shorter ? `<p class="gr-why"><b>Or, shorter:</b> “${esc(shorter)}”</p>` : ""}
          ${K0 ? `<h3 class="gr-h">A good answer covers (${(4 / K0.need.length).toFixed(1)} points each)</h3><ul class="gr-list">${K0.need.map(([, label]) => `<li class="neu">${esc(label)}</li>`).join("")}</ul>` : ""}
          ${ex("so", "Partly there, but not good enough", sosos)}${ex("weak", "Not good", weak)}
        </div>
      </div>
      <div>
        <div class="mcard"><h2>Score any answer</h2>
          <label>Type or paste an answer<textarea id="gtxt" rows="4" placeholder="Type what a rep might say…">${esc(g.text)}</textarea></label>
          <div class="gr-btns"><button class="btn" id="gscore" type="button">Score it</button></div>
          <p class="note2">Same grader as the missions: 4 points for what's said, 1 for tone, points knocked off for mistakes. Here the tone comes from the words only; in a mission the recording also adds pace, pauses and loudness.</p>
        </div>
        <div id="gres" aria-live="polite"></div>
      </div>
    </div>`;
  const paint = () => {
    const out = $("#gres"), text = g.text.trim();
    if (!text) { out.innerHTML = '<div class="mcard"><p class="note2">Type an answer, or press "Score this one" on any example, and the score appears here.</p></div>'; return; }
    const sci = sc(), key = sci.id + ":" + idx, K = CRITERIA[key];
    const res = Coach.score(key, text, lvl(), { tone: TONE_FOR[sci.id], voice: null }), m = gradeMath(res, K.need.length), tier = gradeTier(res), pass = MLEVEL[lvl()].pass;
    const face = { best: "delighted", mid: "unsure", bad: "annoyed" }[tier];
    const reply = S.reply && (S.reply[tier] || (tier === "mid" ? (MIDS[sci.id] || [])[idx] : null) || S.reply[tier === "mid" ? "bad" : tier]);
    const cls = res.score >= 4 ? "hi" : res.score >= 2.5 ? "mid" : "lo", f1 = n => n.toFixed(1);
    out.innerHTML = `<div class="mcard"><div class="gr-top"><div class="gr-face"><svg viewBox="14 -2 92 112" aria-hidden="true"><g data-x="${face}">${person(custLook(sci))}</g></svg></div>
      <div><div class="gr-score ${cls}">${f1(res.score)}<small> out of 5</small></div><p class="note2">${esc(cust.name)} ${tier === "best" ? "is won over." : tier === "mid" ? "isn't sure yet." : "isn't impressed."} At ${MLEVEL[lvl()].name} difficulty a mission needs ${pass} on average to pass, so on its own this answer ${res.score >= pass ? "would help a rep clear" : "falls short of"} that.</p></div></div>
      ${reply ? `<p class="gr-reply"><b>${esc(cust.name)} would say:</b> ${esc(spoken(reply))}</p>` : ""}
      ${res.compliance ? '<p class="gr-reply" style="border-color:#9a2f2f;background:#fdeceb"><b>⛔ Compliance miss.</b> A health claim or a pressure tactic loses a boss battle instantly.</p>' : ""}
      <h3 class="gr-h">How the score adds up</h3>
      <table class="gr-math"><tr><td>Mentioned ${res.hits.length} of ${K.need.length} things the answer should cover</td><td>${f1(m.raw)} of 4</td></tr>
        <tr><td>Points knocked off for mistakes</td><td>${m.taken ? "−" + f1(m.taken) : "0.0"}</td></tr>
        <tr><td><b>Content</b></td><td>${f1(m.content)} of 4</td></tr>
        <tr><td><b>Tone</b> (${esc(res.tone.name || "natural and polite")})</td><td>${f1(m.tone)} of 1</td></tr>
        <tr><td><b>Total</b></td><td>${f1(m.total)} of 5</td></tr></table>
      <h3 class="gr-h">What this question looks for <span class="note2">(${f1(res.per)} each)</span></h3>
      <ul class="gr-list">${K.need.map(([re, label]) => `<li class="${re.test(text) ? "yes" : "no"}">${esc(label)}</li>`).join("")}</ul>
      <h3 class="gr-h">Mistakes</h3>
      <ul class="gr-list">${res.flags.length ? res.flags.map(f => `<li class="no">${esc(f.msg)}${f.pts ? ` (−${f1(f.pts)})` : ""}</li>`).join("") : '<li class="yes">None found.</li>'}</ul>
      <h3 class="gr-h">Tone</h3>
      <p class="note2">${esc((TONE_FOR[sci.id] || {}).cue || "")}</p>
      <ul class="gr-list">${res.tone.notes.length ? res.tone.notes.map(n => `<li class="${n.ok ? "yes" : "no"}">${esc(n.msg)}${!n.ok && n.pts ? ` (−${f1(n.pts)})` : ""}</li>`).join("") : '<li class="neu">Nothing to flag in the words.</li>'}</ul>
      <p class="note2">${res.words} words. This is a rule-based draft: check it against your own judgement and tell the team what to change.</p></div>`;
  };
  let timer = null;
  const set = t => { g.text = t; $("#gtxt").value = t; paint(); $("#gres").scrollIntoView({ block: "nearest", behavior: "smooth" }); };
  $("#gmis").onchange = e => { g.id = e.target.value; g.step = 0; g.lvl = 0; g.text = ""; mgrGrader(el); };
  $("#gstep").onchange = e => { g.step = Number(e.target.value); g.text = ""; mgrGrader(el); };
  $("#glvl").onchange = e => { g.lvl = Number(e.target.value); paint(); };
  $("#gtxt").oninput = e => { g.text = e.target.value; clearTimeout(timer); timer = setTimeout(paint, 350); };
  $("#gtxt").onkeydown = e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); paint(); } };
  $("#gscore").onclick = paint;
  const pick = { good, so: sosos, weak };
  el.querySelectorAll(".gr-try").forEach(b => b.onclick = () => set(plain(pick[b.dataset.k][Number(b.dataset.i)][0])));
  paint();
}
if (typeof module !== "undefined") module.exports = { gradeMath, gradeTier };
