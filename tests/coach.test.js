// Checks the free coach against every scripted answer: right answers must pass, wrong answers must fail.
// Run from the mock-prototype folder:  node tests/coach.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const ctx = vm.createContext({ console });
for (const f of ["scenarios.js", "criteria.js", "coach.js"]) vm.runInContext(fs.readFileSync(path.join(root, f), "utf8").replace(/^"use strict";/, ""), ctx);
const res = vm.runInContext(`(function () {
  const out = { steps: 0, rightFail: [], wrongPass: [], noCriteria: [] }, strip = t => t.replace(/^"|"$/g, "");
  for (const sc of SCENARIOS) sc.steps.forEach((st, i) => {
    const key = sc.id + ":" + i; out.steps++;
    if (!CRITERIA[key]) { out.noCriteria.push(key); return; }
    for (const d of ["easy", "medium", "hard"]) {
      for (const t of [st.R[0], st.RH]) { const r = Coach.evaluate(key, strip(t), d); if (!r.ok) out.rightFail.push([key, d, strip(t).slice(0, 50), r.missing, r.violations]); }
      for (const w of [...st.E, ...st.H]) { const r = Coach.evaluate(key, strip(w[0]), d); if (r.ok) out.wrongPass.push([key, d, strip(w[0]).slice(0, 60)]); }
    }
  });
  return out; })()`, ctx);
console.log(`${res.steps} steps checked`);
console.log("right answers that failed:", res.rightFail.length, "| wrong answers that passed:", res.wrongPass.length, "| steps with no criteria:", res.noCriteria.length);
if (res.rightFail.length || res.wrongPass.length || res.noCriteria.length) { console.log(JSON.stringify(res, null, 1)); process.exit(1); }
console.log("OK");
