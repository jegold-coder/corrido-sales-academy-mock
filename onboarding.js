"use strict";
// First-run flow: age check (in index.html) -> character setup -> skippable tutorial -> map, where the required knowledge check must be done before any stop opens.
// Returning players skip straight to the map after the age check. The tutorial can be replayed from the dashboard.

function startFlow() {
  document.body.classList.add("onboarding");
  const veteran = state.history.length > 0;               // already played before this flow existed
  if (!state.avatarSaved) return creator(startFlow);
  if (!state.tutorialSeen && !veteran) return tutorial(() => { state.tutorialSeen = true; Progress.save(state); startFlow(); });
  // the knowledge check is no longer forced right after the tutorial: it waits on the map, which stays locked until it is done
  document.body.classList.remove("onboarding");
  home();
}

const TUT = [
  { title: () => `Welcome, ${esc(repName())}!`, icon: "🎶", body: () => `
      <p>You'll practice selling <b>Tequila Corrido</b> to bar owners, shop owners, a confused gas-station clerk and a very bad-tempered owner, before you meet anyone for real.</p>
      <ul class="tutlist"><li>📚 <b>Learn</b> the brand in quick lessons</li><li>🎤 <b>Practice</b> real sales conversations out loud</li><li>🎯 <b>Get scored</b> on what you said, out of 5</li></ul>` },
  { title: () => "Your map", icon: "🗺️", body: () => `
      <p>Follow the trail. Each stop unlocks when you pass the one before it. The glowing one is your next step.</p>
      <ul class="tutlist"><li>🎶 <b>Lessons</b> are short brand quizzes</li><li>🍸 <b>Missions</b> are customer conversations. They start <b>easy</b> and get <b>harder</b> as you go</li><li>⭐ Earn up to three stars on each stop</li><li>🎁 <b>Beat a level to unlock real Corrido merch</b> for your character</li><li>⚔️ <b>Boss battles</b> end each tier. Win to move up from Trainee toward Seasoned Seller</li></ul>` },
  { title: () => "How a mission works", icon: "🎤", body: () => `
      <ol class="tutlist"><li>The customer says something and you get a <b>question</b>.</li><li><b>Record your answer out loud</b>, like a recorded interview. You can type it instead.</li><li>Your <b>avatar plays your answer back in your own voice</b>, and the <b>customer replies</b> to what you actually said.</li><li>Nothing is scored until the end. Then you get a <b>score out of 5</b> for every answer.</li></ol>` },
  { title: () => "How you're scored", icon: "📊", body: () => `
      <p>Each answer is worth <b>5 points</b>: <b>4 for what you say</b> and <b>1 for tone</b>. You <b>earn points</b> for each key thing you mention and <b>lose points</b> for things you miss or get wrong, like hype, health claims or running down another brand.</p>
      <p>🎭 <b>Tone depends on the situation.</b> A nervous shop owner needs a slow, warm voice. A rude bar owner needs you calm and steady, not snapping and not grovelling. Your pace, volume and the life in your voice count, along with your words.</p>
      <p>The scorecard shows what you did right and what to improve, with a stronger answer to compare to.</p>
      <p>📷 The <b>camera coach</b> is optional but <b>highly recommended</b>. It scores your eye contact, posture and smile, and gives 25% more XP. Your browser will ask permission, and video never leaves your device.</p>` },
  { title: () => "Level up", icon: "🏅", body: () => `
      <p>Earn XP, keep a daily streak and collect badges. Your <b>Dashboard</b> shows your tier, your skills and where to improve.</p>
      <p><b>Required next step:</b> you'll land on the map, where a short <b>knowledge check</b> (ten quick questions) is waiting. You have to finish it before the first stop opens. It sets your starting point, so you can see how much you learn along the way.</p>` },
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
function onboardingResult(score, total, onDone) {
  app.innerHTML = `<section class="view sheet result"><h1>Starting point: ${score} / ${total}</h1>
    <p>${score >= 8 ? "You already know a lot about Corrido." : score >= 5 ? "A solid start. The lessons will fill in the rest." : "No worries. That's what the lessons are for."}</p>
    <p class="note2">You'll take the check again later from the Dashboard to see how much you improved.</p>
    <p><button class="btn" id="obgo" type="button">Start practicing</button></p></section>`;
  $("#obgo").onclick = onDone;
  $("#obgo").focus({ preventScroll: true });
}
