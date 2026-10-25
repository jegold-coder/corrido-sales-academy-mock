"use strict";
// The customers and the bar scene behind them.

// ---------- customers and scenes ----------
const LASHES = '<path d="M42 51L40 48.5M47 49.5V47M52 51L54 48.5M68 51L66 48.5M73 49.5V47M78 51L80 48.5" stroke="#111" stroke-width="1.3" stroke-linecap="round"/>';
const CLOTHES = {
  blazer: '<path d="M60 102L46 134L60 200L74 134Z" fill="#fdfaf5"/><path d="M46 134L36 112M74 134L84 112" stroke="#0004" stroke-width="3" stroke-linecap="round"/>',
  cardigan: '<path d="M60 102L48 200H72Z" fill="#f2ebe0"/><path d="M60 104L52 200M60 104L68 200" stroke="#0003" stroke-width="2"/><circle cx="56" cy="140" r="1.6" fill="#0005"/><circle cx="56" cy="158" r="1.6" fill="#0005"/>',
  jacket: '<path d="M60 102L50 200H70Z" fill="#e9e2d2"/><path d="M60 104L60 200" stroke="#0003" stroke-width="1.5"/><path d="M50 108L44 130M70 108L76 130" stroke="#0004" stroke-width="3" stroke-linecap="round"/>',
};
// A hand lying flat on the counter, seen from above and in front: wrist at (wx, wy), fingers pointing toward the middle
// (d = +1 when they point right). Back of the hand, four fingers of different lengths, and a thumb on top.
function restHand(wx, wy, d, skin) {
  const edge = mixHex(skin, "#2b160c", .4), fingers = [[-3.9, 19.6], [-1.3, 20.8], [1.3, 19.4], [3.9, 16.4]];
  const line = (w, col) => fingers.map(([y, len]) => `<path d="M11 ${y}L${len} ${y + (y < 0 ? -.3 : .3)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`).join("") + `<path d="M3 -4.6L9.6 -8.6" stroke="${col}" stroke-width="${w + .5}" stroke-linecap="round"/>`;
  return `<g transform="translate(${wx} ${wy}) scale(${d * 1.1} 1.1) rotate(4)">
    ${line(4.1, edge)}<path d="M0 -4.8C4 -6.2 9 -6 12 -5.4L12 5.6C9 6.2 4 6.2 0 4.8Z" fill="${edge}" transform="scale(1.06)"/>
    <path d="M0 -4.8C4 -6.2 9 -6 12 -5.4L12 5.6C9 6.2 4 6.2 0 4.8Z" fill="${skin}"/>${line(2.8, skin)}
    <path d="M5 -2.2L10.4 -2.6M5 .4L10.4 .2M5 2.8L10.4 3" stroke="#0000001a" stroke-width=".7" fill="none" stroke-linecap="round"/></g>`;
}
// Arms resting on the counter: a sleeve from the shoulder to the elbow, a sleeve along the forearm with a lighter cuff, and a hand
// lying flat at the end of each one. s = +1 for the left of the picture.
const restArms = (skin, sleeve) => [1, -1].map(s => {
  const X = x => (s > 0 ? x : 120 - x), edge = mixHex(sleeve, "#000000", .38), cuff = mixHex(sleeve, "#ffffff", .8);
  const sh = `${X(22)} 110`, el = `${X(15)} 134`, wr = `${X(31)} 137`;
  return `<g stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="M${sh}L${el}" stroke="${edge}" stroke-width="17.4"/><path d="M${el}L${wr}" stroke="${edge}" stroke-width="14.6"/>
    <path d="M${sh}L${el}" stroke="${sleeve}" stroke-width="15.6"/><path d="M${el}L${wr}" stroke="${sleeve}" stroke-width="12.8"/>
    <path d="M${X(28)} 136.7L${X(29.8)} 136.9" stroke="${edge}" stroke-width="13.6"/><path d="M${X(28)} 136.7L${X(29.8)} 136.9" stroke="${cuff}" stroke-width="12"/></g>` + restHand(X(30.6), 136.9, s, skin);
}).join("");
// Marco rests his right hand on a bar towel.
MARCO_LOOK.arms = '<path d="M68 132L100 129L102 141L70 143Z" fill="#f2ebe0"/><path d="M70 137L101 134" stroke="#c9503a" stroke-width="2"/>' + restArms("#c58f64", "#3c4650");
function custLook(sc) {
  if (sc.id === "marco") return MARCO_LOOK;
  const c = sc.cust.look, F = !sc.cust.male, h = HAIRS[c.hairStyle](c.hair, FACES.Oval);
  const own = t => (t || "").replace(/hx/g, "hxc");   // the rep's hair uses clip id "hx"; keep the customer's separate
  return { id: "m", skin: c.skin, hair: c.hair, shirt: c.shirt, face: FACES.Oval, back: own(h.back), hairFront: own(h.front) + own(h.deco),
    lip: c.lip || mixHex(c.skin, "#7a3b30", .4), my: 78, lashes: F ? LASHES : "", blush: F,
    beard: c.beard ? FACIALS(c.beard, c.hair, "m") : "", front: CLOTHES[c.top], arms: restArms(c.skin, c.shirt) };
}

const BOTTLE_COLS = ["#9c6a2a", "#cdbf98", "#2f5f45", "#7d3520", "#2a7482", "#b8952f", "#52283a", "#b9c4c2"];
// bottle: k = 0 slim, 1 round-shouldered, 2 wide
const bottle = (x, yb, c, h, k) => {
  const w = [13, 17, 21][k], nh = [18, 12, 9][k], nw = [5, 6, 8][k], cx = x + w / 2;
  return `<path d="M${x} ${yb}V${yb - h + 8}Q${x} ${yb - h} ${cx - nw / 2} ${yb - h - 2}V${yb - h - nh}H${cx + nw / 2}V${yb - h - 2}Q${x + w} ${yb - h} ${x + w} ${yb - h + 8}V${yb}Z" fill="${c}"/>
    <rect x="${cx - nw / 2 - .5}" y="${yb - h - nh - 3}" width="${nw + 1}" height="4" rx="1" fill="#1a1208"/>
    <rect x="${x + 2}" y="${yb - h * .62}" width="${w - 4}" height="${h * .3}" fill="#f2e8d2" opacity=".85"/>
    <rect x="${x + 4}" y="${yb - h * .5}" width="${w - 8}" height="1.5" fill="#3a2a1a"/>
    <rect x="${x + 2.2}" y="${yb - h + 8}" width="2" height="${h - 14}" fill="#fff" opacity=".3"/>`;
};
const bottleRow = (x0, x1, yb, off) => { let s = "", x = x0, n = 0; while (x < x1 - 24) { const k = (n + off) % 3; s += bottle(x, yb, BOTTLE_COLS[(n + off) % 8], 30 + ((n * 7 + off * 3) % 4) * 7, k); x += [13, 17, 21][k] + 7; n++; } return s; };
const lamp = x => `<polygon points="${x - 10},40 ${x + 10},40 ${x + 70},250 ${x - 70},250" fill="url(#cone)"/>
  <line x1="${x}" y1="0" x2="${x}" y2="22" stroke="#0c0c0c" stroke-width="2"/><path d="M${x - 14} 40L${x - 6} 22H${x + 6}L${x + 14} 40Z" fill="#161616"/>
  <ellipse cx="${x}" cy="42" rx="30" ry="16" fill="url(#glow)"/><ellipse cx="${x}" cy="41" rx="9" ry="3" fill="#fff3c9"/>`;
const NEON = t => `<text x="300" y="34" text-anchor="middle" font-family="Rye,serif" font-size="20" fill="#7fe3ef" filter="url(#neon)" letter-spacing="4">${t}</text>`;
const box = (x, yb, w, h) => `<rect x="${x}" y="${yb - h}" width="${w}" height="${h}" fill="#b88a55" stroke="#0004"/><rect x="${x + w / 2 - 3}" y="${yb - h}" width="6" height="${h}" fill="#d9c08a" opacity=".7"/><rect x="${x + 3}" y="${yb - h + 4}" width="${w * .3}" height="4" fill="#0003"/>`;
const rack = x0 => `<g>${[0, 90, 180].map(d => `<rect x="${x0 + d}" y="30" width="6" height="206" fill="#d9822b"/>`).join("")}${[120, 176, 232].map(y => `<rect x="${x0}" y="${y}" width="186" height="5" fill="#d9822b"/>`).join("")}
  ${[[x0 + 10, 120, 38, 34], [x0 + 54, 120, 30, 26], [x0 + 100, 120, 40, 38], [x0 + 146, 120, 30, 30], [x0 + 12, 176, 34, 32], [x0 + 58, 176, 42, 28], [x0 + 110, 176, 32, 36], [x0 + 148, 176, 30, 24], [x0 + 14, 232, 40, 36], [x0 + 60, 232, 34, 30], [x0 + 104, 232, 44, 38], [x0 + 154, 232, 24, 28]].map(b => box(...b)).join("")}</g>`;
const frame = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#2a1810" stroke="#c9983a" stroke-width="2"/><rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 8}" fill="#c9a76a" opacity=".55"/><circle cx="${x + w / 2}" cy="${y + h / 2}" r="${Math.min(w, h) / 4}" fill="#7a2a3a" opacity=".7"/>`;
const SCENE_BACK = {
  bar: () => ({
    blur: `<rect width="600" height="250" fill="url(#brick)"/><rect width="600" height="250" fill="url(#wallshade)"/>
      <rect x="4" y="52" width="196" height="146" fill="#150a04" opacity=".7"/><rect x="400" y="52" width="196" height="146" fill="#150a04" opacity=".7"/>
      <rect x="206" y="46" width="188" height="150" rx="6" fill="#1c0f06"/><rect x="214" y="54" width="172" height="134" rx="3" fill="url(#mir)"/>
      <g opacity=".35"><rect x="232" y="128" width="12" height="44" rx="3" fill="#c9a23a"/><rect x="250" y="116" width="12" height="56" rx="3" fill="#2f5f45"/><rect x="332" y="124" width="14" height="48" rx="3" fill="#7d3520"/><rect x="352" y="132" width="12" height="40" rx="3" fill="#cdbf98"/></g>
      <path d="M252 54L228 188M302 54L278 188" stroke="#fff" stroke-opacity=".28" stroke-width="8"/>
      ${[[124, 0], [180, 3]].map(([yb, o]) => bottleRow(12, 200, yb, o) + bottleRow(408, 596, yb, o + 4)).join("")}
      <rect x="0" y="124" width="200" height="6" fill="#5a3a1c"/><rect x="0" y="180" width="200" height="6" fill="#5a3a1c"/><rect x="400" y="124" width="200" height="6" fill="#5a3a1c"/><rect x="400" y="180" width="200" height="6" fill="#5a3a1c"/>
      <rect x="0" y="130" width="200" height="30" fill="url(#led)"/><rect x="0" y="186" width="200" height="30" fill="url(#led)"/><rect x="400" y="130" width="200" height="30" fill="url(#led)"/><rect x="400" y="186" width="200" height="30" fill="url(#led)"/>`,
    over: NEON("OPEN") + [60, 150, 450, 540].map(lamp).join(""), label: "a busy cocktail bar" }),
  warehouse: () => ({
    blur: `<rect width="600" height="250" fill="#5d6368"/>${Array.from({ length: 50 }, (_, n) => `<line x1="${n * 12 + 6}" y1="0" x2="${n * 12 + 6}" y2="250" stroke="#000" stroke-opacity=".12" stroke-width="2"/>`).join("")}<rect width="600" height="250" fill="url(#wallshade)"/>
      <rect x="214" y="46" width="172" height="160" fill="#8a9197"/>${Array.from({ length: 13 }, (_, n) => `<rect x="214" y="${46 + n * 12.3}" width="172" height="2" fill="#000" opacity=".25"/>`).join("")}${rack(8)}${rack(404)}`,
    over: [150, 450].map(lamp).join("") + '<rect x="262" y="14" width="76" height="22" rx="3" fill="#e0a42f"/><text x="300" y="30" text-anchor="middle" font-family="Arimo,sans-serif" font-weight="700" font-size="11" fill="#1e2021">RECEIVING</text>', label: "a distribution warehouse" }),
  shop: () => ({
    blur: `<rect width="600" height="250" fill="#6e4b34"/>${Array.from({ length: 30 }, (_, n) => `<line x1="${n * 20 + 10}" y1="0" x2="${n * 20 + 10}" y2="250" stroke="#000" stroke-opacity=".14" stroke-width="1.5"/>`).join("")}<rect width="600" height="250" fill="url(#wallshade)"/>
      ${[[100, 1], [150, 4], [200, 2]].map(([yb, o]) => `${bottleRow(10, 590, yb, o)}<rect x="0" y="${yb}" width="600" height="6" fill="#5a3a1c"/>`).join("")}
      <rect x="236" y="8" width="128" height="66" fill="#1d2a26" stroke="#8a5a2a" stroke-width="4"/><text x="300" y="38" text-anchor="middle" font-family="Rye,serif" font-size="13" fill="#f2ebe0">NEW IN</text><text x="300" y="58" text-anchor="middle" font-family="Arimo,sans-serif" font-size="10" fill="#cfd8d6">ask us for a pick</text>`,
    over: [60, 540].map(lamp).join(""), label: "a neighborhood bottle shop" }),
  venue: () => ({
    blur: `<rect width="600" height="250" fill="url(#navy)"/><rect width="46" height="250" fill="#2a1d3a"/><rect x="554" width="46" height="250" fill="#2a1d3a"/>
      <path d="M200 40H400L388 66L400 92H200L212 66Z" fill="#7a2a3a"/><text x="300" y="75" text-anchor="middle" font-family="Rye,serif" font-size="22" fill="#e0a42f" letter-spacing="3">PARTY</text>
      ${[[130, 200], [300, 212], [470, 200]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="58" ry="12" fill="#efe6d2"/><rect x="${x - 5}" y="${y}" width="10" height="40" fill="#cfc6b2"/><ellipse cx="${x}" cy="${y - 8}" rx="7" ry="5" fill="url(#glow)"/>`).join("")}
      <path d="M0 22Q150 74 300 26T600 22" stroke="#0c0c14" stroke-width="2" fill="none"/>${Array.from({ length: 14 }, (_, n) => { const x = n * 44 + 10; const y = 22 + 40 * Math.sin(Math.PI * (x / 300)) * (x < 300 ? 1 : -1) * .0 + 28 * Math.abs(Math.sin(Math.PI * x / 300)); return `<circle cx="${x}" cy="${y.toFixed(0)}" r="5" fill="#ffe3a0"/><circle cx="${x}" cy="${y.toFixed(0)}" r="12" fill="url(#glow)"/>`; }).join("")}`,
    over: [[90, 100, 14], [230, 130, 10], [410, 110, 15], [520, 140, 11]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffd890" opacity=".22"/>`).join(""), label: "an event venue set up for a party" }),
  lounge: () => ({
    blur: `<rect width="600" height="250" fill="#17323a"/>${Array.from({ length: 24 }, (_, n) => `<line x1="${n * 25 + 12}" y1="0" x2="${n * 25 + 12}" y2="250" stroke="#000" stroke-opacity=".18" stroke-width="2"/>`).join("")}<rect width="600" height="250" fill="url(#wallshade)"/>
      <rect x="196" y="36" width="208" height="130" rx="6" fill="#3a2a10" stroke="#c9983a" stroke-width="4"/><rect x="204" y="44" width="192" height="114" fill="url(#mir)"/><path d="M250 44L226 158M310 44L286 158" stroke="#fff" stroke-opacity=".25" stroke-width="8"/>
      ${[[24, 150, 140], [436, 150, 140]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="66" rx="14" fill="#6a2f2a"/>${Array.from({ length: 5 }, (_, n) => `<circle cx="${x + 16 + n * 27}" cy="${y + 20}" r="2.2" fill="#00000055"/><circle cx="${x + 30 + n * 27}" cy="${y + 42}" r="2.2" fill="#00000055"/>`).join("")}`).join("")}
      <ellipse cx="190" cy="214" rx="14" ry="4" fill="#1a1208"/><ellipse cx="410" cy="214" rx="14" ry="4" fill="#1a1208"/><ellipse cx="190" cy="204" rx="16" ry="12" fill="url(#glow)"/><ellipse cx="410" cy="204" rx="16" ry="12" fill="url(#glow)"/>`,
    over: [100, 300, 500].map(lamp).join(""), label: "a hotel lounge" }),
  restaurant: () => ({
    blur: `<rect width="600" height="250" fill="#5a2222"/><rect y="130" width="600" height="120" fill="#3a1414"/>${Array.from({ length: 12 }, (_, n) => `<rect x="${n * 50 + 4}" y="136" width="42" height="106" rx="2" fill="#4a1a1a" stroke="#0004"/>`).join("")}<rect width="600" height="250" fill="url(#wallshade)"/>
      ${frame(40, 40, 60, 48)}${frame(130, 34, 40, 60)}${frame(430, 34, 40, 60)}${frame(500, 40, 60, 48)}
      <rect x="226" y="52" width="148" height="86" fill="#2a1208" stroke="#8a5a2a" stroke-width="3"/>${bottleRow(232, 368, 92, 2)}${bottleRow(232, 368, 132, 5)}<rect x="226" y="94" width="148" height="4" fill="#5a3a1c"/>
      ${[[70, 190], [530, 190]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="44" ry="9" fill="#f4efe4"/><rect x="${x - 4}" y="${y}" width="8" height="40" fill="#cfc6b2"/><ellipse cx="${x}" cy="${y - 6}" rx="5" ry="4" fill="url(#glow)"/>`).join("")}`,
    over: [100, 300, 500].map(lamp).join(""), label: "a busy restaurant" }),
};

function barScene(avg, sc) {
  const T = SCENE_BACK[sc.theme](), look = custLook(sc);
  const grain = Array.from({ length: 7 }, (_, n) => `<path d="M0 ${238 + n * 1.6}Q150 ${237 + n * 1.6} 300 ${238.5 + n * 1.6}T600 ${238 + n * 1.6}" stroke="#4a2c12" stroke-opacity=".45" fill="none"/>`).join("");
  return `<svg viewBox="0 0 600 380" role="img" aria-label="${T.label}. ${sc.cust.name}, the ${sc.cust.role.toLowerCase()}, stands behind the counter and you, the rep, stand in front.">
    <defs>
      <pattern id="brick" width="48" height="24" patternUnits="userSpaceOnUse"><rect width="48" height="24" fill="#4b2a1a"/>
        <rect x="1" y="1" width="22" height="10" fill="#6b3d27"/><rect x="25" y="1" width="22" height="10" fill="#62371f"/>
        <rect x="-11" y="13" width="22" height="10" fill="#643820"/><rect x="13" y="13" width="22" height="10" fill="#6f4029"/><rect x="37" y="13" width="22" height="10" fill="#5e341e"/></pattern>
      <linearGradient id="navy" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#232b4a"/><stop offset="1" stop-color="#0f1426"/></linearGradient>
      <linearGradient id="wallshade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a0502" stop-opacity=".75"/><stop offset=".5" stop-color="#0a0502" stop-opacity=".2"/><stop offset="1" stop-color="#0a0502" stop-opacity=".6"/></linearGradient>
      <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b07a40"/><stop offset=".4" stop-color="#8a5a2a"/><stop offset="1" stop-color="#6a4220"/></linearGradient>
      <linearGradient id="front" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2210"/><stop offset="1" stop-color="#150a04"/></linearGradient>
      <linearGradient id="mir" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6f8f93"/><stop offset=".5" stop-color="#b8cbcb"/><stop offset="1" stop-color="#5f7f84"/></linearGradient>
      <linearGradient id="led" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd890" stop-opacity=".65"/><stop offset="1" stop-color="#ffd890" stop-opacity="0"/></linearGradient>
      <linearGradient id="cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe3a0" stop-opacity=".22"/><stop offset="1" stop-color="#ffe3a0" stop-opacity="0"/></linearGradient>
      <radialGradient id="glow"><stop offset="0" stop-color="#ffe3a0" stop-opacity=".95"/><stop offset="1" stop-color="#ffe3a0" stop-opacity="0"/></radialGradient>
      <radialGradient id="vig" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient>
      <filter id="dof" x="-2%" y="-2%" width="104%" height="104%"><feGaussianBlur stdDeviation="1.1"/></filter>
      <filter id="neon"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <g filter="url(#dof)">${T.blur}</g>
    ${T.over}
    <g transform="translate(110 76) scale(1.15)"><g class="p" id="pc">${person(look)}</g></g>
    <polygon id="pl" class="mood ${plumb(avg)}" points="179,34 189,48 179,64 169,48"/><text id="rxpop" class="rxpop" x="219" y="74" font-size="24" text-anchor="middle" aria-hidden="true"></text>
    <rect y="236" width="600" height="14" fill="url(#wood)"/>${grain}<rect y="236" width="600" height="2.5" fill="#fff" opacity=".35"/>
    ${[60, 150, 450, 540].map(x => `<ellipse cx="${x}" cy="243" rx="26" ry="2.6" fill="#ffe3a0" opacity=".35"/>`).join("")}
    <rect y="250" width="600" height="130" fill="url(#front)"/><rect y="340" width="600" height="40" fill="#120a05"/>
    ${Array.from({ length: 20 }, (_, n) => `<line x1="${n * 32 + 8}" y1="250" x2="${n * 32 + 8}" y2="340" stroke="#000" stroke-opacity=".35" stroke-width="2"/>`).join("")}
    <rect y="262" width="600" height="5" fill="#b98a2f"/><rect y="262" width="600" height="1.5" fill="#fff0b0" opacity=".7"/>
    <g><ellipse cx="45" cy="292" rx="22" ry="5" fill="#0c0603"/><rect x="43" y="292" width="4" height="88" fill="#0c0603"/>
       <ellipse cx="572" cy="292" rx="22" ry="5" fill="#0c0603"/><rect x="570" y="292" width="4" height="88" fill="#0c0603"/></g>
    <g><path d="M278 236L294 214L310 236Z" fill="#dff1f4" opacity=".75"/><ellipse cx="294" cy="215" rx="4" ry="1.2" fill="#b7d86a"/>
       <rect x="318" y="220" width="20" height="16" rx="2" fill="#e8b25a" opacity=".6"/><rect x="318" y="220" width="20" height="3" fill="#fff" opacity=".4"/>
       <ellipse cx="300" cy="238" rx="26" ry="2" fill="#000" opacity=".25"/></g>
    <g transform="translate(350 96) scale(1.25)"><g class="p" id="pr">${person(repLook())}</g></g>
    <rect width="600" height="380" fill="url(#vig)" pointer-events="none"/>
  </svg>`;
}
