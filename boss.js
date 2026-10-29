"use strict";
// Boss battles: the screen before the fight, the timed Brand Brain quiz, the Tier Up celebration and the shareable tier card.
// Beating a boss moves the rep up a tier and unlocks merch. Uses globals from the page's own scripts (app.js onward) and tiers.js at call time.

const todayKey = () => Progress.today();
// Three tries a day on each boss (the prototype switch turns the limit off while the game is being tested).
function bossTriesLeft(id) {
  if (PROTO("unlimitedTries")) return Infinity;
  const t = (state.bossTries || {})[id];
  return t && t.d === todayKey() ? Math.max(0, 3 - t.n) : 3;
}
function useBossTry(id) {
  if (PROTO("unlimitedTries")) return;
  const t = (state.bossTries || {})[id], n = t && t.d === todayKey() ? t.n : 0;
  state.bossTries = { ...(state.bossTries || {}), [id]: { d: todayKey(), n: n + 1 } }; Progress.save(state);
}

// Small confetti burst for the Tier Up screen.
function confetti(host) {
  const colors = ["#e0a42f", "#2e8b9a", "#b5432a", "#3f8f4f", "#fdfaf5"];
  for (let i = 0; i < 46; i++) {
    const c = document.createElement("i"); c.className = "confetto";
    c.style.cssText = `left:${Math.random() * 100}%;background:${colors[i % colors.length]};animation-delay:${Math.random() * 1.2}s;animation-duration:${2.4 + Math.random() * 2}s;transform:rotate(${Math.random() * 360}deg)`;
    host.appendChild(c);
  }
}

// ---------- the screen before the fight ----------
function bossIntro(stop) {
  Sound.start("boss");   // the boss theme plays on this screen only: it stops when you go back, go anywhere else, or start the battle
  const boss = BOSS_BY[stop.id], tier = boss.tier, quiz = !!boss.quiz, sc = quiz ? null : SCENARIOS.find(m => m.id === stop.id);
  const next = tier >= 5 ? "complete the season" : `become ${aTier(tier + 1)}`, L = sc ? MLEVEL[sc.level] : null;
  const left = bossTriesLeft(stop.id), rewards = stopRewards(stop.id), reward = rewards.join(", ");
  const rules = quiz
    ? [`${boss.count} questions, ${boss.secs} seconds each`, `${D().hearts} hearts: a wrong answer or a timeout costs one, and losing them all ends the battle`, `Score ${Math.round(boss.pass * 100)}% or better to win`, "A question you run out of time on counts as wrong", `Win unlocks Tier ${tier + 1}${reward ? ". Also unlocks " + reward : ""}`]
    : [`Score ${boss.pass.toFixed(1)} / 5 or better across the conversation`,
       boss.voice ? "Voice only: say your answers out loud (typing is switched off if your browser can record)" : "Speak or type. Tone counts toward your score",
       boss.strict ? "Zero compliance misses. Any health claim or pressure tactic loses instantly" : "Any health claim or pressure tactic loses instantly",
       `Each answer is timed like the regular level: up to ${L.secs} seconds`,
       `Win unlocks Tier ${Math.min(5, tier + 1)}${reward ? ". Also unlocks " + reward : ""}`];
  const cust = sc ? sc.cust : { name: "Brand Brain", role: "Ten timed questions" };
  const portrait = sc ? `<svg viewBox="14 -2 92 122" aria-hidden="true">${person(custLook(sc))}</svg>` : `<div class="brainbig" aria-hidden="true">🧠</div>`;
  const dots = left === Infinity ? '<span class="trynote">Unlimited tries while the game is in prototype</span>' : [0, 1, 2].map(i => `<i class="trydot ${i < left ? "on" : ""}"></i>`).join("");
  app.innerHTML = `<section class="view bossintro">
    <div class="bi-top"><button class="x" id="bback" type="button" aria-label="Back to the map">←</button><span>TIER ${tier} BOSS</span><span></span></div>
    <h1 class="bi-title">Boss Battle</h1>
    <p class="bi-sub">Win to ${next}</p>
    <div class="vs">
      <div class="fighter"><div class="portrait gold"><svg viewBox="14 -2 92 122" aria-hidden="true">${person(repLook())}</svg></div><b>${esc(repName())}</b><small>${TIERS[tierOf()]}</small></div>
      <div class="vsmark" aria-hidden="true">VS</div>
      <div class="fighter"><div class="portrait red">${portrait}</div><b>${esc(cust.name)}</b><small>${esc(cust.role)}</small></div>
    </div>
    <ul class="rules">${rules.map(r => `<li>${r}</li>`).join("")}</ul>
    <p class="tries">${left === Infinity ? dots : `Tries left today ${dots}`}</p>
    ${left === 0 ? '<p class="note2 bad">You are out of tries for today. Practice first, then come back tomorrow.</p>' : ""}
    <button class="btn goldbtn" id="bstart" type="button" ${left === 0 ? "disabled" : ""}>Start the battle</button>
    <button class="linkbtn" id="bpractice" type="button">Practice first</button>
    <p class="note2 bi-foot">${state.done[stop.id] ? "You already beat this boss. Replaying doesn't change your tier." : "Practice runs don't use a try and don't count."}</p>
  </section>`;
  $("#bback").onclick = home;
  $("#bstart").onclick = () => startBoss(stop, boss, false);
  $("#bpractice").onclick = () => startBoss(stop, boss, true);
}

// A real fight uses one of today's tries. A practice run is the same conversation without the stakes.
function startBoss(stop, boss, rehearsal) {
  Sound.stop();   // entering the battle (or a practice run) ends the boss theme
  if (boss.quiz) { if (!rehearsal) useBossTry(stop.id); return brandBrain(stop, boss, rehearsal); }
  const sc = SCENARIOS.find(m => m.id === stop.id);
  const run = () => { if (!rehearsal) useBossTry(stop.id); play({ ...sc, boss: rehearsal ? null : boss, rehearsal }); };
  openDiff(run, { ...stop, title: stop.title + (rehearsal ? " (practice)" : ""), sub: rehearsal ? "A practice run. It doesn't use a try and doesn't count." : "Boss battle", noReward: true, level: sc.level, boss: !rehearsal });
}

// ---------- Brand Brain: ten timed brand questions ----------
// Stars follow the score out of 100, like a mission: 10 of 10 is 3 stars and 9 of 10 is 2.5. (They used to be left out, so every win showed one star.)
const quizStars = (right, total) => starsFor(Math.round(right / total * 100));
function brandBrain(stop, boss, rehearsal) {
  const picks = shuffle(BANK).slice(0, boss.count), total = picks.length, missed = [];
  let i = 0, right = 0, tm = null;
  state.hearts = D().hearts; hud(); Cam.stop();   // hearts here too, as in the lessons: a wrong answer or a timeout costs one, and none left ends the battle
  const finish = () => {
    clearInterval(tm); Sound.stop();
    const pct = right / total, won = pct >= boss.pass && state.hearts > 0, first = won && !rehearsal && !state.done[stop.id];
    const score = `${right} / ${total}`, stars = quizStars(right, total);
    const ctx = { boss, stop, won, rehearsal, score, pct, stars, missed, first, kind: "quiz", avgText: `${Math.round(pct * 100)}%` };
    bossOutcome(ctx);
  };
  const show = () => {
    if (i >= total) return finish();
    const it = picks[i], opts = shuffle([[it.a, 1], ...it.w.slice(0, 2).map(x => [x, 0])]);
    app.innerHTML = `<section class="view sheet bbquiz">
      <div class="lesson-top"><button class="x" id="exit" aria-label="Leave the boss battle">✕</button><div class="prog"><i style="width:${i / total * 100}%"></i></div><span class="hearts">${ic("heart")} ${state.hearts}</span><span class="chip">${rehearsal ? "Practice" : "Boss"} · ${i + 1} of ${total}</span></div>
      <div class="timer"><i id="bbtm"></i></div>
      <div class="q">${it.q}</div>
      <div class="opts">${opts.map((o, n) => `<button class="opt" data-n="${n}">${o[0]}</button>`).join("")}</div>
      <p class="note2">${boss.secs} seconds a question. Run out of time and it counts as wrong.</p></section>`;
    $("#exit").onclick = () => { clearInterval(tm); bossIntro(stop); };
    let t0 = Date.now(), done = false;
    const next = (ok, btn) => {
      if (done) return; done = true; clearInterval(tm);
      app.querySelectorAll(".opt").forEach(x => { x.disabled = true; if (opts[x.dataset.n][1]) x.classList.add("best"); });
      if (btn && !ok) btn.classList.add("bad");
      if (ok) right++; else { missed.push(it.topic); state.hearts = Math.max(0, state.hearts - 1); hud(); const hh = app.querySelector(".lesson-top .hearts"); if (hh) hh.innerHTML = `${ic("heart")} ${state.hearts}`; }
      Sound.sfx(ok ? "right" : "wrong");
      setTimeout(() => { i++; if (state.hearts === 0) finish(); else show(); }, 650);
    };
    app.querySelectorAll(".opt").forEach(b => b.onclick = () => next(opts[b.dataset.n][1] === 1, b));
    clearInterval(tm);
    tm = setInterval(() => {
      const f = 1 - (Date.now() - t0) / (boss.secs * 1000), el = $("#bbtm");
      if (!el) return clearInterval(tm);
      el.style.width = Math.max(0, f * 100) + "%";
      if (f <= 0) next(false, null);
    }, 100);
  };
  show();
}

// ---------- what happens after a boss fight ----------
// A first win is a tier up. A practice win just says so. (Mission bosses call bossApplyWin from mission.js.)
// Apply a first-time boss win: mark it done, add the XP bonus, wear the reward. Returns what the tier-up screen shows.
function bossApplyWin({ boss, stop, first, stars, perfect }) {
  const tierFrom = tierOf(), items = stopRewards(stop.id), bonus = 100 * (boss.tier + 3);
  if (first) { state.done[stop.id] = true; state.stars[stop.id] = Math.max(state.stars[stop.id] || 0, stars || 1); state.xp += bonus; wearFirst(items); Progress.save(state); hud(); }
  else if ((stars || 0) > (state.stars[stop.id] || 0)) { state.stars[stop.id] = stars; Progress.save(state); hud(); }   // a replay that scores higher raises the stars
  const badges = awardBadges(["boss-" + stop.id, ...(perfect ? ["bossperfect"] : [])]).concat(syncBadges());
  return { tierFrom, tierTo: tierOf(), items: first ? items : [], bonus: first ? bonus : 0, first, badges };
}
function bossOutcome(ctx) {
  const { boss, stop, won, rehearsal } = ctx;
  if (won && !rehearsal) return tierUp({ ...ctx, ...bossApplyWin({ boss, stop, first: ctx.first, stars: ctx.stars, perfect: ctx.pct >= 1 }) });
  return quizBossResult(ctx);
}

function quizBossResult(ctx) {
  const { boss, stop, won, rehearsal, score, missed } = ctx, left = bossTriesLeft(stop.id);
  app.innerHTML = `<section class="view result sheet">
    <h1>${won ? "Practice win!" : "Not this time"}</h1><span class="chip">Boss · Brand Brain${rehearsal ? " · practice" : ""}</span>
    <div class="bigscore ${won ? "hi" : "lo"}"><b>${score}</b><span>right</span></div>
    <p>${won ? "You'd have beaten the boss. This was a practice run, so nothing changed. Go for the real fight when you're ready." : `You needed ${Math.round(boss.pass * 100)}% or better.`} ${missed.length ? `Topics to review: <b>${[...new Set(missed)].join(", ")}</b>.` : ""}</p>
    <p>${left === Infinity ? "" : `<span class="note2">Tries left today: ${left}</span>`}</p>
    <p><button class="btn" id="again" type="button">${rehearsal ? "Back to the boss" : "Try again"}</button> <button class="btn alt" id="map" type="button">Back to the map</button></p></section>`;
  $("#again").onclick = () => bossIntro(stop); $("#map").onclick = home;
  Sound.sfx(won ? "win" : "defeat"); window.scrollTo(0, 0);
}

// ---------- Tier Up ----------
function tierUp(ctx) {
  const { boss, stop, items = [], bonus = 0, tierTo, first } = ctx, final = boss.tier >= 5, tierName = TIERS[tierTo];
  const rewardBlock = items.length
    ? `<div class="rwcard"><small>UNLOCKED</small><b>${items.length > 2 ? `${esc(items[0])} +${items.length - 1} more` : items.map(esc).join(", ")}</b></div>` : "";
  const badgeBlock = (ctx.badges || []).length
    ? `<div class="tu-badges">${ctx.badges.map(k => `<div class="tu-badge"><div class="bart">${badgeSVG(k, true)}</div><small>NEW BADGE${BADGE_ART[k].kind === "boss" ? " · TIER " + BADGE_ART[k].tier + " BOSS" : ""}</small><b>${esc(BADGES[k][0])}</b></div>`).join("")}</div>` : "";
  app.innerHTML = `<section class="view tierup" id="tierup">
    <p class="tu-kicker">BOSS BEATEN · ${esc(ctx.avgText)}</p>
    <h1 class="tu-title">${final ? "Season complete!" : "Tier up!"}</h1>
    <div class="tu-ring ${state.done.mean ? "legend" : ""}"><svg viewBox="0 -4 120 140" aria-hidden="true">${person(repLook())}</svg></div>
    <p class="tu-tier">TIER ${tierTo}</p><h2 class="tu-name">${tierName}</h2>
    <div class="tu-rewards">${rewardBlock}${bonus ? `<div class="rwcard"><small>REWARD</small><b>+${bonus} XP</b></div>` : `<div class="rwcard"><small>REPLAY</small><b>No new reward</b></div>`}</div>
    ${badgeBlock}
    ${final && first ? '<p class="tu-legend">Legend frame unlocked: your avatar now wears a gold frame.</p>' : ""}
    <button class="btn tealbtn" id="share" type="button">⤴ Share my tier card</button>
    ${ctx.showScorecard ? '<button class="linkbtn" id="score" type="button">See my scorecard</button>' : ""}
    <button class="linkbtn" id="season" type="button">Back to the season</button>
    <p class="note2 tu-foot">Tier cards show your name, avatar and tier only.</p></section>`;
  confetti($("#tierup"));
  $("#share").onclick = () => shareTierCard(tierTo);
  if ($("#score")) $("#score").onclick = ctx.showScorecard;
  $("#season").onclick = home;
  Sound.stop(); Sound.sfx(final ? "season" : "tierup"); setTimeout(() => { if ($("#tierup")) Sound.sfx("badge"); }, 2600); window.scrollTo(0, 0);
}

// A picture of the rep with their tier: name, avatar and tier only. Drawn on a canvas so it can be shared or saved.
async function shareTierCard(tier) {
  const btn = $("#share"); if (btn) { btn.disabled = true; btn.textContent = "Making your card…"; }
  try {
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 -4 120 140" width="565" height="660"><style>.xm path{display:none}</style>${person(repLook())}</svg>`;   // this picture has no page CSS, so hide the reaction mouths here
    // the merch photos are linked from the shop, so inline them for the picture
    for (const u of [...new Set([...svg.matchAll(/href="(https:[^"]+)"/g)].map(m => m[1]))]) {
      try { const b = await (await fetch(u, { mode: "cors" })).blob(), d = await new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); }); svg = svg.split(`href="${u}"`).join(`href="${d}"`); } catch { /* leave it out */ }
    }
    const img = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); });
    await document.fonts.load("64px Rye");
    const W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
    const bg = g.createRadialGradient(W / 2, 200, 60, W / 2, 600, 1100); bg.addColorStop(0, "#7a4d22"); bg.addColorStop(.6, "#33200f"); bg.addColorStop(1, "#1a0f06");
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.textAlign = "center"; g.fillStyle = "#e0a42f"; g.font = "700 30px Arimo, sans-serif"; g.fillText("TEQUILA CORRIDO · SALES ACADEMY", W / 2, 110);
    g.fillStyle = "#fff"; g.font = "88px Rye, serif"; g.fillText(tier >= 5 && state.done.mean ? "SEASON COMPLETE" : "TIER UP", W / 2, 230);
    g.fillStyle = "#fdfaf5"; g.beginPath(); g.arc(W / 2, 640, 330, 0, Math.PI * 2); g.fill();
    g.save(); g.beginPath(); g.arc(W / 2, 640, 330, 0, Math.PI * 2); g.clip(); g.drawImage(img, W / 2 - 282, 640 - 330, 565, 660); g.restore();
    g.lineWidth = 14; g.strokeStyle = "#e0a42f"; g.beginPath(); g.arc(W / 2, 640, 336, 0, Math.PI * 2); g.stroke();
    g.fillStyle = "#e0a42f"; g.font = "700 34px Arimo, sans-serif"; g.fillText(`TIER ${tier}`, W / 2, 1050);
    g.fillStyle = "#fff"; g.font = "78px Rye, serif"; g.fillText(TIERS[tier].toUpperCase(), W / 2, 1140);
    g.fillStyle = "#eadfcc"; g.font = "700 42px Arimo, sans-serif"; g.fillText(repName(), W / 2, 1220);
    const blob = await new Promise(r => c.toBlob(r, "image/png")), file = new File([blob], "my-tier-card.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "My Tequila Corrido tier", text: `I'm a ${TIERS[tier]} at the Tequila Corrido Sales Academy.` }); }
    else { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "my-tier-card.png"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast("Your tier card was saved as a picture."); }
  } catch (e) { if (e && e.name !== "AbortError") toast("Couldn't make the card on this browser."); }
  if (btn) { btn.disabled = false; btn.textContent = "⤴ Share my tier card"; }
}

// "Unlocked" chips with a button to wear the piece right away.
function rewardChips(items) {
  if (!items || !items.length) return "";
  return `<div class="card rewardcard"><h3>🎁 Merch unlocked</h3>${items.map(n => `<div class="rwrow"><span>${esc(n)}</span><button class="btn alt wearbtn" type="button" data-w="${esc(n)}">Wear it now</button></div>`).join("")}</div>`;
}
function wireRewardChips() {
  app.querySelectorAll(".wearbtn").forEach(b => b.onclick = () => { if (equipMerch(b.dataset.w)) { b.textContent = "Wearing it"; b.disabled = true; toast(`${b.dataset.w} is on your character.`); } });
}
