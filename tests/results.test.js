// Checks the results screens and the footer hearts. Run from the mock-prototype folder: node tests/results.test.js
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };
const html = read("index.html"), mission = read("mission.js"), badges = read("badges.js");

// new badges are shown as the real medals, on both kinds of results screen
ok("a mission's results show new badges as medals, not text pills", /\$\{badgeMedals\(earned\)\}/.test(mission) && !/New badge:/.test(mission));
ok("a lesson's results show them as medals too", /\$\{badgeMedals\(earned\)\}/.test(html) && !/New badge:/.test(html));
ok("a medal row shows the medal, 'NEW BADGE' and the badge's name", /const badgeMedals = keys =>/.test(badges) && /badgeSVG\(k, true\)/.test(badges) && /NEW BADGE/.test(badges));

// stars: earned ones pop in one by one, and three stars gets confetti
ok("both results screens use the same animated star row", /const starRow = stars =>/.test(html) && /\$\{starRow\(stars\)\}/.test(mission) && (html.match(/\$\{starRow\(stars\)\}/g) || []).length === 1);
ok("each earned star pops in after the one before it", /animation:starpop \.6s calc\(var\(--i\) \* \.3s \+ \.2s\)/.test(html));
ok("three stars gets confetti on a mission and on a lesson", /if \(stars === 3 && won\) confetti/.test(mission) && /if \(stars === 3\) confetti/.test(html));
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
ok("the strongest and tone notes share one block", /<div class="resnotes">\$\{focus\}\$\{toneLine\}<\/div>/.test(mission));
ok("the camera reminder is one short line, not a card", /class="camnudge"/.test(mission) && !/card nudge/.test(mission));
ok("the merch card no longer carries a footnote", !/You can change what you wear any time in Character/.test(read("boss.js")));
ok("the voice details are still on each answer (pace, pauses, volume)", /words a minute · \$\{r\.tone\.stats\.pauses\} long pauses · volume \$\{r\.tone\.stats\.db\} dB/.test(mission));
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
