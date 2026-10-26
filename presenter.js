"use strict";
// Presenter mode: for showing the game to other people. It loads a sample player, so every page has something on it, and adds a small
// "Presenter" menu that jumps straight to any page. Your own progress and character are stashed in localStorage while it is on and put
// back when you leave, so a demo never costs anyone their real progress. Uses globals from the other scripts at call time.
// Start it from the sign-in screen (after the age check) or from Dashboard > Settings > Prototype tools.

const Presenter = (() => {
  const FLAG = "csa_presenter", STASH = "csa_presenter_stash", AVATAR = "csa_avatar";
  const RUNTIME = ["hearts", "avatar", "avatarSaved", "sc", "cam"];   // fields Progress.save never stores
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
    del: k => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
  };
  const parse = s => { try { return s ? JSON.parse(s) : null; } catch { return null; } };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const q = s => document.querySelector(s);
  const stop = id => ALL_STOPS().find(x => x.id === id);
  const scenario = id => SCENARIOS.find(x => x.id === id);

  // ---------- the sample player ----------
  // A rep part-way through the season, with a weak spot (price handling), a few mistakes to review and a before-and-after check. Where in the
  // season is random (see randomStop); the stops done are always the first ones in a row, so the next stop is open and everything after it is locked.
  const STARS = [3, 2.5, 3, 3, 3, 2.5];
  const DIPS = { "Price handling": 2.4, Closing: 3.1, "Objection handling": 3.4 };   // the lowest skills show on the radar and in Review
  const sampleAvatar = () => cleanAvatar({ ...DEFAULT_AVATAR, name: "Demo Rep", smile: "Warm smile", hairStyle: "Wavy", hair: 2 });
  function sampleProgress(through = "sam", full = false) {   // full: the whole season, every stop at three stars with strong skills
    const P = Progress.blank(), today = Progress.today(), ids = PATH.slice(0, PATH.indexOf(through) + 1);
    ids.forEach((id, i) => { P.done[id] = true; P.stars[id] = full ? 3 : STARS[i % STARS.length]; });
    ids.forEach((id, i) => {
      const sc = scenario(id), lesson = LESSONS.find(x => x.id === id);
      if (!sc && !lesson) return;   // the Brand Brain quiz boss has no mission history
      const skills = {}; let n = 0;
      if (sc) sc.steps.forEach((st, k) => { skills[st.skill] = (!full && DIPS[st.skill]) || +(4.2 + (k % 3) * 0.25).toFixed(2); });
      else skills[id === "brand" ? "Story" : "Product knowledge"] = 4.1;
      const vals = Object.values(skills), avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      n += 1;
      P.history.push({ id, title: sc ? sc.title : lesson.title, diff: sc ? `Level ${sc.level}` : "medium", mode: sc ? "typed" : "quiz", pct: Math.round(avg / 5 * 100), stars: P.stars[id], won: true, xp: sc ? 90 : 60, date: today, skills, camera: null });
    });
    P.xp = through === "sam" ? 520 : Math.max(full ? LEVELS[LEVELS.length - 1][1] : 60, P.history.reduce((a, h) => a + h.xp, 0));
    P.streak = full ? 14 : 5; P.lastDay = today; P.tutorialSeen = true;
    P.pre = { score: 5, total: 10, date: today, missed: ["Story", "Rules", "Selling", "Lineup"] };
    if (ids.includes("priya")) P.post = full ? { score: 10, total: 10, date: today, missed: [] } : { score: 8, total: 10, date: today, missed: ["Prices"] };
    P.badges = full ? Object.keys(BADGES) : ["first", "check", "flawless", "typed", "streak3"].filter(() => ids.includes("quiet"));
    P.proto = { unlockStops: false, unlockMerch: false, unlimitedTries: true };
    P.camPref = false; P.profile = { mode: "guest", email: "" };
    // one stop assigned by the manager, due in three days, so the map and the Assign page have something on them (not once the whole game is done)
    const upNext = PATH[PATH.indexOf(through) + 1];
    if (!full && upNext && typeof Assign !== "undefined") P.assignments = [{ id: "g-sample", stop: upNext, who: "class", due: Assign.inDays(3), note: "Aim for three stars.", by: "Manager", created: today, cls: "sample" }];
    if (typeof DEMO_TEAM !== "undefined") DEMO_TEAM.forEach(([name, xp, lv, b, s]) => { P.team[name] = { n: name, xp, lv, b, s, demo: true }; });
    // moments to review: a poor and a middling answer on the missions already played, scored by the real coach
    const sample = [];
    ids.filter(id => scenario(id)).forEach((id, i) => {
      const sc = scenario(id), k = Math.min(sc.steps.length - 1, 1 + (i % 2)), st = sc.steps[k], text = String((i % 2 ? st.H[0][0] : st.E[0][0]) || "").replace(/^"|"$/g, "");
      try {
        const res = Coach.score(`${id}:${k}`, text, sc.level, { tone: TONE_FOR[id], voice: null });
        if (res.score < 3.5) sample.push({ ck: `${id}:${k}`, mid: id, mission: sc.title, skill: st.skill, line: st.line.replace(/<[^>]+>/g, ""), text, better: st.R[0].replace(/^"|"$/g, ""), missed: res.misses, flags: [...res.flags.map(f => f.msg), ...res.tone.notes.filter(x => !x.ok).map(x => x.msg)], score: res.score, date: today });
      } catch { /* a mistake we can't score is simply left out */ }
    });
    P.mistakes = sample.slice(0, 4);
    return P;
  }

  // ---------- switching in and out, without losing anyone's real progress ----------
  const active = () => store.get(FLAG) === "1";
  function apply(progress, avatar) {
    Object.keys(state).forEach(k => { if (!RUNTIME.includes(k)) delete state[k]; });
    Object.assign(state, Progress.blank(), progress);
    state.hearts = 3; state.cam = state.camPref !== false;
    state.avatar = avatar ? cleanAvatar(avatar) : { ...DEFAULT_AVATAR }; state.avatarSaved = !!avatar;
    Progress.save(state);
    if (typeof Facts !== "undefined") Facts.apply();   // a player's own saved prices and wording go away with their progress, and come back with it
    if (avatar) store.set(AVATAR, JSON.stringify(state.avatar)); else store.del(AVATAR);
    if (typeof syncBadges === "function") syncBadges();
    if (typeof hud === "function") hud();
  }
  function stash() {
    if (!active()) {   // stash only once: the second time round the live data is the sample, and it would overwrite the real thing
      store.set(STASH, JSON.stringify({ progress: store.get(Progress.KEY), avatar: store.get(AVATAR) }));
      store.set(FLAG, "1");
    }
  }
  // Where a random sample stops: after at least the first four stops (so there is a mission, badges and a radar to show) and never after the
  // last one, so the game is part-way through and never finished. It never picks the stop it picked last, so pressing the button changes the map.
  let lastStop = null;
  const randomStop = () => {
    const pool = PATH.slice(3, PATH.length - 1).filter(id => id !== lastStop);
    return (lastStop = pool[Math.floor(Math.random() * pool.length)]);
  };
  function enter(through) {
    stash();
    apply(sampleProgress(through || randomStop()), active() && state.avatarSaved && state.avatar && state.avatar.name === "Demo Rep" ? state.avatar : sampleAvatar());
  }
  // A first-day player: nothing done, nothing earned, every stop locked behind the one before. The character stays, so a demo can start from the beginning.
  function freshProgress() {
    const P = Progress.blank();
    P.tutorialSeen = true; P.camPref = false; P.profile = { mode: "guest", email: "" };
    P.proto = { unlockStops: false, unlimitedTries: true };
    return P;
  }
  // Switch the player to some progress and keep the character as it is now (it may have been edited during the demo).
  function load(progress) { stash(); apply(progress, state.avatarSaved && state.avatar ? state.avatar : sampleAvatar()); }
  const reset = () => load(freshProgress());
  const finish = () => load(sampleProgress(PATH[PATH.length - 1], true));   // the whole game complete: every stop, all six bosses, every badge, the top tier and level
  const sample = () => load(sampleProgress(randomStop()));   // a different point in the season each time
  function restore() {
    const st = parse(store.get(STASH)) || {}, progress = parse(st.progress), avatar = parse(st.avatar);
    store.del(FLAG); store.del(STASH);
    apply(progress || {}, avatar);
    if (!progress) Progress.reset();   // a first-time visitor goes back to a first-time visit
  }

  // ---------- the jump menu ----------
  // A sample run plays a mission through its real screens with typed answers (R strong, H middling, E poor), so the results are the real ones.
  async function autoplay(id, kinds, { through, boss = false } = {}) {
    const sc = scenario(id), real = window.lipTalk;
    if (through) apply(sampleProgress(through), state.avatar);   // a first win only looks like one if the stop has not been won yet
    busy(true); window.lipTalk = () => sleep(120);               // a sample run doesn't speak
    const until = async (fn, ms = 8000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = fn(); if (v) return v; await sleep(60); } return null; };
    try {
      play(boss ? { ...sc, boss: BOSS_BY[id] } : sc);
      for (let k = 0; k < sc.steps.length; k++) {
        const box = await until(() => { const a = q("#ans"); return a && !a.disabled && a; });
        if (!box) throw new Error("the mission did not start");
        const kind = kinds[Math.min(k, kinds.length - 1)], st = sc.steps[k], pick = kind === "R" ? st.R[0] : kind === "H" ? st.H[0][0] : st.E[0][0];
        box.value = String(pick).replace(/^"|"$/g, ""); box.dispatchEvent(new Event("input", { bubbles: true }));
        q("#submit").click();
        const next = await until(() => q("#nx")); if (!next) throw new Error("the answer was not scored");
        next.click();
      }
    } catch (e) { if (typeof toast === "function") toast("The sample run stopped: " + e.message); }
    finally { window.lipTalk = real; busy(false); }
  }
  const tabs = [["Progress", "progress"], ["Badges", "badges"], ["Team", "team"], ["Review", "review"], ["Knowledge check", "check"], ["Settings", "settings"]];
  const mgr = [["Cohorts", "cohorts"], ["Coaching", "coaching"], ["Answers", "answers"], ["Assign", "assign"], ["Brand facts", "facts"], ["Invite", "invite"], ["Leaderboards", "leaderboards"], ["Grader", "grader"]];
  const MENU = () => [
    ["Start", [["Age check", () => location.reload()], ["Create your rep", () => creator(home)], ["Tutorial", () => tutorial(home)]]],
    ["The game", [
      ["Map", () => home()], ["Before you start", () => { home(); openDiff(() => play(scenario("quiet")), stop("quiet")); }], ["Lesson", () => quiz(stop("brand"))],
      ["Mission question", () => play(scenario("quiet"))], ["Surprise customer", () => play(surpriseScenario())], ["Results: a win", () => autoplay("quiet", "R", { through: "brandbrain" })],
      ["Results: not this time", () => autoplay("marco", "RHEHR", { through: "quiet" })], ["Boss intro", () => bossIntro(stop("priya"))],
      ["Brand Brain boss", () => bossIntro(stop("brandbrain"))], ["Boss lost", () => autoplay("mia", "E", { through: "sam", boss: true })],
      ["Tier Up", () => autoplay("priya", "R", { through: "quiet", boss: true })],
    ]],
    ["Dashboard and more", [...tabs.map(([l, t]) => ["Dashboard: " + l, () => dashboard(t)]), ["Character", () => creator(home)], ["Who is Tequila Corrido?", () => explorer()]]],
    ["Manager", mgr.map(([l, t]) => ["Manager: " + l, () => managerMode(t), true])],
    ["Avatar check", [["Shirts: arms and sleeves", () => AvatarCheck.show("sleeves")], ["Shirts: neck and collar", () => AvatarCheck.show("necks")], ["Shirts: bottom of the preview", () => AvatarCheck.show("bottoms")], ["Hair on every head shape", () => AvatarCheck.show("hair")]]],
  ];
  function busy(on) { const b = q("#prbtn"); if (b) { b.disabled = on; b.querySelector("small").textContent = on ? "playing a sample…" : "sample data"; } }
  function go(fn, manager) {
    return () => {
      q("#gate") && q("#gate").classList.add("hidden");
      document.querySelectorAll("dialog[open]").forEach(d => d.close());   // a dialog left open from the last jump would sit on top of this one
      document.body.classList.remove("onboarding"); document.body.classList.toggle("mgr", !!manager);
      close();
      try { const r = fn(); if (r && r.catch) r.catch(() => {}); } catch (e) { if (typeof toast === "function") toast("Couldn't open that page: " + e.message); }
    };
  }
  function close() { const p = q("#prpanel"), b = q("#prbtn"); if (p) p.hidden = true; if (b) b.setAttribute("aria-expanded", "false"); }
  function mount() {
    if (!q("#presenter")) {
      const d = document.createElement("div"); d.id = "presenter";
      d.innerHTML = '<button type="button" id="prbtn" aria-expanded="false" aria-controls="prpanel">🎤 Presenter <small>sample data</small></button><div id="prpanel" role="dialog" aria-label="Presenter menu" hidden></div>';
      document.body.appendChild(d);
      q("#prbtn").onclick = () => { const p = q("#prpanel"), open = p.hidden; if (open) render(); p.hidden = !open; q("#prbtn").setAttribute("aria-expanded", String(open)); };
      document.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
    }
  }
  function render() {
    const p = q("#prpanel"); p.innerHTML = "";
    MENU().forEach(([title, items]) => {
      const sec = document.createElement("div"); sec.className = "prsec"; sec.innerHTML = `<h4>${title}</h4>`;
      items.forEach(([label, fn, manager]) => { const b = document.createElement("button"); b.type = "button"; b.textContent = label; b.onclick = go(fn, manager); sec.appendChild(b); });
      p.appendChild(sec);
    });
    const foot = document.createElement("div"); foot.className = "prsec prfoot";
    foot.innerHTML = '<button type="button" id="prreset">Start over: nothing complete</button><button type="button" id="prsample">Random sample progress</button><button type="button" id="prfinish">Complete the game</button><button type="button" id="prleave">Leave presenter mode</button><small>Your own progress is safe and comes back when you leave.</small>';
    p.appendChild(foot);
    const jump = (fn, msg) => () => { fn(); close(); document.body.classList.remove("onboarding", "mgr"); home(); if (typeof toast === "function") toast(typeof msg === "function" ? msg() : msg); };
    q("#prreset").onclick = jump(reset, "Progress reset: nothing is complete.");
    q("#prsample").onclick = jump(sample, () => `Sample progress loaded: ${Object.keys(state.done).length} of ${PATH.length} stops done.`);
    q("#prfinish").onclick = jump(finish, "The whole game is complete: every stop, all six bosses, every badge.");
    q("#prleave").onclick = () => leave();
  }
  function unmount() { const d = q("#presenter"); if (d) d.remove(); }

  // ---------- the two ways in and out ----------
  function start() {
    enter();
    q("#gate") && q("#gate").classList.add("hidden");
    document.body.classList.remove("onboarding", "mgr");
    mount(); home();
    if (typeof toast === "function") toast("Presenter mode: sample progress is loaded. Your own is safe.");
  }
  function leave() {
    restore(); unmount();
    document.body.classList.remove("mgr");
    if (state.avatarSaved) home(); else startFlow();
    if (typeof toast === "function") toast("Back to your own progress.");
  }
  function boot() {
    const gate = q("#gate"), go = q("#presentGo");
    if (go) go.onclick = () => start();
    const ready = () => { if (active()) mount(); };   // the menu appears only after the age check, so it can never skip it
    if (!gate || gate.classList.contains("hidden")) ready();
    else new MutationObserver((_, obs) => { if (gate.classList.contains("hidden")) { obs.disconnect(); ready(); } }).observe(gate, { attributes: true, attributeFilter: ["class"] });
  }
  return { active, start, leave, enter, reset, finish, sample, restore, sampleProgress, freshProgress, randomStop, sampleAvatar, boot, MENU, FLAG, STASH };
})();
if (typeof document !== "undefined" && document.getElementById) Presenter.boot();
