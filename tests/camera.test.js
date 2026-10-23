// Checks the face maths of the camera coach with fake landmarks. Run:  node tests/camera.test.js
const { frameSignals } = require("../camera.js");
const face = (o = {}) => { const lm = Array.from({ length: 478 }, () => ({ x: .5, y: .5 }));
  const d = { nose: { x: .5, y: .52 }, cL: { x: .38, y: .5 }, cR: { x: .62, y: .5 }, chin: { x: .5, y: .72 }, eA: { x: .44, y: .44 }, eB: { x: .56, y: .44 }, ...o };
  lm[1] = d.nose; lm[234] = d.cL; lm[454] = d.cR; lm[152] = d.chin; lm[33] = d.eA; lm[263] = d.eB; return lm; };
const cases = [
  ["facing the camera", face(), {}, { present: true, eye: true, posture: true, smile: false }],
  ["head turned away", face({ nose: { x: .58, y: .52 } }), {}, { eye: false }],
  ["head tilted", face({ eA: { x: .44, y: .40 }, eB: { x: .56, y: .50 } }), {}, { posture: false }],
  ["looking down", face({ nose: { x: .5, y: .62 } }), {}, { posture: false }],
  ["eyes looking away", face(), { eyeLookOutLeft: .8 }, { eye: false }],
  ["smiling", face(), { mouthSmileLeft: .6, mouthSmileRight: .5 }, { smile: true }],
  ["no face", null, {}, { present: false }],
];
let bad = 0;
for (const [name, lm, bs, want] of cases) {
  const got = frameSignals(lm, bs);
  const ok = Object.entries(want).every(([k, v]) => got[k] === v);
  console.log(ok ? "ok  " : "FAIL", name, JSON.stringify(got)); if (!ok) bad++;
}
process.exit(bad ? 1 : 0);
