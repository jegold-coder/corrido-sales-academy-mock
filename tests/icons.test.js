// Checks the drawn icons: every icon a screen asks for is in the sprite, the stat and toggle icons are not emoji any more, and the Presenter button sits in the footer bar.
// Run from the mock-prototype folder: node tests/icons.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };
const html = read("index.html"), css = html.slice(html.indexOf("<style>"), html.indexOf("</style>"));
const files = fs.readdirSync(root).filter(f => f.endsWith(".js") && f !== "sw.js");
const code = f => read(f).split("\n").filter(l => !/^\s*\/\//.test(l)).join("\n");

// ---------- the sprite and the helper ----------
const symbols = [...html.matchAll(/<symbol id="i-([a-z]+)"/g)].map(m => m[1]);
const used = new Set();
files.forEach(f => [...code(f).matchAll(/\bic\("([a-z]+)"/g)].forEach(m => used.add(m[1])));
[...html.matchAll(/<use href="#i-([a-z]+)"/g)].forEach(m => used.add(m[1]));
ok("every icon a screen asks for is drawn in the sprite", [...used].every(n => symbols.includes(n)), [...used].filter(n => !symbols.includes(n)).join());
ok("every icon in the sprite is used somewhere", symbols.every(n => used.has(n)), symbols.filter(n => !used.has(n)).join());
ok("the sprite is hidden from screen readers and takes no room", /<body>\s*<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">/.test(html));

const ctx = vm.createContext({});
vm.runInContext(read("icons.js").replace(/^"use strict";/, "") + ";globalThis.ic = ic;", ctx);
const ic = ctx.ic;
ok("ic() draws one icon from the sprite, hidden from screen readers", ic("flame") === '<svg class="ic ic-flame" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i-flame"/></svg>');
ok("ic() takes an extra class, used for a lost heart", /class="ic ic-heart lost"/.test(ic("heart", "lost")));
ok("icons.js adds one new global name and loads right after config.js, before the page's scripts", (read("icons.js").match(/^const [A-Za-z]+ =/gm) || []).length === 1 && html.indexOf('<script src="icons.js') === html.indexOf("</script>\n", html.indexOf('<script src="config.js')) + "</script>\n".length && html.indexOf('<script src="icons.js') < html.indexOf('<script src="app.js'));

// ---------- the sound, heart and mic icons are drawn; the streak, XP, merch and reward-chip icons stay emoji ----------
const covered = ["app.js", "nav.js", "map.js", "dashboard.js", "mission.js", "results.js", "presenter.js"];
const stray = covered.filter(f => /[🎤🔊🔇❤🖤]/u.test(code(f)));
ok("the sound, heart and mic icons are not emoji on the map, dashboard, missions, results or Presenter menu", stray.length === 0, stray.join());
ok("the streak, XP and merch icons on the map are emoji (🔥 ⭐ 👕), not drawn", /<span title="Day streak">🔥 /.test(code("map.js")) && /<span title="XP">⭐ /.test(code("map.js")) && /<span title="Merch unlocked">👕 /.test(code("map.js")) && !/ic\("(flame|star|shirt)"\)/.test(covered.map(code).join("\n")));
ok("the reward chips after a mission (streak, camera bonus, hints) are all emoji, so the row matches", /class="rw">🔥 /.test(code("mission.js")) && /class="rw">📷 /.test(code("mission.js")) && /class="rw">💡 /.test(code("mission.js")) && /class="rw">🔥 /.test(code("results.js")) && !/class="rw">\$\{ic\(/.test(code("mission.js") + code("results.js")));
const bar = html.slice(html.indexOf('<footer class="foot"'), html.indexOf("</footer>"));
ok("the footer bar keeps its 🔥 and ⭐ emoji, and its sound and heart icons are drawn", /<i aria-hidden="true">🔥<\/i>/.test(bar) && /<i aria-hidden="true">⭐<\/i>/.test(bar) && !/[🔊🔇❤🖤]/u.test(bar) && (bar.match(/<use href="#i-/g) || []).length >= 4);
ok("the footer's hearts are drawn, say how many are left, and the lost ones are dim", /\$\("#stHearts"\)\.innerHTML = ic\("heart"\)\.repeat\(state\.hearts\) \+ ic\("heart", "lost"\)/.test(code("app.js")) && /\$\("#stHearts"\)\.setAttribute\("aria-label", `\$\{state\.hearts\} of \$\{D\(\)\.hearts\} hearts left`\)/.test(code("app.js")) && /ic-heart\.lost\{color:#ffffff3d\}/.test(css));
ok("the sound and voice toggles swap between a speaker and a muted speaker", /ic\("sound"\)[^;]*ic\("mute"\)/.test(code("nav.js")) && /ic\("sound"\)[^;]*ic\("mute"\)/.test(code("dashboard.js")) && (code("mission.js").match(/ic\("sound"\)[^;]*ic\("mute"\)/g) || []).length >= 2);
ok("the voice button's text is set as markup, so its icon survives a click", /\$\("#vo"\)\.innerHTML = voiceOn/.test(code("mission.js")) && !/\$\("#vo"\)\.textContent/.test(code("mission.js")));
ok("the icon takes the text's colour and size, gold in the footer", /\.ic\{width:1em;height:1em;[^}]*fill:currentColor/.test(css) && /\.foot \.pill \.ic\{color:var\(--gold-t\)\}/.test(css));

// ---------- the Presenter button ----------
ok("on a laptop the Presenter button sits inside the footer bar (it used to float over the page and could cover a button)", /@media\(min-width:801px\)\{body:not\(\.mgr\) #presenter\{bottom:7px\}\}/.test(css));
ok("under 1081px it shrinks to the mic icon, and its words stay for screen readers", /@media\(max-width:1080px\)\{#prbtn \.prlabel,#prbtn small\{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect\(0 0 0 0\)/.test(css) && /id="prbtn"[^>]*title="Presenter menu \(sample data\)"/.test(read("presenter.js")) && /<span class="prlabel">Presenter<\/span> <small>sample data<\/small>/.test(read("presenter.js")));
const white = /\.logo small,\.mlogo small\{[^}]*color:#fff\}/.test(css);
ok("\"Sound on/off\", \"day streak\" and \"XP\" in the footer and \"sample data\" by the Presenter button are the same white as SALES ACADEMY in the header", white && /\.foot \.soundfab span,#prbtn small\{color:#fff\}/.test(css) && /\.foot \.pill em\{color:#fff;opacity:1\}/.test(css) && css.lastIndexOf(".foot .pill em{") > css.indexOf(".foot .pill em{font-style") && css.lastIndexOf("#prbtn small{") > css.indexOf("#prbtn small{font-weight:400"));
const tabs = (html.match(/<nav class="tabbar"[\s\S]*?<\/nav>/) || [""])[0];
ok("the phone bottom bar keeps its emoji icons (they are not drawn)", ["🗺️", "📊", "👤", "🥃", "🔗"].every(e => tabs.includes(`<i aria-hidden="true">${e}</i>`)) && !/<use /.test(tabs));
ok("the phone bar's words are white, and the page you are on turns gold", /\.tabbar button,\.tabbar a\{[^}]*border-radius:10px;color:#fff;/.test(css) && /\.tabbar \[aria-current="page"\]\{color:var\(--gold\);background:#e0a42f26\}/.test(css));
ok("the footer bar is still the only place that reserves room: main keeps its bottom padding", /main\{padding-bottom:5rem\}/.test(css));

console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
