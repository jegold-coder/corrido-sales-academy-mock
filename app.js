"use strict";
// The page's basics: saved progress, toasts, the age gate, the difficulty settings, timers and shared helpers. The first of the page's own scripts: every later file uses these names.

const $ = (s, r = document) => r.querySelector(s);
const app = $("#app");
let state = { hearts: 3, ...Progress.load() };
state.cam = state.camPref !== false;   // the camera coach is on by default and the choice is remembered   // saved progress: xp, done, stars, history, badges, streak, diff, mode

const DIFF = {
  easy:   { label: "Easy",   hearts: 5, hints: 99, win: 50, timer: 0,  meh: 0,  start: [50, 40, 40], xp: 1,   desc: "5 hearts, unlimited hints, a friendly customer, one obvious wrong answer." },
  medium: { label: "Medium", hearts: 3, hints: 1,  win: 60, timer: 60, meh: 0,  start: [40, 30, 30], xp: 1.5, desc: "3 hearts, 1 hint per lesson, 60-second timer, a fair customer.", descType: "3 hearts, 1 hint per lesson, 2-minute timer (it pauses while you speak), a fair customer." },
  hard:   { label: "Hard",   hearts: 2, hints: 0,  win: 70, timer: 30, meh: -5, start: [30, 20, 20], xp: 2,   desc: "2 hearts, no hints, 30-second timer, a tough customer.", descType: "2 hearts, no hints, 75-second timer (it pauses while you speak), a tough customer." },
};
const D = () => DIFF[state.diff];
// Typing or speaking takes longer than tapping an answer, so typed missions get longer timers.

$("#yes").focus();
// A shop photo that is still on its way shows a soft shimmer in its own space, so nothing jumps when it arrives. Load and error don't bubble, so listen on the way down.
["load", "error"].forEach(ev => document.addEventListener(ev, e => { if (e.target.tagName === "IMG") e.target.classList.add("ld"); }, true));
const toast = msg => { let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); } t.textContent = msg; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 3200); };
// Move keyboard focus to the new screen whenever the view changes.
// The room's background music belongs to a mission scene, and the boss theme to the boss screen. Whatever way you leave (the X, the
// logo, the header, anything else), the moment the screen is no longer the one the music belongs to it stops.
let lastScreen = "";
new MutationObserver(() => {
  if (!app.contains(document.activeElement)) app.focus({ preventScroll: true });
  // a different kind of page (map, dashboard, brand, creator...) opens at the top, wherever the page before was scrolled to; redrawing the same
  // page (a dashboard tab, the map after a stop) keeps its place
  const screen = (app.firstElementChild || {}).className || "";
  if (screen !== lastScreen) { lastScreen = screen; window.scrollTo(0, 0); }
  if (Sound.theme && !app.querySelector(Sound.theme === "boss" ? ".bossintro" : "#pc")) Sound.stop();
  document.body.classList.toggle("inlesson", !!app.querySelector(".lesson-top .hearts"));   // the hearts in the footer count only in a lesson
  document.body.classList.toggle("playing", !!app.querySelector("#pc, .lesson-top"));      // a mission or lesson is on: the phone bottom bar steps aside
  paintTabs();
}).observe(app, { childList: true });
// and it goes quiet while the page is hidden (another tab or window) instead of playing on in the background
document.addEventListener("visibilitychange", () => { if (document.hidden) Sound.pause(); else Sound.resume(); });
// Page 2 of the journey: age check, then sign in. The options are "continue as guest", Sign in with Google (auth.js, once a client ID
// is set) and an email that is only saved on this device. Company sign-in is not live yet.
const enterGame = () => { $("#gate").classList.add("hidden"); startFlow(); };
$("#yes").onclick = () => {
  $("#agecard").innerHTML = '<p class="ageok">✓ 21+ confirmed</p>';
  $("#signin").classList.remove("off"); ["#guest", "#email", "#sendlink", "#presentGo"].forEach(x => { $(x).disabled = false; });
  const p = state.profile || {};
  if (p.email) { $("#email").value = p.email; $("#guest").textContent = "Continue as " + (p.mode === "google" && p.name ? p.name : p.email); }
  showGoogleButton();
  $("#guest").focus();
};
$("#no").onclick = () => $("#underMsg").classList.remove("hidden");
$("#guest").onclick = () => { const p = state.profile || {}; state.profile = p.mode === "google" ? p : { mode: "guest", email: p.email || "" }; Progress.save(state); enterGame(); };
$("#sendlink").onclick = () => {
  const em = $("#email").value.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { $("#emailnote").textContent = "That doesn't look like an email address. Try again, or continue as a guest."; $("#emailnote").classList.add("bad"); return; }
  state.profile = { mode: "guest", email: em }; Progress.save(state); enterGame(); setTimeout(() => toast("Welcome! Company sign-in isn't live yet, so you're a guest. Your email is saved on this device only."), 300);
};
$("#email").onkeydown = e => { if (e.key === "Enter") $("#sendlink").click(); };
$("#mgrLink").onclick = e => { e.preventDefault(); $("#gate").classList.add("hidden"); managerMode(); };
// while the age gate is up, the keyboard and screen readers cannot reach the page behind it
{
  const wall = () => { const up = !$("#gate").classList.contains("hidden"); ["header.top", "#app", ".foot", "#tabbar"].forEach(q => { $(q).inert = up; }); };
  wall(); new MutationObserver(wall).observe($("#gate"), { attributes: true, attributeFilter: ["class"] });
}

// ---------- helpers ----------
const clamp = v => Math.max(0, Math.min(100, v));
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
const plumb = m => (m >= 60 ? "" : m >= 35 ? "mid" : "low");
const hud = () => {
  $("#stXp").textContent = state.xp;
  $("#stStreak").textContent = state.streak || 0;
  { const lv = levelOf(state.xp), nx = LEVELS[lv + 1], lo = LEVELS[lv][1];
    $("#stLvl").textContent = LEVELS[lv][0]; $("#ftLvl").title = `Your rank: ${LEVELS[lv][0]}. Open your dashboard.`;   // XP is a rank (Rookie to Master Rep). "Tier" is for bosses and "Easy to Expert" is for difficulty
    $("#xpFill").style.width = (nx ? Math.round((state.xp - lo) / (nx[1] - lo) * 100) : 100) + "%"; }
    $("#stHearts").textContent = "❤️".repeat(state.hearts) + "🖤".repeat(Math.max(0, D().hearts - state.hearts));
};
let tmr = null, tmrS = null;
const stopTimer = () => { clearInterval(tmr); tmr = null; tmrS = null; };
function startTimer(sec, onEnd) {
  stopTimer();
  tmrS = { t0: Date.now(), paused: false, at: 0 };
  tmr = setInterval(() => {
    const el = $("#tm");
    if (!el) return stopTimer();
    if (tmrS.paused) return;
    const f = 1 - (Date.now() - tmrS.t0) / 1000 / sec;
    el.style.width = Math.max(0, f * 100) + "%";
    if (f <= 0) { stopTimer(); onEnd(); }
  }, 100);
}
// The timer waits while the rep is speaking into the mic.
const pauseTimer = () => { if (tmrS && !tmrS.paused) { tmrS.paused = true; tmrS.at = Date.now(); } };
const resumeTimer = () => { if (tmrS && tmrS.paused) { tmrS.t0 += Date.now() - tmrS.at; tmrS.paused = false; } };
function stopAll() { stopTimer(); if (window.speechSynthesis) { Voices.halt(); speechSynthesis.cancel(); } }
