// Checks the first run, "Try this question again", the 60-second review (the Who is Tequila Corrido? page) and its calculator, time estimates.
// Run from the mock-prototype folder: node tests/callcard.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };
const html = read("index.html"), onb = read("onboarding.js"), mission = read("mission.js"), dash = read("dashboard.js"), field = read("callcard.js");

// ---------- the calculator's maths ----------
const ctx = vm.createContext({ console });
vm.runInContext(field.replace(/^"use strict";/, "") + ";globalThis.FW = CallCard;", ctx);
const near = (a, b) => Math.abs(a - b) < 0.005;
const m = vm.runInContext(`FW.pourMath({ cost: 44.99, ml: 750, oz: 1.5, menu: 12 })`, ctx);
ok("a 750 ml bottle at a 1.5 oz pour makes 16 whole pours", m.pours === 16);
ok("the cost per pour is the bottle cost over the pours", near(m.perPour, 44.99 / 16));
ok("the pour cost is the cost per pour as a share of the menu price", near(m.pct, 44.99 / 16 / 12 * 100));
ok("a bottle brings in pours times the menu price, and what is left is that minus the bottle cost", near(m.revenue, 192) && near(m.kept, 192 - 44.99));
ok("without a menu price there is no pour cost or revenue, only pours and cost per pour", (r => r.pours === 16 && r.pct === undefined && r.revenue === undefined)(vm.runInContext(`FW.pourMath({ cost: 44.99, ml: 750, oz: 1.5, menu: "" })`, ctx)));
ok("missing, zero or silly numbers give no answer instead of a wrong one", ["{cost:'',ml:750,oz:1.5}", "{cost:0,ml:750,oz:1.5}", "{cost:40,ml:0,oz:1.5}", "{cost:40,ml:750,oz:0}", "{cost:40,ml:20,oz:2}", "{cost:'abc',ml:750,oz:1.5}"].every(a => vm.runInContext(`FW.pourMath(${a})`, ctx) === null));
ok("a bigger pour means fewer pours and a higher cost per pour", vm.runInContext(`FW.pourMath({cost:50,ml:750,oz:2}).perPour > FW.pourMath({cost:50,ml:750,oz:1}).perPour`, ctx));

// ---------- the card never invents numbers ----------
ok("the card says its prices are public shop prices and that wholesale must be confirmed in writing", /public shop prices/.test(field) && /confirm them in writing/.test(field) && /never quotes a margin/.test(field));
ok("the bottles come from one list, the same one the calculator uses", /LINEUP\.map/.test(field) && (field.match(/LINEUP\.map/g) || []).length === 2 && (html.match(/const LINEUP = \[/g) || []).length === 1);
ok("no merch or clothing on the card", !/merch|shirt|\bhat\b/i.test([...vm.runInContext("[...FW.DO, ...FW.NEVER, ...FW.IFTHEY.flat()]", ctx)].join(" ")));
ok("the Never list covers under 21, health claims, invented numbers, other brands, leaving alcohol and shipping", ["under 21", "health claims", "Invent prices", "Run down", "Leave alcohol", "shipping"].every(w => vm.runInContext("FW.NEVER", ctx).some(x => x.includes(w))));
// ---------- the Who is Tequila Corrido? page is the 60-second review ----------
const explorer = html.slice(html.indexOf("function explorer() {"), html.indexOf("// ---------- home / map ----------"));
ok("the Who is Tequila Corrido? page is the 60-second review: built from CallCard.review(), with its calculator wired, and no separate Before a call page or button", /\$\{CallCard\.review\(\)\}/.test(explorer) && /CallCard\.wire\(\);/.test(explorer) && !/beforeCall|id="xcall"|Before a call/.test(html + field + read("presenter.js")) && /your 60-second review before a call/i.test(explorer));
ok("that page has no link to the website: no href, no new-tab link, no shop link, and its merch list is plain rows", !/href=|target=|ilovetequilacorrido|shoplink|sitelink|xsite/.test(explorer + field) && !/<a class="xrow"|<a class="xbottle"/.test(explorer + field) && /<div class="xrow"/.test(explorer));
const rev = (() => {
  const c = vm.createContext({ console, IMG: "img/", esc: s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]), $: () => ({}) });
  vm.runInContext(html.match(/const LINEUP = \[[\s\S]*?\n\];/)[0] + field.replace(/^"use strict";/, "") + ";globalThis.R = CallCard.review();", c);
  return c.R;
})();
ok("the review has the one-line promise, four bottles with photos and prices, Do and Never, six things they might say, and a calculator folded away", /Say it in one line/.test(rev) && (rev.match(/class="xbottle"/g) || []).length === 4 && /\$44\.99/.test(rev) && /\$89\.99/.test(rev) && /<h3>Do<\/h3>/.test(rev) && /<h3>Never<\/h3>/.test(rev) && (rev.match(/<dt>/g) || []).length === 6 && /<details class="card xmerch" id="calc">/.test(rev));
ok("it is condensed: each Do, Never and objection answer is one short line (under 80 characters)", vm.runInContext("[...FW.DO, ...FW.NEVER, ...FW.IFTHEY.map(x => x[1])]", ctx).every(x => x.length < 80));
ok("the review itself has no links at all", !/<a /.test(rev) && !/href/.test(rev));

// ---------- the Field log is gone ----------
ok("there is no Field log: no tab, no code, no styles, and the card has no link to one", !/Field log|dashField|FieldWork|fieldwork|state\.field|fform|flist/.test(html + dash + field + read("presenter.js")) && !fs.existsSync(path.join(root, "fieldwork.js")));
ok("the Dashboard tabs are the six it had before", /const tabs = \[\["progress", "Progress"\], \["badges", "Badges"\], \["team", "Team"\], \["review", "Review".*?\], \["check", "Knowledge check"\], \["settings", "Settings"\]\];/.test(dash));

// ---------- the quick start ----------
ok("a new player gets the full creator, then a short tutorial, then the open map: no stop opens by itself, so they can look around", /creator\(startFlow, \{ fresh: true \}\)/.test(onb) && /if \(!state\.tutorialSeen && !veteran\) return tutorial\(/.test(onb) && !/welcomed|openDiff/.test(onb) && !/firstCall/.test(onb + mission + html));
ok("the creator shows every option from the start (no extra tap), and the first time starts from a random look with a clear face", !/quick|qonly|cmore/.test(html.slice(html.indexOf("function creator("), html.indexOf("// ---------- customers and scenes ----------"))) && /const fresh = !!opts\.fresh;/.test(html) && /if \(fresh && !state\.avatarSaved\) \{ \$\("#crand"\)\.click\(\); A\.glasses = "None"; A\.hat = "None"; wire\(\); \}/.test(html) && !/\.creator\.quick/.test(html));
ok("there is no forced call or camera prompt before the map, and the camera works as before in missions", !/firstCall|first call/i.test(onb + mission) && /if \(state\.cam\) \{ Cam\.reset\(\); Cam\.begin\(\); \} else Cam\.stop\(\);/.test(mission));
ok("the knowledge check no longer locks the map; it is offered on the Dashboard", /const needsCheck = \(\) => false;/.test(html) && /id="pcheck"/.test(dash) && !/Required next step/.test(onb));
ok("the tutorial is three short cards, and it can be replayed from Settings", (onb.match(/^  \{ title: \(\) =>/gm) || []).length === 3 && /id="replay"/.test(dash) && /function tutorial\(/.test(onb));

// ---------- Try this question again ----------
ok("every answer that is not yet strong has a Try this question again button", /\$\{r\.score < 4 \? `<p class="retryrow"><button class="btn alt retryq"/.test(mission) && /\.retryq"\)\.forEach\(b => b\.onclick = \(\) => play\(retryScenario\(log\[\+b\.dataset\.i\]\)\)\)/.test(mission));
ok("a retry is one question, practice only, with the same criteria key so a good answer clears it from Review", /function retryScenario\(l\)/.test(mission) && /retry: true, retryFrom: l\.res\.score/.test(mission) && /ckey: l\.ck/.test(mission) && /steps: \[\{ \.\.\.st, line: l\.line, src, ckey: l\.ck \}\]/.test(mission));
ok("the checklist is hidden on a retry, and the results compare the two scores", /L\.tips && !sc\.retry \? tips/.test(mission) && /Last time you scored/.test(mission));

// ---------- time and the weekly goal, kept off the map ----------
ok("the time estimate shows in the dialog and the Next up bar, and not on each stop", /about \$\{stopMinutes\(stop\)\} min/.test(html) && /about \$\{stopMinutes\(nextStop\)\} min/.test(html) && !/stopMinutes\(n\)/.test(html) && !/stopMinutes\(st\)\}/.test(html.slice(html.indexOf("const stops = "), html.indexOf("const stops = ") + 1500)));
ok("a mission is about a minute and a half an answer, a lesson half a minute a question", /st\.qs \? Math\.max\(2, Math\.round\(st\.qs\.length \* 0\.5\)\) : st\.steps \? Math\.max\(3, Math\.round\(st\.steps\.length \* 1\.5\)\)/.test(html));
ok("there is no weekly goal on the Dashboard", !/weekGoalCard|weekStart|wgoal|weekgoal|weekGoal/.test(dash + html));
ok("the card script loads after the manager script and the names don't clash", html.indexOf('<script src="manager.js') < html.indexOf('<script src="callcard.js') && (field.match(/^const [A-Za-z]+ =/gm) || []).length === 1);
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
