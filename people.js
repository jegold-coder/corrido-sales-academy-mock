"use strict";
// The drawn people: hands, bodies, polos, faces, the customer's mouths, the rep's smile styles and Marco's look.

// ---------- illustrated people + bar scene (SVG) ----------
// Swap for photos or video later. Each person is drawn in a 120x200 local box.
// ---------- hands and body ----------
const OUT = "#00000038";
const capsule = (x1, y1, x2, y2, w, col, outline) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${outline ? OUT : col}" stroke-width="${outline ? w + 1.4 : w}" stroke-linecap="round"/>`;
// A relaxed hand hanging from the wrist at (cx, cy): one tapered shape with fingertip bumps, finger lines and a thumb.
// d = +1 when the thumb is on the right. sy squashes it for a hand lying on the bar.
function hangHand(cx, cy, d, skin, sy = 1) {
  const palm = "M-5.6 -1C-6.8 6-7.4 12-7 19C-6.8 24-5 27-3.2 27C-1.8 27.6-.6 27.1 0 26C.8 27.4 2.4 27.7 3.6 26.8C5.4 26 6.6 22 7 19C7.4 12 6.8 6 5.6 -1Z";
  const t = (x, y) => `${(d * x).toFixed(1)} ${y}`;
  const thumb = `M${t(5, 3)}C${t(8, 6)} ${t(9.4, 12)} ${t(8.6, 17)}C${t(8, 19.4)} ${t(5.8, 19.2)} ${t(5.6, 16.6)}C${t(5.4, 12)} ${t(4.6, 8)} ${t(4.6, 4)}Z`;
  return `<g transform="translate(${cx} ${cy}) scale(1 ${sy})">
    <path d="${palm}" fill="${skin}" stroke="${OUT}" stroke-width="1.1" stroke-linejoin="round"/>
    <path d="M-2.5 17L-3 25.6M0 18L0 26M2.8 17.4L3.3 25.4" stroke="#0003" stroke-width=".8" fill="none" stroke-linecap="round"/>
    <path d="${thumb}" fill="${skin}" stroke="${OUT}" stroke-width="1.1" stroke-linejoin="round"/>
  </g>`;
}
// A human-shaped body. The garment is built around the arms, so skin never pokes out of the shirt:
// sleeves are always wider than the arm inside them, and the torso skin sits fully under the garment.

// Cloth for the space-dyed polo: heathered dark grey with the real embroidered logo on the left chest.
function poloCloth(c, X, mir) {
  const [lx0, ly0, lx1, ly1] = c.logo.box, S = 15 / (lx1 - lx0), cx = 76, cy = 128, mx = (lx0 + lx1) / 2, my = (ly0 + ly1) / 2;
  return `<defs><filter id="heather" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .5 -.12"/></filter>
      <clipPath id="plogo"><rect x="${cx - 8.5}" y="${cy - 5}" width="17" height="10"/></clipPath></defs>
    <rect x="0" y="95" width="120" height="125" fill="${c.base}"/>
    <rect x="0" y="95" width="120" height="125" filter="url(#heather)" opacity="${c.heather ?? .22}"/>
    <g clip-path="url(#plogo)" style="mix-blend-mode:${c.logo.blend || "lighten"}"><image style="filter:brightness(${c.logo.dim || 1})" href="${c.logo.img}" x="${(cx - mx * S).toFixed(1)}" y="${(cy - my * S).toFixed(1)}" width="${S.toFixed(1)}" height="${S.toFixed(1)}" preserveAspectRatio="none"/></g>
    <path d="M${X(24)} 118Q${X(20)} 150 ${X(22)} 160M${mir(X(24))} 118Q${mir(X(20))} 150 ${mir(X(22))} 160" stroke="#000" stroke-opacity="${c.heather < .1 && c.base > "#d0d0d0" ? .05 : .12}" stroke-width="2" fill="none"/>`;
}
// Collar wings, placket and buttons, drawn over the skin so the neck rises out of the open collar.
function poloCollar(c, X, mir) {
  const base = c.base, lum = [1, 3, 5].reduce((t, i) => t + parseInt(base.slice(i, i + 2), 16), 0) / 3, light = lum > 170;
  const lite = light ? mixHex(base, "#000000", .07) : mixHex(base, "#ffffff", .1), dark = mixHex(base, "#000000", light ? .18 : .35), edge = mixHex(base, "#000000", light ? .4 : .7), btn = light ? "#8a8a88" : mixHex(base, "#ffffff", .3);
  const wing = m => { const P = x => (m ? mir(x) : x), pts = [[X(43), 96.5], [X(52), 98], [60, 120.5], [X(52), 113]]; return `<path d="M${pts.map(q => P(q[0]) + " " + q[1]).join("L")}Z" fill="${lite}" stroke="${edge}" stroke-width=".9" stroke-linejoin="round"/>`; };
  return `<path d="M${X(46)} 98L${mir(X(46))} 98L60 120.5Z" fill="${c.skin}"/><path d="M${X(50)} 112Q60 118 ${mir(X(50))} 112" stroke="#0002" stroke-width="1" fill="none"/>
    ${wing(false)}${wing(true)}
    <path d="M60 120.5V146" stroke="${dark}" stroke-width="4" stroke-linecap="butt"/><path d="M58 121V146M62 121V146" stroke="#0004" stroke-width=".6"/>
    <circle cx="60" cy="126" r="1.2" fill="${btn}"/><circle cx="60" cy="134" r="1.2" fill="${btn}"/>`;
}
function humanBody(c) {
  const f = c.F ? .86 : 1, X = x => +(60 + (x - 60) * f).toFixed(1), mir = x => +(120 - x).toFixed(1);
  const sk = c.skin, hem = c.hem, se = 186, aw = c.F ? 13 : 16, fw = c.F ? 10.5 : 12.5, nw = c.F ? 18 : 22;
  const A = { s: X(16), e: X(14), w: X(14) };           // left arm centre x at shoulder, elbow, wrist
  const hs = aw / 2 + 3, cs = fw / 2 + 3.2, tl = X(23), tr = mir(tl);
  const arm = (m, at, cuff) => { const P = m ? mir : x => x, s = at ? at[0] : P(A.s), e = at ? (at[0] + at[2]) / 2 : P(A.e), w = at ? at[2] : P(A.w), y0 = at ? at[1] : 118, y1 = at ? (at[1] + 174) / 2 : 150;
    const wa = at ? Math.min(aw, fw + .5) : aw;   // under a photo sleeve the upper arm is no wider than the forearm, so it never pokes out of the opening
    // the sleeve's cuff casts a soft shadow on the arm just below it, so the arm reads as coming out of the sleeve
    const at_ = y => (y <= y1 ? s + (e - s) * (y - y0) / (y1 - y0) : e + (w - e) * (y - y1) / (182 - y1)), gid = "cs" + Math.round(cuff || 0), sh = cuff ? `<defs><linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="0" y1="${cuff}" x2="0" y2="${cuff + 9}"><stop offset="0" stop-color="#000" stop-opacity=".32"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs><line x1="${at_(cuff).toFixed(1)}" y1="${cuff}" x2="${at_(cuff + 9).toFixed(1)}" y2="${cuff + 9}" stroke="url(#${gid})" stroke-width="${cuff <= y1 ? wa : fw}"/>` : "";
    return capsule(s, y0, e, y1, wa, sk, true) + capsule(e, y1, w, 182, fw, sk, true) + capsule(s, y0, e, y1, wa, sk) + capsule(e, y1, w, 182, fw, sk) + sh + hangHand(w, 180, m ? -1 : 1, sk); };
  const neck = c.v ? `M${X(46)} 99L60 120L${X(74)} 99` : `M${X(42)} 99C${X(42)} 110 ${X(49)} 114 60 114C${mir(X(49))} 114 ${mir(X(42))} 110 ${mir(X(42))} 99`;
  const right = c.long
    ? `L${mir(A.w - cs)} ${se}L${mir(A.w + cs)} ${se}L${tr} 152L${tr} ${hem}`
    : `L${mir(A.e - hs)} 148L${mir(A.e + hs)} 148L${tr} 146L${tr} ${hem}`;
  const left = c.long
    ? `L${tl} ${hem}L${tl} 152L${A.w + cs} ${se}L${A.w - cs} ${se}L${A.s - hs} 124`
    : `L${tl} ${hem}L${tl} 146L${A.e + hs} 148L${A.e - hs} 148L${A.s - hs} 124`;
  // a polo drapes: sleeves hang a little open and the body curves in to a slightly flared hem
  const dPolo = `${neck}L${mir(X(28))} 104Q${mir(A.s - hs - 2)} 106 ${mir(A.s - hs)} 126L${mir(A.e - hs - 1)} 151Q${mir(A.e)} 154 ${mir(A.e + hs - 1)} 149L${mir(X(24))} 151C${mir(X(24))} 172 ${mir(X(22))} 195 ${mir(X(23))} 212Q60 217 ${X(23)} 212C${X(22)} 195 ${X(24)} 172 ${X(24)} 151L${A.e + hs - 1} 149Q${A.e} 154 ${A.e - hs - 1} 151L${A.s - hs} 126Q${A.s - hs - 2} 106 ${X(28)} 104Z`;
  const d = c.polo ? dPolo : `${neck}L${mir(X(28))} 104Q${mir(A.s - hs - 2)} 106 ${mir(A.s - hs)} 124${right}${left}Q${A.s - hs - 2} 106 ${X(28)} 104Z`;
  const gw = (mir(A.s - hs) - (A.s - hs)), id = "rep";
  // The trousers and belt start narrower than any shirt's hem (the narrowest is about 55 wide), so they never show beside a hem in the preview.
  const legs = `<path d="M${X(32)} 108L${mir(X(32))} 108L${tr} 200L${tl} 200Z" fill="${c.polo ? sk : c.base}" ${c.polo ? "" : `transform="translate(60 150) scale(.86 1) translate(-60 -150)"`}/><path d="M${X(34)} 196H${mir(X(34))}L${mir(X(22))} 280H${X(22)}Z" fill="#2b3a55"/><rect x="${X(34)}" y="196" width="${(mir(X(34)) - X(34)).toFixed(1)}" height="6" fill="#3a2a1c"/><rect x="57" y="195" width="6" height="5" rx="1" fill="#e0a42f"/><path d="M60 201V280" stroke="#0004" stroke-width="1"/>`;
  // The skin under a shirt only shows through the neck opening: cut to that opening, so no corner of it can stick out beside the collar on any shirt.
  const holeD = `M${X(42)} 80V99C${X(42)} 110 ${X(49)} 114 60 114C${mir(X(49))} 114 ${mir(X(42))} 110 ${mir(X(42))} 99V80Z`;
  const skin = `<rect x="${60 - nw / 2}" y="76" width="${nw}" height="30" rx="8" fill="${sk}"/>${c.polo ? `<path d="M${X(44)} 99.5H${mir(X(44))}L60 123Z" fill="${sk}"/>` : `<defs><clipPath id="nk-${id}"><path d="${holeD}"/></clipPath></defs><g clip-path="url(#nk-${id})"><path d="M${60 - nw / 2} 90H${60 + nw / 2}Q${60 + nw / 2} 98 ${mir(X(41))} 101V128H${X(41)}V101Q${60 - nw / 2} 98 ${60 - nw / 2} 90Z" fill="${sk}"/></g>`}${c.polo ? `<path d="M${X(48)} 108Q60 112 ${mir(X(48))} 108" stroke="#0002" stroke-width="1.4" fill="none"/>` : ""}`;
  // the photo is stretched so its hem always lands at HEM_Y, whatever the product's proportions
  const HEM_Y = 212, W = gw * c.Wk, vsFit = c.polo ? 1 : (HEM_Y - 99) * (c.bbox[2] - c.bbox[0]) / ((c.bbox[3] - c.bbox[1]) * W);
  const photo = c.polo ? poloCloth(c, X, mir) : placeImg(c.img, c.bbox, W, 99, false, vsFit);
  // where a point of the product photo (as fractions of the image) lands on the avatar
  const px = f => +(60 + (f - (c.bbox[0] + c.bbox[2]) / 2) * W / (c.bbox[2] - c.bbox[0])).toFixed(1), py = f => +(99 + (f - c.bbox[1]) * W / (c.bbox[2] - c.bbox[0]) * vsFit).toFixed(1);
  const lumB = [1, 3, 5].reduce((t, i) => t + parseInt(c.base.slice(i, i + 2), 16), 0) / 3, K = lumB > 170 ? .3 : lumB > 110 ? .65 : 1;   // light cloth needs far less shading
  const shade = `<linearGradient id="gs-${id}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="${(.3 * K).toFixed(2)}"/><stop offset=".2" stop-color="#000" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${(.3 * K).toFixed(2)}"/></linearGradient>`;
  // A photo tee is the whole garment: the product photo is stretched over shoulders, sleeves and hem as it is, with only
  // the neck opening cut out, so there is no second body shape behind it.
  const cutout = `M-30 80H${X(42)}V99C${X(42)} 110 ${X(49)} 114 60 114C${mir(X(49))} 114 ${mir(X(42))} 110 ${mir(X(42))} 99V80H150V320H-30Z`;
  // the raglan keeps the photo from the shoulder seams down the torso; the flared photo sleeves are cut off (the drawn sleeves cover that edge)
  const D = c.dsl, xt = D ? [px(D.torso[0]), px(D.torso[1])] : null, ay = D ? py(D.armpit) : 0;
  const xh = D ? (D.hem || D.torso).map(px) : null, yh = D ? Math.min(py(D.hemY || .96), 280) : 0;   // a relaxed tee flares from the armpit to the hem
  const capSleeve = D && !c.F && !D.box && D.shoulder != null;   // a man's tee gets cap sleeves, shaped like the Tequila On My Mind tee's; a woman's (and the raglan) get the boxier drawn sleeve
  const neckHole = `V99C${X(42)} 110 ${X(49)} 114 60 114C${mir(X(49))} 114 ${mir(X(42))} 110 ${mir(X(42))} 99V80`;
  const rcut = capSleeve ? `M${xt[0]} 80H${X(42)}${neckHole}H${xt[1]}V${ay}L${xh[1]} ${yh}V320H${xh[0]}V${yh}L${xt[0]} ${ay}Z` : D ? `M${X(42)} 99L${X(28)} 104L${A.s - hs + 1} 116L${xt[0]} ${ay}L${xh[0]} ${yh}L${xh[0]} 320L${xh[1]} 320L${xh[1]} ${yh}L${xt[1]} ${ay}L${mir(A.s - hs + 1)} 116L${mir(X(28))} 104L${mir(X(42))} 99C${mir(X(42))} 110 ${mir(X(49))} 114 60 114C${X(49)} 114 ${X(42)} 110 ${X(42)} 99Z` : "";
  const garmentPhoto = `<defs><clipPath id="gm-${id}"><path d="${D ? rcut : cutout}"/></clipPath></defs>
    <g clip-path="url(#gm-${id})">${photo}</g>
    <path d="${neck}" fill="none" stroke="${mixHex(c.base, "#000000", .14)}" stroke-width="1.5" stroke-linecap="round"/>`;
  const garment = c.polo ? `<defs>${shade}<clipPath id="gm-${id}"><path d="${d}"/></clipPath></defs>
    <path d="${d}" fill="${c.base}"/>
    <g clip-path="url(#gm-${id})">${photo}
      ${c.polo ? "" : `<rect x="0" y="95" width="120" height="${hem - 90}" fill="url(#gs-${id})"/>`}
      <path d="M${X(34)} 146Q${X(30)} ${hem - 20} ${X(28)} ${hem}M${X(86)} 146Q${X(90)} ${hem - 20} ${X(92)} ${hem}" stroke="#000" stroke-opacity="${(.1 * K).toFixed(2)}" stroke-width="3" fill="none"/>
      ${c.polo ? "" : `<ellipse cx="${tl}" cy="146" rx="5" ry="9" fill="#000" opacity="${(.16 * K).toFixed(2)}"/><ellipse cx="${tr}" cy="146" rx="5" ry="9" fill="#000" opacity="${(.16 * K).toFixed(2)}"/>`}</g>
    <path d="${d}" fill="none" stroke="#000" stroke-opacity="${(.24 * Math.max(K, .45)).toFixed(2)}" stroke-width="1" stroke-linejoin="round"/>
    `: garmentPhoto;
  // A polo is drawn, not pasted: the product photo can't be bent around a neck, so the cloth, collar, placket and buttons
  // are built to fit the body and only the real embroidered logo is cut from the photo.
  const open = c.polo ? poloCollar(c, X, mir) : "";
  // arms start below the sleeve, so no shoulder skin pokes out above a photo tee's sleeve
  let atL = null, atR = null;
  if (!c.polo && c.sl) {   // each photo's sleeves end in a different place, so the arms come out of the real sleeve openings
    atL = [px(c.sl[0][0]), py(c.sl[0][1]) - 9, 0]; atR = [px(c.sl[1][0]), py(c.sl[1][1]) - 9, 0];
    // below the sleeve the arm hangs against the side of the body, so there is no gap between arm and torso
    atL[2] = Math.max(atL[0], px(c.sl[0][2]) - fw / 2 + 1.5); atR[2] = Math.min(atR[0], px(c.sl[1][2]) + fw / 2 - 1.5);
  }
  // A drawn sleeve hangs from the shoulder over the arm and ends at the photo's cuff (3/4 on the raglan, above the elbow on a short-sleeve tee); the forearm
  // and hand show below it, against the torso edge. Its top follows the slope of the shoulder (outer corner low, inner corner up by the collar).
  let sleeves = "", hemY = null;
  if (D) {
    const cy = py(D.cuff), ya = 132, y1 = (ya + 174) / 2, short = cy <= y1 + 2 || !!D.loose, shade = D.shade ?? .3, f1 = n => +n.toFixed(1);
    const w0 = aw + 2, w1 = aw - .5, w2 = short ? aw + (D.flare ?? 8) : fw + 1.5, xe = (D.edge || D.torso).map(px);   // a short sleeve starts narrow at the shoulder and flares out to its cuff; xe: where the torso edge is at hand height
    atL = [A.s, ya, xe[0] - fw / 2 + 1.5]; atR = [mir(A.s), ya, xe[1] + fw / 2 - 1.5];
    const gid = Math.round(shade * 100);
    // cap sleeve: shoulder tip, a hem corner out beside the arm and the armpit, in the proportions of the Tequila On My Mind tee (43 tall, hem corner 10 above the armpit, 9 out from the arm)
    const capShape = (xt, s, dir) => {
      const ys = py(D.shoulder), k = (ay - ys) / 43.2, T = [f1(xt - dir * 1.3), f1(ys)], Oc = [f1(s + dir * 9.1), f1(ay - 9.8 * k)], Ia = [f1(xt - dir * .9), f1(ay)];
      return { T, Oc, Ia, hemAt: x => Oc[1] + (Ia[1] - Oc[1]) * (x - Oc[0]) / (Ia[0] - Oc[0]) };
    };
    const side_dir = side => (side === "L" ? -1 : 1);
    const caps = capSleeve ? [capShape(xt[0], atL[0], -1), capShape(xt[1], atR[0], 1)] : null;
    if (caps) { atL[1] = f1(caps[0].hemAt(atL[0]) + 1.5); atR[1] = f1(caps[1].hemAt(atR[0]) + 1.5); hemY = atL[1] - 1.5; }   // the arm starts at the hem, under the sleeve
    const sleeve = (at, side) => {
      if (caps) {
        const { T, Oc, Ia } = caps[side === "L" ? 0 : 1], lerp = (P, Q, d) => { const n = Math.hypot(Q[0] - P[0], Q[1] - P[1]); return [f1(P[0] + (Q[0] - P[0]) * d / n), f1(P[1] + (Q[1] - P[1]) * d / n)]; };
        // the outer hem corner is rounded off, and the top edge bows out a little, like cloth over a shoulder
        const A1 = lerp(Oc, T, 3.5), A2 = lerp(Oc, Ia, 3.5), Ct = [f1((T[0] + Oc[0]) / 2 + side_dir(side) * 1.6), f1((T[1] + Oc[1]) / 2 - 1.2)], shape = `M${T}Q${Ct} ${A1}Q${Oc} ${A2}L${Ia}Z`, edge = `M${T}Q${Ct} ${A1}Q${Oc} ${A2}L${Ia}`;
        const band = D.trim ? `<path d="M${Oc}L${Ia}L${lerp(Ia, T, 4.5)}L${lerp(Oc, T, 4.5)}Z" fill="${D.trim}"/>` : "";
        const speck = D.heather ? `<clipPath id="shc${side}"><path d="${shape}"/></clipPath><g clip-path="url(#shc${side})"><rect x="0" y="100" width="120" height="70" filter="url(#shr)" opacity="${D.heather}"/></g>` : "";
        return `<path d="${shape}" fill="${D.sleeve}"/>${speck}<path d="${shape}" fill="url(#rsh${gid})"/>${band}
          <path d="${edge}" fill="none" stroke="#000" stroke-opacity="${shade < .2 ? .2 : .3}" stroke-width="1" stroke-linejoin="round"/><path d="M${T}L${Ia}" fill="none" stroke="#000" stroke-opacity=".1" stroke-width="1"/>`;
      }
      const s = at[0], dir = s < 60 ? -1 : 1, e = (at[0] + at[2]) / 2;
      const along = y => (y <= y1 ? s + (e - s) * (y - ya) / (y1 - ya) : e + (at[2] - e) * (y - y1) / (182 - y1)), cx = along(cy);   // the arm bends at y1 and ends at y 182
      const O = [f1(s + dir * w0 / 2), 126], I = [f1(s - dir * w0 / 2), 114.5], C = [f1(s + dir * (w0 / 2 - 5)), 112.5];   // outer and inner shoulder corners, and the curve's pull
      const inEl = [f1(e - dir * w1 / 2), y1], outEl = [f1(e + dir * w1 / 2), y1], inCf = [f1(cx - dir * w2 / 2), cy], outCf = [f1(cx + dir * w2 / 2), cy];
      const down = short ? `L${inCf}L${outCf}` : `L${inEl}L${inCf}L${outCf}L${outEl}`, shape = `M${O}Q${C} ${I}${down}Z`;
      // a contrasting band at the cuff (a ringer tee), cut along the sleeve's own edges
      const at_ = (P, Q, y) => [f1(P[0] + (Q[0] - P[0]) * (y - P[1]) / (cy - P[1])), f1(y)], band = D.trim && short ? `<path d="M${at_(O, outCf, cy - 4.5)}L${outCf}L${inCf}L${at_(I, inCf, cy - 4.5)}Z" fill="${D.trim}"/>` : "";
      // a speckle over heathered cloth, so a drawn sleeve matches the photo's body
      const speck = D.heather ? `<clipPath id="shc${side}"><path d="${shape}"/></clipPath><g clip-path="url(#shc${side})"><rect x="0" y="100" width="120" height="70" filter="url(#shr)" opacity="${D.heather}"/></g>` : "";
      return `<path d="${shape}" fill="${D.sleeve}"/>${speck}<path d="${shape}" fill="url(#rsh${gid})"/>${band}
        <path d="M${I}${down}L${O}" fill="none" stroke="#000" stroke-opacity="${shade < .2 ? .2 : .3}" stroke-width="1" stroke-linejoin="round"/>`;
    };
    sleeves = `<defs><linearGradient id="rsh${gid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="${shade}"/><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${shade}"/></linearGradient>${D.heather ? '<filter id="shr" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 .5 -.12"/></filter>' : ""}</defs>${sleeve(atL, "L")}${sleeve(atR, "R")}`;
  }
  const cuffY = D ? (hemY ?? py(D.cuff)) : c.polo ? 152 : atL ? atL[1] + 9 : 0;   // where the sleeve ends, for the shadow under it
  const arms = c.polo ? arm(false, undefined, cuffY) + arm(true, undefined, cuffY) : atL ? arm(false, atL, cuffY) + arm(true, atR, cuffY) : `<defs><clipPath id="armclip"><rect x="-30" y="134" width="180" height="200"/></clipPath></defs><g clip-path="url(#armclip)">${arm(false)}${arm(true)}</g>`;
  // the strip that keeps a rounded or scooped hem from showing the trousers under it
  const hf = c.hemFill, hemFill = hf && !c.polo ? `<rect x="${px(hf[0])}" y="${(py(hf[2]) - 2).toFixed(1)}" width="${(px(hf[1]) - px(hf[0])).toFixed(1)}" height="${(220 - py(hf[2]) + 2).toFixed(1)}" fill="${c.base}"/>` : "";
  return { torso: legs + hemFill + arms + skin + garment + open + sleeves };
}

const FACES = {
  Oval: "M32 52C32 28 46 16 60 16S88 28 88 52C88 76 76 92 60 92S32 76 32 52Z",
  Round: "M30 54C30 30 44 18 60 18S90 30 90 54C90 78 76 90 60 90S30 78 30 54Z",
  Square: "M33 32C33 22 44 17 60 17S87 22 87 32V62C87 82 74 92 60 92S33 82 33 62Z",
  Heart: "M31 44C31 26 46 16 60 16S89 26 89 44C89 66 74 92 60 92S31 66 31 44Z",
  Long: "M34 50C34 26 46 12 60 12S86 26 86 50C86 76 75 96 60 96S34 76 34 50Z",
};
// Illustrated people (SVG), drawn in a 120x200 local box. Swap for photos or video later.
function person(o) {
  const face = o.face || FACES.Oval, id = o.id || "p", body = o.body || "M6 200C6 116 32 100 60 100S114 116 114 200Z";
  const eye = o.eye || "#3b2a1c", brow = o.brow || o.hair;
  const legacy = `<clipPath id="bd-${id}"><path d="${body}"/></clipPath>
    <path d="${body}" fill="${o.shirt}"/>
    <g clip-path="url(#bd-${id})">${o.front || ""}</g>
    ${o.shirtImg || ""}
    ${o.arms || ""}
    <rect x="${60 - (o.neckW || 20) / 2}" y="82" width="${o.neckW || 20}" height="24" rx="8" fill="${o.skin}"/>`;
  const eyeAt = x => `<ellipse cx="${x}" cy="54" rx="4.4" ry="4.2" fill="#fff"/><circle cx="${x}" cy="54.3" r="3" fill="${eye}"/><circle cx="${x}" cy="54.3" r="1.4" fill="#111"/><circle cx="${x + 1.3}" cy="52.8" r="1" fill="#fff"/>`;
  return `${o.back || ""}
    ${o.human ? o.torso : legacy}
    <ellipse cx="${60 - (o.earX || 29)}" cy="56" rx="5" ry="8" fill="${o.skin}"/><ellipse cx="${60 + (o.earX || 29)}" cy="56" rx="5" ry="8" fill="${o.skin}"/>
    ${o.ears || ""}
    <clipPath id="fc-${id}"><path d="${face}"/></clipPath>
    <path d="${face}" fill="${o.skin}"/>
    ${o.blush === false ? "" : '<ellipse class="blush" cx="42" cy="68" rx="6" ry="4" fill="#d9605533"/><ellipse class="blush" cx="78" cy="68" rx="6" ry="4" fill="#d9605533"/>'}
    ${o.hairFront}
    <path class="brow bl" d="M40 46Q47 42 54 46" stroke="${brow}" stroke-width="${o.browW || 3}" fill="none" stroke-linecap="round"/><path class="brow br" d="M66 46Q73 42 80 46" stroke="${brow}" stroke-width="${o.browW || 3}" fill="none" stroke-linecap="round"/>
    <g class="eyes">${eyeAt(47)}${eyeAt(73)}${o.lashes || ""}</g>
    ${o.hat || ""}
    <path d="M60 56Q56 66 61 68" stroke="#0003" stroke-width="2" fill="none" stroke-linecap="round"/>
    ${o.beard || ""}
    ${o.over || ""}
    <ellipse class="mouth${o.smile ? " hid" : ""}" cx="60" cy="${o.my}" rx="6.5" ry="2" fill="${o.lip}"${o.smile ? ' opacity="0"' : ""}/>
    ${o.smile ? smileShape(o) : ""}
    ${faceMouths(o)}
    ${o.glasses || ""}`;
}
// Mouths for the customer's reactions (smile, grin, flat, frown). All are hidden until a customer's face is set (see data-x in the CSS).
function faceMouths(o) {
  const y = Number(o.my) || 78, lip = /^#[0-9a-f]{6}$/i.test(o.lip || "") ? o.lip : "#7a3b30", c = o.beard ? mixHex(lip, "#ffffff", .55) : mixHex(lip, "#000000", .25);
  return `<g class="xm" fill="none" stroke="${c}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
    <path class="xm-smile" d="M52.5 ${y - 1.5}Q60 ${y + 5} 67.5 ${y - 1.5}"/><path class="xm-grin" d="M50.5 ${y - 2}Q60 ${y + 9.5} 69.5 ${y - 2}Z" fill="#fff" stroke-width="1.5"/>
    <path class="xm-flat" d="M53.5 ${y + .6}L66 ${y - .4}"/><path class="xm-frown" d="M52.5 ${y + 2.2}Q60 ${y - 3.6} 67.5 ${y + 2.2}"/></g>`;
}
// Smile styles for the rep (the Smile row in the creator). The first is the plain mouth every character starts with. The others are drawn over it
// and hide while the rep talks, so the lip-sync still works (see .talking in the CSS).
const SMILES = ["Neutral", "Soft smile", "Warm smile", "Big smile", "Grin", "Smirk", "Laugh"];
function smileShape(o) {
  const y = Number(o.my) || 77, lip = /^#[0-9a-f]{6}$/i.test(o.lip || "") ? o.lip : "#7a3b30", line = o.beard ? mixHex(lip, "#ffffff", .55) : mixHex(lip, "#000000", .22);
  const stroke = (d, w = 1.7) => `<path d="${d}" fill="none" stroke="${line}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const S = {
    "Soft smile": stroke(`M54 ${y - 1}Q60 ${y + 3.4} 66 ${y - 1}`),
    "Warm smile": stroke(`M52 ${y - 1.6}Q60 ${y + 5.4} 68 ${y - 1.6}`) + stroke(`M51 ${y - 2.6}Q50 ${y - 1.4} 51.2 ${y - .3}M69 ${y - 2.6}Q70 ${y - 1.4} 68.8 ${y - .3}`, 1.1),
    "Big smile": `<path d="M50 ${y - 2.4}Q60 ${y + 10} 70 ${y - 2.4}Q60 ${y + .8} 50 ${y - 2.4}Z" fill="#fff" stroke="${line}" stroke-width="1.5" stroke-linejoin="round"/>`,
    "Grin": `<path d="M48.5 ${y - 2.6}H71.5Q70 ${y + 8.6} 60 ${y + 9}Q50 ${y + 8.6} 48.5 ${y - 2.6}Z" fill="#fff" stroke="${line}" stroke-width="1.5" stroke-linejoin="round"/>` + stroke(`M49.6 ${y + 1.6}H70.4`, .6),
    "Smirk": stroke(`M53.5 ${y + .6}Q60 ${y + 1.3} 65 ${y - .3}Q67.6 ${y - 1.2} 69 ${y - 3.4}`) + stroke(`M69.8 ${y - 1.2}Q71.4 ${y - 2.2} 70.8 ${y - 4}`, 1.1),
    "Laugh": `<path d="M50 ${y - 2.6}Q60 ${y - .8} 70 ${y - 2.6}Q68.6 ${y + 10.6} 60 ${y + 11}Q51.4 ${y + 10.6} 50 ${y - 2.6}Z" fill="#4a1d1d" stroke="${line}" stroke-width="1.4" stroke-linejoin="round"/>` +
      `<path d="M51.2 ${y - 2.1}Q60 ${y - .4} 68.8 ${y - 2.1}L68.2 ${y + 1.8}Q60 ${y + 3} 51.8 ${y + 1.8}Z" fill="#fff"/><ellipse cx="60" cy="${y + 7.8}" rx="3.9" ry="2.3" fill="#d9605a"/>`,
  };
  return S[o.smile] ? `<g class="smilev">${S[o.smile]}</g>` : "";
}
const MARCO_LOOK = {
  id: "m", skin: "#c58f64", hair: "#231710", my: 80, lip: "#6b3228",   // the mouth sits over the beard; without these it was drawn above his head
  front: '<path d="M42 118H78L86 200H34Z" fill="#23201e"/><path d="M47 104L43 120M73 104L77 120" stroke="#23201e" stroke-width="5" stroke-linecap="round"/>' +
         '<path d="M82 104L102 120L94 138L76 120Z" fill="#f2ebe0"/><path d="M86 112L96 124" stroke="#c9503a" stroke-width="3"/>',
  hairFront: '<path d="M30 54C25 24 44 9 62 10C82 11 95 28 90 54C89 44 85 34 79 30C66 38 46 36 36 29C32 35 30 44 30 54Z" fill="#231710"/><path d="M44 17C54 13 66 13 76 18" stroke="#4a3426" stroke-width="2" fill="none" stroke-linecap="round"/>',
  beard: '<path d="M32 58C33 86 44 98 60 98C76 98 87 86 88 58C86 68 82 71 77 71C71 66 49 66 43 71C38 71 34 68 32 58Z" fill="#231710"/><path d="M46 71C52 65 68 65 74 71C68 74 52 74 46 71Z" fill="#231710"/>',
};
