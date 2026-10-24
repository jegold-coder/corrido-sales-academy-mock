// Checks the tone rules: the words, and the voice maths on synthetic audio. Run: node tests/tone.test.js
const { Tone } = require("../tone.js");
let fails = 0;
const ok = (name, cond, extra = "") => { console.log((cond ? "ok   " : "FAIL ") + name + (extra ? " " + extra : "")); if (!cond) fails++; };

// ---- words ----
const warm = { name: "warm and friendly", warm: true, lively: true, pace: [115, 175] };
const steady = { name: "calm and steady", steady: true, firm: true, pace: [115, 165] };
const plain = { name: "patient and simple", warm: true, plain: true, pace: [100, 150] };
const t = (txt, p) => Tone.score(txt, p, null);
ok("warm, polite answer keeps full tone", t("Thanks for asking. I'd love a few minutes to tell you about it.", warm).pts === 1);
ok("flat, cold answer loses points in a warm situation", t("We make tequila. Order it.", warm).pts < 1);
ok("the same cold answer is fine when warmth isn't called for", t("We make tequila. It has three ingredients.", { name: "polished", pace: [120, 170] }).pts === 1);
ok("snapping back costs points", t("Wow, that's rude. Calm down, you're wrong.", steady).pts <= .5);
ok("grovelling costs points when steady is needed", t("I'm so sorry to bother you, I know you hate reps, I'll be out of your way.", steady).pts < t("Fair enough, I'll be quick.", steady).pts);
ok("bad language is penalised", t("This damn tequila is great, thanks.", warm).pts < t("This tequila is great, thanks.", warm).pts);
ok("jargon costs points for a confused customer", t("Thanks, happy to help. The wholesale margin and sell-through are strong.", plain).pts < t("Thanks, happy to help. It has only three ingredients.", plain).pts);

// ---- voice maths on synthetic audio ----
const sr = 16000;
function speech({ secs, f0 = 180, wobble = 0, amp = .2, gaps = [] }) {
  const x = new Float32Array(Math.round(secs * sr));
  for (let i = 0; i < x.length; i++) {
    const s = i / sr; if (gaps.some(([a, b]) => s >= a && s < b)) continue;
    const syl = .5 + .5 * Math.sin(2 * Math.PI * 4 * s);                    // about four syllables a second
    const f = f0 * (1 + wobble * Math.sin(2 * Math.PI * .8 * s));             // pitch moves up and down
    x[i] = amp * syl * (Math.sin(2 * Math.PI * f * s) + .4 * Math.sin(4 * Math.PI * f * s));
  }
  return x;
}
const m1 = Tone.analyzeSamples(speech({ secs: 12, wobble: .25 }), sr);
ok("finds speech in a recording", m1.ok && m1.spanSecs > 10);
ok("a lively voice has pitch movement", m1.pitchStd != null && m1.pitchStd > 1.8, `(${m1.pitchStd && m1.pitchStd.toFixed(1)} semitones)`);
const m2 = Tone.analyzeSamples(speech({ secs: 12, wobble: 0 }), sr);
ok("a flat voice has little pitch movement", m2.pitchStd != null && m2.pitchStd < 1.2, `(${m2.pitchStd && m2.pitchStd.toFixed(1)} semitones)`);
ok("long pauses are counted", Tone.analyzeSamples(speech({ secs: 14, gaps: [[3, 4.5], [6, 7.5], [9, 10.5]] }), sr).pauses >= 3);
const quiet = Tone.analyzeSamples(speech({ secs: 8, amp: .004 }), sr);
ok("a very quiet recording is read as quiet", !quiet.ok || quiet.db < -40, quiet.ok ? `(${quiet.db.toFixed(0)} dB)` : "(too quiet to analyse)");
const loud = Tone.analyzeSamples(speech({ secs: 8, amp: .9 }), sr);
ok("a very loud recording is read as loud", loud.ok && loud.db > -8, loud.ok ? `(${loud.db.toFixed(0)} dB)` : "");
// pace: 40 words over 12 seconds is 200 words a minute, too fast for a nervous customer
const fast = Tone.score("Thanks happy to help " + "word ".repeat(36), plain, m1);
ok("talking too fast costs points for a patient situation", fast.notes.some(n => !n.ok && /Too fast/.test(n.msg)) && fast.stats.wpm > 180, `(${fast.stats && fast.stats.wpm} wpm)`);
const good = Tone.score("Thanks happy to help " + "word ".repeat(21), plain, m1);
ok("a steady pace is fine", good.notes.some(n => n.ok && /Good pace/.test(n.msg)), `(${good.stats && good.stats.wpm} wpm)`);
const flat = Tone.score("Thanks, I'd love to help you with that today.", warm, m2);
ok("a flat voice is flagged when warmth is wanted", flat.notes.some(n => !n.ok && /Flat/.test(n.msg)));
ok("the tone score never leaves 0 to 1", [fast, good, flat].every(r => r.pts >= 0 && r.pts <= 1));
console.log(fails ? `${fails} FAILED` : "OK");
process.exit(fails ? 1 : 0);
