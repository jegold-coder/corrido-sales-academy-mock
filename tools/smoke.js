"use strict";
// A click-through smoke test: it opens the game in a real (windowless) Chrome, plays through the first run, visits every page the Presenter menu can reach,
// draws every shirt and hairstyle, and checks the offline copy. It fails on any error in the page. Run from the mock-prototype folder:  node tools/smoke.js
// It needs Chrome (set CHROME if it is not in the usual place) and an internet connection for the shop photos; it installs nothing.
const http = require("http"), fs = require("fs"), path = require("path");
const { launch, sleep } = require("./cdp.js");
const root = path.join(__dirname, "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".svg": "image/svg+xml", ".css": "text/css" };
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };

(async () => {
  // a tiny web server for this folder that tells the browser to keep nothing, so every run sees the files as they are now
  const server = http.createServer((req, res) => {
    const f = path.join(root, decodeURIComponent(req.url.split("?")[0]).replace(/^\/$/, "/index.html"));
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(f)] || "application/octet-stream", "Cache-Control": "no-store" }); fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const chrome = await launch();

  // every error the page reports, except images from the shop failing to load (no internet is not a bug in the game)
  const errors = [];
  chrome.on(m => {
    if (m.method === "Runtime.exceptionThrown") errors.push("exception: " + ((m.params.exceptionDetails.exception || {}).description || m.params.exceptionDetails.text));
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push("console.error: " + m.params.args.map(a => a.value || a.description || "").join(" "));
    if (m.method === "Log.entryAdded" && m.params.entry.level === "error" && !/shopify|ilovetequilacorrido/.test(m.params.entry.url || "")) errors.push("log: " + m.params.entry.text + " " + (m.params.entry.url || ""));
  });
  const step = async (name, fn) => { const before = errors.length; try { await fn(); } catch (e) { ok(name, false, e.message); return; } ok(name, errors.length === before, errors.slice(before).join(" | ")); };
  const click = sel => chrome.eval(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) throw new Error("no ${sel.replace(/"/g, "'")}"); e.click(); return true; })()`);

  try {
    // ----- a first visit: age check, guest sign-in, create a rep, tutorial, the map
    await chrome.go(base); await chrome.eval("localStorage.clear()"); await chrome.go(base);
    await step("the age check shows first, with no way past it except yes", async () => {
      if (!await chrome.waitFor("!!document.querySelector('#yes')")) throw new Error("no age check");
      if (await chrome.eval("document.querySelector('#guest').disabled") !== true) throw new Error("sign-in is open before the age check");
    });
    await step("yes opens sign-in, and guest leads to the character creator", async () => {
      await click("#yes"); if (!await chrome.waitFor("!document.querySelector('#guest').disabled")) throw new Error("sign-in stayed locked");
      await click("#guest"); if (!await chrome.waitFor("!!document.querySelector('#cname') && !!document.querySelector('#cprev')")) throw new Error("no creator");
    });
    await step("a name and Save and continue lead to the three-card tutorial, which can be skipped", async () => {
      await chrome.eval("(() => { const n = document.querySelector('#cname'); n.value = 'Taylor'; n.dispatchEvent(new Event('input', { bubbles: true })); })()");
      await click("#cdone"); if (!await chrome.waitFor("!!document.querySelector('#tskip')")) throw new Error("no tutorial");
      await click("#tskip"); if (!await chrome.waitFor("!!document.querySelector('.maphome')")) throw new Error("no map");
    });
    await step("the map has 16 stops, only the first one open", async () => {
      const r = await chrome.eval("({ nodes: document.querySelectorAll('.node').length, locked: document.querySelectorAll('.node.locked').length })");
      if (r.nodes !== 16 || r.locked !== 15) throw new Error(JSON.stringify(r));
    });
    await step("the first lesson can be opened from the map and played through to its results", async () => {
      await click(".node[data-id=brand]"); if (!await chrome.waitFor("document.querySelector('#diffDlg').open")) throw new Error("no dialog");
      await chrome.eval("document.querySelector('#diffDlg button.btn:not(.alt)').click()");
      for (let i = 0; i < 40 && !await chrome.eval("!!document.querySelector('.result')"); i++) {
        await chrome.eval("(() => { const o = document.querySelector('.opt:not(:disabled)'); if (o) o.click(); })()"); await sleep(120);
        await chrome.eval("(() => { const n = document.querySelector('#nx'); if (n) n.click(); })()"); await sleep(120);
      }
      if (!await chrome.waitFor("!!document.querySelector('.result')", 4000)) throw new Error("the lesson never reached its results");
    });
    await step("every Dashboard tab opens", async () => {
      for (const t of ["progress", "badges", "team", "review", "check", "settings"]) { await chrome.eval(`dashboard(${JSON.stringify(t)})`); if (!await chrome.eval("!!document.querySelector('.dash, .dhead')")) throw new Error("tab " + t); }
    });

    // ----- Presenter mode: every page its menu reaches
    await chrome.go(base); await chrome.eval("localStorage.clear()"); await chrome.go(base);
    await click("#yes"); await chrome.waitFor("!document.querySelector('#presentGo').disabled"); await click("#presentGo");
    ok("Presenter mode opens with sample progress and its menu button", await chrome.waitFor("!!document.querySelector('#prbtn') && !!document.querySelector('.maphome')"));
    const jumps = await chrome.eval("Presenter.MENU().flatMap(([, items]) => items.map(i => i[0]))");
    ok(`the Presenter menu has ${jumps.length} jumps`, jumps.length >= 26);
    for (let k = 0; k < jumps.length; k++) {
      if (jumps[k] === "Age check") continue;   // that jump reloads the page, which the first-visit steps above already cover
      await step(`jump ${k + 1}/${jumps.length}: ${jumps[k]}`, async () => {
        await chrome.eval(`(() => { document.querySelectorAll("dialog[open]").forEach(d => d.close()); document.body.classList.toggle("mgr", ${/^Manager/.test(jumps[k])}); const f = Presenter.MENU().flatMap(([, items]) => items)[${k}][1]; const r = f(); if (r && r.catch) r.catch(() => {}); })()`);
        await sleep(350);
        if (!await chrome.waitFor("!document.querySelector('#prbtn').disabled", 30000)) throw new Error("a sample run never finished");
        const stale = await chrome.eval("(document.body.innerText.match(/\\bLv\\b|\\b[Ll]evel \\d/) || [])[0] || ''");   // the old names for rank and difficulty are gone from every page
        if (stale) throw new Error("a page still says '" + stale + "'");
      });
    }
    await step("the three progress buttons in the menu work: start over, random sample, complete the game", async () => {
      const r = await chrome.eval(`(() => { const n = () => Object.keys(state.done).length; Presenter.reset(); const a = n(); Presenter.sample(); const b = n(); Presenter.finish(); return [a, b, n(), PATH.length]; })()`);
      if (!(r[0] === 0 && r[1] > 3 && r[1] < r[3] && r[2] === r[3])) throw new Error(JSON.stringify(r));
    });

    // ----- every shirt, hairstyle and head shape draws without an error
    await step("every shirt, hairstyle and head shape draws, for a man and a woman", async () => {
      const r = await chrome.eval(`(() => { let n = 0; const keep = JSON.stringify(state.avatar); state.proto = { ...state.proto, unlockMerch: true };
        for (const g of ["Male", "Female"]) { state.avatar.gender = g; Object.assign(state.avatar, GENDER_DEFAULTS[g]);
          for (const o of outfitsFor(g)) { state.avatar.outfit = o; if (!/<g|<path/.test(person(repLook()))) throw new Error("nothing drawn for " + o); n++; }
          state.avatar.outfit = GENDER_DEFAULTS[g].outfit;
          for (const h of HAIR_BY[g]) for (const f of Object.keys(FACES)) { state.avatar.hairStyle = h; state.avatar.face = f; if (!/<path/.test(person(repLook()))) throw new Error("nothing drawn for " + h + "/" + f); n++; } }
        Object.assign(state.avatar, JSON.parse(keep)); return n; })()`);
      if (r < 200) throw new Error("only " + r + " drawings");
    });

    // ----- a surprise round, and what a manager does with the answers
    const ans = k => `(() => { const st = window.__sx.steps[${k}], box = document.querySelector('#ans'); box.value = ${k === 1 ? "st.H[0][0]" : "st.R[0]"}.replace(/^"|"$/g, ""); box.dispatchEvent(new Event("input", { bubbles: true })); document.querySelector('#submit').click(); })()`;
    await step("a surprise customer round plays through with typed answers, and the results show how the rep sounded", async () => {
      await chrome.eval("(() => { window.lipTalk = () => Promise.resolve(); document.querySelectorAll('dialog[open]').forEach(d => d.close()); document.body.classList.remove('mgr'); state.answers = []; state.notes = {}; window.__sx = surpriseScenario(); play(window.__sx); })()");
      for (let k = 0; k < 5; k++) {
        if (!await chrome.waitFor("!!document.querySelector('#ans') && !document.querySelector('#ans').disabled", 8000)) throw new Error("question " + (k + 1) + " did not appear");
        if (!await chrome.eval("!!document.querySelector('.qhead .twistchip') && !!document.querySelector('.twist')")) throw new Error("question " + (k + 1) + " has no curveball note");
        await chrome.eval(ans(k));
        if (!await chrome.waitFor("!!document.querySelector('#nx')", 30000)) throw new Error("answer " + (k + 1) + " was not scored");
        await chrome.eval("document.querySelector('#nx').click()");
      }
      if (!await chrome.waitFor("!!document.querySelector('.result')", 8000)) throw new Error("no results");
      const r = await chrome.eval("({ cards: document.querySelectorAll('details.acard').length, deliv: document.querySelectorAll('.deliv').length, logged: state.answers.length, retry: document.querySelectorAll('.retryq').length })");
      if (r.cards !== 5 || r.deliv !== 5 || r.logged !== 5 || r.retry < 1) throw new Error(JSON.stringify(r));
    });
    await step("'Hear it' plays a stronger answer, and 'Try this question again' works for a surprise question", async () => {
      if (await chrome.eval("typeof speechSynthesis !== 'undefined'")) {
        if (!await chrome.eval("document.querySelectorAll('.hearbtn').length >= 1")) throw new Error("no Hear it button on a weak answer");
        await chrome.eval("document.querySelector('.hearbtn').click()"); await sleep(1500);
        await chrome.eval("Voices.halt(); speechSynthesis.cancel()");
      }
      await chrome.eval("document.querySelector('.retryq').click()");
      if (!await chrome.waitFor("!!document.querySelector('#ans') && !!document.querySelector('.twist')", 8000)) throw new Error("the retry did not start with its curveball");
      await chrome.eval(`(() => { const sx = SURPRISE.find(x => "surprise:" + x.id === state.sc.steps[0].ckey), box = document.querySelector('#ans'); box.value = sx.R[0].replace(/^"|"$/g, ""); box.dispatchEvent(new Event("input", { bubbles: true })); document.querySelector('#submit').click(); })()`);
      if (!await chrome.waitFor("!!document.querySelector('#nx')", 30000)) throw new Error("the retry was not scored");
      await chrome.eval("document.querySelector('#nx').click()");
      if (!await chrome.waitFor("!!document.querySelector('.result')", 8000)) throw new Error("the retry has no results");
    });
    await step("the manager reads the player's answers, leaves a note, and the rep reads it on the Review page", async () => {
      await chrome.eval("(() => { document.body.classList.add('mgr'); ansRep = AnswerLog.mine()[0].rep; ansLow = false; managerMode('answers'); })()");
      const n = await chrome.eval("document.querySelectorAll('details.mans').length");
      if (n < 5) throw new Error("only " + n + " answers on the Answers page");
      await chrome.eval("(() => { const c = document.querySelector('details.mans'); c.querySelector('.mnote').value = 'Good pause. Keep it.'; c.querySelector('.savenote').click(); })()");
      if (await chrome.eval("AnswerLog.playerNotes().length") !== 1) throw new Error("the note was not saved");
      await chrome.eval("document.body.classList.remove('mgr'); dashboard('progress')");
      if (!await chrome.eval("!!document.querySelector('.newnote') && !!document.querySelector('.ndot')")) throw new Error("the rep is not told about the note");
      await chrome.eval("document.querySelector('#pnote').click()");
      if (!await chrome.eval("!!document.querySelector('.notescard') && /Good pause/.test(document.querySelector('.notescard').textContent) && !document.querySelector('.ndot') && AnswerLog.unseen() === 0")) throw new Error("the Review page does not show the note");
    });
    await step("the Coaching page has a team huddle, and every spreadsheet has a row for every rep", async () => {
      await chrome.eval("(() => { document.body.classList.add('mgr'); mgrClass = 'sample'; managerMode('coaching'); })()");
      if (!await chrome.eval("!!document.querySelector('.mhuddle') && document.querySelectorAll('.huddle li').length === 5")) throw new Error("no team huddle");
      const r = await chrome.eval("({ n: classReps(SAMPLE_CLASS).length, p: progressCsv(SAMPLE_CLASS, classReps(SAMPLE_CLASS)).split('\\n').length, s: skillsCsv(SAMPLE_CLASS, classReps(SAMPLE_CLASS)).split('\\n').length })");
      if (r.p < r.n + 1 || r.s !== r.n + 1) throw new Error(JSON.stringify(r));
    });
    await step("a manager assigns a stop and the rep sees it on the map, then on their Progress tab", async () => {
      await chrome.eval("(() => { state.assignments = []; document.body.classList.add('mgr'); managerMode('assign'); })()");
      await chrome.eval("(() => { document.querySelector('#astop').value = 'quiet'; document.querySelector('#awho').value = 'class'; document.querySelector('#anote').value = 'Aim for three stars'; document.querySelector('#aadd').click(); })()");
      if (await chrome.eval("document.querySelectorAll('.massign').length") !== 1) throw new Error("the assignment is not in the list");
      await chrome.eval("document.body.classList.remove('mgr'); state.done = {}; home()");
      if (!await chrome.eval("!!document.querySelector('.assigned') && /Quiet Bar/.test(document.querySelector('.assigned').textContent)")) throw new Error("no strip on the map");
      await chrome.eval("dashboard('progress')");
      if (!await chrome.eval("!!document.querySelector('.alist')")) throw new Error("no card on the Progress tab");
    });
    await step("a manager changes a price: the lessons, the review and the calculator follow, and a reset puts it back", async () => {
      await chrome.eval("(() => { document.body.classList.add('mgr'); managerMode('facts'); document.querySelector('#fp0').value = '46.99'; document.querySelector('#fken').value = 'Ken Phox'; document.querySelector('#fkendate').value = '2026-10-24'; document.querySelector('#fsave').click(); })()");
      const r = await chrome.eval("({ q: Q('blancoPrice').a, lineup: LINEUP[0][1], review: CallCard.review().includes('$46.99') && /confirmed by ken phox/.test(CallCard.review()), status: Facts.status() })");
      if (r.q !== "$46.99" || r.lineup !== "$46.99" || !r.review) throw new Error(JSON.stringify(r));
      await chrome.eval("Facts.reset()");
      const b = await chrome.eval("({ q: Q('blancoPrice').a, lineup: LINEUP[0][1], draft: Facts.status() })");
      if (b.q !== "$44.99" || b.lineup !== "$44.99" || !/Draft/.test(b.draft)) throw new Error(JSON.stringify(b));
      await chrome.eval("document.body.classList.remove('mgr'); home()");
    });

    // ----- usability: the footer rank, the camera reminder, the feedback fold, the map, the photo placeholders
    await step("the footer shows a rank's name, not 'Lv', and the history table says Difficulty", async () => {
      await chrome.eval("(() => { document.body.classList.remove('mgr'); home(); })()");
      const r = await chrome.eval("({ rank: document.querySelector('#stLvl').textContent, want: LEVELS[levelOf(state.xp)][0], title: document.querySelector('#ftLvl').title, lv: /\\bLv\\b|Level \\d/.test(document.body.innerText) })");
      if (r.rank !== r.want || !/Your rank/.test(r.title) || r.lv) throw new Error(JSON.stringify(r));
      await chrome.eval("dashboard('progress')");
      if (!await chrome.eval("[...document.querySelectorAll('.hist th')].some(h => h.textContent === 'Difficulty') && !/Level \\d/.test(document.querySelector('.hist').textContent)")) throw new Error("the history table still says Level");
    });
    await step("the camera reminder shows on the first question only, and 'x' switches it off for good", async () => {
      await chrome.eval("(() => { window.lipTalk = () => Promise.resolve(); state.cam = false; state.camNudgeOff = false; document.querySelectorAll('dialog[open]').forEach(d => d.close()); window.__sx = surpriseScenario(); play(window.__sx); })()");
      if (!await chrome.waitFor("!!document.querySelector('#camNudge') && !!document.querySelector('#camDismiss')", 8000)) throw new Error("no reminder on the first question");
      await chrome.eval(ans(0)); if (!await chrome.waitFor("!!document.querySelector('#nx')", 30000)) throw new Error("not scored"); await chrome.eval("document.querySelector('#nx').click()");
      if (!await chrome.waitFor("!!document.querySelector('#ans') && !document.querySelector('#ans').disabled", 8000)) throw new Error("question 2 did not appear");
      if (await chrome.eval("!!document.querySelector('#camNudge')")) throw new Error("the reminder came back on question 2");
      await chrome.eval("(() => { window.__sx = surpriseScenario(); play(window.__sx); })()");
      await chrome.waitFor("!!document.querySelector('#camDismiss')", 8000);
      await chrome.eval("document.querySelector('#camDismiss').click()");
      if (await chrome.eval("!!document.querySelector('#camNudge') || state.camNudgeOff !== true")) throw new Error("the x did not dismiss it");
      await chrome.eval("(() => { window.__sx = surpriseScenario(); play(window.__sx); })()");
      await sleep(600);
      if (await chrome.eval("!!document.querySelector('#camNudge')")) throw new Error("it came back after being dismissed");
      await chrome.eval("state.camNudgeOff = false; home()");
    });
    await step("coach mode puts what to fix first and a stronger answer in view, and folds the rest", async () => {
      await chrome.eval("(() => { window.lipTalk = () => Promise.resolve(); state.coachPref = true; play(SCENARIOS.find(m => m.id === 'quiet')); })()");
      if (!await chrome.waitFor("!!document.querySelector('#ans') && !document.querySelector('#ans').disabled", 8000)) throw new Error("no question");
      await chrome.eval("(() => { const st = SCENARIOS.find(m => m.id === 'quiet').steps[1], box = document.querySelector('#ans'); box.value = st.H[0][0].replace(/^\"|\"$/g, ''); box.dispatchEvent(new Event('input', { bubbles: true })); document.querySelector('#submit').click(); })()");
      if (!await chrome.waitFor("!!document.querySelector('.feed.coach')", 30000)) throw new Error("no coach card");
      const r = await chrome.eval("(() => { const c = document.querySelector('.feed.coach'), d = c.querySelector('details.coachmore'); return { fix: c.querySelectorAll('.fixfirst li').length, open: d.open, betterFirst: c.querySelector('.better').compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING, inside: d.querySelectorAll('li, .deliv').length }; })()");
      if (r.fix < 1 || r.fix > 2 || r.open || !r.betterFirst || r.inside < 1) throw new Error(JSON.stringify(r));
      await chrome.eval("state.coachPref = undefined; home()");
    });
    await step("the map opens on the next stop to play, and a first-day map stays at the top", async () => {
      for (let k = 0; k < 3; k++) {   // a different point in the season each time
        await chrome.eval("(() => { Presenter.sample(); home(); })()");
        await sleep(1500);   // the scroll is smooth: let it finish
        const r = await chrome.eval("(() => { const n = document.querySelector('.node.cur'); if (!n) return { none: true }; const b = n.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), vh: innerHeight, idx: ALL_STOPS().findIndex(x => x.id === n.dataset.id) }; })()");
        if (r.none || r.idx < 2 || r.bottom < 0 || r.top > r.vh) throw new Error("the next stop is out of view: " + JSON.stringify(r));
      }
      const rings = await chrome.eval("[...document.querySelectorAll('.node:not(.boss)')].map(n => { const c = getComputedStyle(n), b = n.getBoundingClientRect(); return [c.borderTopWidth, c.borderRightWidth, c.borderBottomWidth, c.borderLeftWidth].every(w => w === c.borderTopWidth) && Math.round(b.width) === Math.round(b.height); }).filter(ok => !ok).length");
      if (rings) throw new Error(rings + " stop circles are not true circles with an even ring");
      await chrome.eval("(() => { Presenter.reset(); window.scrollTo(0, 0); home(); })()");
      await sleep(800);
      if (await chrome.eval("window.scrollY") > 60) throw new Error("a first-day map scrolled away from the top");   // a few pixels of settling is normal; the first stop is already in view
    });
    await step("when the whole game is complete every finished circle has the white ring, the first stops as much as the last, before and after the map is redrawn", async () => {
      const rings = "[...document.querySelectorAll('.node.done')].map(n => { const c = getComputedStyle(n); return [c.borderTopColor, c.borderRightColor, c.borderBottomColor, c.borderLeftColor].every(x => x === 'rgb(255, 241, 196)'); })";
      for (const wait of [300, 4500]) {   // right after it is finished, and once the pop animation is long over
        await chrome.eval("(() => { Presenter.reset(); home(); Presenter.finish(); home(); })()");
        await sleep(wait);
        const r = await chrome.eval(`(() => { const a = ${rings}; return { n: a.length, missing: a.filter(x => !x).length, total: ALL_STOPS().length }; })()`);
        if (r.n !== r.total || r.missing) throw new Error(JSON.stringify(r));
      }
      await chrome.eval("home()"); await sleep(300);   // a plain redraw, with nothing new to pop
      const r2 = await chrome.eval(`(() => { const a = ${rings}; return a.filter(x => !x).length + a.length * 100; })()`);
      if (r2 !== 1600) throw new Error("after a redraw: " + r2);
    });
    await step("the map page is never wider than the screen at any phone or tablet width, and the page can't bounce sideways", async () => {
      await chrome.eval("(() => { Presenter.finish(); document.body.classList.remove('mgr'); home(); })()");
      for (const w of [320, 360, 390, 430, 768, 1100]) {
        await chrome.send("Emulation.setDeviceMetricsOverride", { width: w, height: 800, deviceScaleFactor: 1, mobile: w < 700 });
        await chrome.eval("home()"); await sleep(500);
        const r = await chrome.eval("({ w: innerWidth, scrollW: document.documentElement.scrollWidth, x: (() => { scrollTo(300, 0); return scrollX; })() })");
        if (r.scrollW > r.w || r.x !== 0) throw new Error("at " + w + "px the page is " + r.scrollW + "px wide and scrolls sideways by " + r.x);
      }
      await chrome.send("Emulation.clearDeviceMetricsOverride");
      const s = await chrome.eval("({ bg: getComputedStyle(document.documentElement).backgroundColor, ob: getComputedStyle(document.documentElement).overscrollBehaviorX, ta: getComputedStyle(document.querySelector('#app')).touchAction })");
      if (s.bg !== "rgb(36, 21, 10)" || s.ob !== "none" || !/pan-y/.test(s.ta) || /pan-x/.test(s.ta)) throw new Error(JSON.stringify(s));
    });
    await step("shop photos get a placeholder while they load and lose it when they arrive", async () => {
      await chrome.eval("(() => { state.proto = { ...state.proto, unlockMerch: true }; creator(home); })()");
      await sleep(6000);
      const r = await chrome.eval("(() => { const imgs = [...document.querySelectorAll('.tile img')]; return { n: imgs.length, stuck: imgs.filter(i => i.complete && !i.classList.contains('ld')).length, marked: imgs.filter(i => i.classList.contains('ld')).length }; })()");
      if (r.n < 5 || r.stuck > 0) throw new Error(JSON.stringify(r));
      await chrome.eval("home()");
    });

    // ----- the offline copy
    await chrome.go(base); await click("#yes").catch(() => {});
    const sw = await chrome.eval("navigator.serviceWorker.ready.then(r => !!r.active)").catch(() => false);
    ok("the offline worker registers and becomes active", sw === true);
    await chrome.eval("(() => { state.proto = { ...state.proto, unlockMerch: true }; creator(home); })()"); await sleep(5000);
    const kept = await chrome.eval("caches.open('csa-images-v1').then(c => c.keys()).then(k => k.length)").catch(() => 0);
    const online = await chrome.eval("fetch('https://cdn.shopify.com/s/files/1/0665/6091/7672/files/unisex-classic-tee-black-front-680fb818a821d_600x.png', { mode: 'no-cors' }).then(() => true).catch(() => false)");
    if (online) ok("shop photos are kept on the device after they load", kept > 3, kept + " kept");
    else console.log("skip  no internet, so the photo copy was not checked");
  } catch (e) { ok("the run itself", false, e.message); }

  console.log(fails ? `${fails} FAILED` : "OK");
  await chrome.close(); server.close(); process.exit(fails ? 1 : 0);
})();
