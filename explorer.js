"use strict";
// The shop list and the Who is Tequila Corrido? page (its 60-second review is in callcard.js).

// Every non-bottle product on ilovetequilacorrido.com: [category, name, shop handle, price, thumbnail]. Prices marked "from" rise with size.
const SHOP = [
  ["Tees and tops", "Corrido Classic Tee", "corrido-classic-tee", "from $19.00", "unisex-classic-tee-military-green-front-680fb818b9baf_300x.png"],
  ["Tees and tops", "Corrido Logo Tee", "tequila-corrido-logo-tee", "$24.00", "unisex-staple-t-shirt-dark-grey-heather-front-68c3a7b7c3abb_300x.png"],
  ["Tees and tops", "D.A.R.E. Oversized Tee", "d-a-r-e-oversized-tee", "from $27.90", "unisex-oversized-garment-dyed-t-shirt-washed-black-front-6a389845e4b64_300x.png"],
  ["Tees and tops", "In My Tequila Era Tee", "in-my-tequila-era-tee", "from $29.00", "unisex-classic-tee-charcoal-front-68c3a296d1ab2_300x.png"],
  ["Tees and tops", "Legacy Tee", "legacy-tee", "$34.00", "unisex-tri-blend-t-shirt-athletic-grey-triblend-front-6709aa94ccff0_300x.png"],
  ["Tees and tops", "Mas Tequila Thick Tee", "mas-tequila-thick-tee", "from $24.90", "unisex-garment-dyed-heavyweight-t-shirt-white-front-6997fa20d8768_300x.png"],
  ["Tees and tops", "Mexico Es Chingón Tee", "mexico-es-chingon-tee", "from $34.00", "unisex-organic-ribbed-neck-t-shirt-khaki-front-68c8c0635513f_300x.png"],
  ["Tees and tops", "Más Tequila Tee", "mas-tequila-tee", "from $25.00", "unisex-staple-t-shirt-heather-dust-front-695deb716782d_300x.png"],
  ["Tees and tops", "Pickleball Raglan", "pickleball-raglan", "$40.00", "unisex-34-sleeve-raglan-shirt-heather-denim-navy-front-6709a7bbee3d3_300x.png"],
  ["Tees and tops", "Tequila Delivery 24/7 Oversized Tee", "unisex-oversized-t-shirt", "from $29.50", "unisex-oversized-garment-dyed-t-shirt-washed-charcoal-front-6a388f734581f_300x.png"],
  ["Tees and tops", "Tequila Delivery Tee", "tequila-delivery-tee", "$24.50", "unisex-staple-t-shirt-heather-deep-teal-front-6a3895fe6f6f0_300x.png"],
  ["Tees and tops", "Tequila Era Women’s Tee", "in-my-tequila-era-women-s-tee", "$29.00", "womens-relaxed-t-shirt-white-front-68c3a4bb6ed9a_300x.png"],
  ["Tees and tops", "Tequila On My Mind Organic Tee", "tequila-on-my-mind-organic-tee", "$29.00", "unisex-organic-ribbed-neck-creator-2.0-t-shirt-desert-dust-front-6a091a5ddd295_300x.png"],
  ["Tees and tops", "Tequila On My Mind Tee", "tequila-on-my-mind-tee", "$34.00", "unisex-tri-blend-t-shirt-oatmeal-triblend-front-68c3ada5245e0_300x.png"],
  ["Tees and tops", "Tequila Smuggler Tee", "tequila-smuggler-tee-1", "from $39.00", "oversized-faded-t-shirt-faded-khaki-front-680b21aec055b_300x.png"],
  ["Tees and tops", "Tequila Spirit Animal Tee", "tequila-is-my-spirit-animal-tee", "from $29.00", "unisex-classic-tee-white-front-68c3a5c38d353_300x.png"],
  ["Tees and tops", "Women’s Crop Top", "women-s-crop-top", "$31.00", "womens-crop-top-hazy-pink-front-6709a29a0e35c_300x.png"],
  ["Tees and tops", "Worth the Shot Tee", "worth-the-shot-ringer-tee", "from $36.00", "unisex-ringer-t-shirt-white-black-front-68c3a3cc5bc3d_300x.png"],
  ["Polos", "Corrido Sport Polo (Black or Navy)", "corrido-sport-polo", "from $49.00", "adidas-sport-polo-shirt-black-front-68c3b07fa1fa4_300x.png"],
  ["Polos", "Corrido Sport Polo (White)", "corrido-sport-polo-1", "from $49.00", "adidas-sport-polo-shirt-white-front-68c3b21363d43_300x.png"],
  ["Polos", "Corrido x adidas Space-Dyed Polo", "corrido-x-adidas-space-dyed-polo", "from $64.00", "adidas-space-dyed-polo-shirt-black-melange-front-695df0cbc3730_300x.png"],
  ["Hoodies", "Crop Hoodie", "crop-hoodie", "$58.00", "womens-cropped-hoodie-military-green-front-6709b08357946_300x.png"],
  ["Hoodies", "Tequila Delivery Hoodie", "tequila-delivery-hoodie", "from $61.00", "lane-seven-ls16001gd-i-urban-hoodie-garment-dyed-pigment-midnight-navy-front-6997f60b4561d_300x.png"],
  ["Hats", "Cuffed Beanie", "cuffed-beanie", "$28.00", "cuffed-beanie-dark-grey-front-6709b16b8be6a_300x.png"],
  ["Hats", "Drinking Corduroy Cap", "drinking-corduroy-cap", "$34.00", "vintage-corduroy-cap-brown-front-68dde58629ac6_300x.png"],
  ["Hats", "Pickleball Trucker Cap", "pickleball-trucker-cap", "$29.00", "5-panel-trucker-cap-white-front-68c3b6d79ed4e_300x.png"],
  ["Hats", "Save Water Cap", "save-water-cap", "$29.00", "vintage-cap-navy-front-68c8c480a4e2e_300x.png"],
  ["Hats", "Tequila Rebel Snapback", "tequila-rebel-snapback", "$34.00", "classic-snapback-natural-black-front-680925a92255f_300x.png"],
  ["Hats", "Trucker Cap", "tequila-corrido-trucker-cap", "$35.00", "snapback-trucker-cap-charcoal-black-front-68c3b57080e74_300x.png"],
  ["Gear and accessories", "Corrido Denim Tote Bag", "denim-tote-bag", "$39.00", "organic-denim-tote-bag-denim-blue-front-6709a1834ea16_300x.png"],
  ["Gear and accessories", "Corrido Pickleball Paddle Set", "corrido-pickleball-paddle-set", "$59.00", "pickleball-paddle-_set_-wood-7.5-x-15.5-front-6998102d074e0_300x.png"],
  ["Gear and accessories", "Not Water Travel Mug", "not-water-travel-mug", "from $29.50", "travel-mug-with-a-handle-white-25-oz-front-69b8f3c517f24_300x.png"],
];
const SHOP_CATS = ["Tees and tops", "Polos", "Hoodies", "Hats", "Gear and accessories"];
const SHOP_CHECKED = "24 Oct 2026";
// Each merch row opens its own page on the real shop, in a new tab (the shop handle in SHOP is the end of that page's address).
const SHOP_PAGE = "https://ilovetequilacorrido.com/products/";
const SOLD_OUT = new Set(["denim-tote-bag"]);   // out of stock on the shop when it was checked

// ---------- who is Tequila Corrido ----------
// A read-only page for Ken's other goal: teach people who Corrido is. Only facts from the brand's own site.
// The four bottles with their public shop prices: [name, price, tasting notes, shop handle, photo]. Used by the Who is Tequila Corrido? page (the 60-second review).
const LINEUP = [
    ["Blanco", "$44.99", "Citrus, fruity, floral agave and a slight crisp pepper.", "blanco", "Tequila_Corrido_Blanco_Additive-Free_1_400x.png"],
    ["Reposado", "$54.99", "Vanilla, caramel, fruit and spice.", "reposado", "Tequila_Corrido_Reposado_Additive-Free_Tequila_Bottle_1_400x.png"],
    ["Overproof", "$56.99", "Cooked agave, citrus, tropical hints and subtle spices.", "overproof", "Overproof_Bottle_Tequila_Corrido_Shadow_0507c1d7-9f43-42eb-9e1e-ec0e4de3bb56_400x.png"],
    ["Añejo", "$89.99", "Coffee, agave and dried fruit.", "anejo", "Tequila_Corrido_Anejo_Additive-free_Tequila_400x.png"],
];
function explorer() {
  stopAll(); Cam.stop(); Sound.stop();
  // This page is the 60-second review before a sale: quick reminders only (CallCard.review), then the shop's merch folded away. The only links out are the four bottles, each to its shop page.
  app.innerHTML = `<section class="view sheet explore callcard">
    <div class="dhead"><div class="dwho"><h1>Who is Tequila Corrido?</h1><p>Your 60-second review before a call. Quick reminders, public facts only.</p></div><button class="btn alt" id="xback" type="button">← Map</button></div>
    ${CallCard.review()}
    <details class="card xmerch"><summary><h3>Merch</h3><small>${SHOP.length} products</small></summary>
      <p class="note2">What the real shop sells, as checked on ${SHOP_CHECKED}. Prices and stock change.</p>
      <div class="xtabs" role="tablist">${["All", ...SHOP_CATS].map((c, i) => `<button type="button" role="tab" class="mtab" data-c="${c}" aria-selected="${i === 0}">${c === "Gear and accessories" ? "Gear" : c === "Tees and tops" ? "Tees" : c} <small>${i ? SHOP.filter(r => r[0] === c).length : SHOP.length}</small></button>`).join("")}</div>
      <div class="xlist">${SHOP.map(([c, n, h, pr, th]) => `<a class="xrow" data-c="${c}" href="${SHOP_PAGE}${h}" target="_blank" rel="noopener noreferrer"><img src="${IMG}${th}" alt="" loading="lazy"><span class="xn">${esc(n)}${SOLD_OUT.has(h) ? " <em class=\"out\">Sold out</em>" : ""}<span class="sr"> (opens in a new tab)</span></span><span class="xp">${pr}</span></a>`).join("")}</div></details>
    <p><button class="btn" id="xquiz" type="button">Test yourself with a lesson</button> <button class="btn alt" id="xmap" type="button">Back to the map</button></p></section>`;
  $("#xback").onclick = home; $("#xmap").onclick = home;
  app.querySelectorAll(".xtabs .mtab").forEach(t => t.onclick = () => {
    app.querySelectorAll(".xtabs .mtab").forEach(x => x.setAttribute("aria-selected", String(x === t)));
    app.querySelectorAll(".xrow").forEach(r => { r.hidden = t.dataset.c !== "All" && r.dataset.c !== t.dataset.c; });
  });
  $("#xquiz").onclick = () => lessonIntro(LESSONS[0]);
  CallCard.wire();
}
