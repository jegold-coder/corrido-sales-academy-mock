"use strict";
// Practice a weak skill: a short mixed session built from the steps that train it.

// ---------- practice a weak skill ----------
// Builds a short mixed session from the steps that train one skill, taken from every mission. Each step keeps its own
// customer and scene. It is not a map stop, so it never unlocks anything, but it earns XP and feeds the skill scores.
function practiceScenario(skill) {
  const pool = [];
  SCENARIOS.forEach(m => m.steps.forEach((st, i) => pool.push({ ...st, src: m, ckey: m.id + ":" + i })));
  let picks = shuffle(pool.filter(p => p.skill === skill)).slice(0, 5);
  if (picks.length < 4) {   // a rare skill: top up with the next weakest ones
    for (const [k] of Progress.skillAverages(state)) { if (k === skill) continue; picks = picks.concat(shuffle(pool.filter(p => p.skill === k)).slice(0, 2)); if (picks.length >= 4) break; }
  }
  if (picks.length < 4) picks = picks.concat(shuffle(pool.filter(p => !picks.includes(p))).slice(0, 4 - picks.length));
  picks = picks.slice(0, 5);
  const first = picks[0].src;
  return { id: "practice", practice: true, level: 2, title: "Practice: " + skill, sub: "Mixed customers", icon: "🎯", theme: first.theme, cust: first.cust, hidden: "",
    win: `Nice practice. Each round you replay the moments that trip you up, and the skill scores on your Dashboard follow.`, lose: `Not this time. Practice rounds don't cost you anything, so try another.`, steps: picks };
}
function playPractice(skill) {
  if (document.body.classList.contains("onboarding")) return;
  openDiff(() => play(practiceScenario(skill)), { title: "Practice: " + skill, sub: "A few moments from different customers", practice: true, level: 2 });
}
