// Checks the results screens and the footer hearts. Run from the mock-prototype folder: node tests/results.test.js
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };
const html = require("./page").source(), mission = read("mission.js"), badges = read("badges.js");

// new badges are shown as the real medals, on both kinds of results screen
ok("a mission's results show new badges as medals, not text pills", /\$\{badgeMedals\(earned\)\}/.test(mission) && !/New badge:/.test(mission));
ok("a lesson's results show them as medals too", /\$\{badgeMedals\(earned\)\}/.test(html) && !/New badge:/.test(html));
ok("a medal row shows the medal, 'NEW BADGE' and the badge's name", /const badgeMedals = keys =>/.test(badges) && /badgeSVG\(k, true\)/.test(badges) && /NEW BADGE/.test(badges));

// stars: earned ones pop in one by one, and three stars gets confetti
ok("both results screens use the same animated star row", /const starRow = stars =>/.test(html) && /\$\{starRow\(stars\)\}/.test(mission) && (html.match(/\$\{starRow\(stars\)\}/g) || []).length === 1);
ok("each earned star pops in after the one before it", /animation:starpop \.6s calc\(var\(--i\) \* \.3s \+ \.2s\)/.test(html));
ok("three stars gets confetti on a mission and on a lesson", /if \(stars === 3 && won\) confetti/.test(mission) && /if \(stars === 3 && passed\) confetti/.test(html));
ok("people who prefer less motion get static stars and medals", /prefers-reduced-motion:reduce\)\{\.bigstars \.star\.on,\.bigstars\.full \.star\.on,\.medalnew\{animation:none/.test(html));

// the customer on a mission's results
ok("the results show the customer, looking how the conversation left them", /const resface|class="resface" data-x="\$\{faceX\}"/.test(mission) && /faceX = avg >= 4 \? "delighted" : won \? "pleased" : avg >= 2\.5 \? "unsure" : "annoyed"/.test(mission));
ok("it shows the customer's last words", /class="reslast"/.test(mission) && /spoken\(lastL\.reply\)/.test(mission));
ok("it uses the customer of the last question, so a practice round shows the right face", /SCENARIOS\.find\(x => x\.id === \(lastL && lastL\.mid\)\)/.test(mission));

// the line about strongest and weakest answers
ok("when every answer scores the same there is no strongest or weakest", /hiS - loS < 0\.05/.test(mission));
ok("all-perfect says there is nothing to fix", /Every answer was a strong one\./.test(mission));
ok("all-equal-but-not-perfect points to the notes under each answer", /All your answers scored about the same/.test(mission));

// hearts only count in a lesson
ok("the footer hearts are hidden unless a lesson is open", /body:not\(\.inlesson\) #stHearts\{display:none\}/.test(html));
ok("a lesson is detected by its own hearts counter, so the knowledge check (no hearts) stays clear", /classList\.toggle\("inlesson", !!app\.querySelector\("\.lesson-top \.hearts"\)\)/.test(html) && /\$\{mission \? "" : `<span class="hearts">/.test(html));

// the page behind the top edge: no flags, and no bounce that would show them
ok("the flags that showed when you pulled past the top are gone", !/class="flags"/.test(html) && !/svg\.flags/.test(html) && !/id="fl"/.test(html));
ok("the page doesn't bounce past the top or bottom", /html,body\{overscroll-behavior-y:none\}/.test(html));

// the results page is compact
ok("each answer is a row you can open, with its score and one line on top", /<details class="acard \$\{band\(r\.score\)\}"\$\{r\.score < 3\.5 \? " open" : ""\}>/.test(mission) && /class="aone"/.test(mission));
ok("only the answers that need work start open", /r\.score < 3\.5 \? " open" : ""/.test(mission));
ok("one button opens or closes every answer", /id="toggleAll"/.test(mission) && /ds\.forEach\(d => \{ d\.open = !allOpen; \}\)/.test(mission));
ok("the score, stars and customer share a header row", /<div class="reshead"><div class="resleft">/.test(mission) && /\.reshead\{display:grid/.test(html));
ok("the strongest and tone notes share one block", /<div class="resnotes">\$\{retryNote\}\$\{focus\}\$\{toneLine\}\$\{missionDelivery\(log\)\}<\/div>/.test(mission));
ok("the camera reminder is one short line, not a card", /class="camnudge"/.test(mission) && !/card nudge/.test(mission));
ok("the merch card no longer carries a footnote", !/You can change what you wear any time in Character/.test(read("boss.js")));
ok("the voice details are still on each answer (pace, pauses, volume), now as the 'How you sounded' lines", /\$\{deliveryBlock\(l\.deliv\)\}/.test(mission) && /words a minute/.test(read("tone.js")) && /label: "Long pauses"/.test(read("tone.js")) && /label: "Volume"/.test(read("tone.js")));

// stars follow the score out of 100, in halves; passing is a separate test
const vm = require("vm"), sctx = vm.createContext({ console, localStorage: { getItem() { return null; }, setItem() {}, removeItem() {} } });
vm.runInContext(read("progress.js").replace(/^"use strict";/, ""), sctx);
const sf = p => vm.runInContext(`starsFor(${p})`, sctx);
ok("50% is 1.5 stars, as asked", sf(50) === 1.5);
ok("100% is 3 stars and 0% is none", sf(100) === 3 && sf(0) === 0);
ok("the stars go up in halves with the score", [[17, 0.5], [34, 1], [50, 1.5], [67, 2], [78, 2.5], [92, 3]].every(([p, s]) => sf(p) === s), [17, 34, 50, 67, 78, 92].map(p => sf(p)).join(" "));
ok("a better score never gets fewer stars", Array.from({ length: 101 }, (_, i) => sf(i)).every((s, i, a) => !i || s >= a[i - 1]));
ok("scores outside 0 to 100 are held to 0 to 3 stars", sf(-20) === 0 && sf(140) === 3);
ok("a mission's stars come from its percentage, not from passing", /const pct = Math\.round\(avg \/ 5 \* 100\), stars = starsFor\(pct\)/.test(mission));
ok("a mission counts as passed by its pass mark (won), never by having stars", /counts && won && firstTime/.test(mission) && /if \(counts && won\) \{ state\.done/.test(mission) && !/stars > 0/.test(mission));
ok("a lesson's stars come from its percentage and passing is its own flag", /stars = starsFor\(pct\)/.test(html) && /function finish\(L, passed,/.test(html) && !/stars > 0/.test(html) && /return finish\(L, pass,/.test(read("lessons.js")));
ok("a lesson's Brand Brain badge needs a perfect score, not a rounded star count", /s\.lesson && s\.won && s\.pct === 100/.test(read("progress.js")));
// half stars draw as half stars, on the results, the map and the history
const rctx = vm.createContext({ console }); vm.runInContext(html.slice(html.indexOf("const starRow ="), html.indexOf("function finish(L, passed,")), rctx);
const big = vm.runInContext("starRow(1.5)", rctx), small = vm.runInContext("starGlyphs(2.5)", rctx);
ok("1.5 stars is one full star, one half star and one empty", (big.match(/class="star on"/g) || []).length === 1 && (big.match(/class="star on half"/g) || []).length === 1 && (big.match(/class="star "/g) || []).length === 1);
ok("the map and history stars show 2.5 as two full and a half", (small.match(/class="gs full"/g) || []).length === 2 && (small.match(/class="gs half"/g) || []).length === 1);
ok("the stars say how many they are for screen readers", /aria-label="1\.5 of 3 stars"/.test(big) && /aria-label="2\.5 of 3 stars"/.test(small));
ok("the map and the history use the half-star stars", /starGlyphs\(state\.stars\[n\.id\] \|\| 0\)/.test(html) && /starGlyphs\(h\.stars \|\| 0\)/.test(read("dashboard.js")));
ok("a half star fills half", /\.bigstars \.star\.half\{background:linear-gradient\(90deg,var\(--gold\) 50%/.test(html) && /\.gs\.half\{background:linear-gradient\(90deg,var\(--gold\) 50%/.test(html));
ok("on the map a half star's gold half is not muddied: the stars there get a drop-shadow, and nothing puts a text-shadow on them (a text-shadow shows through the half star's see-through letter and darkens the gold)", /\.node \.stars \.gs\{filter:drop-shadow\(0 1px 1px #000a\)\}/.test(html) && !/\.node \.stars[^{]*\{[^}]*text-shadow/.test(html) && !/\.node \.stars \.gs[^{]*\{[^}]*text-shadow/.test(html) && /\.node \.stars \.gs\.half\{background:linear-gradient\(90deg,var\(--gold\) 50%,#ffffff4d 50%\)/.test(html));
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
