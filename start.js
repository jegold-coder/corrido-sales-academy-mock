"use strict";
// Facts, the list of all stops, and the start of the game. The last script on the page.

const FACTS = [
  "Tequila Corrido is celebrity-free. The site says it's not about flashy endorsements, so the tequila does the talking.",
  "Tequila Corrido's lineup runs Blanco $44.99, Reposado $54.99, Overproof $56.99 and Añejo $89.99, all additive-free.",
  "The brand's promise is only three ingredients and no fake flavors.",
  "The tequila bears the stamp of one of the first female master distillers.",
  "The name comes from the corrido, a traditional Mexican ballad.",
  "Tequila Corrido is for guests 21 and over only.",
];
const ALL_STOPS = () => PATH.map(id => LESSONS.find(l => l.id === id) || SCENARIOS.find(m => m.id === id) || EXTRA_STOPS[id]);
const TOTAL_STOPS = () => ALL_STOPS().length;

if (location.hash === "#manager") { $("#gate").classList.add("hidden"); managerMode(); } else home();
// keep the app and the shop photos on this device after the first visit, so a demo still works on bad Wi-Fi (see sw.js)
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register("sw.js").catch(() => {});
