// Checks the rep's smile styles: the shapes, the creator row, saving, and that the mouth still moves while talking.
// Run from the mock-prototype folder: node tests/smile.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8"), boss = fs.readFileSync(path.join(root, "boss.js"), "utf8");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };
const slice = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
const ctx = vm.createContext({});
vm.runInContext(html.match(/const mixHex = .*;/)[0], ctx);
vm.runInContext(slice("const SMILES = [", "const MARCO_LOOK = {"), ctx);
const ev = s => vm.runInContext(s, ctx);

const names = ev("SMILES"), styles = names.slice(1);
ok("the plain mouth is first, then six smile styles", names[0] === "Neutral" && styles.length === 6 && new Set(names).size === 7, names.join(", "));
const shape = (smile, extra = {}) => ev(`smileShape(${JSON.stringify({ smile, my: 77, lip: "#b05a55", ...extra })})`);
ok("Neutral and anything unknown draw nothing extra, so the plain mouth shows", shape("Neutral") === "" && shape("Nope") === "" && shape("") === "");
ok("every smile is one group that the CSS can hide while talking", styles.every(s => /^<g class="smilev">[\s\S]+<\/g>$/.test(shape(s))));
ok("each smile looks different from the others", new Set(styles.map(s => shape(s))).size === styles.length);

// every point stays on the lower face, around the mouth (the face is 120 wide; the mouth sits at x 60, y 77)
const points = s => [...shape(s).matchAll(/<path d="([^"]+)"/g)].flatMap(m => [...m[1].matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)].map(p => [Number(p[1]), Number(p[2])]));
const bad = styles.filter(s => points(s).some(([x, y]) => x < 47 || x > 73 || y < 70 || y > 90));
ok("every point of every smile sits on the lower face", bad.length === 0, bad.join(", "));
ok("they move with the mouth: a different mouth height moves the drawing", shape("Big smile", { my: 80 }) !== shape("Big smile", { my: 77 }));
ok("on a beard the lines are lighter so they still show", shape("Soft smile", { beard: "<path/>", lip: "#7a3b30" }) !== shape("Soft smile", { lip: "#7a3b30" }));
ok("the open smiles have teeth, and the laugh has a tongue", /#fff/.test(shape("Big smile")) && /#fff/.test(shape("Grin")) && /#fff/.test(shape("Laugh")) && /#d9605a/.test(shape("Laugh")));

// how it is wired into the drawing, the CSS and the creator
ok("the plain mouth hides behind a chosen smile but is still there to move", /<ellipse class="mouth\$\{o\.smile \? " hid" : ""\}"[^>]*\$\{o\.smile \? ' opacity="0"' : ""\}\/>\s*\$\{o\.smile \? smileShape\(o\) : ""\}/.test(html));
ok("while the rep talks the smile hides and the moving mouth shows", /\.talking \.smilev\{display:none\}\.talking \.mouth\.hid\{opacity:1\}/.test(html));
ok("the rep's look passes the chosen smile on, and Neutral passes nothing", /smile: A\.smile && A\.smile !== "Neutral" \? A\.smile : ""/.test(html));
ok("the creator has a Smile row of chips, next to the lips and facial hair", /\{ k: "smile", label: "Smile", chips: SMILES \},\s*\{ k: "glasses"/.test(html));
ok("new avatars start Neutral, and old or damaged saved ones are fixed to Neutral", /DEFAULT_AVATAR = \{[^}]*smile: "Neutral"/.test(html) && /if \(!SMILES\.includes\(A\.smile\)\) A\.smile = "Neutral"/.test(html));
ok("Randomize picks a smile too", /smile: pick\(SMILES\)/.test(html));
ok("the shared tier card picture hides the reaction mouths (it has no page CSS, so all four were drawn at once)", /<style>\.xm path\{display:none\}<\/style>\$\{person\(repLook\(\)\)\}/.test(boss));
ok("the smile names and drawing function are new global names (no clash)", (html.match(/const SMILES =/g) || []).length === 1 && (html.match(/function smileShape/g) || []).length === 1);
ok("the Features row is built with the other looks, above the merch grid", /<h3>Features<\/h3>[\s\S]*?\n\s+\+ merchHtml\(\);/.test(html) && !/\+ merchHtml\(\)\n\s+\+ `<div class="grp"><h3>Features/.test(html));
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
