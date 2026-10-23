"use strict";
// First-run flow: age check (in index.html) -> character setup -> skippable tutorial -> knowledge check -> map.
// Returning players skip straight to the map after the age check. The tutorial can be replayed from the dashboard.

function startFlow() {
  document.body.classList.add("onboarding");
  const veteran = state.history.length > 0;               // already played before this flow existed
  if (!state.avatarSaved) return creator(startFlow);
  if (!state.tutorialSeen && !veteran) return tutorial(() => { state.tutorialSeen = true; Progress.save(state); startFlow(); });
  if (!state.pre && !veteran) return knowledgeCheck(startFlow);
  document.body.classList.remove("onboarding");
  home();
}

const TUT = [
  { title: () => `Welcome, ${esc(repName())}!`, icon: "🎶", body: () => `
      <p>You'll practice selling <b>Tequila Corrido</b> to bar owners, shop owners, distributors and more, before you meet them for real.</p>
      <ul class="tutlist"><li>📚 <b>Learn</b> the brand in quick lessons</li><li>💬 <b>Practice</b> real conversations with customers who each hide a worry</li><li>🎯 <b>Get coached</b> on every answer</li></ul>` },
  { title: () => "Your map", icon: "🗺️", body: () => `
      <p>Follow the trail. Each stop unlocks when you pass the one before it. The glowing one is your next step.</p>
      <ul class="tutlist"><li>🎶 <b>Lessons</b> are short brand quizzes</li><li>🍸 <b>Missions</b> are conversations with a customer</li><li>⭐ Earn up to three stars on each stop</li></ul>` },
  { title: () => "Inside a mission", icon: "🍸", demo: true, body: () => `
      <p>The customer speaks, and you answer. Watch the meters, because good answers raise <b>Trust</b> and <b>Interest</b>. A wrong answer costs a heart ❤️.</p>
      <div class="tutdemo" id="tutdemo"></div>` },
  { title: () => "Make it yours", icon: "🎚️", body: () => `
      <ul class="tutlist"><li><b>Easy:</b> hints, extra hearts, obvious wrong answers</li><li><b>Medium:</b> fair customer, believable wrong answers</li><li><b>Hard:</b> tough customer, no hints, a timer</li></ul>
      <p>On missions you can <b>pick an answer</b> or <b>type or speak</b> your own, and a free coach checks it. You can also turn on the optional <b>camera coach</b> for eye contact and posture. Your browser will ask permission, and video never leaves your device.</p>` },
  { title: () => "Level up", icon: "🏅", body: () => `
      <p>Earn XP, keep a daily streak and collect badges. Your <b>Dashboard</b> shows your skills and where to improve.</p>
      <p>Next is a short <b>knowledge check</b>: ten quick questions so you can see how much you learn along the way.</p>` },
];

function tutorial(onDone, i = 0) {
  const t = TUT[i], last = i === TUT.length - 1;
  app.innerHTML = `<section class="view sheet tut">
    <div class="tuttop"><span class="chip">Tutorial · ${i + 1} of ${TUT.length}</span><button class="btn alt" id="tskip" type="button">Skip tutorial</button></div>
    <div class="tuticon" aria-hidden="true">${t.icon}</div>
    <h1>${t.title()}</h1>${t.body()}
    <div class="dots" aria-hidden="true">${TUT.map((_, n) => `<i class="${n === i ? "on" : ""}"></i>`).join("")}</div>
    <div class="row2"><button class="btn alt" id="tback" type="button" ${i === 0 ? "disabled" : ""}>Back</button><button class="btn" id="tnext" type="button">${last ? "Continue" : "Next"}</button></div></section>`;
  $("#tskip").onclick = onDone;
  $("#tback").onclick = () => tutorial(onDone, i - 1);
  $("#tnext").onclick = () => (last ? onDone() : tutorial(onDone, i + 1));
  $("#tnext").focus({ preventScroll: true });
  if (t.demo) tutorialDemo();
}

// A tiny practice moment using Marco's opening, with no scoring.
function tutorialDemo() {
  const st = SCENARIOS[0].steps[0], box = $("#tutdemo");
  const opts = shuffle([[st.R[0], "best", st.R[1]], [st.E[0][0], "bad", st.E[0][1]], [st.H[0][0], "bad", st.H[0][1]]]);
  box.innerHTML = `<div class="bubble">${st.line}</div><div class="q">Try it: how do you open?</div>
    <div class="opts">${opts.map((o, n) => `<button class="opt" data-n="${n}">${o[0]}</button>`).join("")}</div><div id="tutfb" aria-live="polite"></div>`;
  box.querySelectorAll(".opt").forEach(b => b.onclick = () => {
    const o = opts[b.dataset.n];
    box.querySelectorAll(".opt").forEach(x => { x.disabled = true; if (opts[x.dataset.n][1] === "best") x.classList.add("best"); });
    b.classList.add(o[1]);
    $("#tutfb").innerHTML = `<div class="feed ${o[1]}"><span>${o[1] === "best" ? "Great move! " : "Not quite. "}${o[2]} <i>(Just practice: nothing is scored here.)</i></span></div>`;
  });
}

// Shown after the first knowledge check.
function onboardingResult(score, total, onDone) {
  app.innerHTML = `<section class="view sheet result"><h1>Starting point: ${score} / ${total}</h1>
    <p>${score >= 8 ? "You already know a lot about Corrido." : score >= 5 ? "A solid start. The lessons will fill in the rest." : "No worries. That's what the lessons are for."}</p>
    <p class="note2">You'll take the check again later from the Dashboard to see how much you improved.</p>
    <p><button class="btn" id="obgo" type="button">Start practicing</button></p></section>`;
  $("#obgo").onclick = onDone;
  $("#obgo").focus({ preventScroll: true });
}
