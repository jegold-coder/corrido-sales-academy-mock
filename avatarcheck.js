"use strict";
// Contact sheets for checking how the avatar is drawn, opened from the Presenter menu ("Avatar check"): every shirt, or every hairstyle on every head shape, on one page.
// This is how the arms, sleeves, neck skin, hair and hems were checked by eye. Each picture sits in its own frame (an iframe), so pictures never share ids and a shirt
// cannot borrow another's clip. A sheet only borrows the player's avatar to draw with, and puts it back afterwards. Uses globals from index.html at call time.

const AvatarCheck = (() => {
  const EXPRESSION = "Warm smile";   // every face on every sheet wears this one expression, so only the hair, shirt or neck differs
  const esc2 = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  const short = n => n.replace(/Corrido |Tequila |Tee|\(|\)/g, "").trim().slice(0, 24);
  // what each sheet shows: which part of the picture, how big, and what a good result looks like
  const SHEETS = {
    sleeves: { title: "Shirts: arms and sleeves", note: "Every arm comes out of its sleeve, and a drawn sleeve hangs over the arm with the arm showing below it.", vb: "0 96 120 90", w: 190, h: 142 },
    necks: { title: "Shirts: neck and collar", note: "The skin is painted pink so a stray corner shows: none should be beside the collar.", vb: "32 84 56 36", w: 190, h: 122, skin: "#ff00ff" },
    bottoms: { title: "Shirts: the bottom of the preview", note: "The trousers are green and the belt yellow so they show: none should be under or beside a shirt.", vb: "0 178 120 30", w: 190, h: 48, loud: true, bg: "#ff5fa8" },
    hair: { title: "Hair on every head shape", note: "Each row is one hairstyle on the five head shapes (Oval, Round, Square, Heart, Long), all with the same warm smile: the hair should be attached to every one.", vb: "10 -4 100 104", w: 112, h: 116 },
  };
  // Inside a frame the page's own CSS is missing, which hides the four reaction mouths a customer's face can show (smile, grin, flat, frown). Without this rule all four
  // are drawn on top of each other, so the same rule goes in each frame, and every face shows just the one expression it was given.
  const frame = (inner, o) => `<iframe scrolling="no" style="border:0;width:${o.w}px;height:${o.h}px;background:${o.bg || "#fff"}" srcdoc="${esc2(`<style>.xm path{display:none}</style><body style="margin:0;overflow:hidden"><svg xmlns="http://www.w3.org/2000/svg" viewBox="${o.vb}" width="${o.w}" height="${o.h}" style="display:block">${inner}</svg>`)}"></iframe>`;

  // draw with a changed avatar (and, for the neck sheet, a loud skin colour), then put everything back
  function draw(gender, change, o) {
    const keep = state.avatar, skin = SKINS[1];
    try {
      state.avatar = { ...keep, gender, ...GENDER_DEFAULTS[gender], skin: 1, hairStyle: "Bald", hat: "None", smile: EXPRESSION, ...change };
      if (o.skin) SKINS[1] = o.skin;
      let svg = person(repLook());
      if (o.loud) svg = svg.replace(/#2b3a55/g, "#00ff00").replace(/#3a2a1c/g, "#ffff00");
      return svg;
    } finally { state.avatar = keep; SKINS[1] = skin; }
  }

  function show(kind = "sleeves", gender = "Male") {
    stopAll(); Cam.stop(); Sound.stop();
    const o = SHEETS[kind];
    const body = kind === "hair"
      ? HAIR_BY[gender].map(h => `<div class="avrow"><b>${esc(h)}</b>${Object.keys(FACES).map(f => frame(draw(gender, { hairStyle: h, face: f }, o), o)).join("")}</div>`).join("")
      : `<div class="avgrid">${outfitsFor(gender).map(n => `<div class="avcell">${frame(draw(gender, { outfit: n }, o), o)}<small>${esc(short(n))}</small></div>`).join("")}</div>`;
    app.innerHTML = `<section class="view sheet avcheck"><div class="dhead"><div class="dwho"><h1>${o.title}</h1><p>${o.note}</p></div><button class="btn alt" id="avback" type="button">← Map</button></div>
      <p class="avtabs">${Object.entries(SHEETS).map(([k, s]) => `<button type="button" class="btn ${k === kind ? "" : "alt"}" data-k="${k}">${s.title}</button>`).join(" ")}
        <span class="avgender">${["Male", "Female"].map(g => `<button type="button" class="btn ${g === gender ? "" : "alt"}" data-g="${g}">${g === "Male" ? "Men" : "Women"}</button>`).join(" ")}</span></p>${body}</section>`;
    $("#avback").onclick = home;
    app.querySelectorAll(".avtabs [data-k]").forEach(b => b.onclick = () => show(b.dataset.k, gender));
    app.querySelectorAll(".avtabs [data-g]").forEach(b => b.onclick = () => show(kind, b.dataset.g));
    window.scrollTo(0, 0);
  }

  return { show, SHEETS };
})();
