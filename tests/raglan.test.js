// Checks the Pickleball Raglan on the avatar: the body comes from the photo, the sleeves are drawn hanging over the arms, and nothing is left floating.
// Run from the mock-prototype folder: node tests/raglan.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };

// just the body-drawing code from the page, run on its own
const ctx = vm.createContext({});
vm.runInContext(html.match(/^const OUT = .*;$/m)[0] + html.match(/^const mixHex = .*;$/m)[0] + html.match(/^const placeImg = [\s\S]*?^};$/m)[0] + html.slice(html.indexOf("const capsule ="), html.indexOf("const FACES = {")).replace(/^function hangHand[\s\S]*?^}\n/m, m => m), ctx);
const O = vm.runInContext(html.match(/  "Pickleball Raglan": \{[\s\S]*?dsl: \{[^}]*\} \},/)[0].replace(/^  "Pickleball Raglan": /, "IMG = ''; ({").replace(/ \},$/, " })").replace("({{", "({").replace(/img: IMG \+ "[^"]*"/, 'img: "raglan.png"'), ctx);
const body = (extra = {}, F = false) => vm.runInContext(`humanBody(${JSON.stringify({ F, skin: "#e0b090", base: O.base, img: O.img, bbox: O.bbox, Wk: O.Wk, long: false, hem: O.hem, v: false, polo: false, dsl: O.dsl, ...extra })}).torso`, ctx);

ok("the raglan has what it needs to be drawn: the sleeve colour, the torso edges, the armpit and the cuff", O.dsl && /^#[0-9a-f]{6}$/.test(O.dsl.sleeve) && O.dsl.torso[0] < O.dsl.torso[1] && O.dsl.armpit > 0.2 && O.dsl.armpit < O.dsl.cuff && O.dsl.cuff < 0.7);
ok("it no longer uses the flared photo sleeves as the arm openings", !/"Pickleball Raglan": \[\[/.test(html));
ok("the creator passes the raglan's data on to the body", /dsl: O\.dsl, sl: SLEEVE/.test(html));

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
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
