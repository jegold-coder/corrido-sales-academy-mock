"use strict";
// Brand facts: what the game says about Tequila Corrido that a manager (or Ken) may need to change without touching code: the four public bottle prices, the
// wording on the 60-second review (the one-line promise, Do, Never and what to say to each objection) and the "Did you know?" lines.
// A price change reaches every mission, lesson, quiz answer, scoring rule and the review in one go: the old number is swapped for the new one in the game's own
// text (see use() and apply()). Saved on this device only (state.facts). Uses globals from the other scripts (state, esc, Progress...) at call time.

const Facts = (() => {
  const BOTTLES = ["Blanco", "Reposado", "Overproof", "Añejo"];
  const PRICES = { Blanco: "44.99", Reposado: "54.99", Overproof: "56.99", "Añejo": "89.99" };   // the shop's prices when they were last checked
  const CHECKED = "2026-10-24";
  let roots = [], dyk = null, dykDefault = [], review0 = { promise: "", doList: [], neverList: [], replies: [] }, current = { ...PRICES };   // current: the prices the text says right now

  // The data the price swap walks (SCENARIOS, the question bank, the scoring rules...), and the "Did you know?" list, which is handled apart because it can be replaced.
  function use(rootList, didYouKnow) { roots = rootList || []; dyk = didYouKnow || null; dykDefault = dyk ? [...dyk] : []; }
  // The review's own wording, registered by callcard.js, so it is the default the editor starts from.
  const setReview = r => { review0 = r; };

  const saved = () => (typeof state !== "undefined" && state.facts) || {};
  const rx = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Replace the numbers in `from` with the ones in `to` in one pass, through a marker, so two prices can even trade places. A price is only a price when no digit
  // or dot touches it (so 44.99 is not found inside 144.99). Works on text, and on a rule's regular expression (whose text spells the dot as \.).
  function swapper(from, to) {
    const items = BOTTLES.filter(b => from[b] !== to[b]);
    if (!items.length) return null;
    const textRe = items.map(b => new RegExp(`(^|[^\\d.])${rx(from[b])}(?!\\d)`, "g")), srcRe = items.map(b => new RegExp(`(^|[^\\d.])${rx(from[b].replace(".", "\\."))}(?!\\d)`, "g"));
    return v => {
      const isRe = v instanceof RegExp; let s = isRe ? v.source : v;
      (isRe ? srcRe : textRe).forEach((r, i) => { s = s.replace(r, (m, pre) => pre + "\u0001" + i + "\u0001"); });
      items.forEach((b, i) => { s = s.split("\u0001" + i + "\u0001").join(isRe ? to[b].replace(".", "\\.") : to[b]); });
      return isRe ? (s === v.source ? v : new RegExp(s, v.flags)) : s;
    };
  }
  function walk(node, fn, seen = new Set()) {
    if (!node || typeof node !== "object" || seen.has(node)) return;
    seen.add(node);
    for (const k of Array.isArray(node) ? node.keys() : Object.keys(node)) {
      const v = node[k];
      if (typeof v === "string" || v instanceof RegExp) node[k] = fn(v); else walk(v, fn, seen);
    }
  }

  // ----- what is set now -----
  const prices = () => ({ ...PRICES, ...(saved().prices || {}) });
  const pick = (k, dflt) => (saved()[k] != null ? saved()[k] : dflt);
  const dykNow = () => { const s = swapper(PRICES, prices()); return dykDefault.map(l => (s ? s(l) : l)); };
  const get = () => ({ prices: prices(), checked: pick("checked", CHECKED), confirmedBy: pick("confirmedBy", ""), confirmedOn: pick("confirmedOn", ""),
    promise: pick("promise", review0.promise), doList: pick("doList", review0.doList), neverList: pick("neverList", review0.neverList), replies: pick("replies", review0.replies),
    didYouKnow: pick("didYouKnow", dykNow()) });
  const review = () => { const g = get(); return { promise: g.promise, doList: g.doList, neverList: g.neverList, replies: g.replies }; };
  const defaults = () => ({ prices: { ...PRICES }, checked: CHECKED, confirmedBy: "", confirmedOn: "", ...review0, didYouKnow: [...dykDefault] });
  const dateLabel = d => (d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");
  const status = () => { const g = get(); return g.confirmedBy ? `Confirmed by ${g.confirmedBy}${g.confirmedOn ? " on " + dateLabel(g.confirmedOn) : ""}` : "Draft: not yet confirmed by the brand"; };

  // Put the saved prices and lines into the game: swap the numbers in the game's text from what it says now to what is saved, and set the "Did you know?" list.
  function apply() {
    const target = prices(), sw = swapper(current, target);
    if (sw) roots.forEach(r => walk(r, sw));
    current = target;
    if (dyk) {
      const f = saved(), lines = Array.isArray(f.didYouKnow) && f.didYouKnow.length ? f.didYouKnow.map(x => esc(x)) : dykNow();
      dyk.splice(0, dyk.length, ...lines);
    }
  }

  // ----- saving -----
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  // input: the editor's fields. Returns { ok, errors, clean }, where clean holds only what differs from the defaults (so a default keeps following the real prices).
  function validate(input) {
    const errors = [], D = defaults(), clean = {}, p = {};
    BOTTLES.forEach(b => {
      const raw = String((input.prices || {})[b] == null ? "" : input.prices[b]).trim().replace(/^\$/, "");
      if (!/^\d{1,3}(\.\d{1,2})?$/.test(raw) || Number(raw) < 20 || Number(raw) > 500) errors.push(`The ${b} price needs to be a number between 20 and 500, like 44.99.`);
      else p[b] = Number(raw).toFixed(2);
    });
    if (!errors.length) {
      if (new Set(Object.values(p)).size < 4) errors.push("Each bottle needs its own price, so no two can match.");
      else if (BOTTLES.some(b => b !== "Añejo" && Number(p[b]) >= Number(p["Añejo"]))) errors.push("The Añejo has to stay the most expensive bottle, because a lesson question asks which one is the priciest.");
    }
    if (errors.length === 0 && !same(p, D.prices)) clean.prices = p;
    const promise = String(input.promise == null ? "" : input.promise).trim();
    if (!promise) errors.push("The one-line promise can't be empty."); else if (promise.length > 160) errors.push("The one-line promise is too long (160 letters at most).");
    if (promise !== D.promise) clean.promise = promise;
    [["doList", "Do line", D.doList], ["neverList", "Never line", D.neverList], ["replies", "Reply to an objection", D.replies]].forEach(([k, label, dflt]) => {
      const v = (input[k] || []).slice(0, dflt.length).map((x, i) => { const t = String(x == null ? "" : x).trim(); if (!t) errors.push(`${label} ${i + 1} can't be empty.`); else if (t.length > 200) errors.push(`${label} ${i + 1} is too long (200 letters at most).`); return t; });
      if (v.length === dflt.length && !same(v, dflt)) clean[k] = v;
    });
    const lines = (input.didYouKnow || []).map(x => String(x == null ? "" : x).trim()).filter(Boolean);
    if (!lines.length) errors.push("Keep at least one “Did you know?” line.");
    else if (lines.some(l => l.length > 220)) errors.push("A “Did you know?” line is too long (220 letters at most).");
    else {   // lines left as the form showed them (the defaults at today's prices), or as the defaults would read at the new prices, are not custom: they keep following the prices
      const s = swapper(PRICES, Object.keys(p).length === 4 ? p : PRICES), atNew = dykDefault.map(l => (s ? s(l) : l));
      if (!same(lines, dykNow()) && !same(lines, atNew)) clean.didYouKnow = lines;
    }
    const checked = String(input.checked || "").trim();
    if (checked && !/^\d{4}-\d{2}-\d{2}$/.test(checked)) errors.push("Pick a date for “prices last checked”.");
    else if (checked && checked !== CHECKED) clean.checked = checked;
    const by = String(input.confirmedBy || "").trim().slice(0, 40);
    if (by) { clean.confirmedBy = by; if (/^\d{4}-\d{2}-\d{2}$/.test(String(input.confirmedOn || ""))) clean.confirmedOn = input.confirmedOn; }
    return { ok: errors.length === 0, errors, clean };
  }
  function save(input) {
    const r = validate(input);
    if (r.ok) { state.facts = Object.keys(r.clean).length ? r.clean : null; Progress.save(state); apply(); }
    return r;
  }
  function reset() { state.facts = null; Progress.save(state); apply(); }

  return { BOTTLES, PRICES, CHECKED, use, setReview, apply, get, review, defaults, status, dateLabel, validate, save, reset, swapper, walk };
})();

// ----- manager mode > Brand facts -----
function mgrFacts(el) {
  const f = Facts.get(), D = Facts.defaults();
  const box = (id, label, val, max = 200, rows = 2) => `<label class="mlab" for="${id}">${label}</label><textarea id="${id}" class="minput" rows="${rows}" maxlength="${max}">${esc(val)}</textarea>`;
  const confirmed = !!f.confirmedBy;
  el.innerHTML = `<div class="mhead"><div><h1 class="mtitle">Brand facts</h1><p class="msub">Change what the game says about Tequila Corrido without touching code. A change reaches every mission, lesson and the 60-second review at once. Saved on this device (prototype).</p></div></div>
    <div class="mrow2">
      <div class="mcard"><h2>Public prices</h2>
        <p class="note2">The shop's prices. Wholesale terms are not public, so the game never quotes them.</p>
        <div class="fgrid">${Facts.BOTTLES.map((b, i) => `<div><label class="mlab" for="fp${i}">${b} ($)</label><input id="fp${i}" class="minput" inputmode="decimal" value="${esc(f.prices[b])}"></div>`).join("")}</div>
        <label class="mlab" for="fchecked">Prices last checked on the shop</label><input id="fchecked" class="minput" type="date" value="${esc(f.checked)}">
        <p class="note2">Shown on the 60-second review. A price you change here also changes the lesson questions and the answers the coach looks for.</p></div>
      <div class="mcard"><h2>Confirmed by the brand?</h2>
        <p class="fstatus ${confirmed ? "ok" : "draft"}" role="status"><b>${esc(Facts.status())}</b></p>
        <p class="note2">The prices and the wording below, including “celebrity-free”, still need Ken's confirmation. Put in who confirmed them and when, and the review says so. Leave the name blank to show it as a draft.</p>
        <label class="mlab" for="fken">Confirmed by</label><input id="fken" class="minput" maxlength="40" value="${esc(f.confirmedBy)}" placeholder="For example: Ken Phox">
        <label class="mlab" for="fkendate">On</label><input id="fkendate" class="minput" type="date" value="${esc(f.confirmedOn)}"></div></div>
    <div class="mcard"><h2>The 60-second review</h2>
      ${box("fpromise", "The one-line promise (the first sentence shows in bold)", f.promise, 160)}
      <div class="mrow2"><div><h3 class="gr-h">Do</h3>${f.doList.map((x, i) => box("fdo" + i, "Do " + (i + 1), x)).join("")}</div>
        <div><h3 class="gr-h">Never</h3>${f.neverList.map((x, i) => box("fnever" + i, "Never " + (i + 1), x)).join("")}</div></div>
      <h3 class="gr-h">If they say…</h3>${f.replies.map((x, i) => box("freply" + i, `${CallCard.IFTHEY[i][0]}`, x)).join("")}</div>
    <div class="mcard"><h2>“Did you know?” lines</h2>
      <p class="note2">One shows at random on each results screen. Clear a line to remove it. A price you type here will not follow the price fields above.</p>
      ${f.didYouKnow.concat(["", ""]).slice(0, Math.max(6, f.didYouKnow.length + 1)).map((x, i) => box("fdyk" + i, "Line " + (i + 1), x, 220)).join("")}</div>
    <p class="note2 fmsg" id="fmsg" role="alert"></p>
    <div class="mcbtns"><button class="mbtn" id="fsave" type="button">Save changes</button><button class="mbtn alt" id="freset" type="button">Back to the original wording</button></div>`;
  const val = id => ($("#" + id) || { value: "" }).value, arr = (p, n) => Array.from({ length: n }, (_, i) => val(p + i));
  $("#fsave").onclick = () => {
    const r = Facts.save({ prices: Object.fromEntries(Facts.BOTTLES.map((b, i) => [b, val("fp" + i)])), checked: val("fchecked"), confirmedBy: val("fken"), confirmedOn: val("fkendate"),
      promise: val("fpromise"), doList: arr("fdo", D.doList.length), neverList: arr("fnever", D.neverList.length), replies: arr("freply", D.replies.length), didYouKnow: arr("fdyk", Math.max(6, f.didYouKnow.length + 1)) });
    if (!r.ok) { $("#fmsg").innerHTML = r.errors.map(e => `⚠ ${esc(e)}`).join("<br>"); $("#fmsg").scrollIntoView({ block: "nearest", behavior: "smooth" }); return; }
    toast("Saved. The whole game now uses these facts.");
    mgrFacts(el);
  };
  $("#freset").onclick = () => { if (confirm("Put back the original prices and wording everywhere?")) { Facts.reset(); toast("Back to the original facts."); mgrFacts(el); } };
}
