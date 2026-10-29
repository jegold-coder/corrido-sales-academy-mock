"use strict";
// The home page: the tier bar, the map of stops, and the header of a lesson.

// ---------- home / map ----------
// Where the rep is on the six tiers, and which boss is next. Beating a boss is how you move up.
function tierBar() {
  const t = tierOf(), nb = nextBoss(), st = nb && ALL_STOPS().find(x => x.id === nb.id);
  return `<div class="tierbar go" data-go="progress" role="link" tabindex="0" title="Open your tier ladder" aria-label="Your tier. Open your progress.">
    <div class="tierrow">${TIERS.map((n, i) => `<div class="tierdot ${i < t ? "done" : i === t ? "now" : ""}" title="Tier ${i}: ${n}"><b>${i}</b></div>`).join("<i class=\"tl\"></i>")}</div>
    <p class="tiernow"><b>Tier ${t} · ${TIERS[t]}</b>${nb && st ? ` <span>Next boss: <b>${esc(st.title)}</b></span>` : ` <span>Season complete. You beat every boss.</span>`}</p></div>`;
}
// The knowledge check is required before the first stop: the map stays locked behind a "Step 1" card until the rep has finished it (state.pre is the
// saved result). A rep who already has finished stops is not locked out, and Presenter's "Unlock every stop" skips it. Return false to make it optional again.
const needsCheck = () => !state.pre && !Object.keys(state.done).length;

// The stops finished the last time the map was drawn, so a stop you just finished can pop and light the road to the next one.
let mapSeen = null;
// A boss's face for its stop on the map (the Brand Brain quiz has no face, so it keeps its icon).
const bossFace = n => { const sc = BOSS_BY[n.id] && SCENARIOS.find(s => s.id === n.id); return sc ? `<span class="bface" aria-hidden="true"><svg viewBox="20 -4 80 80">${person(custLook(sc))}</svg></span>` : null; };
const pieceThumb = nm => { const m = OUTFITS[nm] || HATS[nm], v = merchView(nm, state.avatar.gender); return m ? (v.img ? `<img src="${thumb(v.img)}" alt="" loading="lazy">` : poloIcon(m.base)) : ""; };

function home() {
  stopAll(); Cam.stop(); Sound.stop(); document.body.classList.remove("onboarding");
  state.hearts = D().hearts; hud();
  const nodes = ALL_STOPS();
  const nextStop = nodes.find(x => !state.done[x.id]), gated = needsCheck() && !PROTO("unlockStops");
  // The Tier 0 banner sits near the top of the map and the first stop hangs below it. TOP is that stop's height: 20 more while it is the current stop, so the START tag fits between the two.
  const GAP = 175, TOP = !gated && nodes[0] === nextStop ? 134 : 114, H = nodes.length * GAP + TOP - 60;
  const xs = nodes.map((_, i) => (i % 2 ? 295 : 105)), ys = nodes.map((_, i) => TOP + i * GAP);
  let roads = "", stops = "";
  const doneIds = nodes.filter(n => state.done[n.id]).map(n => n.id), fresh = newlyDone(mapSeen, doneIds), tNow = tierOf(), starts = tierStarts(nodes.map(n => n.id));
  mapSeen = new Set(doneIds);
  const freshBoss = fresh.map(id => BOSS_BY[id]).find(Boolean);
  for (let i = 0; i < nodes.length - 1; i++) {
    const d = `M${xs[i]} ${ys[i]} C${xs[i]} ${ys[i] + 95} ${xs[i + 1]} ${ys[i + 1] - 95} ${xs[i + 1]} ${ys[i + 1]}`;
    const c = state.done[nodes[i].id] ? "done" : "";
    roads += `<path class="rd-base ${c}" d="${d}"/><path class="rd-mid ${c}" d="${d}"/>${fresh.includes(nodes[i].id) ? `<path class="rd-glow" d="${d}"/>` : ""}`;
  }
  nodes.forEach((n, i) => {
    const done = state.done[n.id], open = PROTO("unlockStops") || (!gated && (i === 0 || done || state.done[nodes[i - 1].id])), cur = !gated && n === nodes.find(x => !state.done[x.id]);
    const pos = `left:${xs[i] / 4}%;top:${ys[i] / H * 100}%`, face = BOSS_BY[n.id] ? bossFace(n) : null;
    stops += `<div class="stop" style="${pos}">
      <button class="node ${BOSS_BY[n.id] ? "boss" : ""} ${done ? "done" : ""} ${cur ? "cur" : ""} ${open ? "" : "locked"} ${fresh.includes(n.id) ? "fresh" : ""}" data-id="${n.id}" data-prev="${i ? esc(nodes[i - 1].title) : ""}" ${open ? "" : 'aria-disabled="true"'} aria-label="${n.title}${done ? `, completed, ${state.stars[n.id] || 0} of 3 stars` : ""}${cur ? ", next stop" : ""}${open ? "" : " (locked)"}">
        ${cur ? '<span class="start">START</span>' : ""}${face ? `${face}${done ? '<span class="bchk">✓</span>' : open ? "" : '<span class="blk">🔒</span>'}` : done ? "✓" : open ? n.icon : "🔒"}
        ${done ? `<span class="stars">${starGlyphs(state.stars[n.id] || 0)}</span>` : ""}
      </button><div class="lab">${BOSS_BY[n.id] ? `<span class="bosstag">Boss · Tier ${BOSS_BY[n.id].tier}</span>` : ""}${n.title}<small>${open ? (BOSS_BY[n.id] ? `Beat it to become ${aTier(Math.min(5, BOSS_BY[n.id].tier + 1))}` : `${n.sub} · ${n.qs ? "lesson" : MLEVEL[n.level].name}`) : gated ? "Locked: take the knowledge check first" : `Locked: pass “${esc(nodes[i - 1].title)}” first`}</small></div></div>`;
  });
  const lv = levelOf(state.xp), lcur = LEVELS[lv][1], lnxt = LEVELS[lv + 1], lpct = lnxt ? Math.round((state.xp - lcur) / (lnxt[1] - lcur) * 100) : 100;
  const gotMerch = merchEarned().size, allMerch = merchTotal();
  const rewardStop = nextStop && nodes.slice(nodes.indexOf(nextStop)).find(n => stopRewards(n.id).length), rewardItems = rewardStop ? stopRewards(rewardStop.id) : [];
  const nb = nextBoss(), nbStop = nb && nodes.find(n => n.id === nb.id), nbIdx = nbStop ? nodes.indexOf(nbStop) : -1, nbSc = nbStop && SCENARIOS.find(x => x.id === nbStop.id);
  const nbOpen = nbStop && (PROTO("unlockStops") || (!gated && (nbIdx === 0 || state.done[nodes[nbIdx - 1].id])));
  const sideLeft = `<aside class="mside" aria-label="Your rep">
    <div class="sidecard repcard go" data-go="progress" role="link" tabindex="0" title="Open your progress"><div class="rav"><svg viewBox="26 -6 68 84" aria-hidden="true">${person(repLook())}</svg></div><b class="rn">${esc(repName())}</b><span class="rt">Tier ${tNow} · ${TIERS[tNow]}</span>
      <div class="bar" aria-hidden="true"><i style="width:${lpct}%"></i></div><small>Rank: ${LEVELS[lv][0]}${lnxt ? ` · ${lnxt[1] - state.xp} XP to ${lnxt[0]}` : ""}</small>
      <div class="sidestats"><span title="Day streak">🔥 ${state.streak || 0}</span><span title="XP">⭐ ${state.xp}</span><span title="Merch unlocked">👕 ${gotMerch}/${allMerch}</span></div><em class="goto">Your progress ›</em></div>
    ${rewardStop ? `<div class="sidecard go" data-go="creator" role="link" tabindex="0" title="Open the character creator"><h3>Next unlock</h3><div class="pieces">${rewardItems.slice(0, 3).map(nm => `<span class="piece" title="${esc(merchView(nm, state.avatar.gender).label)}">${pieceThumb(nm)}</span>`).join("")}</div><p>${esc(merchView(rewardItems[0], state.avatar.gender).label)}${rewardItems.length > 1 ? ` +${rewardItems.length - 1} more` : ""}</p><small>Beat ${esc(rewardStop.title)}</small><em class="goto">Your outfits ›</em></div>` : ""}</aside>`;
  const sideRight = `<aside class="mside" aria-label="Next boss and badges">
    ${nb && nbStop ? `<div class="sidecard bosscard"><h3>Next boss</h3><div class="bigface">${bossFace(nbStop) || '<span class="bface brain">🧠</span>'}</div><b class="rn">${nbSc ? esc(nbSc.cust.name) : "Brand Brain"}</b><span class="rt">${nbSc ? esc(nbSc.cust.role) : "Ten timed questions"}</span>
      <p>Tier ${nb.tier} boss. Win to become ${aTier(Math.min(5, nb.tier + 1))}.</p><small>${nb.quiz ? `${Math.round(nb.pass * 100)}% or better to win` : `${nb.pass.toFixed(1)} out of 5 on average to win${nb.voice ? ", voice only" : ""}`}</small>
      <button class="btn" id="sidefight" type="button" ${nbOpen ? "" : "disabled"}>${nbOpen ? "See the battle" : "Locked"}</button></div>`
      : '<div class="sidecard"><h3>Season complete</h3><p>You have beaten every boss.</p></div>'}
    <div class="sidecard go" data-go="badges" role="link" tabindex="0" title="Open your badges"><h3>Boss badges</h3>${bossBadgeRow()}<small>${state.badges.filter(k => k.startsWith("boss-")).length} of 6 earned</small><em class="goto">All badges ›</em></div></aside>`;
  // A tier banner hangs 120px above its first stop so the START tag fits between them. Tier 0 has no stop above it to bump into, so its banner sits 26px from the top of the map.
  const bandUp = (f, t) => (t === 0 ? TOP - 26 : 120);
  const bands = starts.map((f, t) => `<div class="tierband ${t < tNow ? "past" : t === tNow ? "now" : "next"} ${freshBoss && t === freshBoss.tier + 1 ? "new" : ""}" style="--x:${xs[f] / 4}%;top:${Math.max(ys[f] - bandUp(f, t), 22) / H * 100}%"><span>Tier ${t}<i class="tt"> · ${TIERS[t]}</i></span></div>`).join("");
  app.innerHTML = `<section class="view maphome">${sideLeft}<div class="mcenter">
    <h1 class="sr">Your training map</h1>
    <p class="lede">${gated ? `Welcome, ${esc(repName())}` : `Ready to sell, ${esc(repName())}?`}</p>
    ${Assign.strip()}
    ${gated ? `<div class="checkgate" role="alert"><div><b>Step 1: take the knowledge check (required)</b><p>The map is locked until you finish a short 10-question check. It takes about two minutes, and it sets your starting point so you can see how much you improve.</p></div><button class="btn" id="gocheck" type="button">Start the knowledge check</button></div>` : nextStop ? `<div class="nextup"><span>Next up: <b>${esc(nextStop.title)}</b> <small>${nextStop.qs ? "lesson" : "mission"} · about ${stopMinutes(nextStop)} min</small></span><button class="btn" id="nextgo" type="button">Start</button></div>` : '<div class="nextup"><span><b>Every stop is complete.</b> Replay any stop to beat your stars.</span></div>'}
    ${tierBar()}
    <div class="map" style="aspect-ratio:400/${H}"><svg class="roads" viewBox="0 0 400 ${H}" aria-hidden="true">${roads}</svg>${bands}${stops}</div></div>${sideRight}</section>`;
  const launch = st => (BOSS_BY[st.id] ? bossIntro(st) : openDiff(() => (st.qs ? quiz(st) : play(st)), st));
  app.querySelectorAll(".node").forEach(b => b.onclick = () => {
    if (b.getAttribute("aria-disabled")) {   // locked: say why in the toast (always in view, however far down the map you are) and nudge the circle
      toast(gated ? "Locked. Take the knowledge check above first to open the map." : `Locked. Pass “${b.dataset.prev}” first to unlock this stop.`);
      b.classList.remove("nope"); void b.offsetWidth; b.classList.add("nope"); b.addEventListener("animationend", () => b.classList.remove("nope"), { once: true });
      return;
    }
    launch(nodes.find(x => x.id === b.dataset.id));
  });
  if ($("#nextgo")) $("#nextgo").onclick = () => launch(nextStop);
  if ($("#gocheck")) $("#gocheck").onclick = () => knowledgeCheck(home);
  if ($("#sidefight")) $("#sidefight").onclick = () => launch(nbStop);
  Assign.wire(app);
  // the cards and the tier bar open the matching page: badges, progress (ladder) or the character creator
  app.querySelectorAll(".go[data-go]").forEach(el => {
    const go = () => (el.dataset.go === "creator" ? creator(home) : dashboard(el.dataset.go));
    el.onclick = go; el.onkeydown = e => { if (e.target === el && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); go(); } };
  });
  const popped = [...app.querySelectorAll(".node.fresh")].pop(), here = app.querySelector(".node.cur");   // the last stop finished since the map was drawn, and the next one to play
  if (popped) setTimeout(() => {   // a stop you just finished: bring it into view so you see it pop, with the next stop in view too when the window is tall enough
    const a = popped.getBoundingClientRect(), b = here ? here.getBoundingClientRect() : a;
    window.scrollTo({ top: Math.max(0, scrollY + (Math.min(a.top, b.top) + Math.max(a.bottom, b.bottom)) / 2 - innerHeight / 2), behavior: "smooth" });
  }, 200);
  else if (here && nodes.indexOf(nextStop) >= 2) setTimeout(() => here.scrollIntoView({ block: "center" }), 60);   // coming back to the map: open on the next stop, not at the top of a long road (the first two stops are in view already)
}

// ---------- lesson chrome (the quizzes live in lessons.js) ----------
function lessonTop(p, mission, title) {
  return `<div class="lesson-top">${title ? `<h1 class="sr">${esc(title)}</h1>` : ""}<button class="x" id="exit" aria-label="Exit">✕</button><div class="prog"><i style="width:${p * 100}%"></i></div>${mission ? "" : `<span class="hearts">${ic("heart")} ${state.hearts}</span><span class="chip">${D().label}</span>`}</div>`;
}
function wireX() { $("#exit").onclick = home; }
