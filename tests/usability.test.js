// Checks the usability fixes: each ladder has its own word (Rank for XP, Tier for bosses, Easy to Expert for difficulty), the Record button stays pinned on a phone, the map opens
// on the next stop, the camera reminder shows once and can be switched off, feedback shows what to fix first and folds the rest, and photos have a placeholder.
// Run from the mock-prototype folder: node tests/usability.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };
const html = read("index.html"), css = html.slice(html.indexOf("<style>"), html.indexOf("</style>"));
const noComments = src => src.split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");

// ---------- 1. each ladder has its own word ----------
const ctx = vm.createContext({ console });
["scenarios.js", "progress.js", "tiers.js"].forEach(f => vm.runInContext(read(f).replace(/^"use strict";/, "").replace(/if \(typeof module[^\n]*/, ""), ctx));
const ev = s => vm.runInContext(s, ctx);
const ranks = ev("LEVELS.map(l => l[0])"), tiers = ev("TIERS"), diffs = [...new Set(ev("Object.values(MLEVEL).map(l => l.name)"))];
ok("difficulty is Easy, Medium, Hard or Expert", diffs.join() === "Easy,Medium,Hard,Expert");
ok("the three ladders share no word: ranks (XP), tiers (bosses) and difficulties are different names", new Set([...ranks, ...tiers, ...diffs]).size === ranks.length + tiers.length + diffs.length, ranks.join() + " | " + tiers.join() + " | " + diffs.join());
const shown = ["app.js", "dialog.js", "dashboard.js", "map.js", "mission.js", "grader.js", "presenter.js", "boss.js", "results.js", "onboarding.js"].map(f => [f, noComments(read(f))]);
const stray = shown.filter(([, s]) => /\bLv\b|[Ll]evel \$\{|[Ll]evel \d|>Level<|"[Ll]evel"|"[Ll]evel " \+|\bLevel [A-Za-z]/.test(s)).map(([f]) => f);
ok("no screen says 'Lv', 'Level 4' or 'Level' as a column or label any more", stray.length === 0, stray.join());
ok("the footer shows the rank's name (Rookie to Master Rep), with a title that says it is a rank", /\$\("#stLvl"\)\.textContent = LEVELS\[lv\]\[0\]/.test(read("app.js")) && /Your rank: /.test(read("app.js")) && /<span id="stLvl">Rookie<\/span>/.test(html) && !/lvname/.test(html));
ok("the dashboard and the map card say 'Rank: Closer', and the leaderboard shows rank names", /Rank: \$\{LEVELS\[lv\]\[0\]\}/.test(read("dashboard.js")) && /Rank: \$\{LEVELS\[lv\]\[0\]\}/.test(read("map.js")) && /LEVELS\[r\.lv\] \|\| LEVELS\[0\]/.test(read("dashboard.js")) && /Top rank reached/.test(read("dashboard.js")));
ok("a mission shows its difficulty by name (the chip, the screen before it, the results) and the history table has a Difficulty column", /<span class="chip lvlchip" title="How hard this mission is">\$\{L\.name\}<\/span>/.test(read("mission.js")) && /L\.name\} · about/.test(read("dialog.js")) && /: L\.name\} · \$\{esc\(sc\.title\)\}/.test(read("mission.js")) && /<th>Difficulty<\/th>/.test(read("dashboard.js")));
ok("a mission is recorded under its difficulty's name, and an older history that says 'Level 4' still reads right", /diff: sc\.surprise \? "Surprise round" : L\.name/.test(read("mission.js")) && ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"].map(d => ev(`diffLabel(${JSON.stringify(d)})`)).join() === "Easy,Easy,Medium,Hard,Expert" && ev(`diffLabel("Hard")`) === "Hard" && ev(`diffLabel("Surprise round")`) === "Surprise round" && ev(`diffLabel(undefined)`) === undefined);
const tough = d => ev(`BADGES.hard[2]({ won: true, diff: ${JSON.stringify(d)} })`), lost = ev(`BADGES.hard[2]({ won: false, diff: "Hard" })`);
ok("Tough Crowd is for passing a Hard or Expert mission, in the new names and the old ones, and not for Easy, Medium, a surprise round or a loss", ["Hard", "Expert", "Level 4", "Level 5"].every(tough) && ["Easy", "Medium", "Level 1", "Level 3", "Surprise round", ""].every(d => !tough(d)) && !lost && ev("BADGES.hard[1]") === "Pass a Hard or Expert mission");
ok("lessons say 'a hint per lesson', and 'easy' is a mission difficulty in the camera note", /1 hint per lesson/.test(read("app.js")) && !/per level/.test(read("app.js")) && /On by default for Easy missions/.test(read("dialog.js")));

// ---------- 2. the Record button stays pinned on a phone ----------
const phone = css.slice(css.indexOf("on a phone the Record button stays pinned"));
const block = phone.slice(0, phone.indexOf("}\n}") + 3);
const stickyBottom = +(block.match(/\.recdock\{[^}]*position:sticky;bottom:(\d+)px/) || [])[1];
const footerPx = 2 * 6.4 + 28 + 2;   // the stats bar on a phone: .4rem padding top and bottom, a pill about 28px tall, and its border
ok("on a phone (700px or less) the record row is sticky, just above the stats bar", /@media\(max-width:700px\)/.test(block) && stickyBottom >= footerPx && stickyBottom <= 80, `(bottom: ${stickyBottom}px)`);
ok("the panel steps out of the way (display: contents) so the row can stick for the whole question, and the row has a background and a shadow", /\.mission \.recpanel\{display:contents\}/.test(block) && /\.recdock\{[^}]*background:var\(--cream\)[^}]*box-shadow/.test(block));
ok("nothing above the mission page clips it (a clipped parent stops a sticky row)", !/\.(view|sheet|mission|app|main)\s*\{[^}]*overflow:\s*(hidden|auto|scroll)/.test(css) && !/#app\s*\{[^}]*overflow:\s*(hidden|auto|scroll)/.test(css));
ok("the first row of the panel carries the pinned class, and starting to record follows the words on a phone instead of the hidden panel", /<div class="rrow recdock"><button class="btn recbtn" id="recbtn"/.test(read("mission.js")) && /PHONE\.matches \? \$\("#ans"\) : \$\("#recpanel"\)/.test(read("mission.js")) && /PHONE = window\.matchMedia\("\(max-width:700px\)"\)/.test(read("mission.js")));

// ---------- 3. the map opens on the next stop ----------
const map = read("map.js");
ok("coming back to the map scrolls to the next stop to play when it is past the first two", /const popped = \[\.\.\.app\.querySelectorAll\("\.node\.fresh"\)\]\.pop\(\), here = app\.querySelector\("\.node\.cur"\)/.test(map) && /else if \(here && nodes\.indexOf\(nextStop\) >= 2\) setTimeout\(\(\) => here\.scrollIntoView\(\{ block: "center" \}\), 60\)/.test(map));
ok("a stop you just finished still gets its scroll, now centred between it and the next stop so both are in view", /Math\.min\(a\.top, b\.top\) \+ Math\.max\(a\.bottom, b\.bottom\)\) \/ 2 - innerHeight \/ 2/.test(map) && /behavior: "smooth"/.test(map) && map.indexOf("if (popped) setTimeout") < map.indexOf("else if (here"));

// ---------- 4. the camera reminder ----------
const mission = read("mission.js");
ok("the camera reminder is on the first question only, and not at all once a rep has dismissed it", /: i > 0 \|\| state\.camNudgeOff \? ""/.test(mission));
ok("it has a dismiss button with a name for a screen reader, and dismissing is remembered and saved", /id="camDismiss"[^>]*aria-label="Don't remind me about the camera again"/.test(mission) && /\$\("#camDismiss"\)\.onclick = \(\) => \{ state\.camNudgeOff = true; Progress\.save\(state\); \$\("#camNudge"\)\.remove\(\); \}/.test(mission) && ev("Progress.blank().camNudgeOff") === false);
ok("turning the camera on from the reminder still works", /if \(\$\("#camEnable"\)\) \$\("#camEnable"\)\.onclick/.test(mission) && /id="camEnable"/.test(mission));

// ---------- 5. feedback: fix first, the rest folds ----------
const c = vm.createContext({ console, window: { matchMedia: () => ({ matches: false }), SpeechRecognition: null }, esc: s => String(s).replace(/[&<>"]/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]), state: {}, speechSynthesis: {} });
vm.runInContext(read("mission.js").replace(/^"use strict";/, ""), c);
vm.runInContext(`const deliveryBlock = d => (d ? '<div class="deliv">DELIV</div>' : ""); const hearButton = t => '<button class="hearbtn">HEAR</button>';`, c);
const card = (over = {}) => vm.runInContext(`coachCard(${JSON.stringify({ model: "A model answer.", pace: [110, 175], deliv: { items: [{ ok: true }, { ok: false }] }, res: { score: 2.5, content: 1.5, tone: { pts: .5, notes: [{ ok: false, msg: "Tone note" }, { ok: true, msg: "fine" }] }, hits: ["did one thing"], misses: ["a", "b", "c"], flags: [{ msg: "Hype", pts: 1 }] }, ...over })})`, c);
const html1 = card(), fixes = [...html1.match(/<div class="fixfirst">[\s\S]*?<\/div>/)[0].matchAll(/<li>([^<]*)<\/li>/g)].map(m => m[1]);
ok("the coach card puts at most two things to fix in front: a mistake that cost points first, then what was missed, then tone", fixes.length === 2 && fixes[0] === "⚠ Hype" && fixes[1] === "✗ Missing: a");
ok("the stronger answer and its Hear it button come before the fold, and the fold holds what went well, every miss and flag, the tone note and how you sounded", html1.indexOf("A stronger answer might sound like") < html1.indexOf('<details class="coachmore">') && html1.indexOf("HEAR") < html1.indexOf('<details class="coachmore">') && (d => /did one thing/.test(d) && /Missing: c/.test(d) && /Hype/.test(d) && /Tone note/.test(d) && /DELIV/.test(d))(html1.slice(html1.indexOf('<details class="coachmore">'))));
ok("the fold says what is in it and how many things in it are worth a look (tone and voice lines that missed)", /Tone, how you sounded and what went well \(2 to check\)/.test(html1));
const clean = card({ res: { score: 5, content: 4, tone: { pts: 1, notes: [{ ok: true, msg: "fine" }] }, hits: ["x"], misses: [], flags: [] }, deliv: { items: [{ ok: true }] } });
ok("a perfect answer has no 'fix first' box, says there is nothing to fix, and its fold has no count", !/fixfirst/.test(clean) && /Nothing to fix\./.test(clean) && /what went well<\/summary>/.test(clean));
ok("one thing to fix shows one line, not an empty second one", (h => (h.match(/<li>/g) || []).length === 1)(card({ res: { score: 3, content: 2, tone: { pts: 1, notes: [] }, hits: ["x"], misses: ["only one"], flags: [] }, deliv: null }).match(/<div class="fixfirst">[\s\S]*?<\/div>/)[0]));
const cards = mission.slice(mission.indexOf("const cards = log.map"), mission.indexOf("const deliver = cam"));
const pos = s => cards.indexOf(s);
ok("on the results screen each answer shows what you said, what was missing, mistakes, a stronger answer and Try again first, then folds the rest", pos('<ul class="misses">') < pos('<details class="coachmore">') && pos('<ul class="flags">') < pos('<details class="coachmore">') && pos("A stronger answer might sound like") < pos('<details class="coachmore">') && pos("retryq") < pos('<details class="coachmore">') && pos('<ul class="hits">') > pos('<details class="coachmore">') && pos('<ul class="tonelist">') > pos('<details class="coachmore">') && pos("deliveryBlock(l.deliv)") > pos('<details class="coachmore">'));
ok("the fold and the fix-first box are styled, and the fold's summary is a tap target", /\.coachmore>summary\{cursor:pointer/.test(css) && /\.fixfirst\{/.test(css));

// ---------- 6. photos have a placeholder ----------
ok("a photo still on its way shows a shimmer in the space it will fill: the creator tiles, the pieces on the map, the shop list and the four bottles", [".tile img:not(.ld)", ".piece img:not(.ld)", ".xrow img:not(.ld)", ".xbottle img:not(.ld)"].every(s => css.includes(s)) && /@keyframes shim/.test(css));
ok("the shimmer stops for anyone who asks for less motion", /@media\(prefers-reduced-motion:reduce\)\{\.tile img:not\(\.ld\)[^}]*animation:none/.test(css));
ok("those photos have a fixed size, so nothing moves when one arrives", /\.xbottle img\{width:110px;height:140px/.test(css) && /\.xrow img\{width:36px;height:36px/.test(css) && /\.tile img,\.tile>svg\{width:100%;height:100%/.test(css) && /\.piece img,\.piece svg\{width:100%;height:100%/.test(css));
ok("the page marks a photo as loaded when it arrives or fails (those events don't bubble, so it listens on the way down)", /\["load", "error"\]\.forEach\(ev => document\.addEventListener\(ev, e => \{ if \(e\.target\.tagName === "IMG"\) e\.target\.classList\.add\("ld"\); \}, true\)\)/.test(read("app.js")));

// ---------- 7. the stop circles are true circles with an even ring ----------
const rule = sel => (css.match(new RegExp("(?:^|\\n)" + sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\{([^}]*)\\}")) || [])[1] || "";
ok("a stop circle has the same border all the way round (no thicker bottom, which made the fill an egg and the ring lopsided)", /border:5px solid var\(--teal-d\)/.test(rule(".node")) && !/border-bottom/.test(rule(".node")) && !/border-bottom/.test(rule(".node.done")) && !/border-bottom/.test(rule(".node.locked")) && !/border-bottom/.test(rule(".node:disabled")), rule(".node").slice(0, 120));
ok("each state changes the whole ring's colour: finished is white (cream, like a finished boss), locked a darker grey", /border-color:#fff1c4/.test(rule(".node.done")) && /border-color:#a99d90/.test(rule(".node.locked")) && /border-color:#a99d90/.test(rule(".node:disabled")));
ok("the pop animation's ring is only a pulse: it ends invisible (it used to stay, so only a stop finished since the map was last drawn had a white ring), and it is left out for anyone who asks for less motion", /\.node\.fresh::after\{[^}]*animation:nodering 1\.4s ease-out 2 forwards/.test(css) && /\.node\.fresh::after\{display:none\}/.test(css) && /@keyframes nodering\{from\{opacity:\.9;transform:scale\(\.9\)\}to\{opacity:0;/.test(css));
ok("so the white ring on a finished stop is the circle's own border: every finished stop has it, however and whenever it was finished", /\.node\.done\{[^}]*border-color:#fff1c4/.test(css) && !/\.node\.done\{[^}]*border-color:(?!#fff1c4)/.test(css));
ok("a boss keeps its own coin look (a gold ring with a thick base), which is set on .node.boss only", /border:4px solid var\(--gold\);border-bottom:10px solid #5a1a0a/.test(rule(".node.boss")));

// ---------- 8. nothing slides sideways ----------
ok("the page can't bounce or be swiped sideways, and the page edge behind it is dark brown, not the browser's white", /html\{background:#24150a;overscroll-behavior:none;overflow-x:hidden\}/.test(css));
ok("the app, the header, the stats bar and the phone bar only pan up and down (and pinch to zoom), and the wide tables and the manager tabs keep their own sideways scroll", /#app,\.top,\.foot,\.tabbar\{touch-action:pan-y pinch-zoom\}/.test(css) && /\.mtablewrap,\.mnav\{touch-action:pan-x pan-y\}/.test(css) && /\.mtablewrap\{overflow-x:auto\}/.test(css) && /\.mnav\{flex-wrap:nowrap;overflow-x:auto/.test(css));
ok("nothing was done that would break the pinned bars: body is not a scroll container, so sticky and fixed bars still work", !/body\{[^}]*overflow-x:(hidden|auto|scroll)/.test(css) && !/body\{[^}]*overflow:(hidden|auto|scroll)/.test(css));

// ---------- 9. the first screen ----------
const gate = html.slice(html.indexOf('<div class="gate splash"'), html.indexOf("<header class=\"top\">"));
ok("the first screen has no bottle icon or emoji any more: a drawn gold medallion with an agave and a star, hidden from screen readers", /<svg class="emblem"[^>]*aria-hidden="true"/.test(gate) && !/bottleicon/.test(html) && !/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(gate.replace(/✓/g, "")));
ok("it has papel picado flags on a string across the top and agave plants along the bottom, drawn in code (no photo, nothing to download), and neither can be tapped", /--papel:url\("data:image\/svg\+xml/.test(css) && /--agave:url\("data:image\/svg\+xml/.test(css) && /\.gate\.splash::before\{[^}]*position:fixed[^}]*top:0[^}]*pointer-events:none/.test(css) && /\.gate\.splash::after\{[^}]*position:fixed[^}]*bottom:0[^}]*pointer-events:none/.test(css));
ok("the background is layered: a spotlight behind the medallion, rays, and a dark brown gradient", (css.match(/\.gate\.splash\{[^}]*\}/) || [""])[0].split("radial-gradient(").length >= 3 && /repeating-conic-gradient\(from 0deg at 50% 10%/.test(css));
ok("the age check is a card with a red 21+ coin on its edge (decorative), and the sign-in is a second card with a 'Step 2' heading and a lock line that shows only until the age check is passed", /<span class="agebadge" aria-hidden="true">21\+<\/span>/.test(gate) && /Step 2 · Sign in/.test(gate) && /Unlocks after the age check/.test(gate) && /\.signin:not\(\.off\) \.lockline\{display:none\}/.test(css));
ok("everything the game's script needs is still there, by id, and the gate is still a labelled dialog", ["yes", "no", "guest", "email", "sendlink", "presentGo", "mgrLink", "agecard", "signin", "underMsg", "googlerow", "gbtn", "gsoon", "emailnote"].every(id => new RegExp(`id="${id}"`).test(gate)) && /<div class="gate splash" id="gate" role="dialog" aria-modal="true" aria-labelledby="gateTitle">/.test(gate) && /id="gateTitle"/.test(gate));
ok("after 'Yes' the age card gives way to a small '21+ confirmed' line (the card styling drops away)", /\$\("#agecard"\)\.classList\.add\("done"\)/.test(read("app.js")) && /\.agecard\.done\{[^}]*background:none[^}]*box-shadow:none/.test(css) && /\.ageok\{/.test(css));
ok("the first screen never grows wider than a small phone: its column can shrink, and the email box doesn't ask for its full default width", /\.gate\.splash\{[^}]*grid-template-columns:minmax\(0,1fr\)/.test(css) && /\.emailrow input\{flex:1 1 0;width:0;min-width:0/.test(css));
ok("the buttons on it are gold with dark text (the secondary ones are outlined), and the title scales down on a phone", /\.splash \.btn:not\(\.alt\)\{background:linear-gradient\(180deg,#f6cf78,#e0a42f\);color:#2a1708/.test(css) && /\.splashtitle\{font:clamp\(2rem,9\.5vw,2\.8rem\)/.test(css));
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
