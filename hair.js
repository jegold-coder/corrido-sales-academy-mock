"use strict";
// Skin, hair, eye and frame colours, and the hairstyles. A hair cap is cut from the face outline, so it fits every head shape.

// ---------- customizable rep ----------
// How each face shape changes the hair: horizontal scale, vertical scale, vertical shift (all about the top of the head) and ear position.
const FACE_FIT = {
  Oval: { sx: 1, sy: 1, dy: 0, ear: 29 },
  Round: { sx: 1.07, sy: .97, dy: 2, ear: 31 },
  Square: { sx: .97, sy: 1, dy: 1, ear: 28 },
  Heart: { sx: 1.03, sy: 1, dy: 0, ear: 28 },
  Long: { sx: .93, sy: 1.1, dy: -4, ear: 27 },
};
const SKINS = ["#f3d2b8", "#e5b08c", "#d19a6c", "#b57a50", "#8a5a3a", "#5e3b26"];
const HAIRC = ["#1a1410", "#3b2418", "#6b4423", "#8a3a22", "#d9b35a", "#b5432a", "#9a9a9a", "#e6e6e6", "#2e8b9a"];
const EYEC = ["#5a3a1e", "#1e2021", "#3a78b5", "#4a8a52", "#8a6a2a", "#7f8a90"];
const FRAMEC = ["#1a1a1a", "#c9983a", "#7a4a26", "#b5432a"];
const OUTC = ["#1f6a77", "#243a5e", "#7a2a3a", "#3a3f46", "#2f5f45", "#915f1b"];
// Hair that grows from the head: a "cap" is the face outline (a little bigger) cut off at a hairline, so it stays attached on every face shape.
// line = the hairline, as path commands from the right temple to the left temple. back/deco are fitted to the face by FACE_FIT.
// Every hair cap gets its own clip id. A shared id made a second person on the page (a customer next to the rep, or a grid of
// previews) borrow the first person's head shape, which is what made some hair look wrong on other face shapes.
let capSeq = 0;
// The hairline can start further out than a narrow face is wide, which left a white sliver between the hair and the head. So the thin band between the
// face and the slightly larger cap, from the top down to the hairline's lowest point, is always hair too: the hair is attached on every face shape.
const cap = (c, face, line, vol = 1.07, y0 = 50) => {
  const id = "hx" + (++capSeq), grow = `translate(60 52) scale(${vol} ${vol}) translate(-60 -52)`;
  return `<clipPath id="${id}"><path d="${face}" transform="${grow}"/></clipPath><clipPath id="${id}y"><rect x="-20" y="-40" width="160" height="${40 + y0}"/></clipPath>
    <mask id="${id}m"><path d="${face}" transform="${grow}" fill="#fff"/><path d="${face}" fill="#000"/></mask>
    <g clip-path="url(#${id})"><path d="M-20 -40H140V${y0}${line}L-20 ${y0}Z" fill="${c}"/></g>
    <g clip-path="url(#${id}y)"><rect x="-20" y="-40" width="160" height="200" fill="${c}" mask="url(#${id}m)"/></g>`;
};
// Marks that belong on the hair (a parting, a shine, cornrow lines) are cut off at the head's outline, so none sticks out above a narrow or tall head.
const onHead = (face, marks, vol = 1.09) => { const id = "hd" + (++capSeq); return `<clipPath id="${id}"><path d="${face}" transform="translate(60 52) scale(${vol} ${vol}) translate(-60 -52)"/></clipPath><g clip-path="url(#${id})">${marks}</g>`; };
const LINE = {
  buzz: "L89 48C86 36 78 30 60 30S34 36 31 48",
  short: "L90 54C88 44 84 34 78 30C66 38 46 36 36 29C32 35 30 44 30 54",
  slick: "L89 50C86 38 80 30 74 27C62 24 42 28 34 42L31 50",
  center: "L91 52C88 40 78 30 61 26C42 30 32 40 29 52",
  swept: "L90 52C86 40 80 30 70 25C60 35 42 35 32 49L30 52",
  bangs: "L91 52L91 36C80 30 70 30 60 30S40 30 29 36L29 52",
  pixie: "L91 54C89 42 84 32 76 28C70 36 54 32 34 40C32 44 30 48 29 52L29 54",
  messy: "L90 52C90 40 86 32 80 30L76 41L70 30L64 41L58 30L52 41L46 31L40 41L36 32C32 38 30 44 29 52",
  curtainsM: "L92 52C91 60 88 64 84 66C82 54 72 40 60 32C48 40 38 54 36 66C32 64 29 60 28 52",
  curtains: "L92 56C91 64 90 70 88 74C86 58 76 42 60 32C44 42 34 58 32 74C30 70 29 64 28 56",
  updo: "L91 52C88 38 76 28 60 26C44 28 32 38 29 52",
  taper: "L90 52C90 42 86 34 78 31C66 36 48 34 40 33C34 35 31 42 30 52",
  spiky: "L90 50C86 40 80 34 72 32C60 36 44 34 36 40C33 43 31 46 30 50",
  curly: "L91 50C86 40 80 32 70 29H50C40 32 34 40 29 50",
  low: "L91 48C85 36 74 30 60 30S35 36 29 48",
};
const PART = '<path d="M60 11L60 26" stroke="#000" stroke-opacity=".25" stroke-width="1.4"/>';
const SHINE = '<path d="M44 18C54 12 70 12 80 20M40 24C52 17 70 17 84 26" stroke="#fff" stroke-opacity=".2" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
const LONGBACK = c => `<path d="M29 56C22 20 44 7 60 7S98 20 91 56C94 84 90 110 82 124L38 124C30 110 26 84 29 56Z" fill="${c}"/>`;
const ring = (cx, cy, rx, ry, r, n, t0, t1) => Array.from({ length: n }, (_, i) => { const t = t0 + (t1 - t0) * i / (n - 1); return `<circle cx="${(cx + rx * Math.cos(t)).toFixed(1)}" cy="${(cy + ry * Math.sin(t)).toFixed(1)}" r="${r}"/>`; }).join("");
const HAIRS = {
  Bald: () => ({ back: "", front: "" }),
  // ----- men
  Buzz: (c, f) => ({ front: cap(c, f, LINE.buzz, 1.05, 48) }),
  Short: (c, f) => ({ front: cap(c, f, LINE.short, 1.09, 54) }),
  "Slick back": (c, f) => ({ front: cap(c, f, LINE.slick, 1.08), deco: SHINE, clip: true }),
  Messy: (c, f) => ({ front: cap(c, f, LINE.messy, 1.1, 52) }),
  Curtains: (c, f) => ({ front: cap(c, f, LINE.curtainsM, 1.09, 52), deco: '<path d="M60 12L60 32" stroke="#000" stroke-opacity=".2" stroke-width="1.4"/>', clip: true }),
  // the faded sides are clipped to this person's own face, so they stay on the head whatever its shape
  "Low taper fade": (c, f) => { const id = "fd" + (++capSeq); return { front: cap(c, f, LINE.taper, 1.1, 52) + `<clipPath id="${id}"><path d="${f}"/></clipPath><g clip-path="url(#${id})"><path d="M26 66V40H37L40 56ZM94 66V40H83L80 56Z" fill="${c}" opacity=".32"/><path d="M36 62C37 57 38 54 40 52M84 62C83 57 82 54 80 52" stroke="${c}" stroke-opacity=".4" stroke-width="1.2" fill="none"/></g>` }; },
  Spiky: (c, f) => ({ front: cap(c, f, LINE.spiky, 1.07), deco: `<path d="M30 50L27 33L34 36L31 17L42 27L45 7L54 24L60 3L66 24L75 7L78 27L89 17L86 36L93 33L90 50C86 40 80 34 72 32C60 36 44 34 36 40C33 43 31 46 30 50Z" fill="${c}"/><path d="M46 14L49 24M60 10L60 22M74 14L71 24" stroke="#fff" stroke-opacity=".18" stroke-width="1.6" stroke-linecap="round"/>` }),
  "Flat top": (c, f) => ({ front: cap(c, f, LINE.buzz, 1.02, 48), deco: `<path d="M31 48L30 14C30 8 36 6 60 6S90 8 90 14L89 48C86 36 78 28 60 28S34 36 31 48Z" fill="${c}"/>` }),
  Mullet: (c, f) => ({ back: `<path d="M27 58C22 80 26 106 34 120C44 114 54 112 60 112C66 112 76 114 86 120C94 106 98 80 93 58Z" fill="${c}"/>`, front: cap(c, f, LINE.short, 1.09, 54) }),
  Dreadlocks: (c, f) => ({ back: `<g stroke="${c}" stroke-width="6.5" stroke-linecap="round" fill="none">${[[22, 70], [28, 92], [34, 104], [98, 70], [92, 92], [86, 104]].map(([x, y]) => `<path d="M${x} 36Q${x + (x < 60 ? -3 : 3)} ${y - 20} ${x} ${y}"/>`).join("")}</g>`, front: cap(c, f, LINE.low, 1.1) }),
  Cornrows: (c, f) => ({ front: cap(c, f, LINE.buzz, 1.05, 48), deco: '<g stroke="#000" stroke-opacity=".35" stroke-width="1.3" fill="none" stroke-linecap="round"><path d="M42 30Q40 23 46 18M50 30Q49 22 53 17M60 30L60 16M70 30Q71 22 67 17M78 30Q80 23 74 18"/></g>', clip: true }),
  "Man bun": (c, f) => ({ back: `<circle cx="60" cy="12" r="13" fill="${c}"/>`, front: cap(c, f, LINE.slick, 1.08) }),
  Mohawk: (c, f) => ({ back: "", front: `<g opacity=".28">${cap(c, f, LINE.low, 1.0, 50)}</g>`, deco: `<path d="M52 36C48 24 50 8 54 4L58 14L60 1L64 14L68 4C72 8 72 24 68 36Z" fill="${c}"/>` }),
  Curly: (c, f) => ({
    back: `<g fill="${c}"><ellipse cx="60" cy="38" rx="36" ry="30"/>${ring(60, 40, 40, 34, 11, 18, Math.PI * .8, Math.PI * 2.2)}<circle cx="22" cy="58" r="9"/><circle cx="19" cy="68" r="7"/><circle cx="98" cy="58" r="9"/><circle cx="101" cy="68" r="7"/></g>`,
    front: cap(c, f, LINE.curly, 1.08),
    deco: `<g fill="${c}">${[36, 43, 50, 57, 64, 71, 78, 85].map((x, i) => `<circle cx="${x}" cy="${30 + (i % 2) * 2}" r="6.5"/>`).join("")}<circle cx="33" cy="42" r="5.5"/><circle cx="87" cy="42" r="5.5"/></g><g fill="#fff" opacity=".12"><circle cx="50" cy="20" r="3"/><circle cx="68" cy="18" r="3"/><circle cx="78" cy="26" r="2.5"/></g>`,
  }),
  Afro: (c, f) => ({ back: `<ellipse cx="60" cy="32" rx="46" ry="40" fill="${c}"/>`, front: cap(c, f, LINE.low, 1.06) }),
  // ----- women
  Pixie: (c, f) => ({ front: cap(c, f, LINE.pixie, 1.08, 54) }),
  Bob: (c, f) => ({ back: `<path d="M27 50C22 18 46 6 60 6S98 18 93 50C95 70 91 90 83 98L37 98C29 90 25 70 27 50Z" fill="${c}"/>`, front: cap(c, f, LINE.bangs, 1.1, 52) }),
  Long: (c, f) => ({ back: `<path d="M28 56C20 18 44 6 60 6C78 6 100 18 92 56C97 88 93 116 84 128L36 128C27 116 23 88 28 56Z" fill="${c}"/>`, front: cap(c, f, LINE.center, 1.09, 52), deco: PART, clip: true }),
  Wavy: (c, f) => ({ back: `<path d="M28 54C18 24 42 6 60 6S102 24 92 54C98 62 92 70 96 80C100 90 90 98 94 108C98 118 90 124 92 132L28 132C30 124 22 118 26 108C30 98 20 90 24 80C28 70 22 62 28 54Z" fill="${c}"/>`, front: cap(c, f, LINE.center, 1.09, 52), deco: PART, clip: true }),
  "Side swept": (c, f) => ({ back: LONGBACK(c), front: cap(c, f, LINE.swept, 1.09, 52) }),
  "Curtain bangs": (c, f) => ({ back: LONGBACK(c), front: cap(c, f, LINE.curtains, 1.09, 56) }),
  Ponytail: (c, f) => ({ back: `<path d="M86 34C106 34 112 68 100 98C94 80 94 62 84 52Z" fill="${c}"/>`, front: cap(c, f, LINE.updo, 1.08) }),
  Pigtails: (c, f) => ({ back: `<g fill="${c}"><path d="M32 40C12 44 8 76 18 104C26 90 30 68 36 52Z"/><path d="M88 40C108 44 112 76 102 104C94 90 90 68 84 52Z"/></g><circle cx="30" cy="44" r="3" fill="#b5432a"/><circle cx="90" cy="44" r="3" fill="#b5432a"/>`, front: cap(c, f, LINE.center, 1.09, 52), deco: PART, clip: true }),
  Bun: (c, f) => ({ back: `<circle cx="60" cy="14" r="12" fill="${c}"/>`, front: cap(c, f, LINE.updo, 1.08) }),
  "Half-up": (c, f) => ({ back: LONGBACK(c) + `<circle cx="60" cy="12" r="9" fill="${c}"/>`, front: cap(c, f, LINE.updo, 1.08) }),
  "Space buns": (c, f) => ({ back: `<circle cx="37" cy="15" r="11" fill="${c}"/><circle cx="83" cy="15" r="11" fill="${c}"/>`, front: cap(c, f, LINE.center, 1.09, 52), deco: PART, clip: true }),
  "Side braid": (c, f) => ({ back: `<path d="M28 56C22 20 44 7 60 7S98 20 92 56C92 62 91 66 88 68L32 68C29 66 28 62 28 56Z" fill="${c}"/><g fill="${c}" stroke="#000" stroke-opacity=".25" stroke-width=".8">${[0, 1, 2, 3, 4, 5, 6].map(i => `<ellipse cx="${90 + i * 1.4}" cy="${70 + i * 9}" rx="5.4" ry="5.6"/>`).join("")}</g>`, front: cap(c, f, LINE.swept, 1.09, 52) }),
  Braids: (c, f) => ({ back: `<path d="M28 56C20 18 44 6 60 6C78 6 100 18 92 56C92 64 91 70 88 72L32 72C29 70 28 64 28 56Z" fill="${c}"/>`, front: cap(c, f, LINE.center, 1.09, 52), deco: PART + `<g fill="${c}" stroke="#000" stroke-opacity=".25" stroke-width=".8">${[0, 1, 2, 3, 4, 5].map(i => `<ellipse cx="${30 - i * .4}" cy="${72 + i * 9}" rx="5" ry="5.2"/><ellipse cx="${90 + i * .4}" cy="${72 + i * 9}" rx="5" ry="5.2"/>`).join("")}</g>`, clip: true }),
};
