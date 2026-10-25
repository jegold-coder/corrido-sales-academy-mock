// The game's scripts share one global scope, so two files declaring the same top-level name stops the second file loading
// (that is how a clash once broke the voices). Run from the mock-prototype folder: node tests/globals.test.js
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const files = [...html.matchAll(/<script src="([^"?]+)/g)].map(m => m[1]);   // scripts carry ?v=... so a browser never reuses an old copy
const sources = Object.fromEntries(files.map(f => [f, fs.readFileSync(path.join(root, f), "utf8")]));
const seen = {}; let fails = 0;
// the page's own code lives in the files listed in tests/page.js: they are the last scripts on the page, in that order, and nothing is left inline
const { PAGE_FILES } = require("./page");
const check = (name, c) => { console.log((c ? "ok   " : "FAIL ") + name); if (!c) fails++; };
check("the page has no inline script", !/<script>/.test(html));
check("the page's own scripts are the last scripts on the page, in the order tests/page.js lists them", files.slice(-PAGE_FILES.length).join() === PAGE_FILES.join());
check("each starts in strict mode", PAGE_FILES.every(f => /^"use strict";\n/.test(sources[f])));
for (const [f, src] of Object.entries(sources)) {
  const top = src.split("\n").filter(l => /^(const|let|var|function|async function|class) /.test(l));   // unindented lines are top level
  for (const l of top) {
    const m = l.match(/^(?:const|let|var|function|async function|class) +([A-Za-z_$][\w$]*)/); if (!m) continue;
    (seen[m[1]] = seen[m[1]] || new Set()).add(f);
  }
}
const clashes = Object.entries(seen).filter(([, fs_]) => fs_.size > 1);
clashes.forEach(([n, fs_]) => { console.log("FAIL " + n + " is declared in " + [...fs_].join(" and ")); fails++; });
console.log(`${Object.keys(seen).length} top-level names across ${Object.keys(sources).length} scripts`);
console.log(fails ? `${fails} CLASH(ES)` : "OK"); process.exit(fails ? 1 : 0);
