// Checks the upgraded map and the dashboard ladder and radar. Run from the mock-prototype folder: node tests/map.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };
const ctx = vm.createContext({ console, state: { done: {}, proto: {} } });
["scenarios.js", "lessons.js"].forEach(f => vm.runInContext(read(f).replace(/^"use strict";/, ""), ctx));
vm.runInContext(read("tiers.js").replace(/^"use strict";/, "").replace(/if \(typeof module[^\n]*/, ""), ctx);
const ev = s => vm.runInContext(s, ctx);

// tier banners: a tier begins right after the boss before it
const starts = ev("tierStarts(PATH)");
ok("the six tiers start at stops 0, 3, 5, 7, 9 and 13", starts.join() === "0,3,5,7,9,13", starts.join());
ok("every tier after the first begins right after a boss", ev("tierStarts(PATH).slice(1).every((f, i) => PATH[f - 1] === BOSSES[i].id)"));
ok("every boss is the last stop of its tier", ev("BOSSES.slice(0, 5).every((b, i) => PATH.indexOf(b.id) === tierStarts(PATH)[i + 1] - 1) && PATH[PATH.length - 1] === BOSSES[5].id"));
// the pop and the glowing road
ok("nothing pops the first time the map is drawn", ev("newlyDone(null, ['brand', 'lineup']).length") === 0);
ok("a stop finished since the last drawing pops", ev("newlyDone(new Set(['brand']), ['brand', 'lineup']).join()") === "lineup");
ok("a stop already seen does not pop again", ev("newlyDone(new Set(['brand', 'lineup']), ['brand', 'lineup']).length") === 0);

// the map page
const html = require("./page").source();
ok("boss stops show the boss's face, and a still-locked boss is a dark silhouette", /const bossFace = n =>/.test(html) && /\.node\.boss\.locked \.bface svg\{filter:grayscale\(1\) brightness/.test(html));
ok("tier banners sit over the first stop of each tier, on that stop's side, clear of the boss's label, and stay inside the map", /class="tierband /.test(html) && /tierStarts\(nodes\.map/.test(html) && /style="--x:\$\{xs\[f\] \/ 4\}%;top:\$\{Math\.max\(ys\[f\] - bandUp\(f, t\), 22\)/.test(html) && /left:clamp\(var\(--hw\),var\(--x\),calc\(100% - var\(--hw\)\)\)/.test(html));
ok("the map has a side panel on each side with the rep, the next unlock, the next boss and the badges", ["Your rep", "Next unlock", "Next boss", "Boss badges"].every(t => html.includes(t)) && /<aside class="mside"/.test(html));
ok("the side panels hide on small screens, where the page is one column", /@media\(max-width:1000px\)\{\.maphome\{display:block\}\.mside\{display:none\}\}/.test(html));
ok("the rep card and the tier bar open Progress, the badges card opens Badges, and the next unlock opens the character creator", /class="sidecard repcard go" data-go="progress"/.test(html) && /class="sidecard go" data-go="badges"[^>]*><h3>Boss badges/.test(html) && /class="sidecard go" data-go="creator"[^>]*><h3>Next unlock/.test(html) && /class="tierbar go" data-go="progress"/.test(html));
ok("those cards work from the keyboard (link role, tab stop, Enter and Space) and the boss button is not inside one", (html.match(/ go" data-go="[a-z]+" role="link" tabindex="0"/g) || []).length === 4 && /e\.key === "Enter" \|\| e\.key === " "\)\) \{ e\.preventDefault\(\); go\(\)/.test(html) && /dashboard\(el\.dataset\.go\)/.test(html) && !/class="sidecard bosscard go"/.test(html));
ok("a stop you just finished pops and lights the road to the next one", /fresh\.includes\(n\.id\) \? "fresh"/.test(html) && /class="rd-glow"/.test(html) && /@keyframes roadrun/.test(html));
ok("people who prefer less motion get no pop or running light", /prefers-reduced-motion:reduce\)\{\.node\.fresh::after\{display:none\}\.node\.fresh,\.rd-glow/.test(html));
ok("Tier Up plays the victory music, the longer one for the season finale", /Sound\.sfx\(final \? "season" : "tierup"\)/.test(read("boss.js")));

// the START tag floats 80 units above a stop's centre (24 tall); the tier banner chip is about 30 tall. Neither may touch.
// bandUp gives the banner's height above its stop: 88 for Tier 0 once its first stop is not the current one (no START tag), and 120 otherwise.
const top = Number((html.match(/TOP = (\d+)/) || [])[1]), near = Number((html.match(/const bandUp = .*? \? (\d+) : (\d+)\)/) || [])[1]), off = Number((html.match(/const bandUp = .*? \? (\d+) : (\d+)\)/) || [])[2]), minY = Number((html.match(/Math\.max\(ys\[f\] - bandUp\(f, t\), (\d+)\)/) || [])[1]);
const chipBottom = (y0, first) => (first ? Math.max(y0 - off, minY) : y0 - off) + 15, startTop = y0 => y0 - 80;
ok("the first stop's tier banner clears its START tag by a good margin", chipBottom(top, true) + 12 <= startTop(top), `chip bottom ${chipBottom(top, true)}, START top ${startTop(top)}`);
ok("every other tier's banner clears the START tag too", chipBottom(top + 175 * 3, false) + 12 <= startTop(top + 175 * 3));
ok("the first banner is not cut off by the top of the map, whether it hangs 120 or 88 above the stop", Math.max(top - off, minY) - 15 >= 0 && Math.max(top - near, minY) - 15 >= 0);
ok("Tier 0's banner sits closer once there is no START tag to leave room for (88 against 120), and still clears the stop's top edge (a 92px circle) by a margin", near === 88 && off === 120 && near < off && (top - near) + 15 + 12 <= top - 46);

// the dashboard: ladder and radar
const dash = read("dashboard.js");
vm.runInContext(dash.slice(dash.indexOf("const radarPoints"), dash.indexOf("function skillRadar")), ctx);
const pts = ev("radarPoints([1, 1, 1, 1], 100, 0, 0)");
ok("a four-skill radar puts the points at the top, right, bottom and left", Math.abs(pts[0][0]) < 1e-6 && Math.abs(pts[0][1] + 100) < 1e-6 && Math.abs(pts[1][0] - 100) < 1e-6 && Math.abs(pts[2][1] - 100) < 1e-6 && Math.abs(pts[3][0] + 100) < 1e-6);
ok("a zero score sits at the centre and half sits halfway", ev("radarPoints([0, .5], 100, 10, 10)").flat().map(n => Math.round(n)).join() === "10,10,10,60");
ok("the radar shows once there are scores in three skill areas, bars before that", /fams\.length >= 3/.test(dash) && /The radar chart appears once you have scores in three skill areas/.test(dash));
ok("the ladder has one step per tier, each with its boss's medal", /TIERS\.map\(\(n, i\) =>/.test(dash) && /badgeSVG\("boss-" \+ boss\.id, earned\)/.test(dash));
ok("the ladder comes first on the Progress tab", dash.indexOf("${tierCard()}") < dash.indexOf('<div class="stats3">'));
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
