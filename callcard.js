"use strict";
// The "Before a call" card: a 60-second refresher (the promise, the four bottles at their public prices, do and never, what to say to the usual objections)
// and a per-pour cost calculator that works from the rep's OWN numbers. It never quotes a margin or a wholesale price: those aren't public.
// Opened from the "Who is Tequila Corrido?" page. Uses globals from the other scripts (app, $, esc, LINEUP...) at call time.

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

  // ---------- Before a call ----------
  const DO = ["Ask about their guests and what they pour before you pitch.", "Respect their time: offer 60 seconds, or a quieter time.", "Use the brand's own words, and offer a taste.", "Ask for one small, dated next step, such as a tasting on a named day."];
  const NEVER = ["Serve or encourage anyone under 21.", "Make health claims.", "Invent prices, margins or sales numbers. Say you'll confirm in writing.", "Run down the brand they already pour.", "Leave alcohol behind unless the manager is there.", "Promise shipping you haven't confirmed."];
  const IFTHEY = [
    ["“It's too expensive.”", "Acknowledge the worry, then make price concrete with per-pour maths (below). Offer to confirm wholesale terms in writing."],
    ["“We already pour another brand.”", "Don't run it down. Name one real difference, then invite a taste."],
    ["“I'm busy right now.”", "Offer 60 seconds, or ask for a better time and give a day and hour."],
    ["“I'm not the one who decides.”", "Be friendly and brief. Ask the best day and time to meet the decision-maker. Don't leave a bottle behind."],
    ["“Is it good for you?”", "No health claims. Stick to what the brand says: additive-free, three ingredients, no fake flavors."],
    ["“We don't want it.”", "Don't argue or beg. Ask who their shoppers are, and when one buys something different. Suggest a tiny test."],
  ];
  function beforeCall() {
    stopAll(); Cam.stop(); Sound.stop();
    app.innerHTML = `<section class="view sheet callcard">
      <div class="dhead"><div class="dwho"><h1>Before a call</h1><p>A 60-second refresher. Public facts only, and your own numbers.</p></div><button class="btn alt" id="cback" type="button">← Brand</button></div>
      <div class="card"><h3>Say it in one line</h3><p><b>Additive-free.</b> Only three ingredients and no fake flavors.</p>
        <p class="note2">The name: a corrido is a traditional Mexican ballad, and the brand borrows its music-and-rebellion spirit. The tequila bears the stamp of one of the first female master distillers.</p></div>
      <div class="card"><h3>The four bottles</h3><div class="cclineup">${LINEUP.map(([n, pr, notes]) => `<div><b>${esc(n)}</b> <span class="pr">${esc(pr)}</span><small>${esc(notes)}</small></div>`).join("")}</div>
        <p class="note2">These are the public shop prices. Wholesale terms aren't public, so say you'll confirm them in writing.</p></div>
      <div class="ccrow"><div class="card"><h3>Do</h3><ul class="xlist">${DO.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div><div class="card"><h3>Never</h3><ul class="xlist nev">${NEVER.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></div>
      <div class="card"><h3>If they say…</h3><dl class="ifthey">${IFTHEY.map(([a, b]) => `<dt>${a}</dt><dd>${esc(b)}</dd>`).join("")}</dl></div>
      <div class="card" id="calc"><h3>Per-pour cost calculator</h3>
        <p class="note2">Per-pour maths beats arguing about the bottle price. Type in the bar's numbers. This uses only what you enter, and it never quotes a margin.</p>
        <div class="calcgrid">
          <label>Bottle
            <select id="cbottle">${LINEUP.map(([n, pr]) => `<option value="${pr.replace("$", "")}">${esc(n)} (${esc(pr)} shop price)</option>`).join("")}<option value="">Other</option></select></label>
          <label>Cost per bottle to the bar ($)<input id="ccost" type="number" min="0" step="0.01" inputmode="decimal" value="${LINEUP[0][1].replace("$", "")}"></label>
          <label>Bottle size (ml)<input id="cml" type="number" min="1" step="1" inputmode="numeric" value="750"></label>
          <label>Pour size (oz)<select id="coz"><option>1</option><option>1.25</option><option selected>1.5</option><option>2</option></select></label>
          <label>Menu price per drink ($)<input id="cmenu" type="number" min="0" step="0.01" inputmode="decimal" placeholder="for example 12"></label></div>
        <div class="calcout" id="cout" role="status" aria-live="polite"></div>
        <p class="note2">The shop price is only a starting point: use the confirmed wholesale price once you have it in writing, and check the bottle size on the label.</p></div>
</section>`;
    const val = id => $(id).value, show = () => {
      const m = pourMath({ cost: val("#ccost"), ml: val("#cml"), oz: val("#coz"), menu: val("#cmenu") });
      $("#cout").innerHTML = !m ? "<p>Enter a bottle cost, a size and a pour size.</p>"
        : `<div><b>${m.pours}</b><span>pours in a bottle</span></div><div><b>${money(m.perPour)}</b><span>cost per pour</span></div>`
          + (m.pct != null ? `<div><b>${m.pct.toFixed(0)}%</b><span>pour cost</span></div><div><b>${money(m.revenue)}</b><span>a bottle brings in</span></div><div><b>${money(m.kept)}</b><span>left after the bottle cost</span></div>` : "<p class=\"note2\">Add a menu price to see the pour cost.</p>");
    };
    $("#cbottle").onchange = () => { if (val("#cbottle")) $("#ccost").value = val("#cbottle"); show(); };
    ["#ccost", "#cml", "#coz", "#cmenu"].forEach(id => { $(id).oninput = show; $(id).onchange = show; });
    $("#cback").onclick = () => explorer();
    show(); window.scrollTo(0, 0);
  }

  return { pourMath, beforeCall, DO, NEVER, IFTHEY };
})();
