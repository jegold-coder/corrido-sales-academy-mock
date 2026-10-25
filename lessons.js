"use strict";
// Brand lessons (Duolingo-style quizzes) and the before/after knowledge check.
// All facts come from ilovetequilacorrido.com. Anything the site does not say (aging, margins, awards) is left out.
// Each question: a = the right answer, w = three wrong answers. Easy shows 2 wrong, Medium 2 random wrong, Hard all 3.

const BANK = [
  // ----- Story and spirit
  { id: "name", topic: "Story", q: `What does the name "Corrido" come from?`, a: `A traditional Mexican ballad`, w: [`A type of agave plant`, `The founder's last name`, `A Mexican dance`], why: `A corrido is a traditional Mexican ballad. The brand borrows its music-and-rebellion spirit.` },
  { id: "promise", topic: "Story", q: `Which phrase is part of the brand's promise?`, a: `Only three ingredients, no fake flavors`, w: [`Aged in oak for twelve years`, `Triple distilled for smoothness`, `Organic and low calorie`], why: `"Only three ingredients, no fake flavors" is the heart of the additive-free message.` },
  { id: "distiller", topic: "Story", q: `What does the brand say about its master distiller?`, a: `It bears the stamp of one of the first female master distillers`, w: [`It was made by a retired bartender`, `A celebrity founder blends it`, `A single family has made it for 200 years`], why: `The site says the tequila carries the stamp of one of the first female master distillers.` },
  { id: "imagery", topic: "Story", q: `Which imagery shows up on the brand's site?`, a: `Vinyl records and piano`, w: [`Surfboards and palm trees`, `Race cars and trophies`, `Mountains and snowboards`], why: `Bottles, vinyl records and piano keys carry the music-meets-rebellion look.` },
  { id: "voice", topic: "Story", q: `How would you describe the brand's voice?`, a: `Bold, irreverent and a little rebellious`, w: [`Quiet and formal`, `Scientific and technical`, `Luxury and exclusive`], why: `The site talks about defiance and authenticity, with lines like "Let's stir up some trouble."` },
  { id: "endorse", topic: "Story", q: `What does the brand say it is NOT about?`, a: `Flashy endorsements`, w: [`Quality and craftsmanship`, `Music and rebellion`, `Mexico's tequila heartland`], why: `The site says it's not about flashy endorsements. Corrido is celebrity-free: the tequila does the talking.` },
  { id: "celebfree", topic: "Story", q: `Which best describes Corrido's approach to fame?`, a: `Celebrity-free: the tequila does the talking`, w: [`Backed by a famous actor`, `Endorsed by pro athletes`, `Founded by a pop star`], why: `Corrido is celebrity-free. Never claim celebrity fans or endorsements the brand doesn't have.` },
  { id: "contrast", topic: "Story", q: `Who does the brand set itself against?`, a: `Mass-produced, overpriced competitors`, w: [`Craft cocktail bars`, `Local farmers`, `Wine makers`], why: `The messaging contrasts Corrido with mass-produced, overpriced tequila.` },
  // ----- Lineup, notes and prices
  { id: "count", topic: "Lineup", q: `How many tequila expressions are on the site?`, a: `Four: Blanco, Overproof, Reposado, Añejo`, w: [`Two: Blanco and Añejo`, `Three: Blanco, Reposado, Añejo`, `Six, including a mezcal`], why: `The lineup is Blanco, Overproof, Reposado and Añejo.` },
  { id: "priciest", topic: "Prices", q: `Which expression is the priciest on the site?`, a: `Añejo ($89.99)`, w: [`Blanco ($44.99)`, `Reposado ($54.99)`, `Overproof ($56.99)`], why: `Blanco $44.99, Reposado $54.99, Overproof $56.99, Añejo $89.99.` },
  { id: "blancoPrice", topic: "Prices", q: `What does the Blanco cost on the site?`, a: `$44.99`, w: [`$54.99`, `$56.99`, `$89.99`], why: `The Blanco is $44.99.` },
  { id: "overproofPrice", topic: "Prices", q: `What does the Overproof cost on the site?`, a: `$56.99`, w: [`$44.99`, `$54.99`, `$89.99`], why: `The Overproof is $56.99.` },
  { id: "reposadoPrice", topic: "Prices", q: `What does the Reposado cost on the site?`, a: `$54.99`, w: [`$44.99`, `$56.99`, `$89.99`], why: `The Reposado is $54.99.` },
  { id: "noteBlanco", topic: "Lineup", q: `Which expression has citrus, fruity, floral agave notes and a slight crisp pepper?`, a: `Blanco`, w: [`Reposado`, `Añejo`, `Overproof`], why: `Blanco: citrus, fruity, floral agave and a slight crisp pepper.` },
  { id: "noteRepo", topic: "Lineup", q: `Which expression has vanilla, caramel, fruit and spice?`, a: `Reposado`, w: [`Blanco`, `Añejo`, `Overproof`], why: `Reposado: vanilla, caramel, fruit and spice.` },
  { id: "noteAnejo", topic: "Lineup", q: `Which expression has coffee, agave and dried fruit?`, a: `Añejo`, w: [`Blanco`, `Reposado`, `Overproof`], why: `Añejo: coffee, agave and dried fruit.` },
  { id: "noteOver", topic: "Lineup", q: `Which expression has cooked agave, citrus, tropical hints and subtle spices?`, a: `Overproof`, w: [`Blanco`, `Reposado`, `Añejo`], why: `Overproof: cooked agave, citrus, tropical hints and subtle spices.` },
  { id: "shipping", topic: "Lineup", q: `When does the site offer free shipping?`, a: `On a three-bottle purchase`, w: [`On every order`, `On orders over $200`, `Only for first-time buyers`], why: `Free shipping applies to a three-bottle purchase on the site. It's an online-store offer, not a wholesale deal.` },
  // ----- Rules of the road
  { id: "age", topic: "Rules", q: `What age is the brand for?`, a: `21 and over only`, w: [`18 and over`, `Anyone with a parent present`, `Any adult guest`], why: `The site has a 21+ age gate. Never encourage serving anyone under 21.` },
  { id: "safeClaim", topic: "Rules", q: `Which claim is safe to make about Corrido?`, a: `It's additive-free`, w: [`It prevents hangovers`, `It's organic`, `It's low calorie`], why: `Stick to the brand's own wording. Health, organic and calorie claims aren't made by the brand.` },
  { id: "teen", topic: "Rules", q: `A 19-year-old guest asks for a taste. What do you do?`, a: `Say no kindly and offer a non-alcoholic option`, w: [`Pour a tiny taste`, `Let her parents decide`, `Look the other way`], why: `Alcohol is for guests 21 and older. Offer an alternative instead.` },
  { id: "margin", topic: "Rules", q: `A buyer asks about your wholesale margin and you don't know it. Best move?`, a: `Say you'll confirm it in writing`, w: [`Estimate a number`, `Say margins are great`, `Change the subject`], why: `Never invent prices, margins or sales numbers. Commit to confirming them.` },
  { id: "bash", topic: "Rules", q: `What should you never do about a competitor's brand?`, a: `Run it down`, w: [`Respect it`, `Ask what the buyer likes about it`, `Invite a side-by-side taste`], why: `Respect the incumbent, name one real difference and invite a taste.` },
  { id: "leave", topic: "Rules", q: `The host asks you to leave a bottle for the manager. Best move?`, a: `Leave a card and offer a tasting with the manager there`, w: [`Leave the bottle with the staff`, `Leave it hidden in the back`, `Courier one over tonight`], why: `Leaving alcohol with staff can break rules. Set up a tasting with the decision-maker.` },
  // ----- Selling
  { id: "busy", topic: "Selling", q: `The bar is slammed and the owner is busy. How do you open?`, a: `Respect their time and offer to come back`, w: [`Start your full pitch`, `Raise your voice over the noise`, `Wait at the bar all night`], why: `Respecting a busy owner's time earns you the conversation.` },
  { id: "switch", topic: "Selling", q: `"Why should I switch brands?" What's the best answer?`, a: `One real difference, then invite them to taste`, w: [`"We're simply the best"`, `"The other brand is overrated"`, `"Everyone is switching"`], why: `Specific and true, with proof they can taste for themselves.` },
];
const Q = id => BANK.find(q => q.id === id);

// Two lessons, six questions each. They come first on the map, before any mission, so reps have the background they need.
// The compliance questions (21+, health claims, margins) stay in the knowledge-check pool and are practiced in the missions.
const LESSONS = [
  { id: "brand", title: "Meet Corrido", sub: "The brand and its story", icon: "🎶", qs: ["name", "promise", "distiller", "voice", "endorse", "contrast"] },
  { id: "lineup", title: "Know the Lineup", sub: "Tasting notes and prices", icon: "🍾", qs: ["noteBlanco", "noteRepo", "noteAnejo", "noteOver", "priciest", "blancoPrice"] },
];
// Path order on the map: lessons are mixed in between missions.
// Both lessons come first, then the Brand Brain boss, then missions from easiest to hardest (see LEVEL_OF in scenarios.js).
// Boss battles are at the end of each tier: Brand Brain, Priya, Mia, Rafael, Dana and the Bad-Tempered Owner (see BOSSES in tiers.js).
const PATH = ["brand", "lineup", "brandbrain", "quiet", "priya", "sam", "mia", "gas", "buyer", "marco", "ray", "stickup", "dana", "comply", "hardno", "mean"];

// Answer choices for a question at the current difficulty (state.diff): 3 options on Easy and Medium, 4 on Hard.
function choicesFor(q, diff) {
  const wrong = diff === "hard" ? q.w : diff === "easy" ? q.w.slice(0, 2) : shuffle(q.w).slice(0, 2);
  return shuffle([[q.a, 1], ...wrong.map(x => [x, 0])]);
}

function quiz(L, i = 0, right = 0, missed = []) {
  if (i === 0 && right === 0) { state.hearts = D().hearts; hud(); Cam.stop(); Sound.stop(); }
  const items = L.qs.map(Q);
  if (i >= items.length || state.hearts === 0) {
    const pass = state.hearts > 0;
    const topics = {};
    items.forEach(q => { topics[q.topic] = topics[q.topic] || [0, 0]; topics[q.topic][1]++; if (!missed.includes(q.id)) topics[q.topic][0]++; });
    const skills = Object.fromEntries(Object.entries(topics).map(([k, v]) => [k, Math.round(v[0] / v[1] * 5 * 10) / 10]));
    const wrong = items.length - right;
    return finish(L, pass, pass ? 20 + right * 5 : 0, skills,
      pass ? `Lesson complete: ${right} of ${items.length} right.` : "You ran out of hearts. Review the cheat sheet below and try again.", "");
  }
  const it = items[i], opts = choicesFor(it, state.diff);
  let done = false;
  app.innerHTML = `<section class="view sheet">${lessonTop(i / items.length, false, L.title)}
    <div class="q">${it.q}</div>
    ${D().timer ? '<div class="timer" aria-label="Time left"><i id="tm"></i></div>' : ""}
    <div class="opts">${opts.map((o, n) => `<button class="opt" data-n="${n}">${o[0]}</button>`).join("")}</div><div id="fb" aria-live="polite"></div></section>`;
  wireX();
  const answer = (ok, btn) => {
    if (done) return; done = true; stopTimer(); Sound.sfx(ok ? "right" : "wrong");
    app.querySelectorAll(".opt").forEach(x => { x.disabled = true; if (opts[x.dataset.n][1]) x.classList.add("best"); });
    if (!ok) { if (btn) btn.classList.add("bad"); state.hearts = Math.max(0, state.hearts - 1); hud(); }
    $("#fb").innerHTML = `<div class="feed ${ok ? "best" : "bad"}"><span>${ok ? "Correct! " : btn ? "Not quite. " : "Time's up. "}${it.why}</span><button class="btn" id="nx">Continue</button></div>`;
    $("#nx").onclick = () => quiz(L, i + 1, right + (ok ? 1 : 0), ok ? missed : [...missed, it.id]);
    $("#nx").focus({ preventScroll: true });
  };
  app.querySelectorAll(".opt").forEach(b => b.onclick = () => answer(opts[b.dataset.n][1] === 1, b));
  if (D().timer) startTimer(D().timer, () => answer(false, null));
}

// ----- before / after knowledge check (10 random questions, no hearts) -----
// ob = a callback when this is the first-run check. During first-run a question can be skipped for now (it comes back
// at the end), but the check has to be finished before the map opens.
function knowledgeCheck(ob = null) {
  const picks = shuffle(BANK).slice(0, 10), queue = [...picks], total = picks.length, missed = [];
  let score = 0;
  const show = () => {
    if (!queue.length) {
      const kind = state.pre ? "post" : "pre", rec = { score, total, date: Progress.today(), missed: [...new Set(missed)] };
      state[kind] = rec; Progress.save(state);
      return ob ? onboardingResult(score, total, ob) : dashboard("check");
    }
    const it = queue[0], opts = shuffle([[it.a, 1], ...it.w.slice(0, 2).map(x => [x, 0])]), canSkip = ob && queue.length > 1;
    app.innerHTML = `<section class="view sheet"><div class="lesson-top"><h1 class="sr">Knowledge check</h1>${ob ? "" : '<button class="x" id="exit" aria-label="Exit">✕</button>'}<div class="prog"><i style="width:${(total - queue.length) / total * 100}%"></i></div><span class="chip">Knowledge check · ${total - queue.length} of ${total} done</span></div>
      <div class="q">${it.q}</div><div class="opts">${opts.map((o, n) => `<button class="opt" data-n="${n}">${o[0]}</button>`).join("")}</div>
      ${ob ? `<p class="note2">${canSkip ? "Not sure? You can skip a question for now, and it comes back at the end. " : ""}You need to finish the check to open the map.</p>` : ""}
      ${canSkip ? '<button class="btn alt" id="skipq" type="button">Skip for now</button>' : ""}<div id="fb" aria-live="polite"></div></section>`;
    if (!ob) $("#exit").onclick = () => dashboard("check");
    if (canSkip) $("#skipq").onclick = () => { queue.push(queue.shift()); show(); };
    app.querySelectorAll(".opt").forEach(b => b.onclick = () => {
      const ok = opts[b.dataset.n][1] === 1; Sound.sfx(ok ? "right" : "wrong");
      app.querySelectorAll(".opt").forEach(x => { x.disabled = true; if (opts[x.dataset.n][1]) x.classList.add("best"); });
      if (canSkip) $("#skipq").disabled = true;
      if (!ok) b.classList.add("bad");
      $("#fb").innerHTML = `<div class="feed ${ok ? "best" : "bad"}"><span>${ok ? "Correct! " : "Not quite. "}${it.why}</span><button class="btn" id="nx">Continue</button></div>`;
      $("#nx").onclick = () => { queue.shift(); if (ok) score++; else missed.push(it.topic); show(); };
      $("#nx").focus({ preventScroll: true });
    });
  };
  show();
}

function dashCheck(el) {
  const pre = state.pre, post = state.post;
  const fmt = r => `${r.score} / ${r.total} <small>(${r.date})</small>`;
  const delta = pre && post ? post.score - pre.score : null;
  const finished = ALL_STOPS().filter(x => state.done[x.id]).length;
  el.innerHTML = `<p class="note2">Ten quick questions from across the lessons. Take it once before you start and once after a few missions to see what you learned.</p>
    <div class="stats3"><div><b>${pre ? fmt(pre) : "–"}</b><span>before</span></div><div><b>${post ? fmt(post) : "–"}</b><span>after</span></div><div><b>${delta == null ? "–" : (delta >= 0 ? "+" : "") + delta}</b><span>change</span></div></div>
    ${post && post.missed.length ? `<p class="learn">Topics to review: <b>${post.missed.join(", ")}</b>.</p>` : pre && pre.missed.length && !post ? `<p class="learn">Weak spots on your first try: <b>${pre.missed.join(", ")}</b>.</p>` : ""}
    <button class="btn" id="takecheck" type="button">${!pre ? "Take the check (before)" : post ? "Retake the check" : finished < 3 ? "Take it after a few more stops" : "Take the check (after)"}</button>`;
  $("#takecheck").onclick = () => { if (post) { state.post = null; } knowledgeCheck(); };
}
