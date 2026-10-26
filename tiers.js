"use strict";
// Tiers, boss battles and merch rewards: six tiers, a boss battle at the end of each, and real Corrido
// merch unlocked as you beat levels. Beating boss N moves you up to tier N+1. Nothing here needs a server: it is all worked out
// from state.done, so progress and unlocks follow the rep's saved progress on this device.

const TIERS = ["Trainee", "Associate Rep", "Field Rep", "Senior Rep", "Key Account Rep", "Seasoned Seller"];

// The six bosses, in order. pass is an average out of 5 (or a share of the quiz). voice means answers must be spoken when the
// browser can record. A health claim or a pressure tactic loses a boss battle instantly. The answer time limits are the same
// as the regular level, because each boss is one of the existing missions.
const BOSSES = [
  { id: "brandbrain", tier: 0, quiz: true, pass: .8, secs: 15, count: 10 },
  { id: "priya", tier: 1, pass: 3.5 },
  { id: "mia", tier: 2, pass: 3.5 },
  { id: "buyer", tier: 3, pass: 4.0, voice: true },
  { id: "dana", tier: 4, pass: 4.0, voice: true },
  { id: "mean", tier: 5, pass: 4.2, voice: true, strict: true },
];
const BOSS_BY = Object.fromEntries(BOSSES.map(b => [b.id, b]));

// A boss that is not one of the missions: ten timed brand questions.
const EXTRA_STOPS = {
  brandbrain: { id: "brandbrain", title: "Brand Brain", sub: "Ten timed questions", icon: "🧠", boss: true, level: 0 },
};

// What each stop unlocks. Every piece of merch that is not a starter is unlocked exactly once. Nearly half of it is free from
// the start (fifteen shirts and five hats), so there is a real choice in the creator before the first stop.
const STARTER_MERCH = [
  "Spirit Animal Tee", "Corrido Classic Tee (Maroon)", "Corrido Classic Tee (Black)", "Corrido Classic Tee (Navy)", "Corrido Classic Tee (Charcoal)", "Corrido Classic Tee (Dark Heather)",
  "Tequila Delivery Tee", "Más Tequila Tee", "Mexico Es Chingón Tee", "Worth the Shot Tee", "Tequila On My Mind Tee", "Corrido Logo Tee (Heather Navy)",
  "Mas Tequila Tee (White)", "In My Tequila Era Tee (Charcoal)", "Tequila Delivery 24/7 Oversized Tee (Washed Maroon)",
  "Save Water Cap", "Trucker Cap", "Cuffed Beanie", "Pickleball Trucker Cap", "Drinking Corduroy Cap",
];
const REWARDS = {
  brand: ["Corrido Classic Tee (Military Green)"],
  lineup: ["Legacy Tee"],
  brandbrain: ["Mas Tequila Tee (Ivory)", "Corrido Classic Tee (Dark Chocolate)"],
  quiet: ["Tequila Delivery 24/7 Oversized Tee (Washed Charcoal)"],
  priya: ["Corrido Logo Tee (Dark Grey Heather)", "In My Tequila Era Tee (Military Green)"],
  sam: ["Corrido Classic Tee (Graphite Heather)"],
  mia: ["Mas Tequila Tee (Khaki)", "Tequila Smuggler Tee"],
  buyer: ["Corrido Sport Polo (Black)", "Corrido Sport Polo (Navy)", "Corrido Sport Polo (White)"],
  gas: ["D.A.R.E. Oversized Tee"],
  dana: ["Corrido x adidas Polo", "Pickleball Raglan"],
  marco: ["Mas Tequila Tee (Bay)"],
  ray: ["Corrido Classic Tee (Brown Savana)"],
  stickup: ["Tequila Delivery 24/7 Oversized Tee (Light Washed Denim)"],
  comply: ["Tequila On My Mind Tri-Blend Tee"],
  hardno: ["Tequila Delivery 24/7 Oversized Tee (Vintage White)"],
  mean: ["Rebel Snapback"],
};
// The Military Green Era tee is the men's cut only (a woman has the Women's Tee, which is the Charcoal piece), so a female rep never sees it. At the
// stop that would have unlocked it she gets a different shirt instead, and the stop that shirt came from gives one piece fewer. Every piece a rep
// can wear is still unlocked exactly once.
const REWARDS_F = {
  priya: ["Corrido Logo Tee (Dark Grey Heather)", "Tequila Smuggler Tee"],
  mia: ["Mas Tequila Tee (Khaki)"],
};
const curGender = () => (typeof state !== "undefined" && state.avatar && state.avatar.gender) || "";
const rewardsFor = gender => (gender === "Female" ? { ...REWARDS, ...REWARDS_F } : REWARDS);
const stopRewards = stop => rewardsFor(curGender())[stop] || [];   // what passing this stop unlocks for the rep playing now
const merchStop = name => (Object.entries(rewardsFor(curGender())).find(([, items]) => items.includes(name)) || [])[0];
// How many pieces this rep can collect: everything cut for their gender (the Military Green Era tee is men's only), plus the hats.
const merchTotal = (gender = curGender()) => Object.values(OUTFITS).filter(o => !o.g || o.g === "u" || o.g === (gender === "Female" ? "f" : "m")).length + Object.keys(HATS).length;

// Prototype switches (Dashboard, Settings), all off by default: each stop stays locked until the one before it is done, merch has to be earned, and a boss gives
// three tries a day. Presenter mode turns unlimited tries on for its sample player, so a demo can retry a boss.
const PROTO_DEFAULTS = { unlockStops: false, unlockMerch: false, unlimitedTries: false };
const PROTO = k => ({ ...PROTO_DEFAULTS, ...((typeof state !== "undefined" && state.proto) || {}) })[k];

// "a Field Rep" / "an Associate Rep"
const aTier = i => `${/^[aeiou]/i.test(TIERS[i]) ? "an" : "a"} ${TIERS[i]}`;
const bossesBeaten = () => BOSSES.filter(b => state.done[b.id]).length;
const tierOf = () => Math.min(5, bossesBeaten());
const nextBoss = () => BOSSES.find(b => !state.done[b.id]) || null;

const merchEarned = () => {
  const s = new Set(STARTER_MERCH);
  Object.entries(rewardsFor(curGender())).forEach(([stop, items]) => { if (state.done[stop]) items.forEach(i => s.add(i)); });
  return s;
};
const merchUnlocked = name => PROTO("unlockMerch") || merchEarned().has(name);
// Where to find a locked piece: "Beat The Quiet Bar to unlock".
const merchHow = name => {
  const stop = merchStop(name), st = stop && (typeof ALL_STOPS === "function" ? ALL_STOPS().find(x => x.id === stop) : null);
  return st ? `Beat ${st.title} to unlock` : "Locked";
};

// Put a piece of merch on the rep and remember it.
function equipMerch(name) {
  const A = state.avatar;
  if (OUTFITS[name]) { A.outfit = name; } else if (HATS[name]) { A.hat = name; } else return false;
  try { localStorage.setItem("csa_avatar", JSON.stringify(A)); } catch { /* storage unavailable */ }
  return true;
}
// Wear the first new shirt and the first new hat from a reward, so a Tier Up shows off the new gear.
function wearFirst(items) {
  const shirt = items.find(i => OUTFITS[i]), hat = items.find(i => HATS[i]);
  if (shirt) equipMerch(shirt); if (hat) equipMerch(hat);
}
// The first stop of each tier: a tier begins right after the boss before it. ids is the map order.
const tierStarts = ids => TIERS.map((_, i) => (i === 0 ? 0 : ids.indexOf(BOSSES[i - 1].id) + 1));
// Stops finished since the map was last drawn, for the pop and the glowing road. seen is a Set, or null the first time.
const newlyDone = (seen, doneIds) => (seen ? doneIds.filter(id => !seen.has(id)) : []);
if (typeof module !== "undefined") module.exports = { TIERS, BOSSES, REWARDS, STARTER_MERCH };
