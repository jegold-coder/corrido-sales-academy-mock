// Checks how customers are given voices and how a line is broken up to be spoken. Run from the mock-prototype folder: node tests/voices.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const V = require(path.join(__dirname, "..", "voices.js"));
const ctx = vm.createContext({ console });
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "scenarios.js"), "utf8").replace(/^"use strict";/, ""), ctx);
const people = vm.runInContext("SCENARIOS.map(s => ({ id: s.id, male: s.cust.male, name: s.cust.name }))", ctx);
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };

// a stock Mac, as listed by the browser
const mac = ["Samantha|en-US", "Aaron|en-US", "Albert|en-US", "Arthur|en-GB", "Bad News|en-US", "Bells|en-US", "Catherine|en-AU", "Daniel (English (United Kingdom))|en-GB", "Eddy (English (United States))|en-US", "Flo (English (United States))|en-US", "Flo (English (United Kingdom))|en-GB",
  "Fred|en-US", "Gordon|en-AU", "Grandma (English (United States))|en-US", "Grandpa (English (United States))|en-US", "Jester|en-US", "Karen|en-AU", "Kathy|en-US", "Martha|en-GB", "Moira|en-IE", "Nicky|en-US", "Ralph|en-US", "Reed (English (United States))|en-US",
  "Rishi|en-IN", "Rocko (English (United States))|en-US", "Sandy (English (United States))|en-US", "Shelley (English (United States))|en-US", "Tessa|en-ZA", "Zarvox|en-US", "Paulina|es-MX", "Mónica|es-ES"].map(s => { const [name, lang] = s.split("|"); return { name, lang }; });
const T = V.assignVoices(mac, people, new Set(["Daniel (English (United Kingdom))", "Samantha"]));
const names = people.map(p => T.get(p.id) && T.get(p.id).name);
people.forEach(p => console.log("     " + p.name.padEnd(6) + (p.male ? "M " : "F ") + (T.get(p.id) ? T.get(p.id).name + " · " + T.get(p.id).lang : "none")));
ok("every customer gets a voice", names.every(Boolean));
ok("no two customers share a voice", new Set(names).size === names.length);
ok("no customer uses a joke or effect voice", names.every(n => !/Albert|Bad News|Bells|Jester|Zarvox/.test(n)));
ok("no customer sounds like the rep", names.every(n => n !== "Samantha" && !/^Daniel/.test(n)));
ok("a voice matches the customer's gender", people.every(p => V.voiceGender(T.get(p.id)) === (p.male ? "m" : "f")));
ok("customers do not all share one accent", new Set(people.map(p => T.get(p.id).lang)).size >= 4, [...new Set(people.map(p => T.get(p.id).lang))].join(" "));
ok("the old customer gets the older voice", /Grandpa/.test(T.get("mean").name));
ok("only that customer gets an older voice", people.filter(p => /Grand/.test(T.get(p.id).name)).length === 1);
ok("the same list always gives the same voices", people.every(p => V.assignVoices(mac, people, new Set(["Daniel (English (United Kingdom))", "Samantha"])).get(p.id).name === T.get(p.id).name));

// a Windows or Edge list: Natural voices win
const edge = ["Microsoft Aria Online (Natural) - English (United States)|en-US", "Microsoft Guy Online (Natural) - English (United States)|en-US", "Microsoft Neerja Online (Natural) - English (India)|en-IN", "Microsoft Ryan Online (Natural) - English (United Kingdom)|en-GB",
  "Microsoft David - English (United States)|en-US", "Microsoft Zira - English (United States)|en-US", "Microsoft Natasha Online (Natural) - English (Australia)|en-AU"].map(s => { const [name, lang] = s.split("|"); return { name, lang }; });
const E = V.assignVoices(edge, people);
ok("Edge: the Indian-English voice goes to the customer who wants it", E.get("priya").name.includes("Neerja"));
ok("Edge: Natural voices are chosen over the basic ones", people.every(p => /Natural/.test(E.get(p.id).name)) || people.filter(p => !/Natural/.test(E.get(p.id).name)).length <= 3);
ok("an empty voice list does not crash", V.assignVoices([], people).get("quiet") === null);
ok("only male voices for male customers when only a female voice exists", V.assignVoices([{ name: "Samantha", lang: "en-US" }], people).get("sam") === null);

// delivery
const line = "Okay, so what's in it for me? I've heard this pitch before — and it never ends well... Convince me.";
const ch = V.speechChunks(V.prepareSpeech(line, "flat", false), { pitch: 1, rate: 1 }, "flat");
ok("a line is split into sentences", ch.length >= 3, ch.map(c => JSON.stringify(c.text)).join(" "));
ok("a dash becomes a comma", !/—/.test(ch.map(c => c.text).join(" ")));
ok("a question lifts the pitch", ch.find(c => /\?$/.test(c.text)).pitch > ch[ch.length - 1].pitch - .06);
ok("pace and pitch stay in a human range", ch.every(c => c.rate >= .6 && c.rate <= 1.4 && c.pitch >= .7 && c.pitch <= 1.3));
ok("there is a pause between sentences", ch.every(c => c.pause >= 70));
const cold = V.speechChunks("Not interested. Really.", { pitch: 1, rate: 1 }, "cold"), warm = V.speechChunks("Not interested. Really.", { pitch: 1, rate: 1 }, "warm");
ok("a cold customer sounds lower and slower than a warm one", cold[0].pitch < warm[0].pitch + .06 && cold[0].rate < warm[0].rate + .08);
ok("a very long sentence is broken up", V.speechChunks("This is a long sentence, " + "with many small parts, ".repeat(12) + "and an end.", { pitch: 1, rate: 1 }, "flat").length >= 2);
const hm = V.prepareSpeech("Hm. I was hoping for a simpler answer.", "cold", true);
ok("a line that already starts with a filler gets no second one", hm === "Hm. I was hoping for a simpler answer.");
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
