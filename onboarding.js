"use strict";
// First-run flow: age check (in index.html) -> create your rep (every option is there; it starts from a random look) -> a short tutorial of three cards,
// skippable -> the map, open from the start. Nothing opens by itself: the Next up bar shows where to begin and the rep can explore first.
// The knowledge check is optional (Dashboard > Knowledge check). The tutorial can be replayed from Dashboard > Settings > Help.
// Returning players skip straight to the map after the age check.

function startFlow() {
  document.body.classList.add("onboarding");
  const veteran = state.history.length > 0;               // already played before this flow existed
  if (!state.avatarSaved) return creator(startFlow, { fresh: true });
  if (!state.tutorialSeen && !veteran) return tutorial(() => { state.tutorialSeen = true; Progress.save(state); startFlow(); });
  document.body.classList.remove("onboarding");
  home();
}

const TUT = [
  { title: () => `Welcome, ${esc(repName())}!`, icon: "🎶", body: () => `
      <p>Learn Tequila Corrido, practice selling it out loud, and climb from Trainee to Seasoned Seller.</p>
      <ul class="tutlist"><li>📚 <b>Lessons</b> teach the brand in a few minutes</li><li>🎤 <b>Missions</b> are conversations with customers</li><li>🗺️ <b>Follow the map</b>, one stop at a time</li></ul>` },
  { title: () => "How a mission works", icon: "🎤", body: () => `
      <ol class="tutlist"><li>The customer says something and asks you a <b>question</b>.</li><li><b>Say your answer out loud</b>, or type it.</li><li>Your avatar plays it back and the customer <b>replies</b>.</li></ol>
      <p>Missions start easy and get harder as you go.</p>` },
  { title: () => "How you're scored", icon: "📊", body: () => `
      <p>Each answer is worth <b>5 points</b>: <b>4 for what you say</b> and <b>1 for tone</b>. You'll see a <b>stronger answer</b> to compare with.</p>
      <p>Beat a <b>boss</b> to move up a tier, earn XP and badges, and unlock merch for your character.</p>
      <p>📷 The <b>camera coach</b> is optional (25% more XP). Your video stays on your device.</p>` },
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
}

// Shown after the first knowledge check.
function onboardingResult(score, total, onDone, badges = []) {
  app.innerHTML = `<section class="view sheet result"><h1>Starting point: ${score} / ${total}</h1>
    <p>${score >= 8 ? "You already know a lot about Corrido." : score >= 5 ? "A solid start. The lessons will fill in the rest." : "No worries. That's what the lessons are for."}</p>
    ${badgeMedals(badges)}
    <p class="note2">You'll take the check again later from the Dashboard to see how much you improved.</p>
    <p><button class="btn" id="obgo" type="button">Start practicing</button></p></section>`;
  $("#obgo").onclick = onDone;
  $("#obgo").focus({ preventScroll: true });
}
