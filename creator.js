"use strict";
// The character creator page.

// ---------- character creator ----------
// Options depend on the chosen gender. Corrido merch supplies the shirts and hats.
const swatchCol = (g, v) => (g.match ? (v === -1 ? "" : HAIRC[v]) : v);
// What you can wear comes first, so the locked pieces never push your options down the page.
const unlockedFirst = list => {
  const ord = [...list.filter(merchUnlocked), ...list.filter(n => !merchUnlocked(n))];
  // a piece can ask to sit right behind another one (a colourway next to its sibling), even if one is locked and the other is not
  ord.filter(n => OUTFITS[n] && OUTFITS[n].after && ord.includes(OUTFITS[n].after)).forEach(n => { ord.splice(ord.indexOf(n), 1); ord.splice(ord.indexOf(OUTFITS[n].after) + 1, 0, n); });
  return ord;
};
function groupsFor(A) {
  const F = A.gender === "Female";
  return [
    { k: "gender", label: "Character", chips: ["Male", "Female"] },
    { k: "skin", label: "Skin tone", sw: SKINS },
    { k: "face", label: "Face shape", chips: Object.keys(FACES) },
    { k: "hairStyle", label: "Hair style", chips: HAIR_BY[A.gender] },
    { k: "hair", label: "Hair color", sw: HAIRC },
    { k: "eye", label: "Eye color", sw: EYEC },
    { k: "brow", label: "Eyebrow color", sw: [-1, ...HAIRC.map((_, i) => i)], match: true },
    { k: "browW", label: "Eyebrow thickness", chips: ["Thin", "Normal", "Bold"], idx: true },
    ...(F ? [{ k: "lip", label: "Lip color", sw: LIPC }] : [{ k: "facial", label: "Facial hair", chips: ["None", "Stubble", "Mustache", "Goatee", "Beard"] }]),
    { k: "smile", label: "Smile", chips: SMILES },
    { k: "glasses", label: "Glasses", chips: ["None", "Round", "Square", "Sunglasses"] },
    { k: "outfit", merch: "tee", label: "T-shirts", chips: unlockedFirst(outfitsFor(A.gender).filter(n => !OUTFITS[n].polo)) },
    { k: "outfit", merch: "polo", label: "Polos", chips: unlockedFirst(outfitsFor(A.gender).filter(n => OUTFITS[n].polo)) },
    { k: "hat", merch: "hat", label: "Hats", chips: ["None", ...unlockedFirst(Object.keys(HATS))] },
  ];
}
const togglesFor = A => [["dimples", "Dimples"], ["freckles", "Freckles"], ["mole", "Beauty mark"], ["blush", "Rosy cheeks"], ...(A.gender === "Female" ? [["earrings", "Earrings"]] : [])];

// Merch is one tabbed grid of small photos (T-shirts, Polos, Hats) instead of a long list of buttons. Every piece is still there.
const thumb = u => u.replace(/_\d+x\.png/, "_300x.png");
// Polos are drawn in code (there is no flat photo to trim), so their tile is a small polo in the same colour.
const poloIcon = c => `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M17 7L5 14l5 9 6-3v22h16V20l6 3 5-9-12-7-5 4h-6z" fill="${c}" stroke="#0005" stroke-width="1.4" stroke-linejoin="round"/><path d="M19 7l5 9 5-9M24 16v9" fill="none" stroke="#0006" stroke-width="1.4" stroke-linecap="round"/></svg>`;
function creator(onDone, opts = {}) {
  const A = state.avatar;
  const fresh = !!opts.fresh;   // the first time: start from a random look, so there is a good starting point to adjust
  let mtab = "tee";
  const merchTile = c => {
    if (c === "None") return `<button type="button" class="tile none" data-v="None" data-cap="No hat" aria-label="No hat"><span aria-hidden="true">✕</span><small>None</small></button>`;
    const m = OUTFITS[c] || HATS[c], v = merchView(c, A.gender), lock = !merchUnlocked(c), cap = `${v.label} · ${m.price}${lock ? " · " + merchHow(c) : ""}`;
    return `<button type="button" class="tile ${lock ? "locked" : ""}" data-v="${esc(c)}" data-cap="${esc(cap)}" title="${esc(cap)}" ${lock ? 'aria-disabled="true"' : ""} aria-label="${esc(cap)}${lock ? ". Locked" : ""}">${v.img ? `<img src="${thumb(v.img)}" alt="" loading="lazy">` : poloIcon(m.base)}${lock ? '<i class="lk" aria-hidden="true">🔒</i>' : ""}</button>`;
  };
  const merchHtml = () => {
    const gs = groupsFor(A).filter(g => g.merch);
    return `<div class="grp mgrp"><h3>Corrido merch</h3>
      <div class="mtabs" role="tablist">${gs.map(g => { const items = g.chips.filter(c => c !== "None"); return `<button type="button" role="tab" class="mtab" data-m="${g.merch}" aria-selected="${g.merch === mtab}">${g.label} <small>${items.filter(merchUnlocked).length}/${items.length}</small></button>`; }).join("")}</div>
      <p class="mname" id="mname" aria-live="polite"></p>
      ${gs.map(g => `<div class="chips tiles" data-g="${g.k}" data-m="${g.merch}" ${g.merch === mtab ? "" : "hidden"}>${g.chips.map(merchTile).join("")}</div>`).join("")}</div>`;
  };
  const capText = () => {
    const polo = !!OUTFITS[A.outfit].polo;
    if (mtab === "hat") return A.hat === "None" ? "No hat. Pick one to try it on." : `${A.hat} · ${HATS[A.hat].price}`;
    return (mtab === "polo") === polo ? `${merchView(A.outfit, A.gender).label} · ${OUTFITS[A.outfit].price}` : `Pick a ${mtab === "polo" ? "polo" : "T-shirt"} to swap out the ${polo ? "polo" : "shirt"}.`;
  };
  const optsHtml = () => groupsFor(A).filter(g => !g.merch).map(g => `<div class="grp"><h3>${g.label}</h3><div class="chips" data-g="${g.k}">${
    g.sw ? g.sw.map((v, i) => `<button type="button" class="sw ${g.match && v === -1 ? "match" : ""}" style="${swatchCol(g, v) ? `background:${swatchCol(g, v)}` : ""}" data-v="${g.match ? v : i}" aria-label="${g.label} ${i + 1}${v === -1 ? " (match hair)" : ""}" title="${v === -1 ? "Match hair" : ""}"></button>`).join("")
    : g.chips.map((c, i) => `<button type="button" class="chip2" data-v="${g.idx ? i : c}">${c}</button>`).join("")}</div></div>`).join("")
    + `<div class="grp"><h3>Features</h3><div class="chips">${togglesFor(A).map(([k, l]) => `<button type="button" class="chip2 tg" data-t="${k}">${l}</button>`).join("")}</div></div>`   // features sit with the other looks, above the merch
    + merchHtml();
  app.innerHTML = `<section class="view sheet creator">
    <h1>Create your rep</h1>
    <div class="cwrap">
      <div class="cprev">
        <div class="pframe"><svg viewBox="0 -24 120 232" id="cprev" role="img" aria-label="Your character preview"></svg></div>
        <label class="nlab">Your name (required)<input id="cname" maxlength="14" value="${esc(A.name)}" placeholder="Type your name" autocomplete="off" required></label>
        <button class="btn alt" id="crand" type="button">🎲 Randomize</button>
        <div class="shoplinks" id="shoplinks" aria-live="polite"></div>
      </div>
      <div class="copts" id="copts"></div>
    </div>
    <p class="note2">Shirts and hats use the real Tequila Corrido merch photos from their website, linked live (needs internet). Double-click any one to see it on the shop.</p>
    <p class="csavebar"><button class="btn" id="cdone" type="button">Save &amp; continue</button> <small id="nreq" class="nreq">Enter your name to continue.</small></p></section>`;
  const paint = () => {
    $("#cprev").innerHTML = person(repLook());
    const shop = (label, name) => merchView(name, A.gender).url ? `<a class="shoplink" href="https://ilovetequilacorrido.com/products/${merchView(name, A.gender).url}" target="_blank" rel="noopener">${label}: ${esc(merchView(name, A.gender).label)} <span aria-hidden="true">↗</span><span class="sr"> (opens the Tequila Corrido shop in a new tab)</span></a>` : "";
    $("#shoplinks").innerHTML = shop(OUTFITS[A.outfit].polo ? "Polo" : "Shirt", A.outfit) + (A.hat !== "None" ? shop("Hat", A.hat) : "");
    app.querySelectorAll(".chips[data-g]").forEach(box => {
      const k = box.dataset.g;
      box.querySelectorAll("[data-v]").forEach(b => b.setAttribute("aria-pressed", String(A[k]) === b.dataset.v));
    });
    app.querySelectorAll(".tg").forEach(b => b.setAttribute("aria-pressed", !!A[b.dataset.t]));
    if ($("#mname")) $("#mname").textContent = capText();
  };
  const wire = () => {
    $("#copts").innerHTML = optsHtml();
    app.querySelectorAll(".chips[data-g] [data-v]").forEach(b => b.onclick = () => {
      const k = b.parentElement.dataset.g, cur = A[k];
      if (b.getAttribute("aria-disabled")) { toast(`${merchView(b.dataset.v, A.gender).label} is locked. ${merchHow(b.dataset.v)}.`); return; }
      const val = typeof cur === "number" ? Number(b.dataset.v) : b.dataset.v;
      if (k === "gender" && val !== A.gender) { A.gender = val; Object.assign(A, GENDER_DEFAULTS[val]); wire(); } else A[k] = val;
      paint();
    });
    app.querySelectorAll(".tg").forEach(b => b.onclick = () => { A[b.dataset.t] = !A[b.dataset.t]; paint(); });
    // double-click a shirt, polo or hat to open that product on the real shop
    app.querySelectorAll(".chips[data-g=outfit] [data-v], .chips[data-g=hat] [data-v]").forEach(b => {
      const h = merchView(b.dataset.v, A.gender).url;
      if (!h) return;
      b.title = (b.title ? b.title + " · " : "") + "double-click to see it on the Tequila Corrido shop";
      b.ondblclick = () => window.open("https://ilovetequilacorrido.com/products/" + h, "_blank", "noopener");
    });
    app.querySelectorAll(".mtab").forEach(t => t.onclick = () => {
      mtab = t.dataset.m;
      app.querySelectorAll(".mtab").forEach(x => x.setAttribute("aria-selected", String(x === t)));
      app.querySelectorAll(".tiles").forEach(x => { x.hidden = x.dataset.m !== mtab; });
      paint();
    });
    app.querySelectorAll(".tile").forEach(t => {
      const show = () => { $("#mname").textContent = t.dataset.cap; }, back = () => { $("#mname").textContent = capText(); };
      t.onmouseenter = show; t.onfocus = show; t.onmouseleave = back; t.onblur = back;
    });
    paint();
  };
  const checkName = () => { const ok = A.name.trim().length > 0; $("#cdone").disabled = !ok; $("#nreq").classList.toggle("hidden", ok); $("#cname").setAttribute("aria-invalid", String(!ok)); };
  $("#cname").oninput = e => { A.name = e.target.value; checkName(); };
  $("#cname").onkeydown = e => { if (e.key === "Enter" && !$("#cdone").disabled) $("#cdone").click(); };
  $("#crand").onclick = () => {
    const pick = a => a[Math.floor(Math.random() * a.length)], idx = a => a.map((_, i) => i), keep = { name: A.name, gender: A.gender }, F = A.gender === "Female";
    Object.assign(A, GENDER_DEFAULTS[A.gender], { skin: pick(idx(SKINS)), face: pick(Object.keys(FACES)), hairStyle: pick(HAIR_BY[A.gender]), hair: pick(idx(HAIRC)), eye: pick(idx(EYEC)), brow: -1, browW: pick([0, 1, 2]), facial: F ? "None" : pick(["None", "None", "Stubble", "Mustache", "Goatee", "Beard"]), glasses: pick(["None", "None", "Round", "Square", "Sunglasses"]), frame: 0, smile: pick(SMILES), outfit: pick(outfitsFor(A.gender).filter(merchUnlocked)), hat: pick(["None", ...Object.keys(HATS).filter(merchUnlocked)]), lip: pick(idx(LIPC)), dimples: Math.random() < .4, freckles: Math.random() < .3, mole: Math.random() < .2, earrings: F && Math.random() < .4, blush: F ? Math.random() < .8 : Math.random() < .3 }, keep);
    wire();
  };
  $("#cdone").onclick = () => {
    A.name = (A.name || "").trim().slice(0, 14);
    if (!A.name) return checkName();
    state.avatarSaved = true;
    try { localStorage.setItem("csa_avatar", JSON.stringify(A)); } catch { /* storage unavailable */ }
    onDone();
  };
  wire();
  checkName();
  if (fresh && !state.avatarSaved) { $("#crand").click(); A.glasses = "None"; A.hat = "None"; wire(); }   // a random look with a clear face to start from
  if (!A.name.trim()) $("#cname").focus();
  window.scrollTo(0, 0);
}
