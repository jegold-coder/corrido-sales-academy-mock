// Checks that every hairstyle is attached to every head shape: the hair cap always covers the band between the face and its outline, and the marks
// on the hair (parting, shine, cornrow lines) are cut off at the head. Run from the mock-prototype folder: node tests/hair.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const html = require("./page").source();   // index.html with the page's own scripts back in place
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };

// the hair code from the page, run on its own
const ctx = vm.createContext({});
const take = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
vm.runInContext(take("const FACES = {", "const IMG = ") + "\nconst HAIR_BY = " + html.match(/const HAIR_BY = (\{[\s\S]*?\});/)[1] + ";", ctx);
const ev = s => vm.runInContext(s, ctx);
const faces = ev("Object.keys(FACES)"), styles = ev("[...new Set([...HAIR_BY.Male, ...HAIR_BY.Female])]");
ok(`${styles.length} hairstyles on ${faces.length} head shapes are checked`, styles.length >= 28 && faces.length === 5);

// every hairstyle built on a cap covers the band between the face and its slightly larger outline, on every face shape
const capped = styles.filter(s => s !== "Bald");
let missing = [];
for (const s of capped) for (const f of faces) {
  const h = ev(`HAIRS[${JSON.stringify(s)}]("#6b4423", FACES.${f})`), front = h.front || "";
  const mask = front.match(/<mask id="(hx\d+)m"><path d="([^"]+)" transform="[^"]+" fill="#fff"\/><path d="([^"]+)" fill="#000"\/><\/mask>/);
  if (!mask || mask[2] !== ev(`FACES.${f}`) || mask[3] !== ev(`FACES.${f}`) || !new RegExp(`<g clip-path="url\\(#${mask[1]}y\\)"><rect [^>]*mask="url\\(#${mask[1]}m\\)"`).test(front)) missing.push(`${s}/${f}`);
}
ok("every hairstyle has the band that keeps it attached, built from that head's own outline", missing.length === 0, missing.slice(0, 5).join(", "));
ok("the band reaches down to the hairline (the clip is as tall as the cap), so no white sliver is left at the temples", ev(`HAIRS.Short("#000", FACES.Oval).front`).includes('<clipPath id="hx') && /<rect x="-20" y="-40" width="160" height="94"\/>/.test(ev(`HAIRS.Short("#000", FACES.Oval).front`)));
ok("each cap has its own clip ids, so a second person on the page cannot borrow this head shape", (() => { const a = ev(`HAIRS.Short("#000", FACES.Oval).front`).match(/id="(hx\d+)"/)[1], b = ev(`HAIRS.Short("#000", FACES.Round).front`).match(/id="(hx\d+)"/)[1]; return a !== b; })());

// the marks on the hair stay on the head
const marked = ["Slick back", "Curtains", "Cornrows", "Long", "Wavy", "Pigtails", "Space buns", "Braids"], loose = ["Spiky", "Flat top", "Mohawk", "Curly"];
ok("the styles with a parting, shine or cornrow lines are flagged to be cut at the head's outline", marked.every(s => ev(`HAIRS[${JSON.stringify(s)}]("#000", FACES.Oval).clip`) === true), marked.filter(s => ev(`HAIRS[${JSON.stringify(s)}]("#000", FACES.Oval).clip`) !== true).join(", "));
ok("the styles that stand up off the head (spikes, a flat top, a mohawk, curls) are not cut", loose.every(s => !ev(`HAIRS[${JSON.stringify(s)}]("#000", FACES.Oval).clip`)));
const cut = ev(`onHead(FACES.Long, '<path d="M60 4L60 20"/>')`);
ok("the cut is the real head outline, a little larger, with its own id", /<clipPath id="hd\d+"><path d="M34 50C34 26 46 12 60 12S86 26 86 50C86 76 75 96 60 96S34 76 34 50Z" transform="[^"]+"\/><\/clipPath><g clip-path="url\(#hd\d+\)"><path d="M60 4L60 20"\/><\/g>/.test(cut));
ok("the rep's hair uses it for those styles, after the face fit", /h\.clip && h\.deco \? onHead\(FACES\[A\.face\], fit\(h\.deco\)\) : fit\(h\.deco\)/.test(html));
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
