"use strict";
// Sales-script missions, in the style of a recorded video interview.
//   1. The customer says a line and you are given a question.
//   2. You answer out loud (browser speech recognition) or type. The camera coach watches your delivery if it is on.
//   3. Your avatar plays your answer back in YOUR voice (the recording, kept only in memory), with its mouth moving with the
//      sound. If there is no recording (you typed, or the browser couldn't record), it reads your words aloud instead.
//   4. The customer replies to what you actually said, like a sales script.
//   5. Nothing is scored until the end. Each answer is scored out of 5: 4 points for what you said (the rubric in criteria.js)
//      and 1 for tone, judged for the situation from your words and your voice (tone.js). Scored by Coach.score in coach.js.
// Uses globals from index.html (state, app, $, esc, barScene, lessonTop, wireX, finish helpers) at call time.

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let voiceUsed = false;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const wordCount = t => (t.trim() ? t.trim().split(/\s+/).length : 0);
const lvlOf = (sc, view) => (view && view.level) || sc.level || 3;

// The Trust, Interest and bonus meters under the scene.
const need = (name, v, id, tip) => `<div class="need" title="${tip}"><span>${name}</span><div class="bar" role="img" aria-label="${name}. ${tip}"><i id="n${id}" style="width:${v}%"></i></div></div>`;

// A mission can open in a few different ways, so a replay doesn't start with the same line. Never the same one twice in a row.
function withOpener(sc) {
  const alts = OPENERS[sc.id];
  if (!alts) return sc;
  const all = [sc.steps[0].line, ...alts], last = (state.opener || {})[sc.id];
  const pool = all.map((_, n) => n).filter(n => n !== last), n = pool[Math.floor(Math.random() * pool.length)];
  state.opener = { ...(state.opener || {}), [sc.id]: n };
  return n === 0 ? sc : { ...sc, steps: [{ ...sc.steps[0], line: all[n] }, ...sc.steps.slice(1)] };
}

function play(sc) {
  const L = MLEVEL[sc.level || 3];
  sc = sc.practice ? sc : withOpener(sc);
  state.sc = sc; voiceUsed = false;
  if (state.voiceOff !== true) voiceOn = true;   // the avatars talk by default so you hear your answer repeated
  if (state.cam) { Cam.reset(); Cam.begin(); } else Cam.stop();
  Sound.start(sc.theme);
  hud();
  question(0, { trust: L.start[0], interest: L.start[1], price: L.start[2] }, []);
}

// ---------- the customer's face follows how it is going ----------
// delighted, pleased, (neutral), unsure or annoyed. data-x on the customer sets the brows, mouth and cheeks (CSS in index.html),
// and after each answer a small reaction pops up beside their head. The running mood decides the resting face.
const moodFace = M => { const a = (M.trust + M.interest) / 2; return a >= 68 ? "pleased" : a >= 40 ? "" : a >= 28 ? "unsure" : "annoyed"; };
const REACT_POP = { delighted: "😄", unsure: "🤔", annoyed: "😠" };
function setFace(x, pop) {
  const el = $("#pc"); if (!el) return;
  if (x) el.dataset.x = x; else delete el.dataset.x;
  const t = $("#rxpop");
  if (t && pop && REACT_POP[x]) { t.textContent = REACT_POP[x]; t.classList.remove("go"); void t.getBoundingClientRect(); t.classList.add("go"); }
}

// ---------- the avatar's voice, with the mouth moving to the words ----------
function voiceFor(who, custMale) {
  const repMale = state.avatar.gender === "Male", repV = pickVoice(repMale);
  return who === "rep" ? repV : pickVoice(custMale, custMale === repMale && repV ? repV.name : undefined);
}
// Speak the text in the avatar's voice. The mouth opens and closes word by word. When the browser reports where each word
// starts, the mouth follows it exactly. If it doesn't (some voices don't), or the voice is off, the mouth follows a timeline
// paced by the words, so it still moves with what is being said.
function lipTalk(who, raw, custMale, opt = {}) {
  const text = String(raw || "").replace(/<[^>]+>/g, "").trim();
  const el = $(who === "cust" ? "#pc" : "#pr");
  if (!el || !text) return Promise.resolve();
  const mouth = el.querySelector(".mouth"), rest = mouth.getAttribute("ry");
  el.classList.add("talking");
  const words = text.split(/\s+/);
  let alive = true, usedBoundary = false, closeT = null, fallbackT = null;
  const shape = w => Math.min(5.4, 1.8 + (w.match(/[aeiouy]/gi) || []).length * 0.9);
  const pulse = w => { if (!alive) return; mouth.setAttribute("ry", shape(w)); clearTimeout(closeT); closeT = setTimeout(() => { if (alive) mouth.setAttribute("ry", 1.2); }, Math.min(260, 70 + w.length * 28)); };
  const timeline = async () => { for (const w of words) { if (!alive) return; pulse(w); await sleep(Math.min(520, 150 + w.length * 55) + (/[,;:]$/.test(w) ? 160 : /[.?!]$/.test(w) ? 300 : 0)); } };
  const done = () => { alive = false; clearTimeout(closeT); clearTimeout(fallbackT); mouth.setAttribute("ry", rest); el.classList.remove("talking"); };
  const synth = window.speechSynthesis;
  if (!voiceOn || !synth) return timeline().then(done);
  // A customer speaks in their own voice and way of talking (voices.js). Their mood follows how the rep did: warm, flat or cold.
  const sc = state.sc, cv = who === "cust" && sc && sc.cust;
  const prof = cv ? Voices.profile(sc) : { pitch: 1, rate: 0.98 }, voice = cv ? Voices.voice(sc) : voiceFor(who, custMale);
  return Voices.say(text, voice, {
    pitch: prof.pitch, rate: prof.rate, mood: opt.mood || "flat", opener: !!(cv && opt.reply), pause: prof.rate > 1.05 ? .85 : 1,
    onWord: w => { usedBoundary = true; pulse(w); },
    onStart: () => { fallbackT = setTimeout(() => { if (!usedBoundary && alive) timeline(); }, 450); },
  }).then(done);
}

// Play back the rep's own recording. The avatar's mouth follows the loudness of the audio, so it opens and closes with the
// real sound of the voice. Everything stays in memory. Resolves when the audio ends.
async function playOwnVoice(blob) {
  const el = $("#pr");
  if (!el || !blob) return;
  const mouth = el.querySelector(".mouth"), rest = mouth.getAttribute("ry"), url = URL.createObjectURL(blob);
  const audio = new Audio(url); let ac = null, raf = 0;
  el.classList.add("talking");
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    ac = new AC(); const src = ac.createMediaElementSource(audio), an = ac.createAnalyser(); an.fftSize = 512;
    src.connect(an); an.connect(ac.destination);
    const data = new Uint8Array(an.fftSize);
    const loop = () => {
      an.getByteTimeDomainData(data);
      let sum = 0; for (let k = 0; k < data.length; k++) { const v = (data[k] - 128) / 128; sum += v * v; }
      mouth.setAttribute("ry", String(Math.min(5.6, 1.2 + Math.sqrt(sum / data.length) * 30)));
      raf = requestAnimationFrame(loop);
    };
    await audio.play(); loop();
    await new Promise(res => { audio.onended = res; audio.onerror = res; setTimeout(res, 125000); });
  } catch { /* playback blocked or unsupported: the caller already has the words, so just move on */ }
  cancelAnimationFrame(raf); mouth.setAttribute("ry", rest); el.classList.remove("talking");
  if (ac) ac.close();
  URL.revokeObjectURL(url);
}

// ---------- one question ----------
function question(i, M, log) {
  stopAll();
  const sc = state.sc, S = sc.steps[i], view = S.src || sc, cust = view.cust, key = S.ckey || sc.id + ":" + i, K = CRITERIA[key];
  const lvl = lvlOf(sc, view), L = MLEVEL[lvl], n = sc.steps.length, avg = (M.trust + M.interest) / 2;
  const boss = sc.boss, voiceOnly = !!(boss && boss.voice && SR);   // some bosses want your voice, not your typing
  let listening = false, recog = null, fatal = false, base = "", finals = "", elapsed = 0, tick = null, submitted = false, retakes = 1;
  let mic = null, recorder = null, chunks = [], spoke = false;   // the recording of your voice, kept only in memory
  const prof = TONE_FOR[view.id] || { name: "natural and polite", pace: [110, 175] };
  const tips = `<div class="tipbox"><b>A strong answer mentions:</b><ul class="checks2">${K.need.map(x => `<li>${x[1]}</li>`).join("")}</ul>
    <p class="tonecue">🎭 <b>Tone for this customer: ${prof.name}.</b> ${prof.cue || ""} <small>Aim for about ${prof.pace[0]} to ${prof.pace[1]} words a minute.</small></p></div>`;
  const camBlock = state.cam
    ? `<p class="camline" id="camLine" role="status">📷 ${esc(Cam.msg || "Starting camera…")}</p>`
    : `<p class="camnudge" id="camNudge">📷 <b>Camera coach is off.</b> Turn it on for a delivery score and +25% XP. <button class="btn alt" id="camEnable" type="button">Turn on camera</button></p>`;
  app.innerHTML = `<section class="view sheet mission">${lessonTop(i / n, true)}
    <div class="stage"><button class="vbtn" id="vo">${voiceOn ? "🔊 Voice on" : "🔇 Voice off"}</button>${barScene(avg, view)}</div>
    <div class="names"><span>${cust.name} · ${cust.role}</span><span>${esc(repName())} · Rep</span></div>
    ${camBlock}
    <div class="qhead"><span class="chip">Question ${i + 1} of ${n} · ${esc(S.skill)}</span><span class="chip lvlchip">Level ${lvl} · ${L.name}</span>${boss ? `<span class="chip bosschip">Boss battle · Tier ${boss.tier}</span>` : sc.rehearsal ? '<span class="chip">Practice run</span>' : ""}</div>
    <div class="bubble" id="bub" aria-live="polite">${S.line}</div>
    <div class="needs">${need("Trust", M.trust, "t", "How much they believe you and like you.")}${need("Interest", M.interest, "i", "How curious they are about Tequila Corrido.")}${need(cust.meter, M.price, "p", `A bonus meter for this customer: ${cust.meter.toLowerCase()}.`)}</div>
    <h2 class="qprompt">${S.q}</h2>
    ${L.tips && !boss ? tips : ""}
    ${boss ? `<p class="bossrule">⚔️ Boss rules: ${boss.pass.toFixed(1)} / 5 to win. A health claim or a pressure tactic loses instantly.${voiceOnly ? " Voice only: speak your answer." : ""}</p>` : ""}
    <div class="recpanel" id="recpanel">
      <div class="rtimer" aria-hidden="true"><i id="rbar"></i></div>
      <div class="rrow"><button class="btn recbtn" id="recbtn" type="button" ${SR ? "" : "hidden"}>🎙 Start recording</button><span id="rtime" class="rtime">${SR ? `0:00 of ${Math.floor(L.secs / 60)}:${String(L.secs % 60).padStart(2, "0")}` : ""}</span><span id="micMsg" class="note2" role="status"></span></div>
      <label class="sr" for="ans">Your answer</label>
      <textarea id="ans" rows="4" maxlength="1200" ${voiceOnly ? "readonly" : ""} placeholder="${voiceOnly ? "Voice only for this boss. Press Start recording and say your answer. Your words appear here." : SR ? "Press Start recording and say your answer out loud. Your words appear here, and you can fix or type them before you submit." : "Type what you would say out loud."}" autocomplete="off"></textarea>
      <div class="rrow"><button class="btn alt" id="redo" type="button">Start over (1 left)</button><button class="btn" id="submit" type="button" disabled>Submit answer</button><small id="cnt" class="note2"></small></div>
      <p class="note2">${SR ? "Speaking uses your browser's speech recognition (Chrome or Edge), which may send the audio to its speech service to turn it into words. Your voice is also recorded on your device so your avatar can play it back and your tone can be scored. That recording stays in memory and is never saved or uploaded. Prefer not to? Just type." : "Voice recording isn't available in this browser. Chrome or Edge have it. Typing works fine."} Nothing is scored until the end.</p>
    </div>
    <div id="fb" aria-live="polite"></div></section>`;
  wireX();
  const ans = $("#ans"), refresh = () => { const w = wordCount(ans.value); $("#submit").disabled = submitted || w < 3; $("#cnt").textContent = w ? w + " words" : ""; };
  ans.oninput = refresh;
  $("#vo").onclick = () => { voiceOn = !voiceOn; state.voiceOff = !voiceOn; Progress.save(state); $("#vo").textContent = voiceOn ? "🔊 Voice on" : "🔇 Voice off"; if (!voiceOn && window.speechSynthesis) { Voices.halt(); speechSynthesis.cancel(); } };
  if ($("#camEnable")) $("#camEnable").onclick = () => {
    state.cam = true; state.camPref = true; Progress.save(state); Cam.reset(); Cam.begin();
    $("#camNudge").outerHTML = `<p class="camline" id="camLine" role="status">📷 ${esc(Cam.msg || "Starting camera…")}</p>`;
  };

  const setMsg = t => { $("#micMsg").textContent = t; };
  const paintTime = () => { $("#rtime").textContent = `${Math.floor(elapsed / 60)}:${String(Math.floor(elapsed % 60)).padStart(2, "0")} of ${Math.floor(L.secs / 60)}:${String(L.secs % 60).padStart(2, "0")}`; $("#rbar").style.width = Math.min(100, elapsed / L.secs * 100) + "%"; };
  // One recorder for the whole answer. Stopping the mic pauses it, Record more resumes it, so there is one clean file.
  async function startRecorder() {
    if (recorder) { if (recorder.state === "paused") recorder.resume(); return; }
    try {
      if (!window.MediaRecorder || !navigator.mediaDevices?.getUserMedia) return;
      mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const type = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find(t => MediaRecorder.isTypeSupported(t));
      recorder = new MediaRecorder(mic, type ? { mimeType: type } : undefined); chunks = [];
      recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      recorder.start(250);
      if (!listening) recorder.pause();   // they stopped before the mic was ready
    } catch { recorder = null; }          // no recorder: the avatar will read your words instead
  }
  function dropRecording() {
    try { if (recorder && recorder.state !== "inactive") { recorder.ondataavailable = null; recorder.stop(); } } catch { /* already stopped */ }
    if (mic) mic.getTracks().forEach(t => t.stop());
    mic = null; recorder = null; chunks = []; spoke = false;
  }
  function finishRecording() {
    return new Promise(res => {
      if (!recorder) return res(null);
      const rc = recorder, done = () => { const blob = chunks.length ? new Blob(chunks, { type: rc.mimeType || "audio/webm" }) : null; if (mic) mic.getTracks().forEach(t => t.stop()); mic = null; recorder = null; res(blob); };
      if (rc.state === "inactive") return done();
      rc.onstop = done; try { rc.requestData(); } catch { /* fine */ } try { rc.stop(); } catch { done(); }
    });
  }
  function stopListening(why) {
    if (!listening && !recog) return;
    listening = false; clearInterval(tick); tick = null; Cam.sampling = false;
    try { if (recorder && recorder.state === "recording") recorder.pause(); } catch { /* fine */ }
    try { recog && recog.stop(); } catch { /* already stopped */ }
    recog = null;
    const b = $("#recbtn"); if (b) { b.classList.remove("on"); b.textContent = "🎙 Record more"; }
    if (why) setMsg(why);
    refresh();
  }
  function startListening() {
    if (!SR || listening || submitted) return;
    if (window.speechSynthesis) { Voices.halt(); speechSynthesis.cancel(); }   // never record the customer's voice
    base = ans.value.trim() ? ans.value.trim() + " " : ""; finals = ""; fatal = false; setMsg("");
    recog = new SR(); recog.lang = "en-US"; recog.continuous = true; recog.interimResults = true;
    recog.onresult = e => {
      let interim = "";
      for (let k = e.resultIndex; k < e.results.length; k++) { const r = e.results[k]; if (r.isFinal) finals += r[0].transcript + " "; else interim += r[0].transcript; }
      ans.value = (base + finals + interim).trim().slice(0, 1200); voiceUsed = true; spoke = true; refresh();
    };
    recog.onerror = e => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      fatal = true;
      stopListening(e.error === "not-allowed" || e.error === "service-not-allowed" ? "Microphone blocked. Allow it in the browser's address bar, or just type your answer." : e.error === "network" ? "Speech recognition needs an internet connection. You can type instead." : "Voice recording stopped (" + e.error + "). You can type instead.");
    };
    recog.onend = () => { if (listening && !fatal) { try { recog.start(); } catch { /* restarting too fast */ } } };   // browsers stop after a pause: keep going
    try { recog.start(); } catch { recog = null; return; }
    listening = true; Cam.sampling = true; startRecorder();
    const b = $("#recbtn"); b.classList.add("on"); b.textContent = "⏹ Stop recording";
    clearInterval(tick); tick = setInterval(() => { elapsed += .25; paintTime(); if (elapsed >= L.secs) stopListening("Time's up. Read your answer, fix anything, then submit."); }, 250);
    $("#recpanel").scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
  if ($("#recbtn")) $("#recbtn").onclick = () => (listening ? stopListening() : startListening());
  $("#redo").onclick = () => {
    if (retakes < 1 || submitted) return;
    retakes--; stopListening(); dropRecording(); ans.value = ""; elapsed = 0; paintTime(); refresh();
    $("#redo").textContent = "No starts over left"; $("#redo").disabled = true;
    if (SR) startListening();
  };
  $("#submit").onclick = submit;
  ans.onkeydown = e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && !$("#submit").disabled) { e.preventDefault(); submit(); } };

  async function submit() {
    if (submitted) return;
    const text = ans.value.trim();
    if (wordCount(text) < 3) return;
    submitted = true; stopListening(); Cam.sampling = false;
    ["#recbtn", "#redo", "#submit", "#ans"].forEach(s => { if ($(s)) $(s).disabled = true; });
    $("#fb").innerHTML = `<p class="note2">⏳ Listening back to your answer…</p>`;
    // your recording (if the browser could make one) is played back in your own voice and analysed for tone
    const blob = spoke && elapsed >= 1.5 ? await finishRecording() : (dropRecording(), null);
    const voice = blob ? await Tone.analyzeBlob(blob) : null;
    const res = Coach.score(key, text, lvl, { tone: prof, voice });
    // 1. the avatar plays your answer back, in your voice when it has the recording, with its mouth moving with it
    $("#fb").innerHTML = `<p class="note2">🔁 ${esc(repName())} plays your answer back…</p>`;
    $("#bub").innerHTML = `<b>${esc(repName())}:</b> ${esc(text)}`;
    if (blob) await playOwnVoice(blob); else await lipTalk("rep", text);
    // 2. the customer reacts to what you said. Nothing numeric is shown until the end.
    let tier = res.score >= 4 ? "best" : res.score >= 2.5 ? "mid" : "bad";
    if (tier === "best" && res.tone.pts < .6) tier = "mid";   // the right words said the wrong way do not win the customer over
    const idx = Number((key.split(":")[1]));
    const reply = S.reply[tier] || (tier === "mid" ? (MIDS[view.id] || [])[idx] : null) || S.reply[tier === "mid" ? "bad" : tier];
    const d = Math.round((res.score - 2.5) * 8);
    M.trust = clamp(M.trust + d); M.interest = clamp(M.interest + Math.round(d * .8)); M.price = clamp(M.price + Math.round(d * .5));
    $("#pl").setAttribute("class", "mood " + plumb((M.trust + M.interest) / 2));
    [M.trust, M.interest, M.price].forEach((v, k) => { $("#n" + "tip"[k]).style.width = v + "%"; });
    $("#bub").innerHTML = `<b>${cust.name}:</b> ${reply}`;
    setFace(tier === "best" ? "delighted" : tier === "bad" ? "annoyed" : "unsure", true);
    await lipTalk("cust", spoken(reply), cust.male, { reply: true, mood: tier === "best" ? "warm" : tier === "bad" ? "cold" : "flat" });
    log.push({ cname: cust.name, skill: S.skill, q: S.q, line: S.line, text, res, blob, reply, model: S.R[0].replace(/^"|"$/g, ""), mid: view.id, mission: view.title, ck: key });
    // a running list of moments to review. Scoring well on the same moment later clears it.
    state.mistakes = (state.mistakes || []).filter(m => m.ck !== key);
    if (res.score < 3.5) state.mistakes.unshift({ ck: key, mid: view.id, mission: view.title, skill: S.skill, line: S.line.replace(/<[^>]+>/g, ""), text, better: S.R[0].replace(/^"|"$/g, ""), missed: res.misses, flags: [...res.flags.map(f => f.msg), ...res.tone.notes.filter(x => !x.ok).map(x => x.msg)], score: res.score, date: Progress.today() });
    state.mistakes = state.mistakes.slice(0, 80); Progress.save(state);
    const last = i === n - 1;
    $("#fb").innerHTML = `<div class="feed best"><span>${last ? "That was the last question. Your scorecard has a score for every answer." : "Answer recorded. Your scores come at the end."}</span><button class="btn" id="nx" type="button">${last ? "See my results" : "Next question"}</button></div>`;
    $("#nx").onclick = () => (last ? missionResults(M, log) : question(i + 1, M, log));
    $("#nx").focus({ preventScroll: true });
    $("#fb").scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  refresh();
  setFace(moodFace(M));
  lipTalk("cust", spoken(S.line), cust.male);   // the customer says their line while you read the question
}

// ---------- the scorecard ----------
const band = s => (s >= 4 ? "hi" : s >= 2.5 ? "mid" : "lo");
const fmt = n => (Math.round(n * 10) / 10).toFixed(1);

function missionResults(M, log) {
  const sc = state.sc, lvl = sc.level || 3, L = MLEVEL[lvl], n = log.length;
  const total = log.reduce((a, l) => a + l.res.score, 0), avg = total / n;
  const boss = sc.boss, miss = !!boss && log.some(l => l.res.compliance);   // a health claim or a pressure tactic loses a boss fight
  const pass = boss ? boss.pass : sc.practice ? 2.8 : L.pass, won = avg >= pass && !miss;
  const stars = won ? (avg >= 4.5 ? 3 : avg >= 4 ? 2 : 1) : 0;
  const perfect = log.some(l => l.res.score >= 5);
  const cam = Cam.scores(); Cam.stop();
  const delivery = cam ? Math.round((cam.presence + cam.eye + cam.posture + cam.smile) / 4 / 20 * 10) / 10 : null;
  const xp = Math.round((avg * 14 + (won ? 25 : 0)) * (L.mult || 1) * (cam ? 1.25 : 1));
  const skills = {}, cnt = {};
  log.forEach(l => { skills[l.skill] = (skills[l.skill] || 0) + l.res.score; cnt[l.skill] = (cnt[l.skill] || 0) + 1; });
  Object.keys(skills).forEach(k => { skills[k] = Math.round(skills[k] / cnt[k] * 10) / 10; });
  stopAll(); state.xp += xp;
  // beating a regular level unlocks its merch. A boss win is handled by the tier-up (it also moves you up a tier).
  const counts = !sc.practice && !sc.rehearsal && !boss, firstTime = !state.done[sc.id];
  const newItems = counts && stars > 0 && firstTime ? (REWARDS[sc.id] || []) : [];
  if (counts && stars > 0) { state.done[sc.id] = true; state.stars[sc.id] = Math.max(state.stars[sc.id] || 0, stars); }
  const tierInfo = boss && won && !sc.rehearsal ? bossApplyWin({ boss, stop: sc, first: firstTime, stars, perfect: avg >= 4.8 }) : null;
  const pct = Math.round(avg / 5 * 100);
  const earned = Progress.record(state, { id: sc.id, title: sc.title, diff: `Level ${lvl}`, mode: voiceUsed ? "speak" : "type", pct, stars, won, xp, skills, lesson: false, voice: voiceUsed, camera: !!cam, cameraScores: cam, perfect }, TOTAL_STOPS());
  syncBadges().forEach(k => { if (!earned.includes(k)) earned.push(k); });
  hud();
  Sound.stop(); Sound.sfx(won ? "win" : "lose"); if (earned.length) setTimeout(() => Sound.sfx("badge"), 750);
  const renderResults = () => {
  const ranked = [...log].sort((a, b) => b.res.score - a.res.score), best = ranked[0], worst = ranked[ranked.length - 1];
    const left = boss ? bossTriesLeft(sc.id) : null, bossPass = boss ? (boss.pass).toFixed(1) : "";
    const summary = boss && !won ? (miss ? `<b>Boss battle lost: a compliance miss.</b> A health claim or a pressure tactic loses the fight no matter how good the rest was. Your average was ${fmt(avg)} out of 5.` : `${sc.lose} Boss battle lost: your average was <b>${fmt(avg)} out of 5</b> and you needed <b>${bossPass}</b>. Read what knocked points off below.`) + (left === Infinity ? "" : ` Tries left today: <b>${left}</b>.`)
      : boss ? `You beat the boss with <b>${fmt(avg)} out of 5</b> (needed ${bossPass}).`
      : sc.rehearsal ? `That was a practice run: <b>${fmt(avg)} out of 5</b>. It didn't use a try and it doesn't count. The real boss needs ${BOSS_BY[sc.id] ? BOSS_BY[sc.id].pass.toFixed(1) : ""}.`
      : won && avg < 3.8 ? `You got through this one, but not by much. Your average was <b>${fmt(avg)} out of 5</b>, and this ${L.name} mission needed ${fmt(pass)}. The answers that lost points are below.`
      : won ? `${sc.win} Your average was <b>${fmt(avg)} out of 5</b>, and this ${L.name} mission needed ${fmt(pass)}.`
      : `${sc.lose} Your average was <b>${fmt(avg)} out of 5</b>, and this ${L.name} mission needed ${fmt(pass)}. Read what knocked points off below, then try again.`;
    const toneAvg = log.reduce((a, l) => a + l.res.tone.pts, 0) / n;
    const toneLine = `<p class="note2">Your tone across this mission: <b>${fmt(toneAvg)} out of 1</b> per answer${toneAvg < .75 ? ". Tone is where you lost the most. Read the tone notes on each answer." : "."}</p>`;
    const focus = log.length > 1 && best.skill !== worst.skill ? `<p class="note2">Your strongest answer was <b>${esc(best.skill)}</b> (${fmt(best.res.score)}). Your biggest chance to improve is <b>${esc(worst.skill)}</b> (${fmt(worst.res.score)}).</p>` : "";
    const cards = log.map((l, j) => {
      const r = l.res, per = r.per;
      return `<div class="acard ${band(r.score)}">
        <div class="ahead"><b>${j + 1}. ${esc(l.skill)}</b><span class="score ${band(r.score)}">${fmt(r.score)} / 5</span></div>
        <div class="bar" aria-hidden="true"><i style="width:${r.score / 5 * 100}%"></i></div>
        ${boss && l.res.compliance ? '<p class="compmiss">⛔ Compliance miss: a health claim or a pressure tactic loses a boss battle.</p>' : ""}
        <p class="aq"><small>${esc(l.cname)} said:</small> ${esc(l.line.replace(/<[^>]+>/g, ""))}<br><small>You were asked:</small> ${esc(l.q)}</p>
        <details><summary>What you said</summary><p class="said">${esc(l.text)}</p></details>
        ${l.blob ? `<button class="btn alt playmine" type="button" data-i="${j}">▶ Hear yourself</button>` : ""}
        <p class="split"><span>What you said: <b>${fmt(r.content)} / 4</b></span><span>Tone: <b>${fmt(r.tone.pts)} / 1</b></span></p>
        ${r.hits.length ? `<ul class="hits">${r.hits.map(h => `<li class="ok">✓ ${esc(h)} <b>+${fmt(per)}</b></li>`).join("")}</ul>` : ""}
        ${r.misses.length ? `<ul class="misses">${r.misses.map(h => `<li class="no">✗ Missing: ${esc(h)} <b>−${fmt(per)}</b></li>`).join("")}</ul>` : ""}
        <ul class="tonelist"><li class="tonehead">🎭 Tone for this customer: ${esc(r.tone.name)}${r.tone.voiceUsed ? "" : " <small>(judged from your words, no voice recording)</small>"}</li>${r.tone.notes.map(x => `<li class="${x.ok ? "ok" : "no"}">${x.ok ? "✓" : "✗"} ${esc(x.msg)} ${x.ok ? "" : `<b>−${fmt(x.pts)}</b>`}</li>`).join("")}${r.tone.stats && r.tone.stats.wpm ? `<li class="tonestats">Pace ${r.tone.stats.wpm} words a minute · ${r.tone.stats.pauses} long pauses · volume ${r.tone.stats.db} dB</li>` : ""}</ul>
        ${r.flags.length ? `<ul class="flags">${r.flags.map(f => `<li>⚠ ${esc(f.msg)} ${f.pts ? `<b>−${fmt(f.pts)}</b>` : ""}</li>`).join("")}</ul>` : ""}
        ${r.score < 5 ? `<p class="better"><b>A stronger answer might sound like:</b> <i>${esc(l.model)}</i></p>` : `<p class="better"><b>Nothing to fix here.</b> That answer hit everything.</p>`}
      </div>`;
    }).join("");
    const deliver = cam
      ? `<div class="card"><h3>Delivery (camera coach)</h3><div class="ahead"><span>Overall delivery</span><span class="score ${band(delivery)}">${fmt(delivery)} / 5</span></div>${[["Eye contact", "eye"], ["Posture", "posture"], ["Presence", "presence"], ["Expression", "smile"]].map(([lab, k]) => `<div class="row"><span>${lab}</span><div class="bar"><i style="width:${cam[k]}%"></i></div><b>${cam[k]}%</b></div>`).join("")}<ul class="tipsl">${Cam.tips(cam).map(t => `<li>${t}</li>`).join("")}</ul><p class="note2">Measured on your device. The video was never recorded or uploaded.</p></div>`
      : `<div class="card nudge"><h3>Camera coach</h3><p>You didn't use the camera this time. With it on you get a delivery score out of 5 for eye contact, posture and smiling, plus 25% more XP. It's optional, but it's the closest thing here to a real meeting, so we highly recommend it.</p></div>`;
    const transcript = log.map(l => `${l.cname}: ${l.line.replace(/<[^>]+>/g, "")}\n${repName()}: ${l.text}\n${l.cname}: ${spoken(l.reply)}\n(Score ${fmt(l.res.score)} / 5: ${fmt(l.res.content)} content, ${fmt(l.res.tone.pts)} tone)`).join("\n\n");
    app.innerHTML = `<section class="view result sheet">
      <h1>${won ? "Nice work, " + esc(repName()) + "!" : "Not this time"}</h1>
      <span class="chip">${boss ? `Boss battle · Tier ${boss.tier}` : `Level ${lvl} · ${L.name}`} · ${esc(sc.title)}</span>
      <div class="bigscore ${band(avg)}" aria-label="Average score ${fmt(avg)} out of 5"><b>${fmt(avg)}</b><span>/ 5</span></div>
      <div class="bigstars" aria-label="${stars} of 3 stars">${"★".repeat(stars)}<span style="color:#bdb2a5">${"★".repeat(3 - stars)}</span></div>
      <p>${summary}</p>
      <div class="rewards"><span class="rw">+${xp} XP</span><span class="rw">🔥 ${state.streak}-day streak</span>${cam ? '<span class="rw">📷 +25% camera bonus</span>' : ""}</div>
      ${earned.length ? `<div class="rewards">${earned.map(k => `<span class="rw badge-new">🏅 New badge: ${BADGES[k][0]}</span>`).join("")}</div>` : ""}
      ${rewardChips(newItems)}
      ${focus}${toneLine}
      <h3 class="sechead">Your answers</h3>
      <p class="note2">Each answer is worth 5 points: <b>4 for what you said</b> and <b>1 for tone</b>, judged for the situation. You earn points for each thing you mentioned and lose points for what you missed, got wrong or said in the wrong tone.</p>
      ${cards}
      ${deliver}
      ${sc.hidden ? `<div class="learn"><b>What this customer really cared about:</b> ${sc.hidden}</div>` : ""}
      <details class="card"><summary>Conversation transcript</summary><pre id="tx" class="tx">${esc(transcript)}</pre><button class="btn alt" id="cpy" type="button">Copy transcript</button></details>
      <div class="fact">💡 <b>Did you know?</b> ${FACTS[Math.floor(Math.random() * FACTS.length)]}</div>
      <p><button class="btn" id="cont" type="button">Back to the map</button> ${won && !sc.rehearsal ? "" : `<button class="btn alt" id="retry" type="button">${sc.rehearsal ? "Back to the boss" : boss ? "Back to the boss" : "Try again"}</button>`}</p>
    </section>`;
    $("#cont").onclick = home;
    app.querySelectorAll(".playmine").forEach(b => b.onclick = async () => {
      const l = log[+b.dataset.i]; if (!l || !l.blob) return;
      b.disabled = true; b.textContent = "▶ Playing…";
      try { const url = URL.createObjectURL(l.blob), a = new Audio(url); a.onended = a.onerror = () => { URL.revokeObjectURL(url); b.disabled = false; b.textContent = "▶ Hear yourself"; }; await a.play(); } catch { b.disabled = false; b.textContent = "▶ Hear yourself"; }
    });
    if ($("#cpy")) $("#cpy").onclick = () => { navigator.clipboard?.writeText(transcript).then(() => { $("#cpy").textContent = "Copied"; }).catch(() => {}); };
    if ($("#retry")) $("#retry").onclick = () => (BOSS_BY[sc.id] && (boss || sc.rehearsal) ? bossIntro(ALL_STOPS().find(x => x.id === sc.id)) : play(sc.practice ? sc : SCENARIOS.find(m => m.id === sc.id)));
    wireRewardChips();
  window.scrollTo(0, 0);
  };
  if (tierInfo) {
    tierUp({ ...tierInfo, boss, stop: sc, avgText: `${fmt(avg)} / 5`, showScorecard: renderResults });
  } else renderResults();
}
