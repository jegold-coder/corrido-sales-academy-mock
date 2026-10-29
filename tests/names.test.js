// Checks the character's name check (names.js): the word list is stored encoded, every word on it is refused (also in capitals, with repeated letters, with
// look-alike symbols, spaced out and with accents), ordinary names that only contain part of a word are fine, and the creator, the sign-in and loading all use it.
// The test builds its bad names from the list itself, so no offensive word is written out in this file. Run from the mock-prototype folder: node tests/names.test.js
const fs = require("fs"), vm = require("vm"), path = require("path"), os = require("os"), cp = require("child_process");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };

const src = read("names.js");
const encoded = (src.match(/const NAME_WORDS = "([A-Za-z0-9+/=]*)";/) || [])[1];
const entries = encoded ? Buffer.from(encoded, "base64").toString().split("\n").filter(Boolean) : [];
const ctx = vm.createContext({ atob: s => Buffer.from(s, "base64").toString("binary") });
vm.runInContext(src.replace(/^"use strict";/, "") + ";globalThis.NameCheck = NameCheck;", ctx);
const blocked = n => ctx.NameCheck.blocked(n);
const anywhere = entries.filter(e => e[0] !== "="), whole = entries.filter(e => e[0] === "=").map(e => e.slice(1));

// ---------- the list ----------
ok("the list decodes to over a hundred lowercase a-to-z words, none twice, some for whole words only", entries.length > 100 && entries.every(e => /^=?[a-z]+$/.test(e)) && new Set(entries).size === entries.length && whole.length > 20 && anywhere.length > 40, `${entries.length} entries`);
const every = [...anywhere, ...whole];
const plainIn = f => every.filter(w => new RegExp("\\b" + w + "\\b", "i").test(read(f)));
ok("none of the words is in plain text in names.js, the README, the list tool or this test (the list is encoded)", ["names.js", "README.md", "tools/names-list.js", "tests/names.test.js"].every(f => plainIn(f).length === 0), ["names.js", "README.md", "tools/names-list.js", "tests/names.test.js"].map(f => plainIn(f).length ? f + ": " + plainIn(f).length : "").join(""));

// ---------- every word is refused, the usual ways of dodging included ----------
const leet = w => w.replace(/o/g, "0").replace(/e/g, "3").replace(/a/g, "4").replace(/s/g, "$").replace(/i/g, "1");
const dup = w => [...w].map(c => c + c).join("");
const accent = w => w.replace(/[aeiou]/, v => ({ a: "á", e: "é", i: "í", o: "ö", u: "ü" })[v]);
const look = w => w.replace(/a/g, "а").replace(/e/g, "е").replace(/o/g, "о").replace(/c/g, "с").replace(/p/g, "р");
const missed = fn => every.filter(w => !blocked(fn(w)));
ok("every word on the list is refused as typed", missed(w => w).length === 0, missed(w => w).length + " missed");
ok("... in capitals", missed(w => w.toUpperCase()).length === 0);
ok("... with every letter repeated", missed(dup).length === 0);
ok("... with symbols for letters (0 for o, 3 for e, 4 for a, $ for s, 1 for i)", missed(leet).length === 0, missed(leet).slice(0, 3).length + " missed");
ok("... spaced out or with dots between the letters", missed(w => [...w].join(" ")).length === 0 && missed(w => [...w].join(".")).length === 0);
ok("... with an accent on the first vowel", missed(accent).length === 0);
ok("... with look-alike letters from another alphabet", missed(look).length === 0);
ok("... and with a number 1 standing for an l", blocked(every.find(w => /l/.test(w)).replace(/l/g, "1")));
ok("a whole-word entry is also refused with an s on the end", whole.every(w => blocked(w + "s")));

// ---------- ordinary names are fine ----------
const fine = ["Maria", "José", "Zoë", "Hancock", "Cummings", "Essex", "Sussex", "Dickson", "Vergara", "Nazir", "Pissarro", "Analisa", "Assad", "Cockburn", "Shittu", "Peniston",
  "Titus", "Scott", "Mary-Jane", "Jo Ann", "O'Brien", "Li Ma", "Al Ex", "Alex", "Daniel", "Concha", "Sofia", "Dana R.", "Niger", "Class", "Passion", "Jake", "Demo Rep", "Rep", "Ana María"];
ok("ordinary names, including ones that contain part of a word on the list, are not refused", fine.every(n => !blocked(n)), fine.filter(blocked).join(", "));
ok("an empty or blank name is not a bad name (it is just missing)", !blocked("") && !blocked("   ") && !blocked(undefined) && !blocked(null));
const inside = every.filter(w => !blocked("zq" + w + "qz"));
ok("a word inside a longer word is refused only when the list says anywhere (a whole-word entry inside a longer name is fine)", anywhere.every(w => blocked("zq" + w + "qz")) && whole.every(w => !blocked("zq" + w + "qz")), inside.length + " not refused");
const halves = anywhere.filter(w => w.length >= 6).map(w => [w.slice(0, w.length >> 1), w.slice(w.length >> 1)]).filter(([a, b]) => a.length >= 3 && b.length >= 3 && !blocked(a) && !blocked(b));
ok("two ordinary words side by side never join into a refused one (only one- and two-letter pieces are joined)", halves.length > 10 && halves.every(([a, b]) => !blocked(a + " " + b)), halves.length + " pairs tried");

// ---------- where it is used ----------
const creator = read("creator.js"), avatar = read("avatar.js"), auth = read("auth.js"), html = read("index.html");
ok("the creator refuses a name that fails the check: Save & continue stays off, the note under the field says why, and the field is marked invalid", /const typed = A\.name\.trim\(\)\.length > 0, ok = typed && !NameCheck\.blocked\(A\.name\)/.test(creator) && /\$\("#cdone"\)\.disabled = !ok/.test(creator) && /Please pick a name that is fine to show at work\./.test(creator) && /Enter your first name to continue\./.test(creator) && /aria-invalid", String\(!ok\)/.test(creator));
ok("Save & continue checks again when pressed (Enter, or a script, cannot get past it)", /if \(!A\.name \|\| NameCheck\.blocked\(A\.name\)\) return checkName\(\);/.test(creator));
ok("the note is read out when it changes and is tied to the field", /<small id="nreq" class="nreq" aria-live="polite">/.test(creator) && /<input id="cname"[^>]*aria-describedby="nreq"/.test(creator));
ok("a saved name that fails the check (stored earlier, or edited in storage) is cleared when the avatar loads, so it shows as Rep", /if \(typeof NameCheck !== "undefined" && NameCheck\.blocked\(A\.name\)\) A\.name = "";/.test(avatar) && /const repName = \(\) => \(state\.avatar\.name \|\| ""\)\.trim\(\) \|\| "Rep"/.test(avatar));
ok("Sign in with Google does not copy a first name that fails the check into the character", /!NameCheck\.blocked\(r\.user\.first\)\) state\.avatar\.name = r\.user\.first\.slice\(0, 14\)/.test(auth));
const at = f => html.indexOf(`<script src="${f}?v=`);
ok("names.js loads right after icons.js, before the scripts that use it", at("names.js") === html.indexOf("\n", at("icons.js")) + 1 && at("names.js") < at("auth.js") && at("names.js") < at("avatar.js") && at("names.js") < at("creator.js"));
ok("names.js adds two top-level names (the encoded list and NameCheck), in strict mode", (src.match(/^const [A-Za-z_]+ =/gm) || []).length === 2 && /^"use strict";\n/.test(src) && /^const NameCheck = /m.test(src) && /^const NAME_WORDS = /m.test(src));

// ---------- the list tool ----------
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "names-"));
fs.mkdirSync(path.join(tmp, "tools"));
fs.copyFileSync(path.join(root, "names.js"), path.join(tmp, "names.js"));
fs.copyFileSync(path.join(root, "tools", "names-list.js"), path.join(tmp, "tools", "names-list.js"));
const tool = (...a) => cp.spawnSync(process.execPath, [path.join(tmp, "tools", "names-list.js"), ...a], { encoding: "utf8" });
const printed = tool().stdout.split("\n").filter(Boolean);
ok("the list tool prints the same list", printed.join() === entries.join());
const added = tool("add", "zqxwv", "=qwzxv");
const afterAdd = Buffer.from((fs.readFileSync(path.join(tmp, "names.js"), "utf8").match(/const NAME_WORDS = "([A-Za-z0-9+/=]*)";/) || [])[1], "base64").toString().split("\n");
ok("... adds words (and whole-word entries) and reports the count", added.status === 0 && afterAdd.includes("zqxwv") && afterAdd.includes("=qwzxv") && afterAdd.length === entries.length + 2 && /\d+ entries/.test(added.stdout));
tool("remove", "zqxwv", "=qwzxv");
ok("... removes them again, leaving the file as it was", fs.readFileSync(path.join(tmp, "names.js"), "utf8") === src);
const refused = tool("add", "Bad1");
ok("... and refuses a word with anything but letters, without changing the file", refused.status === 1 && /Letters a to z only/.test(refused.stderr) && fs.readFileSync(path.join(tmp, "names.js"), "utf8") === src);
fs.rmSync(tmp, { recursive: true, force: true });

console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
