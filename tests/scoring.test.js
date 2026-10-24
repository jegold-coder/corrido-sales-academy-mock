// Checks the rubric scoring: every model answer should score high, every weak example should score clearly lower.
// Run from the mock-prototype folder:  node tests/scoring.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const ctx = vm.createContext({ console });
for (const f of ["scenarios.js", "criteria.js", "tone.js", "coach.js"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8").replace(/^"use strict";/, ""), ctx);
const res = vm.runInContext(`(function () {
  const out = { steps: 0, modelLow: [], weakHigh: [], noCriteria: [], noReply: [], rows: [] }, strip = t => t.replace(/^"|"$/g, "");
  for (const sc of SCENARIOS) {
    if (!MLEVEL[sc.level]) out.noCriteria.push(sc.id + " has no level");
    if (!TONE_FOR[sc.id]) out.noCriteria.push(sc.id + " has no tone profile");
    sc.steps.forEach((st, i) => {
      const key = sc.id + ":" + i; out.steps++;
      if (!CRITERIA[key]) { out.noCriteria.push(key); return; }
      if (!(st.reply && st.reply.best && st.reply.bad) || !(st.reply.mid || (MIDS[sc.id] && MIDS[sc.id][i]))) out.noReply.push(key);
      const models = [st.R[0], st.RH].map(t => Coach.score(key, strip(t), sc.level, { tone: TONE_FOR[sc.id] }));
      const weak = [...st.E, ...st.H].map(w => Coach.score(key, strip(w[0]), sc.level, { tone: TONE_FOR[sc.id] }));
      models.forEach(m => { if (m.score < 4.2) out.modelLow.push([key, m.score, m.misses, m.flags.map(f => f.msg)]); });
      weak.forEach((w, n) => { if (w.score > 3.4) out.weakHigh.push([key, w.score, [...st.E, ...st.H][n][0].slice(0, 60), w.hits, w.flags.map(f => f.msg)]); });
      out.rows.push([key, Math.min(...models.map(m => m.score)), Math.max(...weak.map(w => w.score))]);
    });
  }
  return out; })()`, ctx);
console.log(`${res.steps} steps checked`);
console.log("model answers scoring under 4.2:", res.modelLow.length, "| weak examples scoring over 3.4:", res.weakHigh.length, "| missing criteria or levels:", res.noCriteria.length, "| missing replies:", res.noReply.length);
if (res.modelLow.length || res.weakHigh.length || res.noCriteria.length || res.noReply.length) { console.log(JSON.stringify(res, (k, v) => (k === "rows" ? undefined : v), 1)); process.exit(1); }
const lows = res.rows.map(r => r[1]), highs = res.rows.map(r => r[2]);
console.log(`lowest model score ${Math.min(...lows)}, highest weak score ${Math.max(...highs)}`);
console.log("OK");
