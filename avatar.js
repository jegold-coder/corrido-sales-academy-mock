"use strict";
// The rep's avatar: its defaults, saving and loading it, and how it is drawn (repLook).

// Place a product photo so its bounding box is W wide, centered on x = 60, with its top (or bottom) edge at y.
// vs squashes the photo vertically (hats are photographed from above; squashing makes them sit on the head).
const placeImg = (url, bbox, W, y, fromBottom, vs = 1) => {
  const [x0, y0, x1, y1] = bbox, S = W / (x1 - x0), H = S * vs, top = fromBottom ? y - y1 * H : y - y0 * H;
  return `<image href="${url}" x="${(60 - (x0 + x1) / 2 * S).toFixed(1)}" y="${top.toFixed(1)}" width="${S.toFixed(1)}" height="${H.toFixed(1)}" preserveAspectRatio="none"/>`;
};
const BODY = { Male: "M2 200C2 118 28 102 60 102S118 118 118 200Z", Female: "M14 200C14 120 38 103 60 103S106 120 106 200Z" };
const HAIR_BY = { Male: ["Bald", "Buzz", "Short", "Slick back", "Messy", "Curtains", "Low taper fade", "Spiky", "Flat top", "Mullet", "Curly", "Afro", "Dreadlocks", "Cornrows", "Man bun", "Mohawk"], Female: ["Pixie", "Bob", "Long", "Wavy", "Side swept", "Curtain bangs", "Ponytail", "Pigtails", "Bun", "Half-up", "Space buns", "Side braid", "Braids", "Curly", "Afro", "Cornrows"] };
const LIPC = ["#b05a55", "#c0302f", "#d96a8a", "#7a2a4a"];
const FACIALS = (k, c, id) => {
  const clip = inner => `<g clip-path="url(#fc-${id})">${inner}</g>`;
  const must = `<path d="M44 71C50 64 56 67 60 69C64 67 70 64 76 71C70 73 64 71 60 72C56 71 50 73 44 71Z" fill="${c}"/>`;
  if (k === "Stubble") return clip(`<path d="M30 58C34 72 46 77 60 77C74 77 86 72 90 58L90 100L30 100Z" fill="${c}" opacity=".28"/>`);
  if (k === "Mustache") return must;
  if (k === "Goatee") return clip(`<path d="M47 80C52 76 68 76 73 80C74 92 68 98 60 98C52 98 46 92 47 80Z" fill="${c}"/>`) + must;
  if (k === "Beard") return clip(`<path d="M30 56C34 74 46 78 60 78C74 78 86 74 90 56L90 100L30 100Z" fill="${c}"/>`) + must;
  return "";
};
const GLASSES = (k, c) => {
  if (k === "Round") return `<circle cx="47" cy="54" r="8.5" fill="#fff" fill-opacity=".12" stroke="${c}" stroke-width="1.8"/><circle cx="73" cy="54" r="8.5" fill="#fff" fill-opacity=".12" stroke="${c}" stroke-width="1.8"/><path d="M55 53Q60 50 65 53M38.5 52L31 50M81.5 52L89 50" stroke="${c}" stroke-width="1.8" fill="none"/>`;
  if (k === "Square") return `<rect x="38" y="47" width="17" height="13" rx="3" fill="#fff" fill-opacity=".12" stroke="${c}" stroke-width="1.8"/><rect x="65" y="47" width="17" height="13" rx="3" fill="#fff" fill-opacity=".12" stroke="${c}" stroke-width="1.8"/><path d="M55 52H65M38 51L31 49M82 51L89 49" stroke="${c}" stroke-width="1.8" fill="none"/>`;
  if (k === "Sunglasses") return `<rect x="37" y="47" width="19" height="13" rx="5" fill="#111" fill-opacity=".92"/><rect x="64" y="47" width="19" height="13" rx="5" fill="#111" fill-opacity=".92"/><path d="M56 51H64M37 50L30 48M83 50L90 48" stroke="#111" stroke-width="2" fill="none"/><path d="M40 50L46 50M67 50L73 50" stroke="#fff" stroke-opacity=".4" stroke-width="1.5"/>`;
  return "";
};
const GENDER_DEFAULTS = {
  Male: { hairStyle: "Short", facial: "None", browW: 2, blush: false, earrings: false, lip: 0, outfit: "Spirit Animal Tee" },
  Female: { hairStyle: "Long", facial: "None", browW: 1, blush: true, earrings: false, lip: 0, outfit: "Spirit Animal Tee" },
};
const DEFAULT_AVATAR = { name: "", gender: "Female", skin: 1, face: "Oval", hairStyle: "Long", hair: 1, eye: 0, brow: -1, browW: 1, facial: "None", glasses: "None", frame: 0, outfit: "Spirit Animal Tee", hat: "None", lip: 0, smile: "Neutral", dimples: false, freckles: false, mole: false, earrings: false, blush: true };
// A piece with a women's cut (its own photo, name and shop page) shows that cut to a female rep, in the tiles, the captions and the shop link.
const merchView = (name, gender) => {
  const m = OUTFITS[name] || HATS[name] || {}, f = gender === "Female" && m.imgF;
  return { img: f ? m.imgF : m.img, label: f && m.nameF ? m.nameF : name, url: f && m.urlF ? m.urlF : MERCH_URL[name] };
};
const outfitsFor = g => Object.keys(OUTFITS).filter(k => OUTFITS[k].g === "u" || OUTFITS[k].g === (g === "Female" ? "f" : "m"));
// Shirts that now have colourway siblings were renamed. A saved avatar keeps working.
const LEGACY_MERCH = { "Corrido Classic Tee": "Corrido Classic Tee (Maroon)", "Tequila Delivery 24/7 Oversized Tee": "Tequila Delivery 24/7 Oversized Tee (Washed Maroon)", "Mas Tequila Tee": "Mas Tequila Tee (White)", "In My Tequila Era Tee": "In My Tequila Era Tee (Charcoal)", "Corrido Logo Tee": "Corrido Logo Tee (Heather Navy)" };
function cleanAvatar(v) {
  const A = { ...DEFAULT_AVATAR, ...v };
  if (LEGACY_MERCH[A.outfit]) A.outfit = LEGACY_MERCH[A.outfit];
  if (!GENDER_DEFAULTS[A.gender]) A.gender = "Female";
  if (!HAIR_BY[A.gender].includes(A.hairStyle)) A.hairStyle = GENDER_DEFAULTS[A.gender].hairStyle;
  if (!outfitsFor(A.gender).includes(A.outfit)) A.outfit = GENDER_DEFAULTS[A.gender].outfit;
  if (A.hat !== "None" && !HATS[A.hat]) A.hat = "None";
  // merch has to be earned: a piece you haven't unlocked yet falls back to the starter shirt or no hat
  if (!merchUnlocked(A.outfit)) A.outfit = STARTER_MERCH[0];
  if (A.hat !== "None" && !merchUnlocked(A.hat)) A.hat = "None";
  if (A.gender === "Female") A.facial = "None";
  if (!SMILES.includes(A.smile)) A.smile = "Neutral";   // avatars saved before smiles existed
  A.frame = 0;   // frame color is no longer a choice
  return A;
}
function loadAvatar() {
  try { const v = JSON.parse(localStorage.getItem("csa_avatar") || "null"); if (v) return cleanAvatar(v); } catch { /* storage unavailable */ }
  return null;
}
const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
state.avatar = loadAvatar() || { ...DEFAULT_AVATAR };
state.avatarSaved = !!loadAvatar();
const repName = () => (state.avatar.name || "").trim() || "Rep";

const mixHex = (a, b, t) => "#" + [1, 3, 5].map(i => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, "0")).join("");
function repLook() {
  const A = state.avatar, F = A.gender === "Female", hair = HAIRC[A.hair], h = HAIRS[A.hairStyle](hair, FACES[A.face]), ff = FACE_FIT[A.face],
    fit = g => (g ? `<g transform="translate(60 ${16 + ff.dy}) scale(${ff.sx} ${ff.sy}) translate(-60 -16)">${g}</g>` : ""), O = OUTFITS[A.outfit], useF = F && O.imgF, out = humanBody({ F, skin: SKINS[A.skin], base: useF ? O.baseF : O.base, img: useF ? O.imgF : O.img, bbox: useF ? O.bboxF : O.bbox, Wk: O.Wk, long: !!O.long, hem: O.hem, v: !!O.v, polo: !!O.polo, logo: O.logo, dsl: DRAWN[A.outfit + (useF ? "F" : "")], hemFill: HEM_FILL[A.outfit], sl: SLEEVE[A.outfit + (useF ? "F" : "")] });
  const over = [
    A.dimples ? '<path d="M41 72Q43 75 45 72M75 72Q77 75 79 72" stroke="#0004" stroke-width="1.5" fill="none" stroke-linecap="round"/>' : "",
    A.freckles ? [[46, 63], [50, 66], [43, 66], [54, 64], [74, 63], [70, 66], [77, 66], [66, 64], [58, 62], [62, 62]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".9" fill="#a8683f" opacity=".7"/>`).join("") : "",
    A.mole ? '<circle cx="71" cy="73" r="1.3" fill="#3a2418"/>' : "",
  ].join("");
  return {
    id: "rep", skin: SKINS[A.skin], face: FACES[A.face], hair, back: fit(h.back), hairFront: (h.front || "") + (h.clip && h.deco ? onHead(FACES[A.face], fit(h.deco)) : fit(h.deco)), earX: FACE_FIT[A.face].ear, eye: EYEC[A.eye],
    brow: A.brow < 0 ? hair : HAIRC[A.brow], browW: [2, 3, 4.6][A.browW], beard: F ? "" : FACIALS(A.facial, hair, "rep"),
    over, glasses: GLASSES(A.glasses, FRAMEC[A.frame]), blush: A.blush, my: 77, smile: A.smile && A.smile !== "Neutral" ? A.smile : "",
    lip: F ? LIPC[A.lip] : mixHex(SKINS[A.skin], "#7a3b30", .4),
    lashes: F ? '<path d="M42 51L40 48.5M47 49.5V47M52 51L54 48.5M68 51L66 48.5M73 49.5V47M78 51L80 48.5" stroke="#111" stroke-width="1.3" stroke-linecap="round"/>' : "",
    human: true, torso: out.torso, hat: A.hat !== "None" ? placeImg(HATS[A.hat].img, HATS[A.hat].bbox, HATS[A.hat].W * ff.sx, 38 + ff.dy, true, HATS[A.hat].vs) : "",
    ears: A.earrings && F ? `<circle cx="${60 - ff.ear}" cy="65" r="2.4" fill="#e0a42f"/><circle cx="${60 + ff.ear}" cy="65" r="2.4" fill="#e0a42f"/>` : "",
  };
}
