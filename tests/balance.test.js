// Checks the right answer is not easy to spot by length. Run: node tests/balance.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const ctx = vm.createContext({ console });
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "scenarios.js"), "utf8").replace(/^"use strict";/, ""), ctx);
const sets = { easy: st => [st.E[0], st.H[0]], medium: st => st.H, hard: st => st.H };
const len = t => t.replace(/^"|"$/g, "").length;
let fail = false;
for (const d of Object.keys(sets)) {
  let longest = 0, steps = 0, ratio = 0;
  vm.runInContext("SCENARIOS", ctx).forEach(sc => sc.steps.forEach(st => {
    const r = len(d !== "easy" ? st.RH : st.R[0]), w = sets[d](st).map(x => len(x[0]));
    steps++; ratio += r / (w.reduce((a, b) => a + b, 0) / w.length);
    if (w.every(x => r > x)) longest++;
  }));
  const share = longest / steps, avg = ratio / steps;
  console.log(`${d}: right answer longest in ${longest}/${steps} (${Math.round(share * 100)}%), avg length ratio ${avg.toFixed(2)}`);
  if (d !== "easy" && (share > 0.5 || avg > 1.35 || avg < 0.7)) fail = true;
}
if (fail) { console.log("FAIL"); process.exit(1); }
console.log("OK");
