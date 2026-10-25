"use strict";
// Tone: how an answer sounds, judged against what the situation calls for. Worth 1 of the 5 points on every answer.
// Two sources, both free and both on your own device:
//   - Your words: warmth, pushiness, combative or grovelling phrases, jargon, hedging, filler, bad language.
//   - Your voice (only when you speak and the browser could record it): pace, long pauses, volume (too quiet or
//     shouting) and how flat or lively your pitch is. The audio is analysed in memory and never uploaded.
// Each mission has a tone profile (TONE_FOR in scenarios.js), for example "calm and steady" for a rude owner or
// "patient and simple" for a confused clerk, so the same voice can score well in one situation and badly in another.

const Tone = {
  // Warm or polite wording: thanks, empathy, or a polite invitation instead of an order.
  WARM: /\b(hi|hello|hey|good (morning|afternoon|evening)|pleasure|hoping|no pressure|if that'?s (okay|ok|alright|all right|fine)|whenever (works|suits)|at your convenience|please|thank(s| you)?|appreciate|glad|happy|love\w*|nice to meet|great to meet|good to meet|congrat\w*|great|nice|wonderful|lovely|i'?m sorry|makes sense|fair (enough|question|point|concern)|i understand|understood|i hear you|good call|no problem|of course|sounds good|that'?s (great|a good|a fair|a real)|welcome|sorry (to hear|about that)|how about|would you|could (i|we)|can i|may i|if you'?d like|if you like|let me|we could|i could|good question|good idea|you'?re right)\b/i,
  PUSHY: /\b(you (need|have|must|should) to|you must|you'?ve got to|right now|today only|last chance|don'?t miss|i insist|you'?ll regret)\b/i,
  COMBATIVE: /\b(wrong|ridiculous|stupid|dumb|obviously|calm down|listen,? (pal|buddy|man|sir)|as i (said|told)|are you kidding|that'?s (rude|ridiculous)|how dare|shut up|i don'?t care)\b/i,
  PROFANE: /\b(damn|hell|crap|sucks|shit|bullshit|ass|pissed|freaking|wtf)\b/i,
  GROVEL: /\b(so sorry|i'?m sorry to bother|sorry to bother|i know you hate|i hate to|if it'?s okay with you|if you don'?t mind|please,? sir|out of your way|i won'?t take (up )?much|sorry for the trouble)\b/i,
  JARGON: /\b(margin|sku|velocity|pull.?through|distribution|placement|rotation|depletion|sell.?through|wholesale)\b/i,
  HEDGE: /\b(maybe|i guess|probably|sort of|kind of|perhaps|hopefully|i was wondering if|just wanted to)\b/gi,
  FILLER: /\b(um+|uh+|er+|erm|you know|i mean|basically|literally)\b/gi,

  // ---------- from the words ----------
  // profile: { name, warm, plain, steady, firm, pace:[min,max], lively }. Returns penalties out of 1 point, plus notes.
  fromText(text, profile) {
    const t = String(text || ""), words = t.trim() ? t.trim().split(/\s+/).length : 0, notes = [];
    let pen = 0;
    if (profile.warm) {
      if (Tone.WARM.test(t)) notes.push({ ok: true, msg: "Warm and polite wording, right for this customer." });
      else { notes.push({ ok: false, msg: "No warm or polite wording. This customer needs a friendly touch (a thank you, \"makes sense\", \"I'd love to\").", pts: .3 }); pen += .3; }
    }
    if (Tone.PROFANE.test(t)) { notes.push({ ok: false, msg: "Bad language. Never in front of a customer.", pts: .6 }); pen += .6; }
    if (Tone.COMBATIVE.test(t)) { const c = profile.steady ? .5 : .4; notes.push({ ok: false, msg: "Combative or defensive wording. It escalates things.", pts: c }); pen += c; }
    // pushy wording is about telling people what to do, so questions don't count ("what margin do you need to make this work?" is a fair question)
    const statements = (t.match(/[^.!?]+[.!?]*/g) || [t]).filter(x => !/\?\s*$/.test(x)).join(" ");
    if (Tone.PUSHY.test(statements)) { notes.push({ ok: false, msg: "Pushy wording (\"you need to\", \"right now\"). Invite instead of telling.", pts: .3 }); pen += .3; }
    if (Tone.GROVEL.test(t)) { const c = profile.steady ? .5 : .3; notes.push({ ok: false, msg: "Apologetic and grovelling. It hands the customer all the power.", pts: c }); pen += c; }
    if (profile.plain && Tone.JARGON.test(t)) { notes.push({ ok: false, msg: "Jargon. This customer needs plain, everyday words.", pts: .2 }); pen += .2; }
    if (profile.firm) {
      const h = (t.match(Tone.HEDGE) || []).length;
      if (h >= 2) { notes.push({ ok: false, msg: "Too many hedges (\"maybe\", \"I guess\", \"probably\"). Sound sure of yourself.", pts: .25 }); pen += .25; }
    }
    const fill = (t.match(Tone.FILLER) || []).length;
    if (words >= 8 && fill / words > .06) { notes.push({ ok: false, msg: `Lots of filler words (${fill}).`, pts: .25 }); pen += .25; }
    return { pen, notes, words };
  },

  // ---------- from the voice ----------
  // Pure maths on the recording's samples (so it can be tested without a browser).
  analyzeSamples(x, sr) {
    const hop = Math.round(sr * 0.025), n = Math.floor(x.length / hop), rms = new Float32Array(n);
    for (let f = 0; f < n; f++) { let s = 0; for (let i = f * hop; i < (f + 1) * hop; i++) s += x[i] * x[i]; rms[f] = Math.sqrt(s / hop); }
    const sorted = Array.from(rms).sort((a, b) => a - b), p90 = sorted[Math.floor(n * .9)] || 0, thr = Math.max(.006, p90 * .15);
    const act = Array.from(rms, v => v > thr);
    const first = act.indexOf(true), last = act.lastIndexOf(true);
    if (first < 0 || last - first < 20) return { ok: false };
    let pauses = 0, longest = 0, run = 0;
    for (let f = first; f <= last; f++) {
      if (!act[f]) run++; else { if (run * .025 >= .9) { pauses++; longest = Math.max(longest, run * .025); } run = 0; }
    }
    const spanSecs = (last - first + 1) * .025;
    let sum = 0, cnt = 0; for (let f = first; f <= last; f++) if (act[f]) { sum += rms[f] * rms[f]; cnt++; }
    const db = 20 * Math.log10(Math.sqrt(sum / Math.max(1, cnt)) || 1e-6);
    // pitch by autocorrelation on a 4x downsampled copy, voiced frames only
    const ds = 4, srd = sr / ds, win = Math.round(srd * .04), minLag = Math.round(srd / 400), maxLag = Math.round(srd / 70), f0s = [];
    for (let f = first; f <= last; f += 2) {
      if (!act[f] || rms[f] < thr * 1.5) continue;
      const start = f * hop; if (start + win * ds + maxLag * ds >= x.length) break;
      const seg = new Float32Array(win + maxLag); for (let i = 0; i < seg.length; i++) seg[i] = x[start + i * ds];
      let e0 = 0; for (let i = 0; i < win; i++) e0 += seg[i] * seg[i];
      if (e0 < 1e-6) continue;
      const ac = new Float32Array(maxLag + 2); let best = 0;
      for (let lag = minLag; lag <= maxLag; lag++) { let c = 0; for (let i = 0; i < win; i++) c += seg[i] * seg[i + lag]; ac[lag] = c; if (c > best) best = c; }
      // take the shortest lag that is nearly as strong as the best, so a sub-harmonic is never mistaken for the pitch
      let bl = 0; for (let lag = minLag + 1; lag < maxLag; lag++) if (ac[lag] >= best * .9 && ac[lag] >= ac[lag - 1] && ac[lag] >= ac[lag + 1]) { bl = lag; break; }
      if (bl && best / e0 > .5) f0s.push(srd / bl);
    }
    let pitchStd = null;
    if (f0s.length >= 12) {
      // ignore octave jumps: only keep pitches within 7 semitones of the middle one
      const semi = f0s.map(v => 12 * Math.log2(v)), med = [...semi].sort((a, b) => a - b)[Math.floor(semi.length / 2)], kept = semi.filter(v => Math.abs(v - med) <= 7);
      if (kept.length >= 10) { const m = kept.reduce((a, b) => a + b, 0) / kept.length; pitchStd = Math.sqrt(kept.reduce((a, b) => a + (b - m) * (b - m), 0) / kept.length); }
    }
    return { ok: true, secs: x.length / sr, spanSecs, pauses, longest, db, pitchStd, voiced: f0s.length };
  },
  // Decode a recording and analyse it. Resolves null if the browser can't decode it, and the tone falls back to words only.
  async analyzeBlob(blob) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
      const buf = await ac.decodeAudioData(await blob.arrayBuffer());
      const m = Tone.analyzeSamples(buf.getChannelData(0), buf.sampleRate); ac.close();
      return m.ok ? m : null;
    } catch { return null; }
  },
  fromVoice(m, words, profile) {
    const notes = []; let pen = 0;
    if (!m) return { pen, notes, stats: null };
    const wpm = m.spanSecs >= 4 ? Math.round(words / (m.spanSecs / 60)) : null;
    const [lo, hi] = profile.pace || [110, 175];
    if (wpm) {
      if (wpm > hi * 1.15) { const c = wpm > hi * 1.35 ? .35 : .25; notes.push({ ok: false, msg: `Too fast: about ${wpm} words a minute. For this customer aim for ${lo} to ${hi}.`, pts: c }); pen += c; }
      else if (wpm < lo * .8) { notes.push({ ok: false, msg: `A bit slow and halting: about ${wpm} words a minute. Aim for ${lo} to ${hi}.`, pts: .2 }); pen += .2; }
      else notes.push({ ok: true, msg: `Good pace for this customer: about ${wpm} words a minute.` });
    }
    if (m.pauses >= 3) { notes.push({ ok: false, msg: `${m.pauses} long pauses mid-answer. Plan your sentence, then say it smoothly.`, pts: .2 }); pen += .2; }
    if (m.db < -40) { notes.push({ ok: false, msg: "Too quiet. Speak up so the customer doesn't have to lean in.", pts: .3 }); pen += .3; }
    else if (m.db > -8) { const c = profile.steady ? .5 : .4; notes.push({ ok: false, msg: "Very loud, close to shouting. Bring your voice down.", pts: c }); pen += c; }
    else notes.push({ ok: true, msg: "Volume was comfortable." });
    if (m.pitchStd != null && profile.lively) {
      if (m.pitchStd < 1.8) { notes.push({ ok: false, msg: "Flat delivery. This customer needs warmth, so let your voice rise and fall.", pts: .25 }); pen += .25; }
      else notes.push({ ok: true, msg: "Your voice had life in it, which suits this customer." });
    }
    return { pen, notes, stats: { wpm, pauses: m.pauses, db: Math.round(m.db), pitch: m.pitchStd != null ? Math.round(m.pitchStd * 10) / 10 : null } };
  },

  // The tone score out of 1 point, with the notes for the scorecard.
  score(text, profile, voiceMetrics) {
    const p = profile || { name: "natural and polite" };
    const tx = Tone.fromText(text, p), vo = Tone.fromVoice(voiceMetrics, tx.words, p);
    const pts = Math.max(0, Math.round((1 - tx.pen - vo.pen) * 10) / 10);
    return { pts, name: p.name, notes: [...tx.notes, ...vo.notes], stats: vo.stats, voiceUsed: !!voiceMetrics };
  },
};
if (typeof module !== "undefined") module.exports = { Tone };
