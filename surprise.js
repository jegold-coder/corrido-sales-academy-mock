"use strict";
// Surprise customer: a practice round of curveballs, because real buyers interrupt, change the subject, go quiet, push back and brush you off, and most missions
// are one clear question at a time. A round is five questions, one of each kind, picked at random from ten, each from a customer the rep has not met. Like
// "practice a weak skill" it is not a map stop, so it never unlocks anything, but it earns XP and feeds the skill scores and the Review list.
// Each step is written like the missions' steps (see scenarios.js): R is the right answer, RH the same worded more plainly, E one obviously wrong answer, H three
// believable wrong ones. The scoring rules (crit) are registered in CRITERIA under "surprise:<id>" and the customers' tones under TONE_FOR, so the real coach scores
// them. tests/surprise.test.js checks that every right answer scores high and every wrong one scores low. Uses globals from the other scripts at call time.

const SURPRISE_CUSTOMERS = {
  tomas: { id: "sx-tomas", title: "Surprise customer", sub: "Bar manager", icon: "⚡", theme: "bar", level: 4,
    cust: { name: "Tomás", role: "Bar manager", male: true, meter: "Patience", look: { skin: "#c68b5e", hair: "#2a1810", hairStyle: "Short", shirt: "#2f3b52", top: "jacket", beard: "Stubble" } } },
  nadia: { id: "sx-nadia", title: "Surprise customer", sub: "Restaurant manager", icon: "⚡", theme: "restaurant", level: 4,
    cust: { name: "Nadia", role: "Restaurant manager", male: false, meter: "Openness", look: { skin: "#b57a50", hair: "#1a1410", hairStyle: "Ponytail", shirt: "#7a2a3a", top: "blazer", lip: "#8e3a34" } } },
  walt: { id: "sx-walt", title: "Surprise customer", sub: "Liquor store owner", icon: "⚡", theme: "shop", level: 4,
    cust: { name: "Walt", role: "Liquor store owner", male: true, meter: "Trust in you", look: { skin: "#e5b08c", hair: "#9a9a9a", hairStyle: "Short", shirt: "#4a2c12", top: "cardigan", beard: "Beard" } } },
  lena: { id: "sx-lena", title: "Surprise customer", sub: "Hotel bar director", icon: "⚡", theme: "lounge", level: 4,
    cust: { name: "Lena", role: "Hotel bar director", male: false, meter: "Interest in premium", look: { skin: "#f3d2b8", hair: "#6b4423", hairStyle: "Wavy", shirt: "#243a5e", top: "blazer", lip: "#b05a55" } } },
  hector: { id: "sx-hector", title: "Surprise customer", sub: "Taquería owner", icon: "⚡", theme: "restaurant", level: 4,
    cust: { name: "Hector", role: "Taquería owner", male: true, meter: "Connection", look: { skin: "#a8683f", hair: "#2a1810", hairStyle: "Curtains", shirt: "#2e6a6f", top: "jacket", beard: "Mustache" } } },
  joan: { id: "sx-joan", title: "Surprise customer", sub: "Events venue manager", icon: "⚡", theme: "venue", level: 4,
    cust: { name: "Joan", role: "Events venue manager", male: false, meter: "Curiosity", look: { skin: "#d19a6c", hair: "#3b2418", hairStyle: "Bun", shirt: "#2f5f45", top: "cardigan", lip: "#a23b3b" } } },
};

// kind: interrupt (they cut in, and give you less time), quiet (they say nothing), topic (they change the subject), push (they push back hard), stall (a polite brush-off).
const SURPRISE = (V => [
  { id: "tomas-rush", kind: "interrupt", view: V.tomas, skill: "Respect", secs: 30, twist: "He cuts in and gives you 30 seconds.",
    hint: `Thirty seconds is not a pitch. Show you respect his time, give one reason to care, and set up a better time.`,
    line: `Tomás is mid-sentence when his phone buzzes. He glances at it and sighs. "Sorry. Sorry. A delivery driver is waiting on me. You've got thirty seconds. Go."`,
    q: `You have thirty seconds. What do you say?`,
    R: [`"Thanks, I'll be quick. Corrido is additive-free with only three ingredients, and I'd love you to taste it. Can I come back Thursday when it's calmer?"`, `Short, one reason to care, and a better time.`],
    RH: `"Quick one: Corrido is additive-free, only three ingredients. Can I come back Thursday and let you taste it?"`,
    E: [[`"I'm going to need more than thirty seconds, so let me sit down and go through all four bottles."`, `Thirty seconds means thirty seconds. A full pitch ignores what he just told you.`]],
    H: [[`"Understood. I can do it in a minute: stay with me and I'll walk you through the four bottles and the price sheet."`, `A minute is not thirty seconds, and a full walk-through is not short.`],
        [`"No problem. I'll leave a bottle behind and come back for your thoughts when you have a moment."`, `Leaving alcohol behind without the manager is against the rules, and it still gives no reason to care.`],
        [`"I'm so sorry to bother you at a bad time. I know you're busy and I hate to take up your day."`, `Grovelling hands him all the power and says nothing about Corrido.`]],
    reply: { best: `Thursday. Fine. Come after three. Thanks for being quick.`, mid: `Okay. Maybe. Come back and we'll see.`, bad: `I really don't have time for this. Not today.` },
    crit: { need: [[/(quick|brief|short|thirty|30 seconds|one sentence|one line|a minute|60 seconds|won'?t keep you|not long|right to the point)/i, "say you will keep it short"],
                   [/(additive|three ingredients|no fake|taste|sample)/i, "give one clear reason to care"],
                   [/(come back|another time|later|thursday|friday|monday|tuesday|wednesday|tomorrow|next week|calmer|quieter|better time|when works)/i, "offer a better time"]],
            bad: [[/(walk you through|all four|four bottles|every expression|price sheet|catalog|five minutes|sit down|go through)/i, "Thirty seconds is not the time for the full pitch."],
                  [/(leave (a|you a|one|the) bottle|bottle behind)/i, "Never leave alcohol behind unless the manager is there."],
                  [/(best tequila|every bar should)/i, "Hype is not a reason. Give one true fact."]] } },

  { id: "joan-short", kind: "interrupt", view: V.joan, skill: "Message", secs: 40, twist: "She stops you and asks for the short version.",
    hint: `She asked for the short version, so don't start over. Give one clear message, why it fits her events, and an easy next step.`,
    line: `Joan is halfway through listening when her phone rings. "Sorry, it's the caterer, I have to take this." She turns away, then back. "Okay. Forget where you were. Give me the short version."`,
    q: `Give her the short version.`,
    R: [`"Sure: Corrido is additive-free with only three ingredients, which suits a signature cocktail at your events. May I bring a tasting for you and your team this week?"`, `One message, why it fits her events, and a small next step.`],
    RH: `"Short version: three ingredients, no fake flavors, and great in an event cocktail. Can I bring a tasting by this week?"`,
    E: [[`"Let me start from the beginning so nothing gets missed."`, `She asked for the short version. Starting over ignores her.`]],
    H: [[`"Sure. It's additive-free. That's really all there is to say about it, honestly."`, `A message with no tie to her events and no next step.`],
        [`"As I was saying, we make four different bottles, and each one has its own tasting notes and price."`, `Picking up where you left off is not the short version.`],
        [`"Short version: great tequila, everyone loves it, and your guests will too. Buy a case today."`, `Hype and a pressure close, with no true fact in it.`]],
    reply: { best: `That's the version I needed. Bring a tasting Wednesday. Thank you.`, mid: `Hm, okay. Send me something short and I'll see.`, bad: `That's not what I asked for. I have to go.` },
    crit: { need: [[/(additive|three ingredients|no fake|female master distiller|first female)/i, "give one clear message"],
                   [/(event|guests?|wedding|party|parties|signature (drink|cocktail)|cocktail|menu|bar package|toast)/i, "tie it to her events"],
                   [/(taste|tasting|sample|come by|bring|stop by|follow up|send)/i, "offer an easy next step"]],
            bad: [[/(start from the beginning|from the top|as i was saying|where i left off|where we were)/i, "She asked for the short version. Don't start over."],
                  [/(everyone loves|everybody loves|buy a case|case today|today only|right now)/i, "Hype and pressure are not a short version. Give one true fact."]] } },

  { id: "nadia-silence", kind: "quiet", view: V.nadia, skill: "Discovery", silent: true, twist: "She goes quiet. Don't rush to fill the silence.",
    hint: `Silence is not a no. Give her room, then ask one open question about her guests or what she thinks. Don't add more pitch.`,
    line: `Nadia reads your one-page card slowly. She turns it over, sets it down and looks at you. The silence stretches. She says nothing.`,
    q: `What do you do?`,
    R: [`"No rush, take your time. What stands out to you on the card, or what would your guests want to know?"`, `Give her room, then ask an open question about her.`],
    RH: `"No pressure. What are your thoughts so far, or what would your guests ask?"`,
    E: [[`"Silence means yes, so I'll take twenty percent off and write up the order."`, `Reading silence as a yes and cutting the price pushes her, and gives away margin for nothing.`]],
    H: [[`"So basically, as I was saying, it's additive-free with three ingredients. Anything you'd like to ask about that?"`, `Filling the silence with more pitch gives her nothing new to think about.`],
        [`"Is the price okay? I can work on the price if it is too high for you."`, `Jumping to price and offering to drop it fills the silence with a discount.`],
        [`"Hello? Is everything okay? Did you read it all? Should I explain the whole card again?"`, `Rapid questions and an offer to repeat the whole card crowd her.`]],
    reply: { best: `You know, my guests keep asking for something cleaner. Tell me about the ingredients.`, mid: `Hm. I'm still thinking. What else?`, bad: `I'm done reading. I need a minute alone, please.` },
    crit: { need: [[/(what (do|are|would|stands|did|about)|how (do|does|would)|tell me|curious|wondering|thoughts)/i, "ask an open question"],
                   [/(guests?|menu|customers?|diners?|cocktails?|thoughts|think)/i, "ask about her guests, her menu or what she thinks"],
                   [/(no rush|take your time|no pressure|whenever|think it over|happy to wait|give you a (moment|minute))/i, "give her room, with no pressure"]],
            bad: [[/(additive|three ingredients|as i was saying|basically)/i, "Don't fill the silence with more pitch."],
                  [/(price|discount|percent off|% off|work on the)/i, "Don't jump to price or a discount to fill a silence."],
                  [/(explain (the|it)|whole card|read it all)/i, "Don't repeat yourself. Give her room."]] } },

  { id: "lena-price", kind: "quiet", view: V.lena, skill: "Price handling", silent: true, twist: "She says nothing after hearing the price.",
    hint: `Don't rush to drop the price. Ask what she is thinking, make it concrete per pour, and offer to confirm terms in writing.`,
    line: `You tell Lena the Añejo is $89.99 a bottle. She leans back, folds her arms and says nothing for what feels like a very long time.`,
    q: `What do you do?`,
    R: [`"What's on your mind? I can also break it down per pour for your menu, and confirm wholesale terms in writing."`, `Ask, make it concrete, and offer to confirm in writing.`],
    RH: `"What do you think so far? I can show the cost per pour and put the terms in writing."`,
    E: [[`"Okay, okay, I can knock twenty percent off if that helps."`, `Dropping the price to break a silence teaches her that quiet gets a discount.`]],
    H: [[`"It's a premium bottle, and honestly it's worth every dollar to the right guest."`, `A defence of the price, with nothing asked and nothing offered.`],
        [`"I can see it's a lot. Would a smaller order help, with a special price?"`, `A special price offered to fill a silence.`],
        [`"Take your time. The price is the price, and our shop prices are public on the site."`, `True, but it shuts the door and gives her no next step.`]],
    reply: { best: `Hm. Per pour. Okay, that changes how I see it. Put the terms in writing.`, mid: `I'm still thinking. Send me the numbers.`, bad: `That's too much. I'm not interested.` },
    crit: { need: [[/(what'?s on your mind|what'?s your (reaction|take|read)|what are you (thinking|weighing)|how (does|did) that (sound|land|sit|feel)|what do you think)/i, "ask what she is thinking"],
                   [/(per pour|a pour|each pour|by the glass|per drink|cost per|per serving)/i, "make the price concrete per pour"],
                   [/(confirm|in writing|terms|wholesale)/i, "offer to confirm terms in writing"]],
            bad: [[/(knock|discount|cheaper|lower the price|special price|percent off|% off|deal for you)/i, "Don't drop the price to fill a silence."]] } },

  { id: "walt-nephew", kind: "topic", view: V.walt, skill: "Underage service", twist: "He changes the subject, and it is a trap.",
    hint: `Be warm, but never serve anyone under 21, not even a sip. Offer another way, then steer back to his shop.`,
    line: `Walt nods along, then glances at the TV above the register. "Did you catch the game? Unbelievable. Anyway, my nephew is helping me today. He's twenty, turns twenty-one Saturday. Pour him a little taste so he can tell me what he thinks?"`,
    q: `How do you answer?`,
    R: [`"Happy early birthday to him! The rule is 21 and over, so he's welcome to taste after Saturday. For your shop, which bottle do you think suits your customers?"`, `Warm, clear about 21, offers a way, and back to his shop.`],
    RH: `"Congrats to him! It's 21 and over, so after Saturday he's welcome to taste. Now, which bottle fits your shelf?"`,
    E: [[`"Sure, a little taste won't hurt anyone. Nobody has to know."`, `Never serve anyone under 21. Not even a sip, and not even with the owner's blessing.`]],
    H: [[`"Sorry, I really can't, my manager would be upset with me. Anyway, did you watch the game last night?"`, `It blames the manager instead of stating the rule, and drifts into small talk.`],
        [`"He should be fine with just a sip. It's only one small taste to get the shop's opinion."`, `A sip is still serving someone under 21.`],
        [`"No. He's under 21, and that's the law, so there is nothing more to discuss."`, `The right rule, said coldly, with no way forward for the conversation.`]],
    reply: { best: `Ha, fair enough. Saturday it is. Now, what would you put on my shelf first?`, mid: `Okay, okay. I just thought it'd be fun. Tell me about the bottles.`, bad: `Wow, you're no fun. I'll find a rep who is.` },
    crit: { need: [[/(21|twenty.?one|legal (drinking )?age|of age|over 21)/i, "say the rule: 21 and over"],
                   [/(birthday|saturday|when he'?s|once he'?s|after (he|saturday)|congrat|happy to|glad to)/i, "stay friendly and offer another way"],
                   [/(your (team|shelf|shop|store|staff|customers)|the shelf|an order|a small order|what you (stock|carry|sell)|back to (the|your))/i, "bring it back to his shop"]],
            bad: [[/(go ahead|sure,? (let him|pour him|he can|a little taste)|just a (taste|sip)|won'?t hurt|nobody has to know|nobody will know|only one small taste|one sip|fine with just)/i, "Never serve anyone under 21, not even a sip."]] } },

  { id: "tomas-mats", kind: "topic", view: V.tomas, skill: "Rapport", twist: "He asks about something you know nothing about.",
    hint: `If you don't know, say so. Then get curious about his guests and bring it back to how Corrido pours.`,
    line: `Tomás cuts in and nods at the shelf. "Random question. My supplier keeps pushing these new bar mats. Do you know anything about them? And what do you think of the margarita trend this year?"`,
    q: `How do you answer?`,
    R: [`"I don't know bar mats, so I won't guess. Margaritas, though: what are your guests ordering most? I'd love you to taste how Corrido pours in one."`, `Honest about what you don't know, curious about his guests, and back to your product.`],
    RH: `"Not sure about mats, honestly. What are your guests ordering in margaritas? I'd like to bring you a taste."`,
    E: [[`"Oh, I'm an expert on bar mats. The thick ones are the best, everyone knows that."`, `Pretending to know something you don't wrecks trust the moment he checks.`]],
    H: [[`"I don't know about mats. Can we get back to my price sheet now?"`, `Honest, but it brushes off his question and drags the talk back to your agenda.`],
        [`"Margaritas are huge this year. Everyone's doing them, and all the bars are switching to additive-free."`, `Trends you can't prove and a claim about other bars you can't verify.`],
        [`"Interesting question. Anyway, would you like to see our four bottles?"`, `It skips both of his questions and jumps back into the pitch.`]],
    reply: { best: `Ha, fair. Okay, mostly spicy and classic. Bring it by, I'll taste it in a marg.`, mid: `Hm, okay. Maybe. Bring something and we'll see.`, bad: `Forget it. I'll ask someone who knows what they're talking about.` },
    crit: { need: [[/(don'?t know|not sure|no idea|can'?t speak to|not my area|haven'?t used|can'?t say)/i, "admit what you don't know"],
                   [/(margarita|your (guests|crowd|customers)|what (are|do) (they|your))/i, "ask about his margaritas or his guests"],
                   [/(taste|pour|sample|try|additive|three ingredients|on your (menu|list)|upgrade)/i, "link it back to Corrido"]],
            bad: [[/(i('| a)m an expert|best (mat|mats)|everyone knows|everyone'?s doing|all the bars|every bar)/i, "Don't invent expertise or trends you can't back up."]] } },

  { id: "lena-leaving", kind: "push", view: V.lena, skill: "Credibility", secs: 30, twist: "She is leaving. You get one sentence.",
    hint: `Stay calm. Agree with the frustration, give one true difference, and ask for a small, quick taste.`,
    line: `Lena stands halfway through your answer and picks up her tablet. "You know what? Five reps this week, all saying the same thing. I'm done. Unless you can give me one good reason to stay another minute."`,
    q: `One sentence. What do you say?`,
    R: [`"Fair, that sounds exhausting. Corrido is additive-free with only three ingredients: let me pour you one taste and you can decide in two minutes."`, `Calm agreement, one true fact, and a small, quick ask.`],
    RH: `"I hear you. It's additive-free, three ingredients. Give me one two-minute taste and I'll let you go."`,
    E: [[`"Those other reps don't know what they're doing. Trust me, I'm different, and you'll regret passing on this."`, `Running down other reps and warning her she'll regret it is how a customer ends up leaving.`]],
    H: [[`"I get it. Can I just have your email so I can send the catalog and not take your time?"`, `Polite, but it gives her no reason to care, only more paper.`],
        [`"Fair enough. Honestly, our social media is growing fast, and everybody who tries it loves it."`, `Follower counts and "everybody loves it" aren't reasons she can check.`],
        [`"You need to hear this: it's the best additive-free tequila, and you need to taste it right now."`, `Pushy and boastful. Telling her what she needs to do is the opposite of earning a minute.`]],
    reply: { best: `Hm. Additive-free, three ingredients. Okay, one taste. Two minutes.`, mid: `Fine. Make it quick. I'm not promising anything.`, bad: `I'm leaving. Don't call me.` },
    crit: { need: [[/(fair|understand|i hear you|i get it|makes sense|appreciate|exhausting|sounds (like|frustrating))/i, "agree calmly with her frustration"],
                   [/(additive|three ingredients|no fake|first female|master distiller|celebrity)/i, "give one true difference"],
                   [/(taste|pour|tasting|sample|two minutes|one minute|try)/i, "ask for something small and quick"]],
            bad: [[/(other reps|those reps|trust me|you'?ll regret|everybody (who )?tries|everyone loves|everybody loves|you need to|right now|the best (additive|tequila))/i, "Don't run others down, boast or pressure her. Give one true fact."]] } },

  { id: "hector-promise", kind: "push", view: V.hector, skill: "Credibility", twist: "He slams a broken promise in your face.",
    hint: `Don't argue and don't promise anything you can't confirm. Say sorry once, then offer something small you can really deliver.`,
    line: `Hector slaps the counter. "The last rep who came in here promised me free shipping and a free case. Never showed up. Why would you be any different?"`,
    q: `How do you answer?`,
    R: [`"I'm sorry that happened, that's frustrating. I won't promise anything I can't confirm in writing, but I can bring a small taste on Thursday and we start small."`, `Own the frustration, promise only what you can confirm, and offer something small and real.`],
    RH: `"That's fair. I only promise what I can confirm in writing, so let me bring one small tasting Friday."`,
    E: [[`"I promise free shipping and a free case this time. I guarantee it."`, `Repeating the exact promise that broke his trust, with a guarantee on top.`]],
    H: [[`"Those other reps don't represent us. Trust me, I'm different."`, `Running down another rep and asking for trust again is what got him here.`],
        [`"I understand. Let me check with my boss and see if I can match what they promised."`, `Matching a promise you can't verify repeats the same mistake.`],
        [`"I hear you. What can I do to earn your trust, free product maybe?"`, `Offering free product is a promise you can't confirm.`]],
    reply: { best: `Hm. At least you're honest. Thursday. Bring the taste, we'll see.`, mid: `Okay. Prove it. Come by and we'll see.`, bad: `Same story from everyone. We're done here.` },
    crit: { need: [[/(sorry|understand|that'?s fair|i hear you|frustrat|you'?re right|makes sense)/i, "acknowledge his frustration"],
                   [/(won'?t promise|can'?t promise|only promise|confirm|in writing|only (what|things) i can)/i, "promise only what you can confirm"],
                   [/(taste|tasting|visit|bring|thursday|friday|tomorrow|small|come (by|back))/i, "offer something small and real"]],
            bad: [[/(free (shipping|case|product|bottles?|stuff)|i promise|i guarantee|other reps?|that rep|trust me|match what they)/i, "Don't promise what you can't confirm, and don't run other reps down."]] } },

  { id: "hector-email", kind: "stall", view: V.hector, skill: "Closing", twist: "He politely brushes you off.",
    hint: `A polite brush-off is not a no. Say yes to the email, then ask what he'd want to see and set a dated check-in.`,
    line: `Hector is polite but already stacking chairs. "This all sounds nice. Why don't you just email me some info, and I'll look when I get a chance?"`,
    q: `How do you answer?`,
    R: [`"Happy to email it. What would be most useful for you to see, and could I check in Thursday afternoon to hear what you think?"`, `Say yes, tailor it to him, and set a dated next step.`],
    RH: `"Of course. What do you want to see in it, and can I call on Friday to follow up?"`,
    E: [[`"An email never works. You have to decide today, because this deal ends soon."`, `Pressure and a made-up deadline turn a polite brush-off into a no.`]],
    H: [[`"Sure, I'll email it. Let me know if you have any questions after you read it."`, `It agrees but leaves the next step entirely to him, so nothing happens.`],
        [`"Of course, I'll email the full catalog and price sheet, and you can just call me whenever."`, `Handing over the whole catalog and leaving the follow-up to him means it never gets read.`],
        [`"Absolutely. I'll send it, and it would help if you could reply within the hour so I can plan my day."`, `It asks him to work to your schedule instead of fixing a time that suits him.`]],
    reply: { best: `Thursday afternoon works. Send the one-pager and bring a sample.`, mid: `Okay. Send it over and I'll look when I can.`, bad: `Mm. Just email me. I'm busy.` },
    crit: { need: [[/(of course|sure|happy to|no problem|absolutely|glad to)/i, "say yes to his request"],
                   [/(what would (be )?(most )?useful|what do you want to (see|know)|what would you like|what matters|what should (i|it) (include|cover))/i, "ask what he wants to see"],
                   [/(thursday|friday|monday|tuesday|wednesday|next week|this week|tomorrow|\d ?(am|pm)|which day|what day)/i, "set a dated follow-up"]],
            bad: [[/(never works|have to decide|decide today|deal ends|ends soon|today only|last chance)/i, "Don't pressure him or invent a deadline."]] } },

  { id: "joan-partner", kind: "stall", view: V.joan, skill: "Follow-up", twist: "She wants to circle back later.",
    hint: `"Let me talk to my partner" is a real next step. Find out what the partner cares about, and offer a dated tasting for both.`,
    line: `Joan smiles and slips her pen behind her ear. "I love it, really. Let me talk to my partner and circle back."`,
    q: `How do you answer?`,
    R: [`"Great, and please do. What will your partner want to know? I can bring a tasting for both of you Thursday, so you decide together."`, `Welcome it, learn what the partner cares about, and offer a dated tasting for both.`],
    RH: `"Of course. What would your partner care about most? I could do a tasting for you both Friday."`,
    E: [[`"Why do you need a partner? Just decide today, because this offer won't last."`, `Pushing her to decide alone, today, brushes off her partner and invents urgency.`]],
    H: [[`"Sounds good. I'll circle back sometime next quarter."`, `A vague follow-up months out lets the deal die.`],
        [`"Okay, great. Tell your partner it's additive-free and he'll definitely say yes."`, `Putting words in the partner's mouth and promising an outcome you can't know.`],
        [`"No problem. I'll call you Thursday to hear what they decided."`, `A dated follow-up, but it leaves the partner out and never asks what they care about.`]],
    reply: { best: `Perfect. Thursday works. My partner mostly cares about cost per drink.`, mid: `Okay. Let me see what he says first.`, bad: `I'll call you if we're interested.` },
    crit: { need: [[/(what (will|would|does|do|might) (your|she|he|they)|anything (your|she|he|they)|want to know|care about|concerns?|questions? (will|would|might|does|do))/i, "ask what her partner will want to know"],
                   [/(you both|both of you|you and your partner|the three of us|all three of us|join|include)/i, "offer to include the partner"],
                   [/(thursday|friday|monday|tuesday|wednesday|this week|next week|tomorrow|\d ?(am|pm))/i, "set a dated follow-up"]],
            bad: [[/(why do you need|just decide|decide (today|now)|won'?t last|definitely say yes|he'?ll (definitely|surely)|they'?ll (definitely|surely)|she'?ll (definitely|surely))/i, "Don't pressure her or speak for her partner."]] } },
])(SURPRISE_CUSTOMERS);

// The tone each curveball customer calls for (see TONE_FOR in scenarios.js), and the rules the real coach scores each answer with.
Object.assign(TONE_FOR, {
  "sx-tomas":  { name: "quick and respectful", pace: [125, 185], cue: "He has no time. Be quick, respectful and easy to say yes to." },
  "sx-nadia":  { name: "calm and patient", steady: true, pace: [100, 150], cue: "Her silence is not a no. Stay relaxed and give her room." },
  "sx-walt":   { name: "friendly but clear", warm: true, firm: true, pace: [110, 165], cue: "He is a friend of the shop, so stay warm, but the rule does not bend." },
  "sx-lena":   { name: "calm and confident", steady: true, firm: true, pace: [115, 170], cue: "She is testing you. Stay calm, even and sure of yourself." },
  "sx-hector": { name: "respectful and steady", steady: true, pace: [105, 160], cue: "He has been let down before. Be honest, calm and small in what you promise." },
  "sx-joan":   { name: "warm and brisk", warm: true, pace: [120, 175], cue: "She is friendly but busy. Sound glad, and keep it moving." },
});
SURPRISE.forEach(s => { CRITERIA["surprise:" + s.id] = s.crit; });

// A round: one curveball of each kind, in a random order, each from a customer the rep hasn't met. It counts as practice: it never marks a stop done.
function surpriseScenario() {
  const steps = shuffle(["interrupt", "quiet", "topic", "push", "stall"]).map(k => { const s = shuffle(SURPRISE.filter(x => x.kind === k))[0]; return { ...s, src: s.view, ckey: "surprise:" + s.id }; });
  const first = steps[0].src;
  return { id: "surprise", practice: true, surprise: true, passMark: 3.2, level: 4, title: "Surprise customer", sub: "Five curveballs", icon: "⚡", theme: first.theme, cust: first.cust, hidden: "",
    win: "You kept your head. Surprises are where training shows, and each one you handle makes the real thing easier.",
    lose: "Surprises are hard on purpose. Read the notes, then go again: the five questions change every time.", steps };
}
function playSurprise() {
  if (document.body.classList.contains("onboarding")) return;
  openDiff(() => play(surpriseScenario()), { title: "Surprise customer", sub: "Five curveballs from customers you haven't met", practice: true, level: 4 });
}

// The Progress tab's card.
const Surprise = (() => {
  const unlocked = () => !!state.done.quiet || (typeof Presenter !== "undefined" && Presenter.active());
  const last = () => [...(state.history || [])].reverse().find(h => h.id === "surprise");
  const card = () => `<div class="card surprisecard"><h3>⚡ Surprise customer</h3>
    <p>Five curveballs from customers you haven't met. They interrupt you, change the subject, go quiet, push back or brush you off. A different five every time. It is practice, so it never unlocks anything, but it earns XP and feeds your skills.</p>
    ${last() ? `<p class="note2">Your last round: <b>${(last().pct / 20).toFixed(1)} / 5</b>.</p>` : ""}
    ${unlocked() ? '<button class="btn" id="psurprise" type="button">Try a surprise customer</button>' : '<p class="note2">It opens once you have finished The Quiet Bar.</p>'}</div>`;
  const wire = el => { const b = el.querySelector("#psurprise"); if (b) b.onclick = playSurprise; };
  return { card, wire, unlocked };
})();
