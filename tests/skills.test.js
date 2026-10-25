// Checks the Skills chart on the dashboard: every skill belongs to one family, the radar has few enough axes that no label overlaps another,
// and every individual skill is still listed. Run from the mock-prototype folder: node tests/skills.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };

const ctx = vm.createContext({ console, localStorage: { getItem: () => null, setItem() {}, removeItem() {} } });
["scenarios.js", "lessons.js", "progress.js"].forEach(f => vm.runInContext(read(f).replace(/^"use strict";/, "").replace(/if \(typeof module[^\n]*/, ""), ctx));
const dash = read("dashboard.js");
vm.runInContext("const esc = t => String(t).replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' })[c]);" + dash.slice(dash.indexOf("// Where each of N skills sits on a radar"), dash.indexOf("function cameraDash(H) {")), ctx);
const ev = s => vm.runInContext(s, ctx);

// every skill the game can score belongs to exactly one family
const skills = ev("[...new Set([...SCENARIOS.flatMap(s => s.steps.map(st => st.skill)), 'Story', 'Product knowledge'])]");
const homes = skills.map(k => [k, ev("SKILL_FAMILIES").filter(([, list]) => list.includes(k)).map(([f]) => f)]);
ok(`all ${skills.length} skills the missions and lessons score are in a family`, homes.every(([, f]) => f.length >= 1), homes.filter(([, f]) => !f.length).map(h => h[0]).join(", "));
ok("no skill is in two families, so none is counted twice", homes.every(([, f]) => f.length <= 1), homes.filter(([, f]) => f.length > 1).map(h => h[0]).join(", "));
ok("there are few enough families for a readable chart (7 or fewer)", ev("SKILL_FAMILIES.length") <= 7 && skills.length > 20);

// the maths: a family's score is the average of its skills, weighted by how often each was scored
const fam = ev(`skillFamilies([["Closing", 60, 3], ["Follow-up", 80, 1], ["Rapport", 90, 2], ["Mystery skill", 50, 1]])`);
ok("a family averages its skills weighted by how often they were scored (Closing 60 x3 and Follow-up 80 x1 gives 65)", fam.find(f => f[0] === "Closing")[1] === 65 && fam.find(f => f[0] === "Closing")[2] === 4);
ok("families with no score are left out, and the rest keep the order of a sales call", fam.map(f => f[0]).join() === "Opening,Closing,Mystery skill", fam.map(f => f[0]).join());
ok("a skill that is in no family gets one of its own instead of vanishing", fam.some(f => f[0] === "Mystery skill" && f[1] === 50));

// the radar for a finished game (every skill scored): label boxes never overlap and all fit inside the picture
const all = JSON.stringify(skills.map(k => [k, 80 + (k.length % 15), 2]));
const svg = ev(`skillRadar(skillFamilies(${all}))`);
const texts = [...svg.matchAll(/<text text-anchor="(\w+)" x="([\d.]+)" y="([\d.]+)">([\s\S]*?)<\/text>/g)].map(m => {
  const lines = [...m[4].matchAll(/<tspan[^>]*>([^<]*)<\/tspan>/g)].map(t => t[1].replace(/&amp;/g, "&")), w = Math.max(...lines.map(l => l.length)) * 6.6, x = +m[2], y = +m[3];
  const left = m[1] === "end" ? x - w : m[1] === "start" ? x : x - w / 2;
  return { lines, box: [left, y - 10, left + w, y - 10 + lines.length * 12 + 2] };
});
ok("the radar has one label per family, 7 at most", texts.length === 7 && (svg.match(/<circle /g) || []).length === 7, texts.length + " labels");
ok("every label is one or two short lines (no line over 14 characters)", texts.every(t => t.lines.length <= 2 && t.lines.every(l => l.length <= 14)), texts.map(t => t.lines.join(" / ")).join(" | "));
const clash = [];
texts.forEach((a, i) => texts.forEach((b, j) => { if (j > i && a.box[0] < b.box[2] && b.box[0] < a.box[2] && a.box[1] < b.box[3] && b.box[1] < a.box[3]) clash.push(`${a.lines.join(" ")} / ${b.lines.join(" ")}`); }));
ok("no two labels overlap", clash.length === 0, clash.join("; "));
ok("every label sits inside the picture (340 x 285)", texts.every(t => t.box[0] >= 0 && t.box[2] <= 340 && t.box[1] >= 0 && t.box[3] <= 285), texts.filter(t => t.box[0] < 0 || t.box[2] > 340).map(t => t.lines.join(" ") + " " + t.box.map(Math.round)).join("; "));
ok("only the weakest family gets the red dot", (svg.match(/class="dot weak"/g) || []).length === 1);

// the page: families beside the chart, every skill under "All skills", the early-game fallback still there
ok("the Skills card shows the radar from three families, and lists every skill under All skills", /fams\.length >= 3/.test(dash) && /<details class="skilldetail"><summary>All \$\{skills\.length\} skills<\/summary>/.test(dash));
ok("with fewer than three families it falls back to the simple bars, and says what unlocks the chart", /three skill areas/.test(dash) && /skills\.map\(\(\[k, v\], i\) => `<div class="row">/.test(dash));
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
