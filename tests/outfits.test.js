// Checks how some outfits are drawn on the avatar. The shirts whose photo sleeves splay out sideways (Mas Tequila, Classic, Delivery, Smuggler, Worth the Shot, the
// Era tees, the Pickleball Raglan): the body comes from the photo and the sleeves are drawn over the arms, as cap sleeves for a man (shaped like the Tequila On My Mind
// tee) and as a boxier sleeve for a woman. The polos: the skin behind the V stays inside the V. Every photo shirt: no neck skin beside the collar.
// Run from the mock-prototype folder: node tests/outfits.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };

// just the body-drawing code from the page, run on its own
const ctx = vm.createContext({});
vm.runInContext(html.match(/^const OUT = .*;$/m)[0] + html.match(/^const mixHex = .*;$/m)[0] + html.match(/^const placeImg = [\s\S]*?^};$/m)[0] + html.slice(html.indexOf("const capsule ="), html.indexOf("const FACES = {")).replace(/^function hangHand[\s\S]*?^}\n/m, m => m), ctx);
vm.runInContext(html.slice(html.indexOf("const FIT = {"), html.indexOf("\n};\n", html.indexOf("const DRAWN = {")) + 4), ctx);   // FIT and DRAWN
const DR = vm.runInContext("DRAWN", ctx);
const entry = name => vm.runInContext("(" + html.match(new RegExp('  "' + name.replace(/[()]/g, "\\$&") + '": (\\{[\\s\\S]*?\\}),\\n(?:  "|\\};)'))[1].replace(/IMG \+ ("[^"]*")/g, "$1") + ")", ctx);
const O = { ...entry("Pickleball Raglan"), dsl: DR["Pickleball Raglan"] };
const body = (extra = {}, F = false) => vm.runInContext(`humanBody(${JSON.stringify({ F, skin: "#e0b090", base: O.base, img: O.img, bbox: O.bbox, Wk: O.Wk, long: false, hem: O.hem, v: false, polo: false, dsl: O.dsl, ...extra })}).torso`, ctx);
const shirt = (name, F = false, extra = {}) => { const e = entry(name); return vm.runInContext(`humanBody(${JSON.stringify({ F, skin: "#e0b090", base: e.base, img: e.img, bbox: e.bbox, Wk: e.Wk, long: false, hem: e.hem, v: false, polo: false, dsl: DR[name], ...extra })}).torso`, ctx); };

ok("the raglan has what it needs to be drawn: the sleeve colour, the torso edges, the armpit and the cuff", O.dsl && /^#[0-9a-f]{6}$/.test(O.dsl.sleeve) && O.dsl.torso[0] < O.dsl.torso[1] && O.dsl.armpit > 0.2 && O.dsl.armpit < O.dsl.cuff && O.dsl.cuff < 0.7);
ok("it no longer uses the flared photo sleeves as the arm openings", !/"Pickleball Raglan": \[\[/.test(html));
ok("the creator passes the drawn-sleeve data on to the body (the women's cut has its own, keyed with an F)", /dsl: DRAWN\[A\.outfit \+ \(useF \? "F" : ""\)\], sl: SLEEVE/.test(html));

for (const [label, F] of [["a male build", false], ["a female build", true]]) {
  const out = body({}, F), plain = body({ dsl: undefined }, F);
  const sleeves = [...out.matchAll(/<path d="(M[^"]+Z)" fill="#262c39"\/>/g)].map(m => m[1]);
  ok(`${label}: two navy sleeves are drawn, one per arm`, sleeves.length === 2);
  ok(`${label}: the photo's flared sleeves are cut off (the clip stops at the torso below the armpit)`, /<clipPath id="gm-rep"><path d="M[^"]*L[^"]*L[^"]*L[^"]*L[^"]*V?[^"]*"/.test(out) && !/<clipPath id="gm-rep"><path d="M-30 80H/.test(out) && /<clipPath id="gm-rep"><path d="M-30 80H/.test(plain));
  // the sleeve's inner edge at the cuff reaches the torso edge, so there is no gap between arm and body
  const clip = out.match(/<clipPath id="gm-rep"><path d="([^"]+)"/)[1], pts = [...clip.matchAll(/L(-?[\d.]+) (-?[\d.]+)/g)].map(m => [+m[1], +m[2]]);
  const armpitL = pts[2], armpitR = pts[pts.length - 4 + 0];   // left armpit is the third corner; the right one mirrors it
  const nums = d => [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map(m => +m[0]);
  const [L, R] = sleeves.map(nums);
  const cuffL = [L[L.length - 6], L[L.length - 4]], cuffR = [R[R.length - 6], R[R.length - 4]];   // x of the two cuff corners
  ok(`${label}: the left sleeve's inner edge reaches the torso edge, so no gap shows beside the body`, Math.max(...cuffL) >= armpitL[0] - 0.5, `${Math.max(...cuffL)} vs ${armpitL[0]}`);
  ok(`${label}: the sleeves end at the same height on both sides, partway down the forearm`, L[9] === R[9] && L[9] > 150 && L[9] < 180, "cuff y " + L[9]);
  ok(`${label}: the forearm and hand are drawn below the sleeve (skin shows under the cuff)`, (out.match(/<line [^>]*stroke="#e0b090"/g) || []).length >= 4 && (out.match(/<path [^>]*fill="#e0b090"/g) || []).length >= 4);
  ok(`${label}: other photo tees are drawn exactly as before (no navy sleeves, the old clip)`, !/#262c39/.test(plain) && !/url\(#rsh\)/.test(plain));
}

// the neck: on every photo shirt the skin behind it is cut to the neck opening, so no corner of it can show beside the collar
const holeOf = out => out.match(/<clipPath id="nk-rep"><path d="([^"]+)"/);
for (const [label, F] of [["a male build", false], ["a female build", true]]) {
  const out = body({}, F), hole = holeOf(out), cut = out.match(/<clipPath id="gm-rep"><path d="([^"]+)"/)[1], plainOut = body({ dsl: undefined }, F), plainCut = plainOut.match(/<clipPath id="gm-rep"><path d="([^"]+)"/)[1];
  ok(`${label}: the skin patch under a photo shirt sits inside a clip`, !!hole && /<g clip-path="url\(#nk-rep\)"><path d="M[^"]*" fill="#e0b090"\/><\/g>/.test(out));
  ok(`${label}: the clip is exactly the neck opening that is cut out of the shirt photo`, hole && /V99(C[^V]+)V80Z$/.test(hole[1]) && hole[1].match(/V99(C[^V]+)V80Z$/)[1] === (plainCut.match(/V99(C[^V]+)V80H/) || [])[1], hole ? hole[1] : "no clip");
  ok(`${label}: no skin patch is left outside that clip`, !/V128H/.test(out.replace(/<g clip-path="url\(#nk-rep\)">[\s\S]*?<\/g>/, "")));
}

// the women's Tequila Era tee: its photo sleeves flare out sideways, so short sleeves are drawn over the arms and the hands come out of them
const era = { ...entry("In My Tequila Era Tee (Charcoal)"), dslF: DR["In My Tequila Era Tee (Charcoal)F"] };
const womens = (extra = {}) => vm.runInContext(`humanBody(${JSON.stringify({ F: true, skin: "#e0b090", base: era.baseF, img: era.imgF, bbox: era.bboxF, Wk: era.Wk, long: false, hem: era.hem, v: false, polo: false, dsl: era.dslF, ...extra })}).torso`, ctx);
{
  const out = womens(), sleeves = [...out.matchAll(/<path d="(M[^"]+Z)" fill="#eeeeec"\/>/g)].map(m => m[1]), nums = d => [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map(m => +m[0]);
  ok("women's Era tee has what it needs to be drawn: sleeve colour, torso edges, the flare to the hem, armpit and cuff", era.dslF && era.dslF.torso[0] > era.dslF.hem[0] && era.dslF.edge[0] <= era.dslF.torso[0] && era.dslF.cuff > era.dslF.armpit - 0.1 && era.dslF.cuff < era.dslF.armpit);
  ok("two short sleeves are drawn, one per arm, and they end at the same height", sleeves.length === 2 && nums(sleeves[0])[7] === nums(sleeves[1])[7], "cuff y " + (sleeves[0] ? nums(sleeves[0])[7] : "none"));
  const [L] = sleeves.map(nums);
  ok("a short sleeve ends above the elbow (it has no elbow corner) and flares out from the shoulder to the cuff", L.length === 10 && L[7] > 135 && L[7] < 156 && Math.abs(L[6] - L[8]) > Math.abs(L[0] - L[4]), `top ${Math.abs(L[0] - L[4]).toFixed(1)} cuff ${Math.abs(L[6] - L[8]).toFixed(1)} at y ${L[7]}`);
  const cut = out.match(/<clipPath id="gm-rep"><path d="([^"]+)"/)[1], pts = [...cut.matchAll(/L(-?[\d.]+) (-?[\d.]+)/g)].map(m => [+m[1], +m[2]]);
  ok("the photo is cut along the torso, which flares from the armpit to the hem, so the photo sleeves are gone and the hem is whole", pts[3][0] < pts[2][0] && pts[3][1] > pts[2][1] + 30, `armpit ${pts[2]} hem ${pts[3]}`);
  ok("the forearms and hands are drawn under the sleeves", (out.match(/<line [^>]*stroke="#e0b090"/g) || []).length >= 4 && (out.match(/<path [^>]*fill="#e0b090"/g) || []).length >= 4);
  ok("the men's Era tee and every other shirt are drawn as before", !/#eeeeec/.test(body({ dsl: undefined }, false)));
}

// the cuff of every sleeve casts a soft shadow on the arm just below it, so the arm reads as coming out of the sleeve
for (const [label, F] of [["a male build", false], ["a female build", true]]) {
  const out = body({}, F), cuffY = +out.match(/<path d="M[^"]+" fill="#262c39"\/>/)[0].match(/-?\d+(?:\.\d+)?/g)[9];   // where the drawn sleeve ends
  const grads = [...out.matchAll(/<linearGradient id="(cs\d+)" gradientUnits="userSpaceOnUse" x1="0" y1="([\d.]+)" x2="0" y2="([\d.]+)">/g)];
  ok(`${label}: both arms get a shadow that starts at the sleeve's cuff and fades out within 9 units`, grads.length === 2 && grads.every(g => Math.abs(+g[2] - cuffY) < 0.01 && Math.abs(+g[3] - (+g[2] + 9)) < 0.01), grads.map(g => g[2]).join());
  ok(`${label}: the shadow is drawn on the arm itself (a line in the arm's own width, using that gradient)`, (out.match(/<line [^>]*stroke="url\(#cs\d+\)"[^>]*stroke-width="[\d.]+"\/>/g) || []).length === 2);
  const poloOut = vm.runInContext(`humanBody(${JSON.stringify({ F, skin: "#e0b090", base: "#10264a", Wk: 1, hem: 208, v: true, polo: true, bbox: [0, 0, 1, 1], logo: { img: "logo.png", box: [.553, .242, .678, .306] } })}).torso`, ctx);
  ok(`${label}: a polo's arms get the shadow under its sleeve too`, (poloOut.match(/stroke="url\(#cs152\)"/g) || []).length === 2);
}

// the shirts on the list get drawn sleeves; a man's are cap sleeves shaped like the Tequila On My Mind tee's, a woman's the boxier sleeve of the women's Era tee
const LIST = Object.keys(DR).filter(k => !/\)F$/.test(k) && k !== "Pickleball Raglan");
ok(`${LIST.length} shirts have drawn sleeves: Mas Tequila, the Era tees, both Delivery tees, Worth the Shot, Smuggler, Spirit Animal and every Classic colour`, LIST.length === 24 && ["Spirit Animal Tee", "Mas Tequila Tee (White)", "In My Tequila Era Tee (Military Green)", "Tequila Delivery Tee", "Tequila Delivery 24/7 Oversized Tee (Vintage White)", "Worth the Shot Tee", "Tequila Smuggler Tee", "Corrido Classic Tee (Brown Savana)"].every(k => LIST.includes(k)));
ok("the shirts that already looked right (On My Mind, Mexico Es Chingon, Legacy, D.A.R.E., the Logo tees) are left as they were", ["Tequila On My Mind Tee", "Mexico Es Chingón Tee", "Legacy Tee", "D.A.R.E. Oversized Tee", "Corrido Logo Tee (Dark Grey Heather)", "Tequila On My Mind Tri-Blend Tee"].every(k => !(k in DR)));
const nums = d => [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map(m => +m[0]);
let badCap = [], badArm = [], badShadow = [], badBox = [];
for (const k of LIST) {
  const col = DR[k].sleeve, out = shirt(k, false), caps = [...out.matchAll(new RegExp(`<path d="(M[\\d.]+,[\\d.]+Q[^"]+Z)" fill="${col}"/>`, "g"))].map(m => nums(m[1]));
  if (caps.length !== 2 || !caps.every(n => n.length === 12)) { badCap.push(k + " (no cap sleeves)"); continue; }
  const [L] = caps, T = [L[0], L[1]], Oc = [L[6], L[7]], Ia = [L[10], L[11]], h = Ia[1] - T[1];
  if (!(T[1] < Oc[1] && Oc[1] < Ia[1] && Oc[0] < T[0] && h > 25 && h < 60 && Ia[1] - Oc[1] > 5 && Ia[1] - Oc[1] < 15)) badCap.push(`${k}: T${T} Oc${Oc} Ia${Ia}`);
  if (!/<clipPath id="gm-rep"><path d="M[\d.]+ 80H[\d.]+V99C/.test(out)) badCap.push(k + " (photo not cut at the torso edge)");
  const skin = [...out.matchAll(/<line x1="([\d.]+)" y1="([\d.]+)" x2="[\d.]+" y2="[\d.]+" stroke="#e0b090"/g)][0], hemAt = x => Oc[1] + (Ia[1] - Oc[1]) * (x - Oc[0]) / (Ia[0] - Oc[0]);
  if (!(+skin[2] >= hemAt(+skin[1]) - 0.05)) badArm.push(`${k}: arm starts at ${skin[2]}, hem is at ${hemAt(+skin[1]).toFixed(1)}`);
  const g = out.match(/<linearGradient id="cs\d+" gradientUnits="userSpaceOnUse" x1="0" y1="([\d.]+)"/);
  if (!g || Math.abs(+g[1] - (+skin[2] - 1.5)) > 0.2) badShadow.push(k + " " + (g ? g[1] : "none"));
  const outF = shirt(k, true), boxy = [...outF.matchAll(new RegExp(`<path d="(M[^"]+Z)" fill="${col}"/>`, "g"))];
  if (boxy.length !== 2 || /Q[^QL]*Q/.test(boxy[0][1])) badBox.push(k);
}
ok("a man's drawn sleeve is a cap: shoulder tip above a hem corner out beside the arm, above the armpit, about as tall as a real sleeve", badCap.length === 0, badCap.slice(0, 3).join(" | "));
ok("his arms start at the sleeve's slanted hem, so no skin shows above it", badArm.length === 0, badArm.slice(0, 3).join(" | "));
ok("each arm gets the soft shadow starting at that hem", badShadow.length === 0, badShadow.slice(0, 3).join(" | "));
ok("a woman gets the boxier sleeve (like the women's Era tee) on every one of those shirts", badBox.length === 0, badBox.slice(0, 3).join(" | "));
ok("a ringer tee (Worth the Shot) has its black cuff band, and a heathered tee has its speckle", /fill="#151515"/.test(shirt("Worth the Shot Tee", false)) && /fill="#151515"/.test(shirt("Worth the Shot Tee", true)) && /<filter id="shr"/.test(shirt("Tequila Delivery Tee", false)) && /<filter id="shr"/.test(shirt("Corrido Classic Tee (Dark Heather)", true)) && !/<filter id="shr"/.test(shirt("Corrido Classic Tee (Black)", false)));
ok("the Pickleball Raglan keeps its 3/4 box sleeves for a man as well (a cap sleeve would not reach the forearm)", DR["Pickleball Raglan"].box === true && /Q[^QL]*L/.test(body({}, false).match(/<path d="(M[^"]+Z)" fill="#262c39"\/>/)[1]) && !/Q[^QL]*Q/.test(body({}, false).match(/<path d="(M[^"]+Z)" fill="#262c39"\/>/)[1]));

// polos: the neck skin behind the V never pokes out beside the collar wings
const polo = (F = false) => vm.runInContext(`humanBody(${JSON.stringify({ F, skin: "#e0b090", base: "#10264a", Wk: 1, hem: 208, v: true, polo: true, bbox: [0, 0, 1, 1], logo: { img: "logo.png", box: [.553, .242, .678, .306] } })}).torso`, ctx);
for (const [label, F] of [["a male build", false], ["a female build", true]]) {
  const out = polo(F), patch = [...out.matchAll(/<path d="M(-?[\d.]+) (-?[\d.]+)H(-?[\d.]+)L60 (-?[\d.]+)Z" fill="#e0b090"\/>/g)];
  const wingTip = Math.min(...[...out.matchAll(/<path d="M(-?[\d.]+) 96\.5L/g)].map(m => +m[1]));   // the collar wing's outer tip, as x
  ok(`${label}: the skin behind the polo's V is a triangle that ends in the V's point (no wide patch with corners)`, patch.length === 1 && !/V124H/.test(out), "patches " + patch.length);
  ok(`${label}: its corners sit inside the collar wings and not above the shoulder line, so none shows at the sides`, patch.length === 1 && +patch[0][1] >= wingTip && +patch[0][3] <= 120 - wingTip && +patch[0][2] >= 99, patch[0] ? `${patch[0][1]}..${patch[0][3]} at y ${patch[0][2]}, wing tip ${wingTip}` : "no patch");
}
ok("other outfits keep their own neck skin (only the polos changed)", /\$\{c\.polo \? `<path d="M\$\{X\(44\)\} 99\.5H/.test(html) && /V128H\$\{X\(41\)\}V101Q/.test(html));
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
