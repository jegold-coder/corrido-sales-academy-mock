"use strict";
// The merch: the real product photos, and the numbers measured from them (sleeves, drawn sleeves, hems, shop links, hats).

// Corrido merch: the real product photos (transparent PNG mockups) from ilovetequilacorrido.com, linked live. Names and prices are from their merch page.
const IMG = "https://cdn.shopify.com/s/files/1/0665/6091/7672/files/";
// bbox = [left, top, right, bottom] of the product inside its image (0 to 1). W = width on the character.
const OUTFITS = {
  "Mas Tequila Tee (White)": { g: "u", price: "$24.90", base: "#f4f4f2", Wk: 1.06, hem: 208, img: IMG + "unisex-garment-dyed-heavyweight-t-shirt-white-front-6997fa20d8768_600x.png?v=1771567841", bbox: [.013, .055, .99, .925] },
  "In My Tequila Era Tee (Charcoal)": { g: "u", price: "$29.00", base: "#6a6a6a", Wk: 1.06, hem: 208, img: IMG + "unisex-classic-tee-charcoal-front-68c3a296d1ab2_600x.png?v=1757651618", bbox: [.023, .042, .978, .958],
    imgF: IMG + "womens-relaxed-t-shirt-white-front-68c3a4bb6ed9a_600x.png?v=1757653237", bboxF: [.082, .035, .917, .965], baseF: "#f4f4f2", nameF: "Tequila Era Women’s Tee", urlF: "in-my-tequila-era-women-s-tee" },
  "Tequila On My Mind Tee": { g: "u", price: "$29.00", base: "#d8cdb4", Wk: .97, hem: 208, img: IMG + "unisex-organic-ribbed-neck-creator-2.0-t-shirt-desert-dust-front-6a091a5ddd295_600x.png?v=1778981479", bbox: [.075, .037, .918, .96] },
  "Corrido x adidas Polo": { g: "u", price: "$64.00", base: "#363635", Wk: 1, hem: 208, polo: true, v: true, bbox: [0, 0, 1, 1],
    logo: { img: IMG + "adidas-space-dyed-polo-shirt-black-melange-front-695df0cbc3730_600x.png?v=1767764185", box: [.556, .238, .652, .292], dim: .72 } },
  "D.A.R.E. Oversized Tee": { g: "u", price: "$27.90", base: "#2c2c2a", Wk: 1.1, hem: 208, img: IMG + "unisex-oversized-garment-dyed-t-shirt-washed-black-front-6a389845e4b64_600x.png", bbox: [0.075, 0.033, 0.925, 0.967] },
  "Tequila Delivery 24/7 Oversized Tee (Washed Maroon)": { g: "u", price: "$29.50", base: "#734449", Wk: 1.1, hem: 208, img: IMG + "unisex-oversized-garment-dyed-t-shirt-washed-maroon-front-6a388f734527e_600x.png", bbox: [0.017, 0.068, 0.985, 0.925] },
  "Corrido Classic Tee (Maroon)": { g: "u", price: "$19.00", base: "#4d1127", Wk: 1.06, hem: 208, img: IMG + "unisex-classic-tee-maroon-front-680fb818a608d_600x.png", bbox: [0.023, 0.042, 0.98, 0.96] },
  "Más Tequila Tee": { g: "u", price: "$25.00", base: "#e5ddd2", Wk: 1.06, hem: 208, img: IMG + "unisex-staple-t-shirt-heather-dust-front-695deb716782d_600x.png", bbox: [0.048, 0.028, 0.952, 0.972] },
  "Mexico Es Chingón Tee": { g: "u", price: "$34.00", base: "#5c5a43", Wk: 0.97, hem: 208, img: IMG + "unisex-organic-ribbed-neck-t-shirt-khaki-front-68c8c0635513f_600x.png", bbox: [0.075, 0.037, 0.92, 0.962] },
  "Corrido Logo Tee (Heather Navy)": { g: "u", price: "$24.00", base: "#2e333f", Wk: 1.06, hem: 208, img: IMG + "unisex-staple-t-shirt-heather-navy-front-68c3a7b7c3e1e_600x.png", bbox: [0.15, 0.022, 0.858, 0.977] },
  "Worth the Shot Tee": { g: "u", price: "$36.00", base: "#f4f4f4", Wk: 1.06, hem: 208, img: IMG + "unisex-ringer-t-shirt-white-black-front-68c3a3cc5bc3d_600x.png", bbox: [0.068, 0.033, 0.932, 0.967] },
  "Tequila Smuggler Tee": { g: "u", price: "$39.00", base: "#c8b394", Wk: 1.1, hem: 208, img: IMG + "oversized-faded-t-shirt-faded-khaki-front-680b21aec055b_600x.png", bbox: [0.04, 0.04, 0.958, 0.962] },
  "Tequila Delivery Tee": { g: "u", price: "$24.50", base: "#497182", Wk: 1.06, hem: 208, img: IMG + "unisex-staple-t-shirt-heather-deep-teal-front-6a3895fe6f6f0_600x.png", bbox: [0.015, 0.058, 0.987, 0.96] },
  "Legacy Tee": { g: "u", price: "$34.00", base: "#91918c", Wk: 1.06, hem: 208, img: IMG + "unisex-tri-blend-t-shirt-athletic-grey-triblend-front-6709aa94ccff0_600x.png", bbox: [0.128, 0.032, 0.885, 0.973] },
  "Tequila On My Mind Tri-Blend Tee": { g: "u", price: "$34.00", base: "#d5cbb9", Wk: 1.06, hem: 208, img: IMG + "unisex-tri-blend-t-shirt-oatmeal-triblend-front-68c3ada5245e0_600x.png", bbox: [0.118, 0.052, 0.858, 0.957] },
  "Corrido Sport Polo (Black)": { g: "u", price: "$49.00", base: "#1a1a1a", Wk: 1, hem: 208, polo: true, v: true, heather: .06, bbox: [0, 0, 1, 1],
    logo: { img: IMG + "adidas-sport-polo-shirt-black-front-68c3b07fa1fa4_600x.png", box: [.553, .242, .678, .306] } },
  "Corrido Sport Polo (Navy)": { g: "u", price: "$49.00", base: "#10264a", Wk: 1, hem: 208, polo: true, v: true, heather: .06, bbox: [0, 0, 1, 1],
    logo: { img: IMG + "adidas-sport-polo-shirt-collegiate-navy-front-68c3b07fa308f_600x.png", box: [.553, .242, .678, .306] } },
  "Corrido Sport Polo (White)": { g: "u", price: "$49.00", base: "#e9e9e8", Wk: 1, hem: 208, polo: true, v: true, heather: .06, bbox: [0, 0, 1, 1],
    logo: { img: IMG + "adidas-sport-polo-shirt-white-front-68c3b21363d43_600x.png", box: [.553, .242, .678, .306], blend: "darken" } },
  "Corrido Classic Tee (Military Green)": { g: "u", price: "$19.00", base: "#737962", Wk: 1.06, hem: 208, img: IMG + "unisex-classic-tee-military-green-front-680fb818b9baf_600x.png", bbox: [0.023, 0.042, 0.98, 0.96] },
  "Corrido Classic Tee (Black)": { g: "u", price: "$19.00", base: "#212121", Wk: 1.06, hem: 208, img: IMG + "unisex-classic-tee-black-front-680fb818a821d_600x.png", bbox: [0.023, 0.042, 0.98, 0.96] },
  "Corrido Classic Tee (Navy)": { g: "u", price: "$19.00", base: "#272e3a", Wk: 1.06, hem: 208, img: IMG + "unisex-classic-tee-navy-front-680fb818a9840_600x.png", bbox: [0.023, 0.042, 0.98, 0.96] },
  "Corrido Classic Tee (Dark Chocolate)": { g: "u", price: "$19.00", base: "#4d423d", Wk: 1.06, hem: 208, img: IMG + "unisex-classic-tee-dark-chocolate-front-680fb818ab906_600x.png", bbox: [0.023, 0.042, 0.98, 0.96] },
  "Corrido Classic Tee (Dark Heather)": { g: "u", price: "$19.00", base: "#565656", Wk: 1.06, hem: 208, img: IMG + "unisex-classic-tee-dark-heather-front-680fb818afcfd_600x.png", bbox: [0.023, 0.042, 0.98, 0.96] },
  "Corrido Classic Tee (Charcoal)": { g: "u", price: "$19.00", base: "#6b6b68", Wk: 1.06, hem: 208, img: IMG + "unisex-classic-tee-charcoal-front-680fb818b4c6b_600x.png", bbox: [0.023, 0.042, 0.98, 0.96] },
  "Corrido Classic Tee (Graphite Heather)": { g: "u", price: "$19.00", base: "#6d6d6d", Wk: 1.06, hem: 208, img: IMG + "unisex-classic-tee-graphite-heather-front-680fb818bfa8f_600x.png", bbox: [0.023, 0.042, 0.98, 0.96] },
  "Corrido Classic Tee (Brown Savana)": { g: "u", price: "$19.00", base: "#998671", Wk: 1.06, hem: 208, img: IMG + "unisex-classic-tee-brown-savana-front-680fb818c6a95_600x.png", bbox: [0.023, 0.042, 0.98, 0.96] },
  "Tequila Delivery 24/7 Oversized Tee (Washed Charcoal)": { g: "u", price: "$29.50", base: "#555047", Wk: 1.1, hem: 208, img: IMG + "unisex-oversized-garment-dyed-t-shirt-washed-charcoal-front-6a388f734581f_600x.png", bbox: [0.017, 0.068, 0.983, 0.925] },
  "Tequila Delivery 24/7 Oversized Tee (Light Washed Denim)": { g: "u", price: "$29.50", base: "#c2c9cd", Wk: 1.1, hem: 208, img: IMG + "unisex-oversized-garment-dyed-t-shirt-light-washed-denim-front-6a388f73433bb_600x.png", bbox: [0.017, 0.068, 0.983, 0.925] },
  "Tequila Delivery 24/7 Oversized Tee (Vintage White)": { g: "u", price: "$29.50", base: "#f4ede0", Wk: 1.1, hem: 208, img: IMG + "unisex-oversized-garment-dyed-t-shirt-vintage-white-front-6a388f7346c57_600x.png", bbox: [0.017, 0.068, 0.983, 0.925] },
  "Mas Tequila Tee (Ivory)": { g: "u", price: "$24.90", base: "#f2e8d0", Wk: 1.06, hem: 208, img: IMG + "unisex-garment-dyed-heavyweight-t-shirt-ivory-front-6997fa20d6c2f_600x.png", bbox: [0.017, 0.057, 0.982, 0.94] },
  "Mas Tequila Tee (Khaki)": { g: "u", price: "$24.90", base: "#aea78b", Wk: 1.06, hem: 208, img: IMG + "unisex-garment-dyed-heavyweight-t-shirt-khaki-front-6a371a9822297_600x.png", bbox: [0.017, 0.057, 0.982, 0.94] },
  "Mas Tequila Tee (Bay)": { g: "u", price: "$24.90", base: "#b3b8a7", Wk: 1.06, hem: 208, img: IMG + "unisex-garment-dyed-heavyweight-t-shirt-bay-front-6a371a9823a39_600x.png", bbox: [0.017, 0.057, 0.982, 0.94] },
  "In My Tequila Era Tee (Military Green)": { g: "m", after: "In My Tequila Era Tee (Charcoal)", price: "$29.00", base: "#6c715c", Wk: 1.06, hem: 208, img: IMG + "unisex-classic-tee-military-green-front-68c3a296d2cd2_600x.png", bbox: [0.038, 0.04, 0.962, 0.958] },
  "Corrido Logo Tee (Dark Grey Heather)": { g: "u", price: "$24.00", base: "#343434", Wk: 1.06, hem: 208, img: IMG + "unisex-staple-t-shirt-dark-grey-heather-front-68c3a7b7c3abb_600x.png", bbox: [0.15, 0.022, 0.858, 0.977] },
  "Pickleball Raglan": { g: "u", price: "$40.00", base: "#455262", Wk: 1.06, hem: 208, img: IMG + "unisex-34-sleeve-raglan-shirt-heather-denim-navy-front-6709a7bbee3d3_600x.png", bbox: [0.015, 0.045, 0.982, 0.96], },
  "Spirit Animal Tee": { g: "u", price: "$29.00", base: "#f4f4f2", Wk: 1.06, hem: 208, img: IMG + "unisex-classic-tee-white-front-68c3a5c38d353_600x.png?v=1757653148", bbox: [.023, .042, .978, .958] },
};
// Where each product photo's sleeves end, as [left, right] = [sleeve centre x, sleeve bottom y, torso edge x] in fractions of the image.
// Measured from the photos' transparent edges, so the arms line up with the sleeve openings.
const SLEEVE = {
  
  "Tequila On My Mind Tee": [[.227, .442, 0.24], [.768, .438, 0.757]], "D.A.R.E. Oversized Tee": [[.221, .415, 0.233], [.778, .415, 0.765]], 
  "Mexico Es Chingón Tee": [[.227, .442, 0.24], [.768, .438, 0.757]],
  "Corrido Logo Tee (Heather Navy)": [[.263, .46, 0.275], [.748, .47, 0.728]], 
  "Legacy Tee": [[.22, .4, 0.232], [.777, .407, 0.767]],
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  "Corrido Logo Tee (Dark Grey Heather)": [[0.263, 0.46, 0.275], [0.748, 0.47, 0.728]],
  "Tequila On My Mind Tri-Blend Tee": [[.251, .468, 0.263], [.742, .463, 0.727]], 
};
// Shirts whose product photo has sleeves splayed out sideways (it was shot flat) are drawn on the rep another way: the body, with its shoulder seams, comes from the photo
// and the sleeves are drawn hanging straight down over the arms, in the shirt's colour, so the arms come out of them properly. Keyed like SLEEVE (a trailing "F" is a women's cut).
// The numbers are fractions of the photo, measured from its transparent edges: torso = the body's left and right edges at the armpit, edge = at hand height, hem = at the hem,
// armpit and cuff = where the sleeve ends, shoulder = where the shoulder line meets the torso edge. sleeve = its colour, shade = how dark its edges are (less on light cloth), heather = a speckle on heathered cloth,
// trim = a contrasting band at the cuff, loose = a wide, deep sleeve.
const FIT = {
  masWhite: { torso: [.223, .773], edge: [.222, .773], hem: [.225, .777], hemY: .89, armpit: .462, cuff: .46, shoulder: .112 },
  mas: { torso: [.213, .783], edge: [.208, .785], hem: [.205, .792], hemY: .91, armpit: .472, cuff: .47, shoulder: .15 },
  masAccent: { torso: [.213, .788], edge: [.212, .795], hem: [.203, .798], hemY: .93, armpit: .418, cuff: .408, shoulder: .123 },
  eraM: { torso: [.187, .807], edge: [.185, .808], hem: [.185, .808], hemY: .93, armpit: .435, cuff: .433, shoulder: .158 },
  eraG: { torso: [.205, .788], edge: [.21, .79], hem: [.208, .788], hemY: .93, armpit: .435, cuff: .433, shoulder: .143 },
  delivery: { torso: [.175, .798], edge: [.17, .807], hem: [.162, .818], hemY: .93, armpit: .457, cuff: .452, shoulder: .188 },
  oversized: { torso: [.217, .782], edge: [.217, .782], hem: [.217, .782], hemY: .89, armpit: .447, cuff: .445, shoulder: .148 },
  worth: { torso: [.248, .75], edge: [.245, .753], hem: [.242, .757], hemY: .93, armpit: .473, cuff: .47, shoulder: .093 },
  smuggler: { torso: [.26, .738], edge: [.26, .738], hem: [.26, .738], hemY: .93, armpit: .505, cuff: .502, shoulder: .093 },
  classic: { torso: [.187, .807], edge: [.185, .808], hem: [.185, .808], hemY: .93, armpit: .435, cuff: .433, shoulder: .158 },
};
const DRAWN = {
  "Mas Tequila Tee (White)": { ...FIT.masWhite, sleeve: "#f4f4f2", shade: .12 },
  "Mas Tequila Tee (Ivory)": { ...FIT.mas, sleeve: "#f2e8d0", shade: .12 },
  "Mas Tequila Tee (Khaki)": { ...FIT.mas, sleeve: "#aea78b", shade: .2 },
  "Mas Tequila Tee (Bay)": { ...FIT.mas, sleeve: "#b3b8a7", shade: .12 },
  "Más Tequila Tee": { ...FIT.masAccent, sleeve: "#e5ddd2", shade: .12 },
  "In My Tequila Era Tee (Charcoal)": { ...FIT.eraM, sleeve: "#6a6a6a", shade: .3 },
  "In My Tequila Era Tee (Military Green)": { ...FIT.eraG, sleeve: "#6c715c", shade: .3 },
  "Tequila Delivery Tee": { ...FIT.delivery, sleeve: "#497182", shade: .3, heather: .1 },
  "Tequila Delivery 24/7 Oversized Tee (Washed Maroon)": { ...FIT.oversized, sleeve: "#734449", shade: .3 },
  "Tequila Delivery 24/7 Oversized Tee (Washed Charcoal)": { ...FIT.oversized, sleeve: "#555047", shade: .3 },
  "Tequila Delivery 24/7 Oversized Tee (Light Washed Denim)": { ...FIT.oversized, sleeve: "#c2c9cd", shade: .12 },
  "Tequila Delivery 24/7 Oversized Tee (Vintage White)": { ...FIT.oversized, sleeve: "#f4ede0", shade: .12 },
  "Worth the Shot Tee": { ...FIT.worth, sleeve: "#f4f4f4", shade: .12, trim: "#151515" },
  "Tequila Smuggler Tee": { ...FIT.smuggler, sleeve: "#c8b394", shade: .12, loose: true },
  "Corrido Classic Tee (Maroon)": { ...FIT.classic, sleeve: "#4d1127", shade: .3 },
  "Corrido Classic Tee (Black)": { ...FIT.classic, sleeve: "#212121", shade: .3 },
  "Corrido Classic Tee (Navy)": { ...FIT.classic, sleeve: "#272e3a", shade: .3 },
  "Corrido Classic Tee (Charcoal)": { ...FIT.classic, sleeve: "#6b6b68", shade: .3, heather: .1 },
  "Corrido Classic Tee (Dark Heather)": { ...FIT.classic, sleeve: "#565656", shade: .3, heather: .1 },
  "Corrido Classic Tee (Military Green)": { ...FIT.classic, sleeve: "#737962", shade: .2 },
  "Corrido Classic Tee (Dark Chocolate)": { ...FIT.classic, sleeve: "#4d423d", shade: .3 },
  "Corrido Classic Tee (Graphite Heather)": { ...FIT.classic, sleeve: "#6d6d6d", shade: .3, heather: .1 },
  "Corrido Classic Tee (Brown Savana)": { ...FIT.classic, sleeve: "#998671", shade: .2 },
  "Spirit Animal Tee": { ...FIT.eraG, sleeve: "#f4f4f2", shade: .12 },
  "In My Tequila Era Tee (Charcoal)F": { sleeve: "#eeeeec", shade: .12, torso: [.285, .713], edge: [.255, .745], hem: [.24, .76], armpit: .47, cuff: .448 },
  "Pickleball Raglan": { sleeve: "#262c39", torso: [.245, .757], armpit: .39, cuff: .588, box: true },   // 3/4 sleeves; the seams run from the collar to the armpit
};
// A few shirt photos have a rounded or scooped hem (the Pickleball Raglan's is a deep scoop), which would let the trousers show under its corners in the preview. For those,
// a strip of the shirt's colour fills in behind the photo, as wide as the hem and reaching below the picture. [left, right, the row where the hem is at full width], as fractions of the photo.
const HEM_FILL = {
  "Pickleball Raglan": [.24, .757, .868], "Tequila On My Mind Tri-Blend Tee": [.245, .743, .945], "Corrido Logo Tee (Heather Navy)": [.277, .737, .968], "Corrido Logo Tee (Dark Grey Heather)": [.277, .737, .968],
  "Legacy Tee": [.227, .773, .963], "Más Tequila Tee": [.202, .8, .965], "Tequila Delivery Tee": [.167, .82, .952], "Tequila Smuggler Tee": [.262, .738, .955],
  "Mas Tequila Tee (Ivory)": [.205, .792, .933], "Mas Tequila Tee (Khaki)": [.205, .792, .933], "Mas Tequila Tee (Bay)": [.205, .792, .933],
};
// Product page on ilovetequilacorrido.com for each piece of merch, so a double-click in the creator opens the real item.
const MERCH_URL = {
  "Corrido Classic Tee (Military Green)": "corrido-classic-tee",
  "Corrido Classic Tee (Black)": "corrido-classic-tee",
  "Corrido Classic Tee (Navy)": "corrido-classic-tee",
  "Corrido Classic Tee (Dark Chocolate)": "corrido-classic-tee",
  "Corrido Classic Tee (Dark Heather)": "corrido-classic-tee",
  "Corrido Classic Tee (Charcoal)": "corrido-classic-tee",
  "Corrido Classic Tee (Graphite Heather)": "corrido-classic-tee",
  "Corrido Classic Tee (Brown Savana)": "corrido-classic-tee",
  "Tequila Delivery 24/7 Oversized Tee (Washed Charcoal)": "unisex-oversized-t-shirt",
  "Tequila Delivery 24/7 Oversized Tee (Light Washed Denim)": "unisex-oversized-t-shirt",
  "Tequila Delivery 24/7 Oversized Tee (Vintage White)": "unisex-oversized-t-shirt",
  "Mas Tequila Tee (Ivory)": "mas-tequila-thick-tee",
  "Mas Tequila Tee (Khaki)": "mas-tequila-thick-tee",
  "Mas Tequila Tee (Bay)": "mas-tequila-thick-tee",
  "In My Tequila Era Tee (Military Green)": "in-my-tequila-era-tee",
  "Corrido Logo Tee (Dark Grey Heather)": "tequila-corrido-logo-tee",
  "Pickleball Raglan": "pickleball-raglan",
  "Mas Tequila Tee (White)": "mas-tequila-thick-tee", "In My Tequila Era Tee (Charcoal)": "in-my-tequila-era-tee", "Tequila On My Mind Tee": "tequila-on-my-mind-organic-tee",
  "Spirit Animal Tee": "tequila-is-my-spirit-animal-tee", "D.A.R.E. Oversized Tee": "d-a-r-e-oversized-tee", "Tequila Delivery 24/7 Oversized Tee (Washed Maroon)": "unisex-oversized-t-shirt",
  "Corrido Classic Tee (Maroon)": "corrido-classic-tee", "Más Tequila Tee": "mas-tequila-tee", "Mexico Es Chingón Tee": "mexico-es-chingon-tee", "Corrido Logo Tee (Heather Navy)": "tequila-corrido-logo-tee",
  "Worth the Shot Tee": "worth-the-shot-ringer-tee", "Tequila Smuggler Tee": "tequila-smuggler-tee-1", "Tequila Delivery Tee": "tequila-delivery-tee", "Legacy Tee": "legacy-tee",
  "Tequila On My Mind Tri-Blend Tee": "tequila-on-my-mind-tee", "Corrido x adidas Polo": "corrido-x-adidas-space-dyed-polo", "Corrido Sport Polo (Black)": "corrido-sport-polo",
  "Corrido Sport Polo (Navy)": "corrido-sport-polo", "Corrido Sport Polo (White)": "corrido-sport-polo-1",
  "Rebel Snapback": "tequila-rebel-snapback", "Trucker Cap": "tequila-corrido-trucker-cap", "Save Water Cap": "save-water-cap", "Drinking Corduroy Cap": "drinking-corduroy-cap",
  "Pickleball Trucker Cap": "pickleball-trucker-cap", "Cuffed Beanie": "cuffed-beanie",
};
const HATS = {
  "Rebel Snapback": { price: "$34.00", W: 63, vs: .7, img: IMG + "classic-snapback-natural-black-front-680925a92255f_600x.png?v=1745429936", bbox: [.085, .083, .908, .943] },
  "Trucker Cap": { price: "$35.00", W: 63, vs: .75, img: IMG + "snapback-trucker-cap-charcoal-black-front-68c3b57080e74_600x.png?v=1757656443", bbox: [.112, .13, .885, .835] },
  "Drinking Corduroy Cap": { price: "$34.00", W: 63, vs: .8, img: IMG + "vintage-corduroy-cap-brown-front-68dde58629ac6_600x.png", bbox: [.135, .118, .865, .87] },
  "Pickleball Trucker Cap": { price: "$29.00", W: 63, vs: .75, img: IMG + "5-panel-trucker-cap-white-front-68c3b6d79ed4e_600x.png", bbox: [.043, .06, .957, .938] },
  "Cuffed Beanie": { price: "$28.00", W: 62, vs: .62, img: IMG + "cuffed-beanie-dark-grey-front-6709b16b8be6a_600x.png", bbox: [.157, .038, .84, .927] },
  "Save Water Cap": { price: "$29.00", W: 63, vs: .8, img: IMG + "vintage-cap-navy-front-68c8c480a4e2e_600x.png?v=1757987976", bbox: [.087, .08, .92, .918] },
};
