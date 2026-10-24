"use strict";
// Badge artwork and the boss badges. Every boss has a medal with that boss's face on it, in a metal that gets richer as the
// tiers go up (bronze, silver, gold, emerald, ruby, diamond), with a ribbon and a plate naming the tier. The other badges are
// coins with an emblem. Locked badges are shown as dark silhouettes, so you can see what is waiting for you.

const METALS = {
  bronze: ["#f6cda3", "#c47f43", "#6e3a14"], silver: ["#fafbfc", "#b4bec6", "#5f6a74"], gold: ["#fff0b3", "#e0a42f", "#7d4f06"],
  emerald: ["#a8f0c8", "#2eaa6e", "#0f4f31"], ruby: ["#ffc2c2", "#d23b3b", "#6d1111"], diamond: ["#ecfaff", "#7fc8ee", "#23648f"],
  amethyst: ["#ead6ff", "#9a5fe0", "#41207f"], lock: ["#e5e0d8", "#b3aca2", "#7a7369"],
};

// One badge per boss. tier is the tier the boss moves you up to.
const BOSS_BADGES = {
  brandbrain: { name: "Brain Trust", how: "Beat the Brand Brain quiz", ico: "🧠", metal: "bronze", plate: "TIER 1" },
  priya: { name: "Shelf Starter", how: "Beat Priya at her bottle shop", metal: "silver", plate: "TIER 2" },
  mia: { name: "Lounge Charmer", how: "Beat Mia at the hotel lounge", metal: "gold", plate: "TIER 3" },
  buyer: { name: "Room Reader", how: "Beat Rafael by reading the room", metal: "emerald", plate: "TIER 4" },
  dana: { name: "Margin Master", how: "Beat Dana at the warehouse", metal: "ruby", plate: "TIER 5" },
  mean: { name: "Cool Under Fire", how: "Beat the Bad-Tempered Owner", metal: "diamond", plate: "FINAL BOSS" },
};
const BADGE_ART = {
  first: { ico: "🎤", metal: "bronze" }, closer: { ico: "🤝", metal: "silver" }, flawless: { ico: "⭐", metal: "gold" }, hard: { ico: "🔥", metal: "ruby" },
  typed: { ico: "💯", metal: "gold" }, voice: { ico: "🎙️", metal: "silver" }, brain: { ico: "🧠", metal: "emerald" }, comply: { ico: "🛡️", metal: "emerald" },
  camera: { ico: "📷", metal: "bronze" }, streak3: { ico: "⚡", metal: "silver" }, all: { ico: "🗺️", metal: "diamond" }, closet: { ico: "👕", metal: "amethyst" },
  bossall: { ico: "👑", metal: "amethyst", kind: "feat", plate: "ALL 6" }, bossperfect: { ico: "🏆", metal: "gold", kind: "feat", plate: "FLAWLESS" },
};
Object.entries(BOSS_BADGES).forEach(([id, b]) => {
  BADGES["boss-" + id] = [b.name, b.how, () => false];   // awarded when the boss is beaten (awardBadges), never by a finished mission
  BADGE_ART["boss-" + id] = { ...b, kind: "boss", boss: id, tierTo: Math.min(5, BOSSES.findIndex(x => x.id === id) + 1) };
});
BADGES.bossperfect = ["Flawless Victory", "Win a boss battle with 4.8 out of 5 or better (or every Brand Brain answer right)", () => false];
BADGES.bossall = ["Season Complete", "Beat all six bosses", () => false];
BADGES.closet = ["Full Closet", "Unlock every piece of Corrido merch", () => false];
Object.values(BADGE_ART).forEach(a => { a.kind = a.kind || "mission"; });

// Give badges that were not already earned. Returns the ones that are new.
function awardBadges(keys) {
  const got = [...new Set(keys)].filter(k => BADGES[k] && !state.badges.includes(k));
  if (got.length) { state.badges.push(...got); Progress.save(state); }
  return got;
}
// Badges that follow from progress already made (a boss beaten, the whole closet), so nothing earned earlier goes missing.
function syncBadges() {
  const keys = BOSSES.filter(b => state.done[b.id]).map(b => "boss-" + b.id);
  if (BOSSES.every(b => state.done[b.id])) keys.push("bossall");
  if (merchEarned().size >= Object.keys(OUTFITS).length + Object.keys(HATS).length) keys.push("closet");
  return awardBadges(keys);
}

let badgeSeq = 0;
// The medal as an inline SVG. on = earned. Each one gets its own gradient and clip ids so many can sit on one page.
function badgeSVG(key, on) {
  const a = BADGE_ART[key] || { ico: "🏅", metal: "bronze", kind: "mission" }, id = "bdg" + (++badgeSeq), m = METALS[on ? a.metal : "lock"];
  const defs = `<defs><linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${m[0]}"/><stop offset=".5" stop-color="${m[1]}"/><stop offset="1" stop-color="${m[2]}"/></linearGradient>
    <linearGradient id="${id}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${on ? "#c0392b" : "#bdb6ab"}"/><stop offset="1" stop-color="${on ? "#6e150d" : "#8a8379"}"/></linearGradient>
    <clipPath id="${id}c"><circle cx="60" cy="58" r="35"/></clipPath></defs>`;
  const face = on ? "#3a2414" : "#d3cdc3", emoji = (y, size) => `<text x="60" y="${y}" font-size="${size}" text-anchor="middle" ${on ? "" : 'style="filter:grayscale(1)" opacity=".4"'}>${a.ico}</text>`;
  const gloss = r => `<ellipse cx="${60 - r * .3}" cy="${58 - r * .45}" rx="${r * .55}" ry="${r * .28}" fill="#fff" opacity="${on ? .26 : .12}" transform="rotate(-28 60 58)"/>`;
  if (a.kind === "mission") {
    return `<svg viewBox="0 0 120 120" role="img" aria-label="${esc((BADGES[key] || [""])[0])} badge">${defs}
      <circle cx="60" cy="60" r="52" fill="url(#${id}m)" stroke="${m[2]}" stroke-width="2.5"/>
      <circle cx="60" cy="60" r="44" fill="none" stroke="${m[0]}" stroke-width="2" opacity=".8"/>
      <circle cx="60" cy="60" r="39" fill="${face}" stroke="${m[2]}" stroke-width="1.5"/>
      ${emoji(77, 40)}${gloss(46)}${on ? "" : '<text x="60" y="64" font-size="30" text-anchor="middle">🔒</text>'}</svg>`;
  }
  // boss and feat badges: ribbon, sunburst medal, portrait or emblem, plate
  const pts = Array.from({ length: 24 }, (_, i) => { const r = i % 2 ? 49 : 56, t = i / 24 * Math.PI * 2 - Math.PI / 2; return (60 + r * Math.cos(t)).toFixed(1) + "," + (58 + r * Math.sin(t)).toFixed(1); }).join(" ");
  const sc = a.boss && SCENARIOS.find(s => s.id === a.boss);
  const inner = sc
    ? `<g clip-path="url(#${id}c)"><circle cx="60" cy="58" r="36" fill="${on ? "#e9d5b5" : "#cfc8bd"}"/><g ${on ? "" : 'style="filter:grayscale(1) brightness(.32)" opacity=".85"'}><svg x="22" y="20" width="76" height="76" viewBox="14 -4 92 92">${person(custLook(sc))}</svg></g></g>`
    : `<circle cx="60" cy="58" r="35" fill="${face}"/>${emoji(74, 44)}`;
  return `<svg viewBox="0 0 120 150" role="img" aria-label="${esc((BADGES[key] || [""])[0])} badge">${defs}
    <path d="M42 98L27 146L47 137L60 150L66 100Z" fill="url(#${id}r)" stroke="#0004" stroke-width="1"/><path d="M78 98L93 146L73 137L60 150L54 100Z" fill="url(#${id}r)" stroke="#0004" stroke-width="1"/>
    <polygon points="${pts}" fill="url(#${id}m)" stroke="${m[2]}" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="60" cy="58" r="44" fill="url(#${id}m)" stroke="${m[2]}" stroke-width="1.5"/>
    <circle cx="60" cy="58" r="38.5" fill="none" stroke="${m[2]}" stroke-width="1.5" opacity=".6"/>
    ${inner}<circle cx="60" cy="58" r="36" fill="none" stroke="${m[0]}" stroke-width="2"/>${gloss(50)}
    <rect x="28" y="92" width="64" height="21" rx="10.5" fill="#2a1a0e" stroke="url(#${id}m)" stroke-width="2"/>
    <text x="60" y="107" font-size="${(a.plate || "").length > 8 ? 8.5 : (a.plate || "").length > 6 ? 10 : 12}" font-weight="800" letter-spacing="1" text-anchor="middle" fill="${m[0]}" font-family="Arimo, sans-serif">${a.plate || ""}</text>
    ${on ? "" : '<text x="60" y="68" font-size="24" text-anchor="middle">🔒</text>'}</svg>`;
}

// One card for the Badges tab and one row of small medals for the Progress tab.
function badgeCard(k) {
  const b = BADGES[k], on = state.badges.includes(k), a = BADGE_ART[k], big = a.kind !== "mission";
  const sub = a.kind === "boss" ? `<span class="btier">${on ? "Reached" : "Beat it to reach"}: ${a.boss === "mean" ? "Season complete" : TIERS[a.tierTo]}</span>` : "";
  return `<div class="bcard ${big ? "big" : ""} ${on ? "on" : ""}" data-k="${k}"><div class="bart">${badgeSVG(k, on)}</div><b>${esc(b[0])}</b>${sub}<small>${esc(b[1])}</small></div>`;
}
const bossBadgeRow = () => `<div class="bossrow" aria-label="Boss badges">${BOSSES.map(b => `<span class="bmini ${state.badges.includes("boss-" + b.id) ? "on" : ""}" title="${esc(BADGES["boss-" + b.id][0])}">${badgeSVG("boss-" + b.id, state.badges.includes("boss-" + b.id))}</span>`).join("")}</div>`;
