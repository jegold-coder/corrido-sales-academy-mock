"use strict";
// The answer log: every answer a rep gives is kept on this device (the words and the score, never the recording), so a manager can read what was
// actually said, see which question the class misses most, and leave a note. There is no server yet, so the sample class gets SAMPLE answers: real
// answers from the missions, scored by the real coach, made the same way every time. Uses globals from the other scripts (state, Progress, Coach,
// SCENARIOS, SAMPLE_REPS, COACH, reachedStops...) at call time.

const AnswerLog = (() => {
  const MAX = 80, LOW = 3.5;   // 3.5 is also the line the Review list uses
  const stamp = daysAgo => new Date(Date.now() - daysAgo * 864e5).toLocaleDateString("en-CA");
  let seq = 0;   // the time alone isn't enough: two answers can be saved in the same millisecond
  const newId = () => "a" + Date.now().toString(36) + (seq++).toString(36);
  const plain = t => String(t || "").replace(/<[^>]+>/g, "").replace(/^"|"$/g, "");
  const youName = () => `${repName()} (you)`;

  // newest first, and only the last MAX are kept
  function add(P, e) { P.answers = [{ id: newId(), date: Progress.today(), ...e }, ...(P.answers || [])].slice(0, MAX); }

  // ----- the sample class -----
  // A small seeded generator, so a sample rep always has the same answers (and the numbers on a page don't change when it is reloaded).
  const rng = name => { let h = 2166136261; for (const ch of name) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); h = h || 1; return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return (h >>> 0) / 4294967296; }; };
  const topicOf = skill => (COACH.find(t => t.re.test(skill || "")) || {}).name;
  const cache = new Map();
  // A sample rep's recent answers: every question of the last three missions they have reached, so several reps answer the same questions and "the question the class
  // misses most" means something. A rep answers well in most skills and badly in their focus skill.
  function sampleAnswers(rep) {
    if (cache.has(rep.name)) return cache.get(rep.name);
    const r = rng(rep.name), reached = reachedStops(rep.tier), recent = SCENARIOS.filter(m => reached.includes(m.id)).sort((a, b) => reached.indexOf(a.id) - reached.indexOf(b.id)).slice(-3);
    const ability = Math.min(.95, .5 + rep.tier * .09), focus = topicOf(rep.focus), picks = [];
    recent.forEach(m => m.steps.forEach((st, k) => picks.push([m, st, k])));
    const out = (rep.tier ? picks : []).map(([m, st, k], i) => {
      const good = focus && topicOf(st.skill) === focus ? ability - .4 : ability, x = r();
      const kind = x < good ? "R" : x < good + (1 - good) * .6 ? "H" : "E", text = plain(kind === "R" ? st.R[0] : kind === "H" ? st.H[0][0] : st.E[0][0]);
      const key = `${m.id}:${k}`, res = Coach.score(key, text, m.level, { tone: TONE_FOR[m.id], voice: null }), spoke = r() < .65;
      return { id: `s-${rep.name}-${i}`, rep: rep.name, sample: true, date: stamp((rep.idle || 0) + Math.floor((picks.length - 1 - i) / 3)), ck: key, mid: m.id, mission: m.title, skill: st.skill, cname: m.cust.name,
        line: st.line.replace(/<[^>]+>/g, ""), q: st.q, text, score: res.score, content: res.content, tone: res.tone.pts, misses: res.misses, hits: res.hits,
        flags: [...res.flags.map(f => f.msg), ...res.tone.notes.filter(n => !n.ok).map(n => n.msg)], better: plain(st.R[0]), level: m.level, spoke,
        wpm: spoke ? Math.round(112 + r() * 72) : null, fillers: kind === "R" ? Math.floor(r() * 2) : Math.floor(r() * 4), pauses: spoke ? Math.floor(r() * 3) : null, words: text.split(/\s+/).length };
    }).reverse();   // newest first: the last question of the last mission is the most recent answer
    cache.set(rep.name, out);
    return out;
  }
  // The player's own answers, as rows of the class they belong to.
  const mine = () => (state.answers || []).map(a => ({ ...a, rep: youName(), you: true }));
  // Every answer for a class: the sample class has the sample reps' answers plus the player's own; any other class only has the player's (nobody else has used it yet).
  const classAnswers = c => (c && c.sample ? [...SAMPLE_REPS.flatMap(sampleAnswers), ...mine()] : mine());

  // ----- reading the answers -----
  // For each question: how many reps answered it (their latest answer), how many scored under 3.5, and what those answers missed most.
  function questionStats(entries, minReps = 3) {
    const by = new Map();
    entries.forEach(e => {   // newest first within each rep, so the first one seen for a rep is their latest
      if (!by.has(e.ck)) by.set(e.ck, { ck: e.ck, mid: e.mid, mission: e.mission, skill: e.skill, cname: e.cname, line: e.line, q: e.q, better: e.better, latest: new Map() });
      const g = by.get(e.ck); if (!g.latest.has(e.rep)) g.latest.set(e.rep, e);
    });
    return [...by.values()].map(({ latest, ...g }) => {
      const es = [...latest.values()], low = es.filter(e => e.score < LOW), miss = new Map();
      low.forEach(e => (e.misses || []).forEach(m => miss.set(m, (miss.get(m) || 0) + 1)));
      return { ...g, n: es.length, low: low.length, pct: Math.round(low.length / es.length * 100), avg: es.reduce((a, e) => a + e.score, 0) / es.length,
        missed: [...miss].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([label, count]) => ({ label, count })), reps: low.map(e => e.rep) };
    }).filter(g => g.n >= minReps).sort((a, b) => b.pct - a.pct || b.n - a.n || a.avg - b.avg);
  }
  // One rep's numbers: how many answers, the average score, average pace, filler words an answer, and the skill that scores lowest.
  function summary(entries) {
    if (!entries.length) return { n: 0, avg: null, wpm: null, fillers: null, weakest: null };
    const paced = entries.filter(e => e.wpm), bySkill = {};
    entries.forEach(e => { (bySkill[e.skill] = bySkill[e.skill] || []).push(e.score); });
    const weakest = Object.entries(bySkill).map(([k, v]) => [k, v.reduce((a, b) => a + b, 0) / v.length]).sort((a, b) => a[1] - b[1])[0];
    return { n: entries.length, avg: entries.reduce((a, e) => a + e.score, 0) / entries.length, wpm: paced.length ? Math.round(paced.reduce((a, e) => a + e.wpm, 0) / paced.length) : null,
      fillers: entries.reduce((a, e) => a + (e.fillers || 0), 0) / entries.length, weakest: weakest[0] };
  }
  // A rep's average for each skill family, out of 100: [[family, percent]] in the order of a sales call.
  const familyScores = entries => {
    const by = {}; entries.forEach(e => { (by[e.skill] = by[e.skill] || []).push(e.score / 5 * 100); });
    return skillFamilies(Object.entries(by).map(([k, v]) => [k, Math.round(v.reduce((a, b) => a + b, 0) / v.length), v.length])).map(([f, p]) => [f, p]);
  };

  // ----- notes from a manager -----
  const notesOf = id => (state.notes || {})[id] || [];
  function addNote(id, text, from) {
    const t = String(text || "").trim().slice(0, 300); if (!t) return null;
    const n = { text: t, from: from || "Manager", date: Progress.today(), seen: false };
    state.notes = { ...(state.notes || {}), [id]: [...notesOf(id), n] }; Progress.save(state);
    return n;
  }
  function removeNote(id, i) {
    const list = notesOf(id).filter((_, k) => k !== i), notes = { ...(state.notes || {}) };
    if (list.length) notes[id] = list; else delete notes[id];
    state.notes = notes; Progress.save(state);
  }
  // The notes a manager left on the player's own answers, newest answer first, for the Review page.
  const playerNotes = () => (state.answers || []).filter(a => notesOf(a.id).length).map(a => ({ answer: a, notes: notesOf(a.id) }));
  const unseen = () => playerNotes().reduce((n, x) => n + x.notes.filter(m => !m.seen).length, 0);
  function markSeen() {
    let changed = false;
    (state.answers || []).forEach(a => notesOf(a.id).forEach(n => { if (!n.seen) { n.seen = true; changed = true; } }));
    if (changed) Progress.save(state);
  }

  // ----- spreadsheets -----
  const csvRows = (entries) => ["Rep,Date,Mission,Skill,Question,Customer said,Rep said,Score (out of 5),Content (out of 4),Tone (out of 1),Missed,Pace (words a minute),Filler words,Long pauses,Manager notes",
    ...entries.map(e => [e.rep, e.date, e.mission, e.skill, plain(e.q), e.line, e.text, e.score, e.content, e.tone, (e.misses || []).join("; "), e.wpm == null ? "" : e.wpm, e.fillers == null ? "" : e.fillers,
      e.pauses == null ? "" : e.pauses, notesOf(e.id).map(n => `${n.from} (${n.date}): ${n.text}`).join(" | ")].map(csvCell).join(","))].join("\n");

  return { MAX, LOW, add, sampleAnswers, classAnswers, questionStats, summary, familyScores, notesOf, addNote, removeNote, playerNotes, unseen, markSeen, csvRows, mine };
})();
