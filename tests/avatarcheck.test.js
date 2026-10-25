// Checks the Presenter menu's avatar check sheets: one picture per shirt, or per hairstyle and head shape, drawn in its own frame, and the player's avatar put back
// afterwards. Run from the mock-prototype folder: node tests/avatarcheck.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };

// a pretend page: just enough of the globals the sheets use, and a record of what each picture was drawn with
const seen = [];
const mine = { outfit: "Mine", gender: "Female", skin: 3, hairStyle: "Pixie", face: "Round", hat: "Cap" };
const SKINS = ["#a", "#b", "#c", "#d"], calls = { stop: 0 };
const ctx = vm.createContext({
  console, state: { avatar: mine }, SKINS, esc: s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"), stopAll() { calls.stop++; }, Cam: { stop() {} }, Sound: { stop() {} },
  GENDER_DEFAULTS: { Male: { outfit: "M0", hat: "None" }, Female: { outfit: "F0", hat: "None" } },
  outfitsFor: g => (g === "Male" ? ["Alpha Tee", "Beta Tee", "Gamma Tee"] : ["Alpha Tee", "Delta Tee"]),
  HAIR_BY: { Male: ["Buzz", "Short"], Female: ["Pixie", "Bob", "Long"] }, FACES: { Oval: 1, Round: 2, Square: 3, Heart: 4, Long: 5 },
  repLook: () => ({ ...ctx.state.avatar }), person: look => { seen.push({ ...look, skinColour: SKINS[1] }); return `<g class="p">${look.outfit}|${look.hairStyle}|${look.face}</g><path fill="#2b3a55"/><rect fill="#3a2a1c"/>`; },
  app: { innerHTML: "", querySelectorAll: () => [] }, $: () => ({}), home() {}, window: { scrollTo() {} },
});
vm.runInContext(read("avatarcheck.js").replace(/^"use strict";/, "") + ";globalThis.AC = AvatarCheck;", ctx);
const show = (k, g) => { seen.length = 0; vm.runInContext(`AC.show(${JSON.stringify(k)}, ${JSON.stringify(g)})`, ctx); return ctx.app.innerHTML; };
const frames = html => (html.match(/<iframe /g) || []).length;

let html = show("sleeves", "Male"); const seenMen = [...seen];
ok("the sleeves sheet has one framed picture per shirt for a man (3), each labelled", frames(html) === 3 && ["Alpha", "Beta", "Gamma"].every(n => html.includes(`<small>${n}</small>`)));
ok("and per shirt for a woman (2)", frames(show("sleeves", "Female")) === 2);
ok("each picture is drawn in its own iframe with the part of the body that sheet is about", /viewBox=&quot;0 96 120 90&quot;/.test(html) && /srcdoc="/.test(html) && /scrolling="no"/.test(html));
ok("each shirt is drawn once, as the gender asked for, not as the player's own look", seenMen.map(s => s.outfit).join() === "Alpha Tee,Beta Tee,Gamma Tee" && seenMen.every(s => s.gender === "Male" && s.hairStyle === "Bald" && s.hat === "None"));

html = show("necks", "Male");
ok("the neck sheet draws every shirt with a loud pink skin colour", frames(html) === 3 && seen.every(s => s.skinColour === "#ff00ff") && /viewBox=&quot;32 84 56 36&quot;/.test(html));
html = show("bottoms", "Male");
ok("the bottom sheet paints the trousers green and the belt yellow, on a pink background", !/#2b3a55|#3a2a1c/.test(decodeURIComponent(html.replace(/&amp;/g, "&").replace(/%/g, "%25"))) && /#00ff00/.test(html) && /#ffff00/.test(html) && /background:#ff5fa8/.test(html));
html = show("hair", "Female");
ok("the hair sheet has every hairstyle on all five head shapes (3 x 5 for a woman)", frames(html) === 15 && seen.length === 15 && new Set(seen.map(s => s.face)).size === 5 && seen.every(s => s.outfit === "F0"));
ok("and 2 x 5 for a man, one row per hairstyle", frames(show("hair", "Male")) === 10 && (ctx.app.innerHTML.match(/class="avrow"/g) || []).length === 2);
ok("every sheet has tabs for the other sheets and a men or women switch, and a way back to the map", ["sleeves", "necks", "bottoms", "hair"].every(k => html.includes(`data-k="${k}"`)) && /data-g="Male"/.test(html) && /data-g="Female"/.test(html) && /id="avback"/.test(html));
ok("the sheet stops any sound or camera that was running", calls.stop > 0);

// the player's own avatar and skin colours are back exactly as they were, even if drawing fails
const keep = JSON.stringify(mine), skinKeep = SKINS.join();
ok("afterwards the player's avatar and the skin colours are exactly as they were", ctx.state.avatar === mine && JSON.stringify(mine) === keep && SKINS.join() === skinKeep);
let threw = false; ctx.person = () => { throw new Error("boom"); };
try { show("necks", "Male"); } catch { threw = true; }
ok("even when a drawing fails, the avatar and skin colours come back", threw && ctx.state.avatar === mine && JSON.stringify(mine) === keep && SKINS.join() === skinKeep);

// how it is wired in
const html0 = read("index.html"), pres = read("presenter.js");
ok("the Presenter menu has an Avatar check section with the four sheets", /\["Avatar check", \[\["Shirts: arms and sleeves", \(\) => AvatarCheck\.show\("sleeves"\)\], \["Shirts: neck and collar", \(\) => AvatarCheck\.show\("necks"\)\], \["Shirts: bottom of the preview", \(\) => AvatarCheck\.show\("bottoms"\)\], \["Hair on every head shape", \(\) => AvatarCheck\.show\("hair"\)\]\]\]/.test(pres));
ok("the script loads after presenter.js and adds one new global name", html0.indexOf('<script src="presenter.js') < html0.indexOf('<script src="avatarcheck.js') && html0.indexOf('<script src="avatarcheck.js') < html0.indexOf("const enterGame") && (read("avatarcheck.js").match(/^const [A-Za-z]+ =/gm) || []).length === 1);
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
