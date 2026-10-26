"use strict";
// Customer voices. Every customer gets their own installed voice, chosen by gender and accent, then delivered the way a person
// talks: a sentence at a time with small pauses, a little change in pitch and pace from one sentence to the next, a lift on
// questions and a mood (warm, flat or cold) that follows how well the rep did. It all runs on the voices already installed
// in the browser, so it is free and works offline. Edge's "Natural" voices and macOS Premium voices sound the most human.

// acc: accents to look for, best first (language tags). old: an older-sounding voice. pitch and rate: the character's own
// voice. Keep pitch inside about 0.9 to 1.1, because stretching it further is what makes a voice sound robotic.
const VOICE_FOR = {
  quiet:   { acc: ["en-US"], pitch: 1.04, rate: 1.0 },
  priya:   { acc: ["en-IN", "en-US"], pitch: 1.0, rate: 1.05 },
  sam:     { acc: ["en-US"], pitch: 1.03, rate: 1.1 },
  mia:     { acc: ["en-IE", "en-GB"], pitch: 1.0, rate: 0.96 },
  buyer:   { acc: ["en-US"], pitch: 1.0, rate: 0.95 },
  gas:     { acc: ["en-US"], pitch: 0.96, rate: 0.9 },
  dana:    { acc: ["en-AU", "en-GB"], pitch: 0.98, rate: 1.06 },
  marco:   { acc: ["en-AU", "en-US"], pitch: 0.94, rate: 0.96 },
  ray:     { acc: ["en-IN", "en-GB"], pitch: 0.98, rate: 1.04 },
  stickup: { acc: ["en-GB", "en-US"], pitch: 1.0, rate: 1.08 },
  comply:  { acc: ["en-ZA", "en-GB"], pitch: 1.02, rate: 1.02 },
  hardno:  { acc: ["en-US"], pitch: 0.95, rate: 0.98 },
  mean:    { acc: ["en-US"], pitch: 0.9, rate: 0.9, old: true },
};
const VOICE_DEFAULT = { acc: ["en-US"], pitch: 1, rate: 1 };

// Voices that are jokes or effects, never used.
const VOICE_NOVELTY = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Deranged|Good News|Hysterical|Jester|Organ|Pipe Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox)\b/i;
// Browsers don't report a voice's gender, so it is read from the name.
const VOICE_FEMALE = /\b(Samantha|Karen|Moira|Tessa|Victoria|Allison|Ava|Susan|Kathy|Nicky|Martha|Catherine|Fiona|Serena|Veena|Zira|Aria|Jenny|Michelle|Sonia|Libby|Natasha|Clara|Emily|Leah|Neerja|Heera|Hazel|Sara|Jane|Emma|Grandma|Flo|Sandy|Shelley|Vicki|Princess|Agnes|Kate|Joanna|Amy|Olivia|Ruth|Salli|Kendra|Kimberly|Ivy|Jessa|Female)\b/i;
const VOICE_MALE = /\b(Daniel|Alex|Fred|Tom|Oliver|Rishi|Aaron|Gordon|Arthur|Ralph|Junior|Albert|Guy|Davis|Andrew|Brian|Christopher|Eric|Roger|Ryan|Liam|Connor|Luke|Prabhat|Mitchell|Mark|George|James|Steffan|Jason|Tony|William|Eddy|Reed|Rocko|Grandpa|Bruce|Matthew|Joey|Justin|Kevin|Russell|Male)\b/i;

const voiceGender = v => (VOICE_FEMALE.test(v.name) ? "f" : VOICE_MALE.test(v.name) ? "m" : "?");
const voiceLang = v => String(v.lang || "").replace("_", "-");
function voiceQuality(v) {
  const n = v.name; let q = 0;
  if (/Natural|Neural/i.test(n)) q += 120;
  if (/Premium/i.test(n)) q += 100;
  if (/Siri/i.test(n)) q += 90;
  if (/Enhanced/i.test(n)) q += 80;
  if (/Google/i.test(n)) q += 35;
  if (/\b(Samantha|Daniel|Karen|Moira|Tessa|Rishi|Alex|Allison|Ava|Susan|Tom|Oliver|Serena|Fiona|Martha|Arthur|Gordon|Catherine|Aaron)\b/.test(n)) q += 20;
  if (/\b(Nicky|Flo|Eddy|Reed|Rocko|Sandy|Shelley|Grandma|Grandpa)\b/.test(n)) q += 25;
  if (/\b(Fred|Kathy|Ralph|Junior|Agnes|Bruce|Vicki|Victoria|Princess)\b/.test(n)) q -= 40;
  return q;
}
function voiceScore(v, prof, male, used, avoid) {
  const g = voiceGender(v);
  if (g !== "?" && g !== (male ? "m" : "f")) return -Infinity;
  const i = prof.acc.indexOf(voiceLang(v)), elder = /\b(Grandma|Grandpa)\b/.test(v.name);
  let s = voiceQuality(v) + (i >= 0 ? 60 - 20 * i : 0);
  s += prof.old ? (elder ? 45 : 0) : (elder ? -60 : 0);   // an older-sounding voice only for an older character
  if (g === "?") s -= 10;
  s -= 35 * (used.get(v.name) || 0);                       // spread the cast over different voices
  if (avoid.has(v.name)) s -= 200;                         // never sound like the rep
  return s;
}
// people: [{ id, male }] in a fixed order, so a customer always gets the same voice. Returns Map id -> voice.
function assignVoices(voices, people, avoid = new Set()) {
  const pool = voices.filter(v => /^en/i.test(v.lang) && !VOICE_NOVELTY.test(v.name)), used = new Map(), out = new Map();
  people.forEach(p => {
    const prof = VOICE_FOR[p.id] || VOICE_DEFAULT;
    let best = null, top = -Infinity;
    pool.forEach(v => { const s = voiceScore(v, prof, p.male, used, avoid); if (s > top) { top = s; best = v; } });
    if (best) used.set(best.name, (used.get(best.name) || 0) + 1);
    out.set(p.id, best);
  });
  return out;
}

// ---------- saying it like a person ----------
const SPEECH_OPENERS = { warm: ["Oh,", "Well,", "Ah,"], flat: ["Hm,", "Okay,", "Right,"], cold: ["Hm.", "Look,", "Uh-huh."] };
const OPENER_ODDS = { warm: .25, flat: .3, cold: .4 };
const MOOD = { warm: { rate: 1.03, pitch: .03 }, flat: { rate: 1, pitch: 0 }, cold: { rate: .96, pitch: -.04 } };
const jitter = w => (Math.random() - .5) * w;
const clampN = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// Text as it is spoken: dashes become commas, and an unhurried customer sometimes starts with a small "hm" or "well".
function prepareSpeech(raw, mood, opener) {
  let t = String(raw || "").replace(/<[^>]+>/g, " ").replace(/\*+/g, "").replace(/\s*[—–]\s*/g, ", ").replace(/\.{3,}/g, "…").replace(/\s+/g, " ").trim();
  if (opener && t && !/^(oh|well|ah|hm+|mm+|okay|right|look|uh|um|yeah)\b/i.test(t) && Math.random() < (OPENER_ODDS[mood] || 0)) {
    const o = SPEECH_OPENERS[mood] || SPEECH_OPENERS.flat;
    t = o[Math.floor(Math.random() * o.length)] + " " + t.charAt(0).toLowerCase() + t.slice(1);
  }
  return t;
}
// Sentences become chunks, each with its own pace, pitch and pause. Tiny ones join the next so it never sounds choppy.
function speechChunks(text, base, mood) {
  const m = MOOD[mood] || MOOD.flat;
  const sentences = (text.match(/[^.!?…]+(?:[.!?…]+["')\]]*)?\s*/g) || [text]).map(s => s.trim()).filter(Boolean);
  const parts = [];
  sentences.forEach(s => {
    if (s.length <= 130) { parts.push(s); return; }
    const bits = s.split(/(?<=[,;:])\s+/); let cur = "";
    bits.forEach(b => { if (cur && (cur + " " + b).length > 110) { parts.push(cur); cur = b; } else cur = cur ? cur + " " + b : b; });
    if (cur) parts.push(cur);
  });
  const merged = [];
  parts.forEach(p => { const last = merged[merged.length - 1]; if (last && last.length < 12 && !/[?!]$/.test(last)) merged[merged.length - 1] = last + " " + p; else merged.push(p); });
  return merged.map((p, i) => {
    const q = /\?["')\]]*$/.test(p), ex = /!["')\]]*$/.test(p), trail = /…["')\]]*$/.test(p), comma = /[,;:]$/.test(p);
    return {
      text: p,
      rate: clampN(base.rate * m.rate * (1 + jitter(.06)) * (ex ? 1.04 : trail ? .94 : 1), .6, 1.4),
      pitch: clampN(base.pitch + m.pitch + jitter(.05) + (q ? .05 : 0) + (ex ? .03 : 0) - (i && !q && !ex ? .01 : 0), .7, 1.3),
      pause: Math.round((comma ? 70 : q ? 280 : trail ? 400 : ex ? 220 : 240) * (base.pause || 1) + Math.random() * 60),
    };
  });
}

// Speak chunk after chunk. onWord(word) fires as each word starts (it drives the mouth). Starting anything new, or calling
// Voices.halt(), ends the one in progress. The promise gives { spoke, fellBack, issue }: spoke is false if no sound ever started.
// Browsers are fussy about speech, so this is careful: it waits for the voice list to load, never calls speak() in the same
// breath as cancel() (Chrome can drop the speech), and if a chosen voice stays silent it tries the browser's own default.
const Voices = (() => {
  let token = 0, cache = null, cacheKey = "";
  const synth = () => (typeof window !== "undefined" ? window.speechSynthesis : null);
  const all = () => (synth() ? synth().getVoices() : []);
  const custId = sc => { const s = typeof SCENARIOS !== "undefined" && SCENARIOS.find(x => x.cust.name === sc.cust.name); return s ? s.id : sc.id; };
  const table = () => {
    const vs = all(), key = vs.length + ":" + vs.map(v => v.name).join("|").length;
    if (cache && key === cacheKey) return cache;
    const avoid = new Set(typeof pickVoice === "function" ? [pickVoice(true), pickVoice(false)].filter(Boolean).map(v => v.name) : []);
    cache = assignVoices(vs, [...SCENARIOS, ...(typeof SURPRISE_CUSTOMERS !== "undefined" ? Object.values(SURPRISE_CUSTOMERS) : [])].map(s => ({ id: s.id, male: s.cust.male })), avoid); cacheKey = key;   // the surprise customers come after the missions' customers, so nobody's voice moves
    return cache;
  };
  // Some browsers fill in their voice list a moment after the page loads. Wait for it, but not for long.
  const ready = () => new Promise(res => {
    const sy = synth(); if (!sy || sy.getVoices().length) return res();
    let done = false; const fin = () => { if (done) return; done = true; res(); };
    if (sy.addEventListener) sy.addEventListener("voiceschanged", fin, { once: true });
    setTimeout(fin, 1500);
  });
  return {
    profile: sc => VOICE_FOR[custId(sc)] || VOICE_DEFAULT,
    voice: sc => table().get(custId(sc)) || (typeof pickVoice === "function" ? pickVoice(sc.cust.male) : null),
    table,
    count: () => all().filter(v => /^en/i.test(v.lang) && !VOICE_NOVELTY.test(v.name)).length,
    halt() { token++; },
    say(text, voice, o = {}) {
      const sy = synth(), mine = ++token;
      const chunks = speechChunks(prepareSpeech(text, o.mood || "flat", o.opener), { pitch: o.pitch || 1, rate: o.rate || 1, pause: o.pause }, o.mood || "flat");
      if (!sy || !chunks.length) return Promise.resolve({ spoke: false, fellBack: false, issue: sy ? "nothing to say" : "this browser can't speak" });
      return new Promise(res => {
        let i = 0, over = false, started = false, fell = false, issue = "", safety = null, watchdog = null, v = voice, cur = null;
        const end = () => { if (over) return; over = true; clearTimeout(safety); clearTimeout(watchdog); res({ spoke: started, fellBack: fell, issue }); };
        const next = () => {
          if (over || mine !== token) return end();
          if (i >= chunks.length) return end();
          const c = chunks[i++], u = new SpeechSynthesisUtterance(c.text); cur = u;
          if (v) { try { u.voice = v; u.lang = v.lang; } catch { v = null; } }
          u.rate = c.rate; u.pitch = c.pitch;
          u.onboundary = e => { if (u === cur && mine === token && o.onWord && (!e.name || e.name === "word")) o.onWord((c.text.slice(e.charIndex).match(/^\S+/) || [""])[0]); };
          u.onstart = () => { if (u !== cur) return; started = true; clearTimeout(watchdog); if (i === 1 && o.onStart) o.onStart(); };
          u.onend = () => { if (u === cur) setTimeout(next, c.pause); };
          u.onerror = e => {
            if (u !== cur) return;   // an utterance we already gave up on
            const er = (e && e.error) || "";
            if (/cancel|interrupt/i.test(er)) return end();
            issue = er || "error"; if (/not-allowed/.test(er)) return end();
            next();
          };
          if (i === 1 && !started) {   // the first line should start quickly; if it stays silent, try the browser's default voice once
            clearTimeout(watchdog);
            watchdog = setTimeout(() => {
              if (started || over || mine !== token) return;
              if (v && !fell) { fell = true; v = null; i = 0; cur = null; sy.cancel(); setTimeout(next, 200); } else { issue = issue || "no sound started"; end(); }
            }, 3000);
          }
          sy.speak(u);
        };
        const go = () => { try { sy.resume(); } catch { /* not paused */ } next(); };
        safety = setTimeout(end, Math.max(9000, chunks.reduce((n, c) => n + c.text.length * 140 + c.pause, 6000)));   // if the browser never says it finished
        ready().then(() => {
          if (mine !== token) return end();
          if (sy.speaking || sy.pending) { sy.cancel(); setTimeout(go, 120); } else go();   // cancel and speak a beat apart, not in the same instant
        });
      });
    },
  };
})();
if (typeof module !== "undefined") module.exports = { VOICE_FOR, assignVoices, voiceGender, voiceQuality, prepareSpeech, speechChunks };
