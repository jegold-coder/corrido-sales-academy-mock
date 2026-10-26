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
// ---- how it sounded, in plain words (Tone.delivery) ----
ok("filler words are counted from the words, and 'umm' counts as 'um'", JSON.stringify(Tone.fillers("Um, you know, umm, I mean it is good")) === JSON.stringify([["um", 2], ["you know", 1], ["i mean", 1]]) && Tone.fillers("A clear answer with three ingredients").length === 0);
const line = (d, k) => d.items.find(i => i.key === k);
const typed = Tone.delivery("Thanks, I'd love you to taste it. Can I come back Thursday?", null, warm);
ok("a typed answer gets only the filler line, and a clean one says so", typed.items.length === 1 && typed.items[0].key === "fillers" && typed.items[0].ok && /None/.test(typed.items[0].text) && !typed.spoke && typed.wpm === null);
const spokenOk = Tone.delivery("Thanks, I'd love you to taste it.", { wpm: 140, pauses: 1, db: -20, pitch: 2.5 }, warm);
ok("a good spoken answer is on target in all five lines: pace, filler words, long pauses, volume and variety", spokenOk.items.map(i => i.key).join() === "pace,fillers,pauses,volume,variety" && spokenOk.ok === 5 && spokenOk.total === 5 && spokenOk.spoke && spokenOk.wpm === 140);
ok("too fast and a bit slow are told apart, with the customer's range in the line", (a => !a.ok && /Too fast/.test(a.text) && /115 to 175/.test(a.text))(line(Tone.delivery("x", { wpm: 230, pauses: 0, db: -20, pitch: 2 }, warm), "pace")) && (b => !b.ok && /A bit slow/.test(b.text))(line(Tone.delivery("x", { wpm: 70, pauses: 0, db: -20, pitch: 2 }, warm), "pace")) && line(Tone.delivery("x", { wpm: 175 * 1.15, pauses: 0, db: -20, pitch: 2 }, warm), "pace").ok);
ok("three long pauses, a quiet voice and shouting are each flagged", !line(Tone.delivery("x", { wpm: 140, pauses: 3, db: -20, pitch: 2 }, warm), "pauses").ok && /Too quiet/.test(line(Tone.delivery("x", { wpm: 140, pauses: 0, db: -45, pitch: 2 }, warm), "volume").text) && /Very loud/.test(line(Tone.delivery("x", { wpm: 140, pauses: 0, db: -5, pitch: 2 }, warm), "volume").text) && line(Tone.delivery("x", { wpm: 140, pauses: 2, db: -20, pitch: 2 }, warm), "pauses").ok);
ok("a flat voice is flagged when the customer needs warmth, and is fine when they don't", !line(Tone.delivery("x", { wpm: 140, pauses: 0, db: -20, pitch: 1 }, warm), "variety").ok && line(Tone.delivery("x", { wpm: 140, pauses: 0, db: -20, pitch: 1 }, steady), "variety").ok && /Steady/.test(line(Tone.delivery("x", { wpm: 140, pauses: 0, db: -20, pitch: 1 }, steady), "variety").text));
const many = Tone.delivery("Um " + "word ".repeat(18) + "you know basically", null, warm), few = Tone.delivery("Um " + "word ".repeat(96), null, warm);
ok("a few filler words in a long answer are fine, a lot in a short one are not, and the line lists them", line(few, "fillers").ok && !line(many, "fillers").ok && /"um"/.test(line(many, "fillers").text) && /"you know"/.test(line(many, "fillers").text) && /Pause quietly/.test(line(many, "fillers").text));
ok("hedging words show up as a line only when there are two or more (like the tone score)", !line(Tone.delivery("Maybe I guess it is fine, probably.", null, warm), "hedges").ok && !line(Tone.delivery("Maybe it is fine.", null, warm), "hedges") === true);
ok("the pace line matches what the scorecard reports for the same recording", (() => { const r = Tone.score("Thanks happy to help " + "word ".repeat(21), plain, m1), d = Tone.delivery("Thanks happy to help " + "word ".repeat(21), r.stats, plain); return d.wpm === r.stats.wpm && line(d, "pace").text.startsWith(r.stats.wpm + " words a minute"); })());
console.log(fails ? `${fails} FAILED` : "OK");
process.exit(fails ? 1 : 0);
