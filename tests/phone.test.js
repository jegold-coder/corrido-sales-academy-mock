// Checks the phone bottom bar is wired up and stays out of the way. Run from the mock-prototype folder: node tests/phone.test.js
const fs = require("fs"), path = require("path");
const html = require("./page").source();   // index.html with the page's own scripts back in place
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };
const bar = (html.match(/<nav class="tabbar"[\s\S]*?<\/nav>/) || [""])[0];

ok("the bar has five places: Map, Dashboard, Character, Brand and Website", ["Map", "Dashboard", "Character", "Brand", "Website"].every(t => new RegExp(`<span>${t}</span>`).test(bar)) && (bar.match(/<button/g) || []).length === 4 && (bar.match(/<a /g) || []).length === 1);
ok("the website link opens a new tab safely and says so to a screen reader", /href="https:\/\/ilovetequilacorrido\.com" target="_blank" rel="noopener noreferrer"/.test(bar) && /opens in a new tab/.test(bar));
ok("the bar is a labelled navigation and its icons are hidden from screen readers", /<nav class="tabbar" id="tabbar" aria-label="Main">/.test(bar) && (bar.match(/<i aria-hidden="true">/g) || []).length === 5);
ok("it exists only on a phone: hidden by default, shown at 700px and narrower", /\.tabbar\{display:none;/.test(html) && /@media\(max-width:700px\)\{[^@]*body:not\(\.onboarding\):not\(\.mgr\):not\(\.playing\) \.tabbar\{display:grid\}/.test(html));
ok("on a phone it replaces the header buttons, and the stats footer rides above it", /\.top \.stats\{display:none\}/.test(html) && /\.foot\{bottom:var\(--tabh\)\}/.test(html) && /main\{padding-bottom:calc\(5rem \+ var\(--tabh\)\)\}/.test(html) && /#toast\{bottom:calc\(76px \+ var\(--tabh\)\)\}/.test(html));
ok("it steps aside during a mission or lesson, and on the first-run and manager screens", /classList\.toggle\("playing", !!app\.querySelector\("#pc, \.lesson-top"\)\)/.test(html) && /:not\(\.onboarding\):not\(\.mgr\):not\(\.playing\)/.test(html));
ok("tapping it never counts as a click outside the panel (that would send you home)", /e\.target\.closest\("header, footer, #tabbar, #presenter, dialog/.test(html));
ok("each tab goes to its page, and tapping the page you are on does nothing", /map: \(\) => \{ if \(!\$\("\.map"\)\) home\(\); \}/.test(html) && /dash: \(\) => \{ if \(!\$\("\.dash"\)\) dashboard\(\); \}/.test(html) && /char: \(\) => \{ if \(!\$\("\.creator"\)\) creator\(home\); \}/.test(html) && /brand: \(\) => \{ if \(!\$\("\.explore"\)\) explorer\(\); \}/.test(html));
ok("the page you are on is marked, with the brand page told apart from the dashboard (they share a header class)", /\$\("\.creator"\) \? "char" : \$\("\.explore"\) \? "brand" : \$\("\.dash"\) \? "dash" : \$\("\.map"\) \? "map"/.test(html) && /setAttribute\("aria-current", "page"\)/.test(html));
ok("the header Dashboard button opens the dashboard from the brand page too", /\$\("#dashBtn"\)\.onclick = \(\) => \(\$\("\.dash"\) \? home\(\) : dashboard\(\)\)/.test(html));
ok("a tap target is at least 44px tall", /min-height:48px/.test(html));
const dash = fs.readFileSync(path.join(__dirname, "..", "dashboard.js"), "utf8");
ok("a different kind of page (dashboard, brand, character, map) opens at the top, not where the last page was scrolled", /const screen = \(app\.firstElementChild \|\| \{\}\)\.className \|\| "";\n\s+if \(screen !== lastScreen\) \{ lastScreen = screen; window\.scrollTo\(0, 0\); \}/.test(html));
ok("each dashboard tab starts at its top too", /dashboard\(b\.dataset\.t\); window\.scrollTo\(0, 0\);/.test(dash));
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
