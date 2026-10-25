// Scores answers written in ordinary words (not copied from the examples) and tricky ones, to catch a grader that only likes the
// exact wording it was written against. Run from the mock-prototype folder: node tests/natural.test.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const root = path.join(__dirname, "..");
const ctx = vm.createContext({ console, state: { done: {}, proto: {} } });
["scenarios.js", "criteria.js", "tone.js", "coach.js"].forEach(f => vm.runInContext(fs.readFileSync(path.join(root, f), "utf8").replace(/^"use strict";/, "").replace(/if \(typeof module[^\n]*/, ""), ctx));
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };
ctx.score = (key, text) => vm.runInContext(`(() => { const sc = SCENARIOS.find(s => s.id === ${JSON.stringify(key.split(":")[0])}); return Coach.score(${JSON.stringify(key)}, ${JSON.stringify(text)}, sc.level, { tone: TONE_FOR[sc.id], voice: null }); })()`, ctx);
const S = (k, t) => ctx.score(k, t);

// answers a real rep might say, in their own words, should score well
const good = [
  ["quiet:0", "Hi Jamie, I'm Alex from Tequila Corrido. We make an additive-free tequila, and I was hoping to grab five minutes of your time if that's okay."],
  ["quiet:0", "Good afternoon! My name is Sam and I represent Tequila Corrido, a tequila brand. Do you have a couple of minutes to chat?"],
  ["quiet:1", "How have your weeknights been going? Who usually comes in, and what do they tend to order?"],
  ["quiet:2", "Ours is additive-free, just agave, water and yeast with nothing artificial, so it would make a clean margarita for your regulars. It's named after the corrido ballads, so there's a real story behind it."],
  ["quiet:3", "Why don't I drop off a bottle for you to taste this Thursday afternoon? We can start with just one bottle to see how your guests react."],
  ["priya:1", "It just means there are only three ingredients and nothing fake gets added, so shoppers can trust what's in the bottle. An easy line for them is: only agave, water and yeast."],
  ["priya:2", "I totally get that, cash is tight when you're new. Let's start with one bottle so you're not tied down, and I'll give you a shelf card so it practically sells itself."],
  ["dana:1", "That's fair. I don't have the wholesale numbers in front of me, so I'll send them over in writing today. What margin do you need to make this worthwhile?"],
  ["dana:2", "Fair concern. Let's run a small pilot in two of your accounts and let the sell-through numbers speak for themselves. I can't promise it'll outsell everything, only show you the data."],
  ["hardno:0", "Understood, I respect that. Quick question though: who are your best customers, and what do they usually grab? I'm just curious what moves for you."],
  ["hardno:3", "I'll keep it small. Thursday at two, I'll bring one bottle and a shelf card, no commitment, and if it's a waste of your time just tell me."],
];
const goodScores = good.map(([k, t]) => S(k, t).score);
ok(`${good.length} answers in ordinary words all score 4.5 or better`, goodScores.every(s => s >= 4.5), goodScores.map(s => s.toFixed(1)).join(" "));

// answers that should not score well
const bad = [
  ["quiet:0", "Our tequila is the best ever, trust me, everyone loves it, and you'd be crazy not to stock it."],
  ["quiet:0", "Yes, sure, okay, thanks so much, that sounds great."],
  ["quiet:0", "I really like soccer and pizza, what's your favorite movie?"],
  ["quiet:0", "asdf qwer zxcv uiop lkjh"],
  ["quiet:0", "Hi."],
  ["quiet:3", "You need to order right now. Sign the paperwork today and I will lock in the price."],
  ["quiet:2", "It's healthier for you and won't give you a hangover."],
  ["dana:1", "I don't know, figure it out yourself, that's not my problem."],
];
const badScores = bad.map(([k, t]) => S(k, t).score);
ok("hype, filler, off-topic, gibberish, too short, pushy, health claims and rudeness all score under 2", badScores.every(s => s < 2), badScores.map(s => s.toFixed(1)).join(" "));
ok("copying the customer's own line doesn't pass", S("quiet:0", "Hey, we're open, but it's pretty quiet. Can I get you something?").score < 2.5);

// health claims: a claim is flagged even if it contains won't or avoid; a refusal to claim is not flagged
const claim = (k, t) => { const r = S(k, t); return { flagged: r.flags.some(f => /health claim/i.test(f.msg)), compliance: r.compliance }; };
ok("a health claim that contains the word won't is still flagged", claim("comply:1", "It's healthier for you and won't give you a hangover.").flagged);
ok("a health claim that contains the word avoid is still flagged", claim("comply:1", "It helps you avoid a hangover because it's good for you.").flagged);
ok("a plain health claim is flagged and is a compliance miss", (c => c.flagged && c.compliance)(claim("comply:1", "It's healthier than other tequilas and it's good for you.")));
["I can't say that it's healthier, that isn't something we claim.", "We don't make health claims about it, but I can tell you what's in it.", "I'm not allowed to say it's good for you. What I can say is it has three ingredients.", "I won't say it's better for you, that wouldn't be honest."]
  .forEach(t => ok(`refusing to make the claim is not flagged: "${t.slice(0, 44)}…"`, !claim("comply:1", t).flagged));

// a question is not pushy, so it can't cost a boss battle
const pushy = (k, t) => { const r = S(k, t); return { pushy: r.tone.notes.some(n => !n.ok && /Pushy/.test(n.msg)), compliance: r.compliance }; };
ok("asking what margin someone needs is not pushy", !pushy("dana:1", "What margin do you need to make this work?").pushy);
ok("offering a sample 'right now' as a question is not pushy", !pushy("dana:1", "Can I drop a sample off right now?").pushy);
ok("an order is pushy, and a pushy answer is a compliance miss", (p => p.pushy && p.compliance)(pushy("dana:1", "You need to order right now.")));
ok("an order after a polite opening is still pushy", pushy("dana:1", "Thanks for your time. You have to sign today.").pushy);
ok("a natural question can't lose the Dana boss battle on compliance", !S("dana:1", "That's fair. I'll confirm the wholesale numbers in writing. What margin do you need to make this worthwhile?").compliance);

// a friendly opener counts as warm for a customer who needs warmth
const toneOf = t => S("quiet:0", t).tone.pts;
ok("a friendly 'Hi' opener is recognised as warm", toneOf("Hi Jamie, I'm Alex from Tequila Corrido. We sell tequila and I'd love five minutes of your time.") === 1);
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
