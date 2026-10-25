"use strict";
// Speech helpers, the coach's summary, and the results screen.

let voiceOn = false;
const spoken = t => (t.match(/"([^"]+)"/) || [0, t])[1].replace(/<[^>]+>/g, "");
// Pick the most natural-sounding installed English voices. Premium, Enhanced and Neural voices sound best.
let VOICES = [];
const loadVoices = () => { VOICES = (window.speechSynthesis ? speechSynthesis.getVoices() : []).filter(v => /^en/i.test(v.lang)); };
if (window.speechSynthesis) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
function pickVoice(male, exclude) {
  const want = male
    ? ["Natural.*(Guy|Davis|Andrew|Brian|Christopher|Eric|Roger)", "Premium|Enhanced", "Google UK English Male", "Daniel", "Alex", "Aaron", "Reed", "Fred"]
    : ["Natural.*(Aria|Jenny|Ava|Emma|Michelle|Sonia)", "Premium|Enhanced", "Google US English", "Samantha", "Ava", "Allison", "Karen", "Moira"];
  const isMale = v => /(Daniel|Alex|Aaron|Reed|Fred|Guy|Davis|Andrew|Brian|Christopher|Eric|Roger|Male|Tom|Rishi|Arthur)/i.test(v.name);
  const pool = VOICES.filter(v => v.name !== exclude && (male ? isMale(v) : !isMale(v)));
  for (const w of want) { const v = pool.find(x => new RegExp(w, "i").test(x.name)); if (v) return v; }
  return pool[0] || VOICES[0] || null;
}
function coachSummary(skills) {
  const rows = Object.entries(skills);
  if (rows.length < 2) return "";
  const hi = rows.reduce((a, b) => (b[1] > a[1] ? b : a)), lo = rows.reduce((a, b) => (b[1] < a[1] ? b : a));
  if (hi[1] === lo[1]) return hi[1] >= 5 ? "Every part of this mission was solid. Try a harder difficulty or typing your answers." : "Review the notes below, then try again.";
  return `Your strongest moment was <b>${hi[0]}</b>. Your biggest chance to improve is <b>${lo[0]}</b>. Check the note for that step below.`;
}

// The stars on a results screen: they follow the score (3 for 100, so 50% is 1.5), earned ones pop in one after the other, a half star
// fills half, and the empty ones wait greyed out.
const starRow = stars => `<div class="bigstars ${stars >= 3 ? "full" : ""}" role="img" aria-label="${stars} of 3 stars">${[0, 1, 2].map(i => { const f = Math.max(0, Math.min(1, stars - i)); return `<span class="star ${f >= 1 ? "on" : f > 0 ? "on half" : ""}" style="--i:${i}">★</span>`; }).join("")}</div>`;
// Three small stars for the map and the history, each full, half or empty.
const starGlyphs = n => `<span class="gstars" role="img" aria-label="${n} of 3 stars">${[0, 1, 2].map(i => { const f = Math.max(0, Math.min(1, n - i)); return `<span class="gs ${f >= 1 ? "full" : f > 0 ? "half" : ""}">★</span>`; }).join("")}</span>`;

function finish(L, passed, xp, skills, summary, hidden, extra = {}) {
  stopAll();
  state.xp += xp;
  const pct = Math.round(Object.values(skills).reduce((a, b) => a + b, 0) / (Object.keys(skills).length * 5) * 100), stars = starsFor(pct);   // stars follow the score; passing is its own test
  const newItems = passed && !L.practice && !state.done[L.id] ? stopRewards(L.id) : [];   // first pass of a lesson unlocks its merch
  if (passed && !L.practice) { state.done[L.id] = true; state.stars[L.id] = Math.max(state.stars[L.id] || 0, stars); }
  const { log, sc, ...meta } = extra;
  const earned = Progress.record(state, { id: L.id, title: L.title, diff: state.diff, mode: L.qs ? "choice" : state.mode, pct, stars, won: passed, xp, skills, lesson: !!L.qs, ...meta }, TOTAL_STOPS());
  syncBadges().forEach(k => { if (!earned.includes(k)) earned.push(k); });
  hud();
  Sound.stop(); Sound.sfx(passed ? "win" : "lose"); if (earned.length) setTimeout(() => Sound.sfx("badge"), 750);
  const next = passed && ALL_STOPS()[ALL_STOPS().findIndex(x => x.id === L.id) + 1];
  const deliver = meta.cameraScores ? `<div class="card"><h3>Delivery (camera coach)</h3>${[["Eye contact", "eye"], ["Posture", "posture"], ["Presence", "presence"], ["Expression", "smile"]].map(([l, k]) => `<div class="row"><span>${l}</span><div class="bar"><i style="width:${meta.cameraScores[k]}%"></i></div><b>${meta.cameraScores[k]}%</b></div>`).join("")}<ul class="tips">${Cam.tips(meta.cameraScores).map(t => `<li>${t}</li>`).join("")}</ul><p class="note2">Nothing was recorded. Only these percentages are kept.</p></div>` : "";
  const transcript = log ? log.map(l => `${l.cname || sc.cust.name}: ${l.line.replace(/<[^>]+>/g, "")}\n${repName()}: ${l.text.replace(/<[^>]+>/g, "")}\n${l.cname || sc.cust.name}: ${l.reply}`).join("\n\n") : "";
  const steps = log ? `<div class="card"><h3>Step by step</h3>${log.map((l, j) => `<div class="stepnote ${l.k}"><b>${j + 1}. ${l.skill}</b> <span>${l.k === "best" ? "✓" : "✗"}</span><p>${l.typed ? esc(l.fb) : l.fb}</p>${l.better ? `<p class="better"><b>Try this instead:</b> <i>${esc(l.better)}</i></p>` : ""}</div>`).join("")}<p class="note2">${coachSummary(skills)}</p></div>
    <details class="card"><summary>Conversation transcript</summary><pre id="tx" class="tx">${esc(transcript)}</pre><button class="btn alt" id="cpy" type="button">Copy transcript</button></details>` : "";
  app.innerHTML = `<section class="view result sheet">
    <h1>${passed ? "Nice work, " + esc(repName()) + "!" : "Not this time"}</h1>
    <span class="chip">${D().label} · ${L.qs ? "Lesson" : state.mode === "type" ? "Typed" : "Pick an answer"} · ×${D().xp} XP</span>
    ${starRow(stars)}
    <p>${summary}</p>
    <div class="rewards"><span class="rw">+${xp} XP</span><span class="rw">🔥 ${state.streak}-day streak</span><span class="rw">${pct}% score</span></div>
    ${badgeMedals(earned)}
    ${rewardChips(newItems)}
    <div class="card"><h3>Scorecard</h3>${Object.entries(skills).map(([k, v]) => `<div class="row"><span>${k}</span><div class="bar"><i style="width:${v / 5 * 100}%"></i></div><b>${v}</b></div>`).join("")}</div>
    ${deliver}
    ${steps}
    ${hidden ? `<div class="learn"><b>Hidden objection revealed:</b> ${hidden}</div>` : ""}
    <div class="fact">💡 <b>Did you know?</b> ${FACTS[Math.floor(Math.random() * FACTS.length)]}</div>
    <p><button class="btn" id="cont">${next ? "Back to the map" : "Continue"}</button> ${!passed ? '<button class="btn alt" id="retry">Try again</button>' : ""}</p>
  </section>`;
  $("#cont").onclick = home;
  wireRewardChips();
  if (stars === 3 && passed) confetti(app.querySelector(".result"));
  if ($("#cpy")) $("#cpy").onclick = () => { navigator.clipboard?.writeText(transcript).then(() => { $("#cpy").textContent = "Copied"; }).catch(() => {}); };
  if ($("#retry")) $("#retry").onclick = () => (L.qs ? quiz(L) : play(L));
}
