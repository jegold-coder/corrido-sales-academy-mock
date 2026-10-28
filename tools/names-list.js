"use strict";
// Reads and edits the name list in names.js, which is stored in base64 so the words are not in plain text in the repo. Run from the mock-prototype folder:
//   node tools/names-list.js                 print the list (a line starting with = only counts as a whole word)
//   node tools/names-list.js add <word>...   add words, letters a to z only; write =word for a whole-word entry
//   node tools/names-list.js remove <word>...  take words out
const fs = require("fs"), path = require("path");
const file = path.join(__dirname, "..", "names.js"), src = fs.readFileSync(file, "utf8");
const m = src.match(/const NAME_WORDS = "([A-Za-z0-9+/=]*)";/);
if (!m) { console.error("names.js has no NAME_WORDS line"); process.exit(1); }
const [cmd, ...args] = process.argv.slice(2);
let list = Buffer.from(m[1], "base64").toString().split("\n").filter(Boolean);
if (!cmd) { console.log(list.join("\n")); process.exit(0); }
if (cmd !== "add" && cmd !== "remove") { console.error("Use: add, remove, or nothing to print the list"); process.exit(1); }
const words = args.map(w => w.toLowerCase());
const bad = words.filter(w => !/^=?[a-z]+$/.test(w));
if (!words.length || bad.length) { console.error(bad.length ? `Letters a to z only (and a leading = for a whole word): ${bad.join(", ")}` : "Give at least one word"); process.exit(1); }
list = cmd === "add" ? [...new Set([...list, ...words])] : list.filter(w => !words.includes(w));
fs.writeFileSync(file, src.replace(m[0], `const NAME_WORDS = "${Buffer.from(list.join("\n")).toString("base64")}";`));
console.log(`${list.length} entries in names.js`);
