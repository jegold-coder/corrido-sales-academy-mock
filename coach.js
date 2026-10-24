"use strict";
// The free coach. Two parts:
//  1. An offline rule-based checker (Coach.evaluate). No account, no network, no cost. This is the default.
//  2. An optional AI judge (Coach.llmJudge) that uses a FREE Google Gemini key the user pastes in. The key stays
//     in memory only. If the call fails, the app falls back to the offline checker.

const Coach = {
  // Things that are wrong in almost any sales answer.
  GLOBAL: [
    [/(trust me|best ever|guarantee|guaranteed|no.?brainer|you'?d be crazy|can'?t lose|everyone loves)/i, "Hype and guarantees sound like a line. Use specific, true facts."],
    [/(garbage|trash|sucks|overrated)/i, "Never run down another brand."],
  ],
  REFUSAL: /(can'?t|cannot|won'?t|not able|unable|don'?t make|not allowed|isn'?t something|don'?t (call|say|use|claim)|aren'?t claims|avoid)/i,
  HEALTH: /(cure|hangover.?free|no hangover|healthier|better for you|good for you|detox|clean eating|low.?calorie)/i,

  needed(diff, n) { return diff === "easy" ? 1 : diff === "medium" ? Math.min(n, 2) : n; },

  // key = "<mission id>:<step index>". Returns what matched, what is missing, and any problems.
  evaluate(key, text, diff) {
    const K = CRITERIA[key], t = (text || "").trim(), out = { matched: [], missing: [], violations: [], ok: false, score: 0 };
    if (!K) return out;
    if (t.length < 12) { out.violations.push("Too short. Say a full sentence or two."); out.missing = K.need.map(n => n[1]); return out; }
    if (t.length > 700) out.violations.push("Too long. In person, keep each answer to a few sentences.");
    K.need.forEach(([re, label]) => (re.test(t) ? out.matched : out.missing).push(label));
    Coach.GLOBAL.forEach(([re, msg]) => { if (re.test(t)) out.violations.push(msg); });
    if (Coach.HEALTH.test(t) && !Coach.REFUSAL.test(t)) out.violations.push("Don't make health claims.");
    K.bad.forEach(([re, msg]) => { if (re.test(t)) out.violations.push(msg); });
    out.violations = [...new Set(out.violations)];
    out.ok = out.matched.length >= Coach.needed(diff, K.need.length) && out.violations.length === 0;
    out.score = out.violations.length ? Math.min(out.matched.length / K.need.length, .4) : out.matched.length / K.need.length;
    return out;
  },

  // HireVue-style score out of 5 for one spoken (or typed) answer: 4 points for what you said and 1 for how you said it.
  // The 4 content points are split equally across the things the answer should mention, so each missing item costs its
  // share. Each mistake (hype, a health claim, bashing another brand, being vague) knocks a point off. The 1 tone point
  // depends on the situation (see Tone in tone.js and TONE_FOR in scenarios.js). Nothing is shown to the rep until the end.
  // ctx = { tone: the mission's tone profile, voice: analysed recording or null }.
  // Returns { score, content, tone, words, hits, misses, flags:[{msg, pts}], per }.
  score(key, text, level = 3, ctx = {}) {
    const K = CRITERIA[key], t = (text || "").trim(), words = t ? t.split(/\s+/).length : 0;
    const out = { score: 0, content: 0, tone: { pts: 0, notes: [], name: "" }, words, hits: [], misses: [], flags: [], per: 0 };
    if (!K) return out;
    const n = K.need.length; out.per = n ? Math.round(4 / n * 10) / 10 : 0;
    if (words < 4) { out.misses = K.need.map(x => x[1]); out.flags.push({ msg: "Too short to score. Give a full answer in a few sentences.", pts: 0 }); return out; }
    K.need.forEach(([re, label]) => (re.test(t) ? out.hits : out.misses).push(label));
    const mult = level >= 5 ? 1.25 : 1, pen = [];
    Coach.GLOBAL.forEach(([re, msg]) => { if (re.test(t)) pen.push({ msg, pts: 1 }); });
    if (Coach.HEALTH.test(t) && !Coach.REFUSAL.test(t)) pen.push({ msg: "Don't make health claims.", pts: 1.5 });
    K.bad.forEach(([re, msg]) => { if (re.test(t)) pen.push({ msg, pts: 1 }); });
    if (words > 160) pen.push({ msg: "Rambling. Keep each answer to the point.", pts: .5 });
    const seen = new Set(); out.flags = pen.filter(f => !seen.has(f.msg) && seen.add(f.msg)).map(f => ({ msg: f.msg, pts: Math.round(f.pts * mult * 10) / 10 }));
    const taken = Math.min(3, out.flags.reduce((a, f) => a + f.pts, 0));
    out.content = Math.max(0, Math.round((4 * out.hits.length / n - taken) * 10) / 10);
    out.tone = typeof Tone !== "undefined" ? Tone.score(t, ctx.tone, ctx.voice) : { pts: 1, notes: [], name: "" };
    out.score = Math.max(0, Math.min(5, Math.round((out.content + out.tone.pts) * 10) / 10));
    return out;
  },

  // A short coaching sentence built from the result.
  feedback(res, step) {
    if (res.ok) return `Strong answer. ${res.matched.length ? "It covered: " + res.matched.join("; ") + "." : ""}`;
    const parts = [];
    if (res.violations.length) parts.push(res.violations.join(" "));
    if (res.missing.length) parts.push("A strong answer here covers: " + res.missing.join("; ") + ".");
    return parts.join(" ") || "Try again with a clearer answer.";
  },

  // ----- optional free AI judge (Google Gemini free tier). Untested without a key. -----
  llm: { key: "", model: "gemini-2.0-flash" },
  async llmJudge(sc, step, text) {
    const { key, model } = Coach.llm;
    if (!key) throw new Error("no key");
    const prompt = `You are a strict but fair sales coach for Tequila Corrido, an additive-free tequila (only three ingredients, no fake flavors, one of the first female master distillers, sold 21+ only). Never accept health claims, serving anyone under 21, or invented prices, margins or sales numbers.
Customer: ${sc.cust.name}, ${sc.cust.role}. Hidden objection: ${sc.hidden}
The customer just said: ${step.line}
The coaching goal for this moment (${step.skill}): ${step.hint}
A model right answer: ${step.R[0]}
The rep answered: "${text}"
Decide if the rep's answer meets the goal in their own words (it does not need to match the model). Reply with JSON only: {"ok": true or false, "feedback": "one or two sentences of coaching"}`;
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: .2 } }),
    });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j = JSON.parse((await r.json()).candidates[0].content.parts[0].text);
    return { ok: !!j.ok, feedback: String(j.feedback || "") };
  },
};
if (typeof module !== "undefined") module.exports = { Coach, CRITERIA };
