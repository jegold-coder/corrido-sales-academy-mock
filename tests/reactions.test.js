// Checks the customer's reactions and the grader page. Run from the mock-prototype folder: node tests/reactions.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };

// reactions: the face has what it needs, and the mission uses it at the right moments
const html = read("index.html"), mission = read("mission.js");
ok("every customer face carries a smile, a grin, a flat mouth and a frown", ["xm-smile", "xm-grin", "xm-flat", "xm-frown"].every(c => html.includes(`class="${c}"`)));
ok("the brows are drawn in two parts so each can move", html.includes('class="brow bl"') && html.includes('class="brow br"'));
ok("the four expressions have styles", ["pleased", "delighted", "unsure", "annoyed"].every(x => new RegExp(`\\[data-x=${x}\\]`).test(html)));
ok("the mouths stay hidden until a face is set, and the open mouth takes over when talking", /\.xm path\{display:none\}/.test(html) && /:not\(\.talking\)/.test(html));
ok("a reaction pop-up sits in the scene", html.includes('id="rxpop"') && /@keyframes rxpop/.test(html));
ok("the resting face follows the mood at the start of each question", /setFace\(moodFace\(M\)\)/.test(mission));
ok("the face reacts to the answer before the customer replies", /setFace\(tier === "best" \? "delighted"[\s\S]{0,80}\n\s*await lipTalk\("cust"/.test(mission));
ok("people who prefer less motion still get the reaction", /prefers-reduced-motion:reduce\)\{\.rxpop\.go\{animation:none/.test(html));
const ctx = vm.createContext({ console, state: {} });
vm.runInContext(mission.slice(mission.indexOf("const moodFace"), mission.indexOf("const REACT_POP")), ctx);
const face = vm.runInContext("moodFace", ctx);
ok("a warm customer smiles, a middling one is plain, a cool one looks unsure, a hostile one is annoyed", face({ trust: 80, interest: 70 }) === "pleased" && face({ trust: 50, interest: 40 }) === "" && face({ trust: 30, interest: 30 }) === "unsure" && face({ trust: 20, interest: 20 }) === "annoyed");
// the levels' starting moods decide how each customer looks at the start
const scn = vm.createContext({ console }); vm.runInContext(read("scenarios.js").replace(/^"use strict";/, ""), scn);
const starts = vm.runInContext("Object.values(MLEVEL).map(l => l.start)", scn).map(s => face({ trust: s[0], interest: s[1] }));
ok("an easy customer starts friendly or plain and the hardest starts guarded", starts[0] === "" && (starts[4] === "unsure" || starts[4] === "annoyed"), starts.map(x => x || "plain").join(", "));

// grader: same scoring as the missions, and its arithmetic adds up
["criteria.js", "tone.js", "coach.js"].forEach(f => vm.runInContext(read(f).replace(/^"use strict";/, "").replace(/if \(typeof module[^\n]*/, ""), scn));
vm.runInContext(read("grader.js").replace(/^"use strict";/, "").replace(/if \(typeof module[^\n]*/, "").replace(/\bfunction dashGrader[\s\S]*$/, ""), scn);
const rows = vm.runInContext(`SCENARIOS.flatMap(s => s.steps.map((st, i) => ({ id: s.id, i, model: st.R[0].replace(/^"|"$/g, ""), weak: st.E && st.E[0] && st.E[0][0].replace(/^"|"$/g, ""), lvl: s.level })))`, scn);
let mathOk = true, tierOk = true, bad = "";
rows.forEach(r => {
  [r.model, r.weak].filter(Boolean).forEach(text => {
    const out = vm.runInContext(`(() => { const key = ${JSON.stringify(r.id + ":" + r.i)}, res = Coach.score(key, ${JSON.stringify(text)}, ${r.lvl}, { tone: TONE_FOR[${JSON.stringify(r.id)}], voice: null }), m = gradeMath(res, CRITERIA[key].need.length); return { m, tier: gradeTier(res), score: res.score }; })()`, scn);
    if (Math.abs(Math.max(0, out.m.raw - out.m.taken) - out.m.content) > .11 || Math.abs(out.m.content + out.m.tone - out.m.total) > .11) { mathOk = false; bad = r.id + ":" + r.i; }
    if (!["best", "mid", "bad"].includes(out.tier)) tierOk = false;
  });
});
ok(`the grader's arithmetic adds up for all ${rows.length} questions, model and weak answers`, mathOk, bad);
ok("every answer lands in one of the three customer reactions", tierOk);
const dash = read("dashboard.js");
ok("the Grader tab is wired in", /\["grader", "Grader"\]/.test(dash) && /grader: dashGrader/.test(dash) && /<script src="grader\.js/.test(html));
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
