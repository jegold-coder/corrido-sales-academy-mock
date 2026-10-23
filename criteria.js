"use strict";
// What a good typed (or spoken) answer needs, step by step. This is the free, offline coach: it checks the rep's
// own words against these rules. need = ideas a good answer includes; bad = things that cost trust.
// These rules are DRAFT, written from the project brief and the public website. Replace them with the startup's
// real rubric once they share what a good pitch looks like.
// Key format: "<mission id>:<step number>".

const CRITERIA = {
  // ---------------- Marco's Bar ----------------
  "marco:0": {
    need: [[/(minute|seconds?|moment|quick|come back|later|after|whenever|lull|rush|slammed|busy|quiet|calm|spare)/i, "acknowledge he's busy and ask for a short time"],
           [/(see|sounds|looks|understand|appreciate|totally|no problem|sorry|happy to)/i, "show you notice and respect his time"],
           [/(\?|or i can|if you'?d rather|works better|your call|when)/i, "let him choose when to talk"]],
    bad: [[/(additive|three ingredients|four expressions|best tequila|every flavor)/i, "Don't start with product facts. He's slammed, so respect his time first."],
          [/(five minutes|5 minutes|walk you through everything|price sheet)/i, "That's a big ask during a rush. Ask for a short moment."],
          [/(great tequila gets noticed|behind your bar|exactly where a|samples for you|wait at the end)/i, "That turns his rush into your opportunity. Respect his time first."]] },
  "marco:1": {
    need: [[/(crowd|guests?|customers?|patrons?|clientele|regulars|who comes|who's in|who drinks|at the bar|friday|weekend)/i, "ask about his guests"],
           [/(order|pour|drink|margarita|pay|price|spend|sell|expect|usually)/i, "ask what they order or what they'll pay"]],
    bad: [[/(discount|cheaper|% off|percent off|deal for you|free case)/i, "Don't offer discounts before you understand his guests."],
          [/(better than|best tequila|our tequila is)/i, "Don't claim you're better yet. Learn what he cares about first."],
          [/(our story|corrido is a|ballad|vinyl)/i, "A nice story, but ask about his guests before telling it."],
          [/(most bars|bars your size|upgrade shows)/i, "That leads him to your answer instead of learning his."],
          [/(who'?s your rep|what brands are you pouring|your rep)/i, "Ask about his guests and what they pay before his suppliers."],
          [/(let me tell you why|why guests love)/i, "That pitches before it listens."]] },
  "marco:2": {
    need: [[/(understand|understood|fair|real|get it|makes sense|constraint|ceiling|concern|that's|hear you|appreciate)/i, "acknowledge his price concern"],
           [/(math|per.?pour|pour cost|margin|break ?down|numbers|cost you|calculate|work out|do the|what you (pour|charge)|where the blanco (lands|falls)|pour and charge)/i, "make price concrete with per-pour math"],
           [/\?|let'?s|walk me|show me/i, "invite him to check the numbers with you"]],
    bad: [[/(our price is|take it or leave|isn'?t for you|quality costs|not for your)/i, "That dismisses his concern. Acknowledge it first."],
          [/(drop the price|lower the price|cut the price|check if we can drop|special price|discount)/i, "Don't promise price cuts you can't back up."],
          [/(upcharge|guests will pay|most bars find)/i, "That's a claim you can't back up with his guests' data."],
          [/(competitive for|reflects real quality|worth it)/i, "That defends the price but never connects it to his $12 ceiling."],
          [/(bring the price down|whether we can bring)/i, "Don't promise price cuts you can't back up."]] },
  "marco:3": {
    need: [[/(respect|solid|great brand|good brand|known|knows it|for a reason|fair|understand)/i, "respect the brand he already pours"],
           [/(additive|three ingredients|no fake|master distiller|female|first female)/i, "name one real difference"],
           [/(taste|side by side|side-by-side|try|pour them|compare|next to)/i, "invite him to taste"]],
    bad: [[/(garbage|trash|overrated|sucks|terrible|worse|everyone'?s moving away|they rely on marketing|rely on marketing|lean on marketing|leans on marketing)/i, "Never bash a competitor. It costs trust and you can't prove it."],
          [/(trust me|best ever|everyone loves|you'?d be crazy)/i, "Hype without proof sounds like a line. Use specific facts."],
          [/(more character|guests are noticing|get to discover)/i, "That's vague. Name a specific, true difference."],
          [/(guests love a story|hard to beat|discover something first)/i, "A story or novelty alone doesn't answer why he should switch. Invite him to taste."]] },
  "marco:4": {
    need: [[/(bottle|sample|tasting|taste|try|pour)/i, "a tasting or a bottle for his team"],
           [/(thursday|monday|tuesday|wednesday|friday|saturday|sunday|tomorrow|next week|this week|tonight|\d+ ?(am|pm))/i, "a specific day"],
           [/(small|first order|trial|start with|if (the team|it'?s a fit|they like))/i, "a small first order if it fits"]],
    bad: [[/(email|follow up next month|are you buying|let me know whenever|no rush)/i, "Too vague or pushy. Ask for a specific next step with a date."],
          [/(large|big|full|opening order today|cases)/i, "Too big, too soon. Start with a small first order."],
          [/(price sheet|send you|talk after)/i, "No concrete next step. Offer a tasting with a date."],
          [/(leave it with me|staff training)/i, "Too far out. Momentum is gone by then."]] },

  // ---------------- Dana's Warehouse ----------------
  "dana:0": {
    need: [[/(sells?|sell.?through|moves?|pull|rotat|criteria|measure|what makes|worth carrying|best.?moving|accounts)/i, "ask what sells through for her"],
           [/(send|happy to|price sheet|will get|i'?ll get|follow up with)/i, "respond to her request for the price sheet"]],
    bad: [[/(next big thing|everyone is going to want|going to be huge|blow up)/i, "Hype with no evidence is exactly what she's tired of."],
          [/(don'?t have a price sheet|didn'?t bring)/i, "Showing up without what she asked for hurts your credibility."],
          [/(walk you through|four expressions|story behind)/i, "Product first, before you know what she needs."],
          [/(growing fast|attached)/i, "A vague growth claim she can't verify."]] },
  "dana:1": {
    need: [[/(confirm|in writing|bring|get back|exact|send|follow up|numbers)/i, "commit to confirming wholesale numbers"],
           [/(margin|target|what do you need|what margin|what'?s your|need to make|tell me your)/i, "ask what margin she needs"],
           [/(fair|understand|good question|reasonable|guess|don'?t want to)/i, "acknowledge the question"]],
    bad: [[/(great margins|trust me|ton of money|huge margin|you'?ll make a ton)/i, "Never promise margins you haven't confirmed."],
          [/(until you commit|before you commit|until you order)/i, "Hiding pricing from a buyer kills trust."],
          [/(in line with other|competitive margins|special deal|talk to my manager|introductory deal|check with my manager)/i, "That's unverified or unauthorized. Commit to confirming real numbers."],
          [/(focus on value|not margin|reflects real quality)/i, "That dodges her actual question."]] },
  "dana:2": {
    need: [[/(pilot|trial|small|test|one account|two accounts|one or two)/i, "offer a small pilot"],
           [/(sell.?through|real|see|actual|prove|results)/i, "let real sales prove it"],
           [/(honest|won'?t pretend|don'?t have|can'?t claim|fair)/i, "be honest about what you can and can't prove"]],
    bad: [[/(selling out|sold out|flying off|everywhere|flies off)/i, "Don't claim sales you can't prove."],
          [/(take my word|trust me)/i, "Asking for blind trust is the opposite of proof."],
          [/(social|followers|bars have already asked|plenty of|gets people talking|buzz)/i, "That isn't sell-through, and you can't verify it."]] },
  "dana:3": {
    need: [[/(account|accounts|store|stores|customers)/i, "which accounts"],
           [/(writing|terms|pricing|samples?|wholesale)/i, "terms or samples"],
           [/(week|friday|monday|two weeks|review|check.?in|meet|by )/i, "dates and a review"]],
    bad: [[/(sign here|sign now|sign up today)/i, "Jumping to a signature skips the plan she asked for."],
          [/(get back to you|let you know|when i know more|whatever you'?re comfortable)/i, "Too vague. She asked for specifics."],
          [/(manager|distribution commitment)/i, "Arrive with a proposal. Don't defer it or ask for more first."]] },

  // ---------------- Priya's Bottle Shop ----------------
  "priya:0": {
    need: [[/(congrat|welcome|nice|exciting|great to meet|good to meet)/i, "welcome her warmly"],
           [/(shoppers?|customers?|regulars?|neighbors?|ask for|looking for|who'?s|buying)/i, "ask about her shoppers"]],
    bad: [[/(every product detail|read you|all the details)/i, "An information dump overwhelms a nervous new owner."],
          [/(sell out|guarantee|guaranteed)/i, "A guarantee you can't keep."],
          [/(need a premium|really needs|stand out)/i, "You're telling her what she needs instead of asking."],
          [/(walk you through|show you what we have)/i, "Show-and-tell before you know what she needs."]] },
  "priya:1": {
    need: [[/(three ingredients|3 ingredients)/i, "only three ingredients"],
           [/(no fake|fake flavors|nothing added|additive)/i, "no fake flavors added"],
           [/(one sentence|tell shoppers|tell customers|explain|say to|repeat|simple|honest answer|a shopper asks|when a shopper)/i, "something she can repeat to shoppers"]],
    bad: [[/(better for you|healthier|cleaner|good for you|detox|doesn'?t give you)/i, "That's a health claim you can't make."],
          [/(marketing term|don'?t worry|artisanal|it means premium|small.?batch)/i, "That's vague or dismissive. Use the brand's own simple words."],
          [/(isn'?t right for your shop|if you don'?t know)/i, "Condescending to a nervous new owner."]] },
  "priya:2": {
    need: [[/(understand|understood|makes sense|fair|totally|of course|i hear you)/i, "acknowledge her budget worry"],
           [/(one|two|couple|small|start|a few)/i, "start small"],
           [/(story|hand.?sell|help|card|talk about|easy to sell)/i, "help her sell it"]],
    bad: [[/(full case|a case|three bottles|order three|free shipping)/i, "Don't push a big order on a tiny budget."],
          [/(locks? in|lock in|invoice you later|leave you the whole)/i, "That's pressure or terms you can't offer."],
          [/(maybe later|no worries)/i, "Giving up loses a warm lead."]] },
  "priya:3": {
    need: [[/(pick|choose|bottle|one|favorite|proudest|happiest)/i, "start with one bottle"],
           [/(confirm|in writing|pricing|wholesale)/i, "confirm pricing in writing"],
           [/(card|shelf|story|sign|talker)/i, "give her a shelf card or story to sell with"]],
    bad: [[/(all four|every bottle|whole lineup|full shelf)/i, "A full lineup is too much for her budget."],
          [/(later|next month|decide when|email you)/i, "Too vague. Set a clear next step."],
          [/(añejo|anejo)/i, "That's the most expensive bottle, which is a risky first pick on a tight budget."]] },

  // ---------------- Compliance Trap ----------------
  "comply:0": {
    need: [[/(can'?t|cannot|not able|unable|won'?t|don'?t make|not allowed|can not)/i, "decline to make a health claim"],
           [/(additive|three ingredients|no fake)/i, "say only what the brand really says"],
           [/(responsib|enjoy)/i, "mention drinking responsibly"]],
    bad: [[/(no hangover|hangover.?free|doesn'?t cause|less of a hangover than|won'?t give you a hangover)/i, "A health claim you can't make."],
          [/(ridiculous|stupid|silly question)/i, "Rude, even if you can't answer."],
          [/(easier on|probably help|cleaner ingredients|feel better|not a doctor)/i, "Even a hedged health claim is still a health claim."]] },
  "comply:1": {
    need: [[/(21|twenty.?one|of age|legal)/i, "21 and over only"],
           [/(sorry|can'?t|cannot|no\b|unable|won'?t|not able)/i, "say no clearly"],
           [/(non.?alcoholic|mocktail|soda|juice|alternative|something else|zero.?proof)/i, "offer a non-alcoholic option"]],
    bad: [[/(nobody will know|look the other way|just a taste|go ahead|keep it quiet)/i, "Never encourage or hide serving someone under 21."],
          [/(her parents|parents' decision|decision at a private party)/i, "The law still applies. It's not yours to weigh in."],
          [/(won'?t tell you what to do)/i, "Too ambiguous. Be clear: 21 and over."]] },
  "comply:2": {
    need: [[/(check|confirm|verify|find out|look into|get you a clear)/i, "confirm before promising"],
           [/(state|states|rules|laws|legal|regulation|where they live)/i, "shipping rules differ by state"],
           [/(adult|signature|21|of age)/i, "an adult has to receive it"]],
    bad: [[/(ship anywhere|anywhere,? no problem|no problem|sure!? we ship)/i, "Don't promise to ship anywhere."],
          [/(labeled as a gift|label it|as a gift)/i, "Labeling doesn't change the legal rules."],
          [/(should be fine|most places|our website says|don'?t worry about it)/i, "'Most places' isn't good enough for alcohol."],
          [/(give me the addresses|figure it out)/i, "Confirm what's legal before collecting addresses."]] },
  "comply:3": {
    need: [[/(additive.?free)/i, "additive-free"],
           [/(three ingredients|no fake)/i, "only three ingredients and no fake flavors"],
           [/(don'?t|can'?t|not|avoid|isn'?t|aren'?t|skip)/i, "steer her away from organic, low-calorie and healthy"]],
    bad: [[/(sure|go ahead|whatever|put whatever|do whatever|i don'?t care)/i, "Don't say yes to unapproved claims."],
          [/\bclean\b/i, "'Clean' implies a health claim too."],
          [/(low.?calorie is okay|check with the venue|venue)/i, "The brand's claims are your responsibility, not the venue's."]] },

  // ---------------- Ray's Restaurant ----------------
  "ray:0": {
    need: [[/(solid|great brand|good brand|respect|trust|knows it|know it|rightly|for a reason|fair)/i, "respect the brand he pours"],
           [/(matters|care about|look for|important|priorit|what do you)/i, "ask what matters to him"]],
    bad: [[/(overrated|overpriced|garbage|trash|isn'?t special|not special|isn'?t anything special|nothing special)/i, "Bashing his choice insults him."],
          [/(nobody'?s heard|they will)/i, "Admitting you're unknown and hoping isn't a pitch."],
          [/(moving to additive|keep trying new things|variety is good)/i, "That's generic or unverified. Ask what matters to him."]] },
  "ray:1": {
    need: [[/(additive|three ingredients|no fake)/i, "one real difference"],
           [/(taste|side by side|try|next to|pour them|compare)/i, "invite him to taste"],
           [/(distiller|female|one of the first|only|one thing|honestly)/i, "keep it honest and specific"]],
    bad: [[/(simply better|cooler bottle|smoother|bartenders love|more care than)/i, "That's subjective or unprovable. Name a true difference."],
          [/(more options than|four expressions give)/i, "Range is nice but doesn't answer 'what's different'."]] },
  "ray:2": {
    need: [[/(celebrit|famous|endorse|big.?name|star)/i, "address the famous-face point"],
           [/(additive|three ingredients|no fake|the tequila (itself|speaks)|speak for itself|about the tequila|just the tequila)/i, "bring it back to the tequila"],
           [/(taste|try|pour|side by side)/i, "invite him to taste"]],
    bad: [[/(celebrities already|a few celebrities|about to sign|athletes|actors|singers|famous people (drink|love))/i, "Don't claim celebrity fans or endorsements the brand doesn't have."],
          [/(nothing else to sell|pay more for the same|famous face just means)/i, "That puts down other brands with claims you can't prove."]] },
  "ray:3": {
    need: [[/(44\.99|54\.99|56\.99|89\.99|\$\d)/i, "the public prices"],
           [/(confirm|in writing|wholesale|exact|bring)/i, "confirm wholesale in writing"]],
    bad: [[/(secret|until you commit|order today|great price)/i, "Hiding prices or pushing a deal kills trust."],
          [/(about the same|probably|competitive with|worth it)/i, "A guess. Don't guess prices."]] },
  "ray:4": {
    need: [[/(corrido|ballad|rebel|music|distiller)/i, "the Corrido story"],
           [/(tasting|taste|bottle|try)/i, "a tasting"],
           [/(thursday|monday|tuesday|wednesday|friday|saturday|sunday|this week|tomorrow|tonight)/i, "a specific day"]],
    bad: [[/(just buy|brochure|you won'?t regret)/i, "Pressure or a brochure isn't a next step."],
          [/(sometime next month|if you'?re ever|let me know if)/i, "Too passive or too far out."],
          [/(few cases|start with .*cases)/i, "Cases before a tasting is too big a step."]] },
  // ---------------- Sam at the Door ----------------
  "sam:0": {
    need: [[/(tequila corrido|tequila brand|rep for|with corrido|i'?m with)/i, "say who you are"],
           [/(manager|owner|bar manager|who'?s best|who would be best|best person|who handles)/i, "ask for the right person"],
           [/(when|come back|later|in today|are they in|she'?s in|he'?s in|a good time)/i, "ask when to come back"]],
    bad: [[/(right now|it'?s important|appointment|wait at the bar|samples? for the owner|drop off)/i, "That's pushy or untrue. Be honest about who you are."],
          [/(liquor orders)/i, "That jumps to the sale before saying who you are."]] },
  "sam:1": {
    need: [[/(tequila corrido|tequila brand|a tequila|we make|they make)/i, "say what you sell"],
           [/(additive|three ingredients|no fake)/i, "one true fact"],
           [/(ten minutes|10 minutes|short chat|quick chat|few minutes|a minute|brief|short)/i, "a small time ask"]],
    bad: [[/(best tequila|buy it today|it'?s personal|everyone'?s talking|call me|full pitch)/i, "That's hype, secrecy or a long pitch to the wrong person."]] },
  "sam:2": {
    need: [[/(rather not|shouldn'?t|can'?t|don'?t leave|not leave|prefer not|not without|not able)/i, "politely decline to leave alcohol"],
           [/(card|contact|number|business card)/i, "leave your card"],
           [/(tasting|taste|come back|when she'?s in|manager (here|present|in)|present)/i, "offer a tasting with the manager"]],
    bad: [[/(take the whole bottle|share it|keep it in the back|don'?t tell|sample cup|courier|tonight|not important enough)/i, "That breaks rules or burns the relationship."]] },
  "sam:3": {
    need: [[/(card|number|contact|reach me)/i, "your contact"],
           [/(tuesday|monday|wednesday|thursday|friday|saturday|sunday|tomorrow|\d ?(am|pm)|three)/i, "a specific day and time"],
           [/(thank|appreciate|thanks)/i, "thank him"]],
    bad: [[/(whenever|sometime|just show up|urgent|social media|call me today|no need for a card)/i, "Vague, pushy or skipping the right path. Pick a day and time."]] },

  // ---------------- Mia's Hotel Lounge ----------------
  "mia:0": {
    need: [[/(when|occasion|dinner|after dinner|cocktails?|sipping|order)/i, "ask when guests order"],
           [/(guests?|travelers?|customers?)/i, "ask about her guests"],
           [/(keep it (simple|quick)|quick|simple|short)/i, "promise to keep it simple"]],
    bad: [[/(best tequila in the world|will love it|great story|want a story|ours is great)/i, "Hype and assumptions. Ask what her guests order."],
          [/(train your whole staff|all four|go through all|current tequila|happy with it)/i, "That adds work for her team or starts with suppliers."]] },
  "mia:1": {
    need: [[/(blanco)/i, "the Blanco"],
           [/(citrus|floral|pepper|bright|fruity)/i, "its citrus and pepper notes"],
           [/(margarita|cocktail|drink)/i, "tie it to the drink"]],
    bad: [[/(a[nñ]ejo|reposado|overproof|all taste the same|any of them)/i, "That's a different expression with different notes."]] },
  "mia:2": {
    need: [[/(a[nñ]ejo)/i, "the Añejo"],
           [/(coffee|dried fruit|agave|sip|sipping|special|occasion)/i, "tie it to sipping or special occasions"],
           [/(math|per.?pour|numbers|work out|figure)/i, "work out the numbers together"]],
    bad: [[/(cheap|sells itself|fortune|\$\d+ a pour|skip it)/i, "Don't dismiss her concern or invent pour prices and profits."],
          [/(discount)/i, "You may not be authorized, and discounting weakens a premium bottle."]] },
  "mia:3": {
    need: [[/(blanco)/i, "Blanco for cocktails"],
           [/(a[nñ]ejo)/i, "Añejo for sipping"],
           [/(menu|description|wording|card)/i, "ready-made menu wording"],
           [/(thursday|monday|tuesday|wednesday|friday|saturday|sunday|this week|tomorrow)/i, "a date"]],
    bad: [[/(all four|case of each|next month|email you|call you sometime|reposado)/i, "Too much work, too vague, or not tied to what her guests order."]] },

  // ---------------- The Hard No ----------------
  "hardno:0": {
    need: [[/(understood|fair enough|i hear you|respect|won'?t waste|no problem|got it)/i, "respect the no"],
           [/(sells?|buying|buys|grab|moving|shoppers?|customers?|regulars)/i, "ask who buys and what sells"],
           [/\?/, "ask a question"]],
    bad: [[/(give me a chance|haven'?t even heard)/i, "Begging makes it worse. Respect the no and ask a question."],
           [/(leave you a bottle|leave a bottle|no obligation)/i, "Leaving alcohol behind after a no earns nothing and may break rules."],
           [/(is the owner|speak to the owner|talk to the owner)/i, "Going around him is a fast way to be shown the door."],
           [/(additive|three ingredients|thirty seconds)/i, "Pitching right after a flat no ignores what he said."]] },
  "hardno:1": {
    need: [[/(makes sense|tells me|fair|understand|got it)/i, "acknowledge his answer"],
           [/(gift|party|parties|occasion|weekend|special|celebrat|birthday)/i, "ask about occasions when shoppers buy something different"],
           [/\?/, "ask a question"]],
    bad: [[/(educate|don'?t know good tequila)/i, "Blaming his customers insults him and them."],
           [/(college kids love|rebel spirit|fit them perfectly)/i, "An assumption about his shoppers. Ask instead."],
           [/(89\.99|status bottle)/i, "A price that doesn't fit these shoppers."],
           [/(full tequila display|start asking for it|once people see it)/i, "Forcing the product onto a crowd that isn't asking for it."]] },
  "hardno:2": {
    need: [[/(maybe not|may be right|fair|understand|you'?re right|point)/i, "agree where he's right"],
           [/(gift|party|parties|special)/i, "name the buyers it might fit"],
           [/(one bottle|a bottle|test|small|try)/i, "suggest a tiny test"]],
    bad: [[/(just have to push|push it)/i, "Telling him to push is a weak answer to a real price concern."],
           [/(lower price|see about a lower|lower the price)/i, "Promising a price cut you can't back up."],
           [/(at least three|three bottles|tough areas)/i, "An unverified claim, and a bigger bet than he wants."],
           [/(steal|come around)/i, "Defending the price doesn't answer who would pay it."]] },
  "hardno:3": {
    need: [[/(won'?t promise|not promising|no big promises|small)/i, "keep the promise small"],
           [/(thursday|monday|tuesday|wednesday|friday|saturday|sunday|tomorrow|\d ?(am|pm)|at two)/i, "a specific day and time"],
           [/(shelf card|card|bring|back)/i, "say what you'll bring"]],
    bad: [[/(actually care|different because)/i, "Claiming you're different is the opposite of showing it."],
           [/(every single week|keep your shelf looking)/i, "An open-ended promise he'll expect forever."],
           [/(other stores i work with|check with the other)/i, "A claim about other stores you haven't established."],
           [/(every day|text you)/i, "Daily texts and vague visits are noise, not follow-through."]] },
  "hardno:4": {
    need: [[/(thursday|monday|tuesday|wednesday|friday|saturday|sunday|tomorrow|at two)/i, "confirm the day and time"],
           [/(thank|thanks|appreciate)/i, "thank him"],
           [/(short|brief|five minutes|quick|under)/i, "promise to keep it short"]],
    bad: [[/(order form|get started)/i, "Assuming a yes when he promised nothing."],
           [/(a few bottles|small display|set it up)/i, "Bringing more than you promised."],
           [/(sometime|get you set up)/i, "'Sometime' isn't a time. Confirm the hour."],
           [/(my cell|text me|change your mind)/i, "Planning for a no instead of confirming the yes."]] },

  // ---------------- Know Your Buyer ----------------
  "buyer:0": {
    need: [[/(both|honestly)/i, "be honest about why you're there"],
           [/(corrido (playing|on the speaker)|music|playlist|song|speaker|record|vinyl)/i, "notice the room"],
           [/\?/, "ask her about it"]],
    bad: [[/(best tequila in the city)/i, "Hype, and it ignores the room."],
           [/(aimed at|take a table|mind if i take)/i, "Assuming who her customers are, and sitting uninvited."],
           [/(authentic tequila for places|basically the authentic)/i, "Claiming authenticity is what she can't stand."],
           [/(owner here|whoever buys)/i, "She's the owner. Read the room."]] },
  "buyer:1": {
    need: [[/(named for|name comes from|corrido ballad|ballad|the corrido)/i, "the corrido name"],
           [/(female|woman|distiller)/i, "one of the first female master distillers"],
           [/(celebrit)/i, "celebrity-free"]],
    bad: [[/(family recipe|generations)/i, "A made-up story. She will see through it."],
           [/(handcrafted|small batches)/i, "Details the brand doesn't claim."],
           [/(true mexican heritage|feel the connection)/i, "An overclaim about her customers' feelings."],
           [/(more about the attitude|unapologetic)/i, "It undersells the actual product."]] },
  "buyer:2": {
    need: [[/(a[nñ]ejo)/i, "the Añejo for sipping"],
           [/(blanco)/i, "the Blanco for margaritas"],
           [/(margarita|sip|sunday|coffee|citrus)/i, "tie each to its moment"]],
    bad: [[/(any of them|all great)/i, "They aren't interchangeable. She asked for a match."],
           [/(for both|only need one bottle|flagship)/i, "One bottle for both moments doesn't match the notes."]] },
  "buyer:3": {
    need: [[/(real worry|you'?re right|understand|fair|makes sense)/i, "acknowledge her worry"],
           [/(math|per.?pour|numbers|work out)/i, "work out the per-pour math"],
           [/(sunday|special|sip)/i, "give the pricey bottle a clear role"]],
    bad: [[/(families will pay|pay anything)/i, "A claim about her customers she knows is untrue."],
           [/(better price|commit to both)/i, "A price promise you can't back up."],
           [/(margin will cover|charge a premium)/i, "An invented profit claim."],
           [/(skip the a[nñ]ejo|safer choice)/i, "It ignores the Sunday sipping she told you about."]] },
  "buyer:4": {
    need: [[/(taste|pour|tasting)/i, "a tasting"],
           [/(thursday|monday|tuesday|wednesday|friday|saturday|sunday|tomorrow|this week)/i, "a date"],
           [/(menu|wording|team)/i, "her team and menu wording"]],
    bad: [[/(order form|sign)/i, "An order form before a tasting is too much, too soon."],
           [/(brand story and prices|share it with your family)/i, "No date, and homework for her."],
           [/(launch night|next month)/i, "Too big and too far out."],
           [/(just order)/i, "Pressure and an unprovable promise."]] },

  // ---------------- Trouble at the Store ----------------
  // Typed answers describe what you would do. Anything that confronts, provokes or abandons people is unsafe.
  "stickup:0": {
    need: [[/(calm|quiet|stay low|stay down|get down)/i, "stay calm and quiet"],
           [/(do what he says|follow|comply|cooperate|give him|let him|do as he)/i, "do what he says"],
           [/(hands|visible|see them|can see)/i, "keep your hands visible"]],
    bad: [[/(charge|tackle|grab (him|it|whatever)|fight|attack|try to stop|stop him|wrestle|disarm|confront|be a hero|play hero)/i, "Never physically confront a robber. Nothing in the store is worth a person's safety."],
           [/(slip out|side door|run (for|out)|run and)/i, "Leaving others alone with him isn't the safe choice."],
           [/(already called|loudly|police.{0,20}panic)/i, "Provoking him puts everyone at risk."],
           [/(step between|talk him down|get in between)/i, "Putting yourself between them escalates the danger."]] },
  "stickup:1": {
    need: [[/(hurt|okay|safe|injur|check)/i, "check that nobody is hurt"],
           [/(911|police|dispatcher)/i, "call 911"],
           [/(stay|wait|with ben)/i, "stay with Ben"]],
    bad: [[/(leave quickly|before the police|paperwork)/i, "Leaving someone in shock alone is the opposite of earning trust."],
           [/(run after|chase|license plate)/i, "Chasing him is unsafe."],
           [/(tidy|put things back|reopen)/i, "Cleaning up disturbs what police need to see."],
           [/(social media|post about)/i, "Posting isn't the priority."]] },
  "stickup:2": {
    need: [[/(statement|cooperate|officers|police)/i, "cooperate with police"],
           [/(offer|ask|what would help|help)/i, "offer help"],
           [/(stay|staying|call|closing up|with him|together)/i, "stay with him"]],
    bad: [[/(lock in a deal|restock|perfect time)/i, "Using a crisis to sell is a line you can't uncross."],
           [/(your card|settle down)/i, "That leaves him alone when he needs help now."],
           [/(take over|take charge|what to do)/i, "Taking over oversteps. Ask what he needs."],
           [/(free bottle|on the house)/i, "Gifting alcohol in a crisis is tone-deaf."]] },
  "stickup:3": {
    need: [[/(stop by|drop in|visit|check in|go by|swing by|show up)/i, "check in in person"],
           [/(how (ben|he|they)|holding up|doing|okay)/i, "ask how he's doing"],
           [/(help|anything|practical|offer)/i, "offer help"]],
    bad: [[/(skip it|awkward|needs space)/i, "He will remember who showed up and who didn't."],
           [/(bottle of corrido|a bottle|gift)/i, "A gift of alcohol after a crisis isn't right."],
           [/(tasting|schedule)/i, "Mixing the check-in with a sales ask spoils it."],
           [/(few weeks|price sheet|pick up where)/i, "Too late, and back to business as usual."]] },
  "stickup:4": {
    need: [[/(thank|thanks)/i, "thank him"],
           [/(shoppers?|who shops|what they buy|customers?)/i, "ask about his shoppers"],
           [/(small|one bottle|shelf card|start)/i, "suggest a small start"]],
    bad: [[/(owes? you|remind him how)/i, "Calling in a favor destroys the trust you earned."],
           [/(full lineup)/i, "Trading on trust to oversell."],
           [/(robbery|security|introduce him)/i, "Off topic, and it reopens a wound."],
           [/(discount|special bond)/i, "An unauthorized discount cheapens the trust."]] },
};
