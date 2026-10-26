// Checks the accessibility fixes: text colours that pass WCAG AA, page headings, keyboard focus, tap size and small text.
// Run from the mock-prototype folder: node tests/a11y.test.js
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };
const html = require("./page").source(), lessons = read("lessons.js"), mission = read("mission.js");

// WCAG contrast ratio between two #rrggbb colours (a layer with alpha is mixed over what is behind it first)
const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const lum = h => { const [r, g, b] = rgb(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
const ratio = (a, b) => { const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
const over = (fg, bg, a) => "#" + rgb(fg).map((v, i) => Math.round(a * v + (1 - a) * rgb(bg)[i]).toString(16).padStart(2, "0")).join("");
const tok = Object.fromEntries([...html.match(/:root\{([^}]*)\}/)[1].matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/g)].map(m => [m[1], m[2]]));

const pairs = [
  ["white button text on the teal buttons", tok.cream, tok.teal],
  ["teal links on white and on the cream page", tok.teal, "#ffffff"],
  ["gold level and XP numbers on the footer pill (brown with a 20% shade)", tok["gold-t"], over("#000000", tok.brown, 0.2)],
  ["gold text on the splash screen at its lightest brown", tok["gold-t"], "#6b441e"],
  ["gold text on the first screen at its lightest point (the spotlight plus the rays)", tok["gold-t"], "#694b27"],
  ["the tagline on the first screen at its lightest point", "#f3e7d0", "#694b27"],
  ["the title on the first screen at its lightest point", "#fff3cf", "#694b27"],
  ["the sign-in card's notes and divider on the dark glass", "#e0d3ba", over("#fff8e8", "#2a1708", 0.07)],
  ["the sign-in card's lock line and step label", tok["gold-t"], over("#fff8e8", "#2a1708", 0.07)],
  ["the age card's text on its cream", "#3a2c1c", "#f6edd9"],
  ["the dark text on the gold buttons (at the darker end of the gold)", "#2a1708", "#e0a42f"],
  ["the 'No' button's text on the age card", "#5a3a12", "#f6edd9"],
  ["the 'under 21' message on the age card", "#7a2a17", "#f6edd9"],
  ["'21+ confirmed' on its green pill", "#1f5a2c", "#dff1e0"],
  ["the 21+ coin's number on the coin's lighter edge", "#ffffff", "#c9472a"],
  ["the small print at the bottom of the first screen", "#d9ccb4", "#27160a"],
  ["the email box's hint text", "#cdbfa6", over("#0a0502", "#2a1708", 0.5)],
  ["green 'good score' text on white", tok.green, "#ffffff"],
  ["amber 'middling score' text on white", "#8f6212", "#ffffff"],
  ["the brown step label on the manager's sand background", "#7a4f12", tok.sand],
  ["white on the manager's 'Back to the game' button over the header", "#ffffff", over("#000000", tok.brown, 0.2)],
  ["gold on the level chip", tok.gold, "#5a3a12"],
  ["locked-badge notes (grey) on white", "#6e6458", "#ffffff"],
  ["the brown boss and tier labels on a white card", tok.brown, "#ffffff"]
];
pairs.forEach(([n, a, b]) => { const r = ratio(a, b); ok(`${n} reach 4.5:1`, r >= 4.5, r.toFixed(2)); });
ok("the cream page background keeps the teal text at 4.5:1 too", ratio(tok.teal, tok.cream) >= 4.5, ratio(tok.teal, tok.cream).toFixed(2));

// the CSS actually uses those colours
ok("the gold that sits on brown is the lighter gold token", [".foot .pill b{color:var(--gold-t)", ".foot #stLvl{color:var(--gold-t)}", ".splashsub{", ".tu-tier{", ".tu-kicker{"].every(s => html.includes(s)) && !/\.foot \.pill b\{color:var\(--gold\);/.test(html));
ok("the locked badges are no longer faded as a whole (fading cut the text contrast), only their pictures", /\.bcard:not\(\.on\)\{opacity:1\}\.bcard:not\(\.on\) \.bart,\.bcard:not\(\.on\) \.bi\{opacity:\.7\}/.test(html));

// headings: every full page has one h1, even where it is not drawn
ok("the map has a heading that screen readers can find", /<div class="mcenter">\s*<h1 class="sr">Your training map<\/h1>/.test(html));
ok("a lesson or mission page gets its title as a heading", /function lessonTop\(p, mission, title\)[\s\S]*?\$\{title \? `<h1 class="sr">\$\{esc\(title\)\}<\/h1>` : ""\}/.test(html) && /lessonTop\(i \/ items\.length, false, L\.title\)/.test(lessons) && /lessonTop\(i \/ n, true, sc\.title\)/.test(mission));
ok("the knowledge check has a heading too", /<h1 class="sr">Knowledge check<\/h1>/.test(lessons));
ok("the age gate hides the page behind it from the keyboard and screen readers, and lets go when it closes", /\$\(q\)\.inert = up/.test(html) && /observe\(\$\("#gate"\), \{ attributes: true, attributeFilter: \["class"\] \}\)/.test(html));

// keyboard focus and tap size
ok("links, inputs, summaries and role=button items all show a focus ring, and it turns gold on dark bars", /a:focus-visible,input:focus-visible,select:focus-visible,summary:focus-visible,\[role=button\]:focus-visible,\[tabindex\]:focus-visible\{outline:3px solid var\(--teal\)/.test(html) && /\.gate :focus-visible,\.foot :focus-visible,\.top :focus-visible\{outline-color:var\(--gold-t\)\}/.test(html));
const px = rem => rem * 16;
ok("checkboxes are 24px or more, in the dialog and in Settings", px(1.5) >= 24 && /input\[type=checkbox\]\{width:1\.5rem;height:1\.5rem/.test(html) && /\.dash input\[type=checkbox\]\{width:1\.5rem;height:1\.5rem/.test(html));
ok("the small text links have padding so they are at least 24px tall", /\.mgrlink a\{display:inline-block;padding:\.4rem 0/.test(html) && /\.presentrow \.linkbtn\{[^}]*padding:\.4rem \.6rem/.test(html) && /\.linkbtn\.dark\{padding:\.3rem \.25rem;min-height:28px/.test(html));

ok("the sticky top bar sits above the page, so a title never draws over its buttons while scrolling", /\.mock,\.top,main\{position:relative;z-index:2\}/.test(html) && /\n\.top\{z-index:6\}/.test(html));

// small text: nothing below 11px
const tiny = [...html.matchAll(/font(?:-size)?:\s*(?:[^;}"]*?\s)?(\.\d+)rem/g)].filter(m => px(Number(m[1])) < 11).map(m => m[0]);
ok("no text is set smaller than 11px", tiny.length === 0, tiny.slice(0, 4).join(" | "));
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
