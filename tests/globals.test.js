// The game's scripts share one global scope, so two files declaring the same top-level name stops the second file loading
// (that is how a clash once broke the voices). Run from the mock-prototype folder: node tests/globals.test.js
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const files = [...html.matchAll(/<script src="([^"?]+)/g)].map(m => m[1]);   // scripts carry ?v=... so a browser never reuses an old copy
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join("\n");
const sources = Object.fromEntries(files.map(f => [f, fs.readFileSync(path.join(root, f), "utf8")]));
sources["index.html (inline)"] = inline;
const seen = {}; let fails = 0;
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
