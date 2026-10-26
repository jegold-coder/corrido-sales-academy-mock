"use strict";
// The 60-second review a rep reads before a sale: the promise, the four bottles at their public prices, do and never, what to say to the usual objections,
// and a per-pour cost calculator that works from the rep's OWN numbers. It never quotes a margin or a wholesale price: those aren't public.
// It is the body of the "Who is Tequila Corrido?" page. Uses globals from the other scripts ($, esc, IMG, LINEUP...) at call time.

const CallCard = (() => {
  const OZ = 29.5735;   // millilitres in a fluid ounce
  // The bar's own maths from the numbers typed in: pours in a bottle, cost per pour and, with a menu price, pour cost and what a bottle brings in.
  function pourMath({ cost, ml, oz, menu }) {
    cost = Number(cost); ml = Number(ml); oz = Number(oz); menu = Number(menu);
    if (!(cost > 0) || !(ml > 0) || !(oz > 0)) return null;
    const pours = Math.floor(ml / (oz * OZ));
    if (pours < 1) return null;
    const out = { pours, perPour: cost / pours };
    if (menu > 0) { out.pct = out.perPour / menu * 100; out.revenue = pours * menu; out.kept = out.revenue - cost; }
    return out;
  }
  const money = n => "$" + n.toFixed(2);

  // ---------- the 60-second review ----------
  const DO = ["Ask about their guests and what they pour first.", "Offer 60 seconds, or a quieter time.", "Use the brand's own words and offer a taste.", "Ask for one small, dated next step."];
  const NEVER = ["Serve or encourage anyone under 21.", "Make health claims.", "Invent prices, margins or sales numbers. Confirm in writing.", "Run down the brand they already pour.", "Leave alcohol behind unless the manager is there.", "Promise shipping you haven't confirmed."];
  const IFTHEY = [
    ["“It's too expensive.”", "Do the per-pour maths (below). Offer to confirm terms in writing."],
    ["“We already pour another brand.”", "Don't run it down. Name one real difference and invite a taste."],
    ["“I'm busy right now.”", "Offer 60 seconds, or a day and hour that works."],
    ["“I'm not the one who decides.”", "Ask the best day and time to meet the decision-maker. Leave no bottle."],
    ["“Is it good for you?”", "No health claims. Additive-free, three ingredients, no fake flavors."],
    ["“We don't want it.”", "Don't argue. Ask who their shoppers are and suggest a tiny test."],
  ];
  // A manager can reword the promise, Do, Never and the replies (manager mode > Brand facts), so these are only the starting wording (facts.js keeps the edits).
  Facts.setReview({ promise: "Additive-free. Only three ingredients and no fake flavors.", doList: DO, neverList: NEVER, replies: IFTHEY.map(x => x[1]) });
  // The first sentence of the promise in bold, the rest as it is.
  const promiseLine = t => { const m = String(t).match(/^(.+?[.!?])(\s+[\s\S]*)?$/); return m ? `<b>${esc(m[1])}</b>${esc(m[2] || "")}` : esc(t); };
  // The quick reminders, as the body of the "Who is Tequila Corrido?" page (that page is the review a rep reads before a sale).
  function review() {
    const R = Facts.review(), F = Facts.get();
    return `<div class="card"><h3>Say it in one line</h3><p>${promiseLine(R.promise)}</p>
        <ul class="xlist"><li><b>The name:</b> a corrido is a Mexican ballad. The brand borrows its music-and-rebellion spirit.</li><li><b>The maker:</b> stamped by one of the first female master distillers.</li><li><b>No famous fans:</b> the tequila does the talking, so never claim any.</li></ul></div>
      <div class="card"><h3>The four bottles</h3><div class="xlineup">${LINEUP.map(([n, pr, notes, , img]) => `<div class="xbottle"><img src="${IMG}${img}" alt="A bottle of Tequila Corrido ${n}" loading="lazy"><div class="xtext"><b>${n}</b><span class="xprice">${pr}</span><small>${notes}</small></div></div>`).join("")}</div>
        <p class="note2">These are the public shop prices. Wholesale terms aren't public, so say you'll confirm them in writing.${F.checked ? ` Prices last checked ${Facts.dateLabel(F.checked)}.` : ""}</p></div>
      <div class="ccrow"><div class="card"><h3>Do</h3><ul class="xlist">${R.doList.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div><div class="card"><h3>Never</h3><ul class="xlist nev">${R.neverList.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></div>
      <div class="card"><h3>If they say…</h3><dl class="ifthey">${IFTHEY.map(([a], i) => `<dt>${a}</dt><dd>${esc(R.replies[i] || IFTHEY[i][1])}</dd>`).join("")}</dl></div>
      <details class="card xmerch" id="calc"><summary><h3>Per-pour cost calculator</h3><small>optional</small></summary>
        <p class="note2">Per-pour maths beats arguing about the bottle price. Type in the bar's numbers. This uses only what you enter, and it never quotes a margin.</p>
        <div class="calcgrid">
          <label>Bottle
            <select id="cbottle">${LINEUP.map(([n, pr]) => `<option value="${pr.replace("$", "")}">${esc(n)} (${esc(pr)} shop price)</option>`).join("")}<option value="">Other</option></select></label>
          <label>Cost per bottle to the bar ($)<input id="ccost" type="number" min="0" step="0.01" inputmode="decimal" value="${LINEUP[0][1].replace("$", "")}"></label>
          <label>Bottle size (ml)<input id="cml" type="number" min="1" step="1" inputmode="numeric" value="750"></label>
          <label>Pour size (oz)<select id="coz"><option>1</option><option>1.25</option><option selected>1.5</option><option>2</option></select></label>
          <label>Menu price per drink ($)<input id="cmenu" type="number" min="0" step="0.01" inputmode="decimal" placeholder="for example 12"></label></div>
        <div class="calcout" id="cout" role="status" aria-live="polite"></div>
        <p class="note2">The shop price is only a starting point: use the confirmed wholesale price once you have it in writing, and check the bottle size on the label.</p></details>
      <p class="note2 wstatus">Wording and prices: ${esc(Facts.status().toLowerCase())}.</p>`;
  }
  // Brings the calculator to life once the page is on screen.
  function wire() {
    const val = id => $(id).value, show = () => {
      const m = pourMath({ cost: val("#ccost"), ml: val("#cml"), oz: val("#coz"), menu: val("#cmenu") });
      $("#cout").innerHTML = !m ? "<p>Enter a bottle cost, a size and a pour size.</p>"
        : `<div><b>${m.pours}</b><span>pours in a bottle</span></div><div><b>${money(m.perPour)}</b><span>cost per pour</span></div>`
          + (m.pct != null ? `<div><b>${m.pct.toFixed(0)}%</b><span>pour cost</span></div><div><b>${money(m.revenue)}</b><span>a bottle brings in</span></div><div><b>${money(m.kept)}</b><span>left after the bottle cost</span></div>` : "<p class=\"note2\">Add a menu price to see the pour cost.</p>");
    };
    $("#cbottle").onchange = () => { if (val("#cbottle")) $("#ccost").value = val("#cbottle"); show(); };
    ["#ccost", "#cml", "#coz", "#cmenu"].forEach(id => { $(id).oninput = show; $(id).onchange = show; });
    show();
  }

  return { pourMath, review, wire, DO, NEVER, IFTHEY };
})();
