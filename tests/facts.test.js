// Checks Brand facts: a manager changes the public prices and the wording of the 60-second review without touching code, and the whole game follows (missions, lessons,
// scoring rules, the review, "Did you know?"), every change can be undone exactly, and bad input is refused. Run from the mock-prototype folder: node tests/facts.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };
const esc = s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);

const ctx = vm.createContext({ console, esc, IMG: "img/", $: () => null, state: { facts: null, done: {}, proto: {} } });
for (const f of ["progress.js", "scenarios.js", "lessons.js", "tiers.js", "criteria.js", "tone.js", "coach.js", "surprise.js", "facts.js", "explorer.js", "callcard.js"]) vm.runInContext(read(f).replace(/^"use strict";/, "").replace(/if \(typeof module[^\n]*/, ""), ctx);
vm.runInContext(read("start.js").match(/const FACTS = \[[\s\S]*?\n\];/)[0], ctx);
vm.runInContext(`const SENTINEL = ["costs $144.99 or 44.99 or $44.995 or $44.99."]; Facts.use([SCENARIOS, OPENERS, LINE_ALTS, MIDS, BANK, LESSONS, CRITERIA, EXTRA_STOPS, LINEUP, SURPRISE, SENTINEL], FACTS); Facts.apply();`, ctx);
const ev = s => vm.runInContext(s, ctx);
// everything the swap can touch, as text (a rule's regular expression by its source), so two states can be compared exactly
const snap = () => ev(`JSON.stringify([SCENARIOS, OPENERS, LINE_ALTS, MIDS, BANK, LESSONS, CRITERIA, LINEUP, SURPRISE, SENTINEL, FACTS], (k, v) => (v instanceof RegExp ? "/" + v.source + "/" + v.flags : v))`);
const NEW = { Blanco: "46.99", Reposado: "56.99", Overproof: "58.99", "Añejo": "92.99" };   // Reposado takes the number the Overproof had, so a careless swap would go wrong
const input = (over = {}) => ({ ...ev("Facts.get()"), ...over });
const save = i => ev(`Facts.save(${JSON.stringify(i)})`);
const original = snap();

// ---------- the starting point ----------
const g0 = ev("Facts.get()"), d0 = ev("Facts.defaults()");
ok("it starts from the shop's public prices, a draft status, and the review's own wording", JSON.stringify(g0.prices) === JSON.stringify({ Blanco: "44.99", Reposado: "54.99", Overproof: "56.99", "Añejo": "89.99" }) && ev("Facts.status()") === "Draft: not yet confirmed by the brand" && g0.promise === "Additive-free. Only three ingredients and no fake flavors." && g0.doList.length === 4 && g0.neverList.length === 6 && g0.replies.length === 6 && g0.didYouKnow.length === 6);
ok("saving exactly the defaults changes nothing and stores nothing", (r => r.ok && Object.keys(r.clean).length === 0)(save(input())) && ev("state.facts") === null && snap() === original);

// ---------- refusing bad input ----------
const bad = (over, re) => { const r = save(input(over)); return !r.ok && r.errors.some(e => re.test(e)) && snap() === original && ev("state.facts") === null; };
ok("a price has to be a number from 20 to 500 with at most two decimals", ["abc", "19.99", "501", "44.999", "", "-45"].every(v => bad({ prices: { ...g0.prices, Blanco: v } }, /Blanco price/)));
ok("two bottles can't share a price (a swap back could not tell them apart)", bad({ prices: { ...g0.prices, Reposado: "44.99" } }, /own price/));
ok("the Añejo must stay the dearest, because a lesson asks which bottle is the priciest", bad({ prices: { ...g0.prices, Blanco: "99.00" } }, /Añejo has to stay the most expensive/));
ok("the promise, every Do, Never and reply, and at least one 'Did you know?' line can't be empty or too long", bad({ promise: "  " }, /promise can't be empty/) && bad({ promise: "x".repeat(161) }, /too long/) && bad({ doList: ["a", "", "c", "d"] }, /Do line 2 can't be empty/) && bad({ neverList: [...g0.neverList.slice(0, 5), "x".repeat(201)] }, /Never line 6 is too long/) && bad({ replies: ["", ...g0.replies.slice(1)] }, /Reply to an objection 1/) && bad({ didYouKnow: ["", " "] }, /at least one/) && bad({ didYouKnow: ["x".repeat(221)] }, /too long/));
ok("a date has to be a date", bad({ checked: "yesterday" }, /date/));
ok("a $ in front of a price is fine", save(input({ prices: { ...g0.prices, Blanco: "$45.00" } })).ok && (ev("Facts.reset()"), snap() === original));

// ---------- the whole game follows a price change ----------
const r1 = save(input({ prices: NEW }));
ok("new prices are saved, and only what differs from the defaults is stored", r1.ok && JSON.stringify(ev("state.facts")) === JSON.stringify({ prices: NEW }));
const all = (re) => (snap().match(re) || []).length;
ok("a line that lists all four prices says the new ones, in the right places (not swapped twice)", snap().includes("On the site: Blanco $46.99, Reposado $56.99, Overproof $58.99, Añejo $92.99.") && !snap().includes("Blanco $44.99") && !snap().includes("Overproof $56.99"));
ok("lesson questions follow: the right answer and the wrong ones, and the priciest bottle (its choices are just the names, so the prices do not give it away; the explanation has them)", ev(`Q("blancoPrice").a`) === "$46.99" && ev(`Q("blancoPrice").w`).join() === "$56.99,$58.99,$92.99" && ev(`Q("priciest").a`) === "Añejo" && ev(`Q("priciest").w`).join() === "Blanco,Reposado,Overproof" && /\$92\.99/.test(ev(`Q("priciest").why`)) && ev(`Q("overproofPrice").a`) === "$58.99");
ok("the four bottles on the review and the pour calculator follow", ev("LINEUP.map(r => r[1]).join()") === "$46.99,$56.99,$58.99,$92.99" && /\$46\.99 shop price/.test(ev("CallCard.review()")) && /value="46\.99"/.test(ev("CallCard.review()")));
ok("the surprise customer's price follows", ev(`SURPRISE.find(s => s.id === "lena-price").line`).includes("$92.99") && !ev(`SURPRISE.find(s => s.id === "lena-price").line`).includes("$89.99"));
ok("the scoring rules follow: a rule that looked for $89.99 now looks for $92.99", ev(`(() => { const re = Object.values(CRITERIA).flatMap(k => [...k.need, ...k.bad]).map(x => x[0]).find(r => /status bottle/.test(r.source)); return re.test("The Añejo at $92.99 is a status bottle") && !re.test("It costs $89.99") && /92\\\\\\.99/.test(re.source) && re.flags === "i"; })()`));
ok("the 'public prices' rule asks for the four new prices", ev(`Object.values(CRITERIA).flatMap(k => k.need).map(x => x[0]).some(r => r.source.startsWith("(46\\\\.99|56\\\\.99|58\\\\.99|92\\\\.99|"))`));
ok("a number that only contains a price is left alone ($144.99, $44.995), and a lone 44.99 follows", ev("SENTINEL[0]") === "costs $144.99 or 46.99 or $44.995 or $46.99.");
ok("'Did you know?' follows too, and it is the same list the results screens read", ev("FACTS[1]") === "Tequila Corrido's lineup runs Blanco $46.99, Reposado $56.99, Overproof $58.99 and Añejo $92.99, all additive-free." && ev("FACTS.length") === 6);
ok("every model answer in every mission and every surprise question still scores 4.2 or more after the change", ev(`(() => { const strip = t => t.replace(/^"|"$/g, ""), low = []; SCENARIOS.forEach(sc => sc.steps.forEach((st, i) => { const key = sc.id + ":" + i, s = Coach.score(key, strip(st.R[0]), sc.level, { tone: TONE_FOR[sc.id] }).score; if (s < 4.2) low.push(key + " " + s); })); SURPRISE.forEach(st => { const s = Coach.score("surprise:" + st.id, strip(st.R[0]), 4, { tone: TONE_FOR[st.view.id] }).score; if (s < 4.2) low.push(st.id + " " + s); }); return low.join(); })()`) === "");
ok("the review says when the prices were last checked, and the game's own text never mentions Corrido merch prices (they aren't swapped)", /Prices last checked 24 Oct 2026/.test(ev("CallCard.review()")) && !/SHOP|OUTFITS|HATS/.test(read("start.js").match(/Facts\.use\([^)]*\)/)[0]));

// ---------- undoing it, exactly ----------
ev("Facts.reset()");
ok("putting the originals back restores every price and rule exactly, even though Reposado took the Overproof's number", snap() === original && ev("state.facts") === null);
save(input({ prices: { Blanco: "54.99", Reposado: "44.99", Overproof: "56.99", "Añejo": "89.99" } }));
ok("two bottles can trade prices: each follows its own bottle", ev(`Q("blancoPrice").a`) === "$54.99" && ev(`Q("reposadoPrice").a`) === "$44.99" && ev("LINEUP.map(r => r[1]).join()") === "$54.99,$44.99,$56.99,$89.99" && snap().includes("Blanco $54.99, Reposado $44.99, Overproof $56.99 and Añejo $89.99"));
ev("Facts.reset()");
ok("and that undoes exactly too", snap() === original);
save(input({ prices: { ...g0.prices, Blanco: "47.50" } })); save(input({ prices: NEW })); const twoSteps = snap();
ev("Facts.reset()"); save(input({ prices: NEW }));
ok("changing prices twice gives the same game as changing them once (the order of edits doesn't matter)", twoSteps === snap());
ev("Facts.reset()");

// ---------- the wording ----------
const words = { promise: "Clean tequila. Three ingredients. Nothing else.", doList: ["Do one", "Do two", "Do three", "Do four"], neverList: ["Never 1", "Never 2", "Never 3", "Never 4", "Never 5", "Never 6"], replies: ["R1", "R2", "R3", "R4", "R5", "R6"] };
ok("new wording is saved and the review shows it, with the first sentence of the promise in bold", save(input(words)).ok && (h => /<b>Clean tequila\.<\/b> Three ingredients\. Nothing else\./.test(h) && /<li>Do two<\/li>/.test(h) && /<li>Never 6<\/li>/.test(h) && /<dd>R4<\/dd>/.test(h) && !/Offer 60 seconds/.test(h))(ev("CallCard.review()")));
ok("only the edited parts are stored, and the objection questions themselves can't be changed", Object.keys(ev("state.facts")).sort().join() === "doList,neverList,promise,replies" && /<dt>“It's too expensive\.”<\/dt>/.test(ev("CallCard.review()")));
ev("Facts.reset()");
ok("the review is back to its own wording after a reset", /Offer 60 seconds/.test(ev("CallCard.review()")) && /<b>Additive-free\.<\/b>/.test(ev("CallCard.review()")));
save(input({ promise: "<script>alert(1)</script> Safe." }));
ok("what a manager types on the review is escaped", !/<script>/.test(ev("CallCard.review()")) && /&lt;script&gt;/.test(ev("CallCard.review()")));
ev("Facts.reset()");

// ---------- Did you know ----------
save(input({ didYouKnow: ["Line one <b>bold</b>.", "Line two."] }));
ok("custom lines replace the list in place, and they are escaped because the results screens write them out as HTML", ev("FACTS.length") === 2 && ev("FACTS[0]") === "Line one &lt;b&gt;bold&lt;/b&gt;." && ev("FACTS[1]") === "Line two.");
ev("Facts.reset()");
ok("clearing a line removes it, and a reset brings all six back", save(input({ didYouKnow: [...g0.didYouKnow.slice(0, 5), "  "] })).ok && ev("FACTS.length") === 5 && (ev("Facts.reset()"), ev("FACTS.length") === 6));
save(input({ prices: NEW, didYouKnow: ev("Facts.get().didYouKnow") }));
ok("lines left as they were keep following the prices: they are not stored as custom text", ev("state.facts.didYouKnow") === undefined && ev("FACTS[1]").includes("$92.99"));
ev("Facts.reset()");

// ---------- who confirmed it ----------
save(input({ confirmedBy: "Ken Phox", confirmedOn: "2026-10-24" }));
ok("who confirmed it, and when, shows as the status and at the foot of the review; with no name it is a draft", ev("Facts.status()") === "Confirmed by Ken Phox on 24 Oct 2026" && /Wording and prices: confirmed by ken phox on 24 oct 2026/.test(ev("CallCard.review()")) && (save(input({ confirmedBy: "" })), ev("Facts.status()") === "Draft: not yet confirmed by the brand") && /Wording and prices: draft: not yet confirmed by the brand/.test(ev("CallCard.review()")));
ev("Facts.reset()");
save(input({ checked: "2026-11-02" }));
ok("the 'prices last checked' date shows on the review", /Prices last checked 2 Nov 2026/.test(ev("CallCard.review()")));
ev("Facts.reset()");

// ---------- where it is wired in ----------
const start = read("start.js"), pres = read("presenter.js"), html = read("index.html"), pageFacts = read("facts.js");
ok("the game applies the saved facts before it draws anything, and Presenter mode re-applies them when it swaps players", /Facts\.use\(\[SCENARIOS, OPENERS, LINE_ALTS, MIDS, BANK, LESSONS, CRITERIA, EXTRA_STOPS, LINEUP, SURPRISE\], FACTS\);\s*Facts\.apply\(\);/.test(start) && start.indexOf("Facts.apply()") < start.indexOf("home();") && /if \(typeof Facts !== "undefined"\) Facts\.apply\(\)/.test(pres));
ok("restoring a backup and resetting all progress both re-apply the facts, so the game never shows prices that are no longer saved", /Progress\.save\(state\); Facts\.apply\(\); hud\(\); done\(true\)/.test(read("dashboard.js")) && /Progress\.reset\(\); Object\.assign\(state, Progress\.blank\(\)\); state\.hearts = D\(\)\.hearts; Facts\.apply\(\)/.test(read("dashboard.js")));
ok("facts.js loads before the review (which registers its wording with it) and the page's own scripts", html.indexOf('<script src="facts.js') < html.indexOf('<script src="callcard.js') && html.indexOf('<script src="callcard.js') < html.indexOf('<script src="app.js'));
ok("the page has a field for every price, the status, the review wording and the lines, a save button and a way back", [/id="fp\$\{i\}"/, /id="fchecked"/, /id="fken"/, /id="fkendate"/, /"fpromise"/, /"fdo" \+ i/, /"fnever" \+ i/, /"freply" \+ i/, /"fdyk" \+ i/, /id="fsave"/, /id="freset"/].every(re => re.test(pageFacts)) && /confirm\("Put back the original prices and wording everywhere\?"\)/.test(pageFacts));
ok("the words a rep never sees stay out of reach: the page doesn't edit missions, scoring rules or merch", !/SCENARIOS\[|CRITERIA\[|OUTFITS|HATS/.test(pageFacts.slice(pageFacts.indexOf("function mgrFacts"))));
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
