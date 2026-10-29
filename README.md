# Corrido Sales Academy (solo mock)

A playable mock of the "AI Sales Training Coach" from the CIS 591 project brief, built to give the team ideas.
It is **not** the team's build, it is **not** in GitHub, and nothing in it is approved by Tequila Corrido.
No input from Ken yet, so every script, rubric rule and score is a labeled draft.

## Run it

```bash
cd "mock-prototype"
python3 -m http.server 8766
```

Open http://localhost:8766/ (it needs a local server, not a double-click on `index.html`).

## It is free

No accounts, no API bills, nothing uploaded. Progress lives in your browser only (`localStorage`).
What it loads from the internet:

| What | From | When |
|---|---|---|
| Fonts | Google Fonts | always |
| Tequila Corrido bottle, record and merch photos, and the logo on the first screen | the brand's own site (`ilovetequilacorrido.com`, linked live) | always. Needs internet. Swap for approved files from Ken before sharing outside the team. |
| Face model for the camera coach | jsDelivr and Google storage (MediaPipe, open source) | only if you turn the camera coach on |
| Gemini free tier | Google | only if you paste your own free key into the optional AI judge |

## What it covers from the brief

| Brief | In the mock |
|---|---|
| Personas with hidden objections | 13 missions, each customer hides a worry that is revealed on the scorecard |
| Behavioral chat | Spoken sales-script conversations: the customer talks, you answer out loud (or type), your avatar plays your answer back in your own recorded voice with its mouth moving with the sound, and the customer replies to what you said |
| Coach mode and hints | A checkbox in the screen before each mission (on by default for Easy missions). With it on, you see what your answer got right and missed right after each answer, before the next question. On Levels 3 and up the checklist is hidden, and a **Show a hint** button gives the same help for 5 XP. Boss battles have neither, so they are scored only at the end |
| Post-session scorecard | Every answer scored out of 5 at the end: 4 points for what you said (what you mentioned, what you missed, what knocked points off) and 1 for tone, with a stronger answer to compare to and a button to hear yourself again. Plus a delivery score from the camera |
| Edge-case library | Pricing pushback (Marco, Dana), competitor comparison (Ray), compliance (Jess), gatekeeper (Sam), product matching (Mia), a store owner who says no (Tony), reading the buyer (Rafael), a store robbery (Ben) |
| Grading | A free rule-based rubric (see `criteria.js`) scores each answer. No account, no cost. The old optional Gemini judge is still in `coach.js` but is not wired into the new flow |
| Voice input | Record button in every mission (browser speech recognition, Chrome or Edge). Typing always works |
| Body-language rating (stretch) | Camera coach is on by default and highly recommended: eye contact, posture, presence and smile, scored out of 5. Video never leaves the device |
| Points, ranks, badges, leaderboard (stretch) | XP and six ranks (Rookie, Opener, Closer, Rainmaker, Corrido Legend, Master Rep), 20 badges (6 boss badges with each boss's face on a medal in bronze, silver, gold, emerald, ruby and diamond, plus boss feats and 12 mission badges, one of them for finishing the knowledge check), daily streak, team board using short share codes (about 20 characters, like `csa2.297x1hx.Taylor`, with a check letter for typos; codes from the first version still work; `tests/teamcode.test.js`) |
| Tiers, bosses and merch rewards | Six tiers from Trainee to Seasoned Seller. A boss battle ends each tier: Brand Brain (ten timed questions), Priya, Mia, Rafael, Dana and the Bad-Tempered Owner. Beating a boss moves you up a tier. Finishing a mission unlocks real Corrido merch for your character |
| Sign-in | Age check, then "continue as guest", **Sign in with Google** (switches on when a free client ID is added, see below) or an email that is only saved on this device. Company sign-in comes with the rollout |
| Manager mode | Open to anyone with the link while in prototype: a class dashboard, coaching (with a team huddle), what reps actually said (with notes), assignments, brand facts, a CSV invite page, leaderboards and the answer grader. Uses sample data. See below |
| The map | A winding road with a boss's face on each boss stop (a dark silhouette while it is still locked), a banner at the start of each tier, and on a wide screen a side panel with your rep, the next unlock and the next boss with the boss badges. The rep card and the tier bar open Dashboard > Progress, the badges card opens Dashboard > Badges, and the next unlock opens the character creator (all work from the keyboard). A stop you just finished pops and a light runs along the road to the next one, and a beaten boss makes the next tier's banner pop in. On a phone the side panels hide and the banners shorten to "Tier 3" |
| Boss battle theme | A corrido-style tune made in code with the browser's Web Audio (no files): a driving oom-pah of bass and strummed guitar, a snare on the backbeat and mariachi trumpets in A minor over the record-player crackle. It plays only on the boss screen, and stops when you go back, go anywhere else, or start the battle (a practice run too). Tier Up has its own victory music in A major, and finishing the season plays a longer one; both are cut off the moment you leave the screen. A lost boss battle plays its own defeat sting (a low toll, a soft snare roll, the Am - G - F - E - Am turn with a trumpet sagging down to A, and a record winding to a stop); an ordinary mission loss keeps the short guitar line |
| Results screens | Compact: the score, stars and the customer (looking how the conversation left them, with their last words) share one header row, new badges appear as the real medals, and each answer is a row showing its score and one line, which you open for the detail (the ones that need work start open, and one button opens or closes them all). Stars follow the score out of 100 and go up in halves (100% is 3 stars, 50% is 1.5), so a half star is half filled on the results, the map and the history. Passing is a separate test, the mission's pass mark, so a score can show stars and still miss the pass mark. They pop in one after another, and three stars brings confetti. When every answer scores the same it says so instead of naming a strongest and weakest. The footer hearts show only inside a lesson. The page doesn't bounce past the top, so nothing shows behind it |
| Customer reactions | The customer's face follows the conversation: brows, mouth and cheeks go from delighted to pleased, plain, unsure or annoyed, and a small reaction pops up beside them after each answer. Harder levels start the customer more guarded |
| Answer grader (manager mode > Grader) | For managers only, because it shows the model answers. For every question: what a good answer looks like and why, the partly-there and not-good answers with the reason for each, and a box to type any answer and see the score, the arithmetic behind it, what it covered, the mistakes, the tone notes and how the customer would react. It is the same grader the missions use, so the team and the client can check it against their own judgement |
| Dashboard progress | The tier ladder is first: six steps with each boss's medal in colour once beaten, where you are now, the next boss and the merch meter. Skills are a radar chart of up to seven skill areas in the order of a sales call (Opening, Discovery, Product & story, Price & margin, Objections, Closing, Compliance & calm) once there are scores in three of them (bars before that), with the weakest area marked and every individual skill listed under "All skills" |
| Rep dashboard | Progress, badges, team, review, knowledge check and settings |
| Quick start (first run) | After the age check and sign-in, a new player creates their rep (every option is there from the start, and it begins from a random look with a clear face), sees a short three-card tutorial (skippable; replayable from Dashboard > Settings > Help), and lands on a locked map with a "Step 1" card: the 10-question knowledge check is required before the first stop, and the map opens when it is done (a rep who already has finished stops is not locked out; it can be retaken from Dashboard > Knowledge check). Nothing else opens by itself: the Next up bar shows where to begin |
| Try this question again | Every answer under 4 out of 5 on a results screen has a button that replays just that question, same customer, with the checklist hidden. It is practice (no stop is marked done) but earns XP, feeds the skill scores, and a good answer clears that moment from Review. The results compare the two scores |
| How you sounded (and hearing a stronger answer) | After each answer (right after it in coach mode, and on the results screen) a short "How you sounded" list in plain words: pace against the customer's range, filler words (named and counted), hedging, long pauses, volume and voice variety, each marked on target or not. A typed answer gets the filler and hedging lines. A "Hear it" button beside every stronger answer plays it out loud at the pace that customer calls for (on a mission screen your own avatar says it). The Progress tab has a "How you sound" card from your last 20 answers, and the results screen a line across the whole mission. Speech recognition often drops "um" and "uh", so a spoken filler count can be low |
| Surprise customer | Practice, not a map stop: five curveballs from six customers you haven't met, one of each kind (they interrupt and give you 30 to 40 seconds, go quiet, change the subject, push back hard, or brush you off), a different five each time, scored by the same coach (`surprise.js`, `tests/surprise.test.js`). It opens on the Progress tab once The Quiet Bar is done. It never unlocks anything and can't earn Tough Crowd |
| Who is Tequila Corrido? (the 60-second review) | The page a rep reads before a sale, as quick reminders only: the promise in one line (with the name, the maker and "no famous fans"), the four bottles with photos at their public shop prices (each opens that bottle's page on the shop in a new tab), short Do and Never lists, what to say to six usual objections, and, folded away, a per-pour cost calculator (bottle cost, size, pour size and menu price in; pours per bottle, cost per pour, pour cost, and what a bottle brings in out) and the shop's merch list. It uses only public facts and the numbers typed in, never quotes a margin or wholesale price, and has no other links to the website |
| Time estimates | "About 6 min" shows in the screen before a stop and in the Next up bar (not on every stop, so the map stays clear) |
| Customers that change | Each customer has a second way to say their later lines (facts, prices and days stay the same). On a replay you never get the same version twice in a row, so you practise the idea, not the wording |
| Accessibility | Checked by a script across 52 screens at desktop and phone width: text colours meet WCAG AA, every page has a heading, every control has a name, tap targets are at least 24 px, focus rings show on every kind of control, nothing scrolls sideways at 320 px, and the age gate locks the page behind it. Still for a person to check: a real screen-reader run, and captions on any video added later |
| "Help people understand who Corrido is" (Ken) | 4 brand lessons, quizzes that get harder with difficulty and a "Who is Tequila Corrido?" page with the promise, lineup, story and selling rules (reached from the header on every screen, next to a link to the real website that opens in a new tab) |
| Practice and review | The Dashboard's Review tab (with a count) collects every wrong answer with a stronger one, and its Progress tab has a Practice button that replays your weakest skill across different customers. Neither is on the map. Missions also open with a different line on replay |

Missions get harder as you go. Each has a difficulty (Easy, Easy, Medium, Hard, Expert, from 1 to 5 in the code) that sets the pass mark, how long an answer can be, how warm the customer starts and whether you see what a strong answer should mention. The ladder runs from an empty bar and a friendly new shop owner, through a gatekeeper, a hotel lounge, a buyer you have to read and a confused gas-station clerk, up to a price-focused distributor, a skeptical bar owner, a crisis, a compliance trap, a flat "no" and finally a bad-tempered bar owner. Brand lessons stay as short quizzes.

How scoring works: each answer is worth 5 points. Four are for what you say, split equally across the things it should mention (for example "give a specific day"), with a point knocked off for each mistake (hype, a health claim, running down another brand, being vague). One point is for **tone**, judged for the situation: a nervous shop owner needs a slow, warm voice, a rude bar owner needs you calm and steady (no snapping, no grovelling), a distributor wants confidence. Tone looks at your words (warmth, pushiness, jargon, hedging) and, when you speak, your voice (pace, long pauses, volume and how flat or lively you sound). Scores are shown only at the end, like a recorded interview.

Your voice is recorded on your device with the browser's MediaRecorder so your avatar can play it back and so the tone can be analysed. The recording stays in memory, is never saved or uploaded, and is gone when you leave the results page. If the browser can't record, or you typed, the avatar reads your words aloud and tone is judged from your words only. The pitch and pace checks were tested on synthetic audio, not on real voices, so treat those notes as guidance.

Three missions come from advice from the team's contact Ken. **The Hard No** (Tony): when an owner says no, find a way in by learning who he sells to and what appeals to them. **Know Your Buyer** (Rafael): fit the pitch to the buyer and stay honest. **Trouble at the Store** (Ben): a robbery. The right answers teach staying calm, complying, calling 911, staying with the owner and checking in later. They do not teach physically stopping the robber, because confronting an armed person can get people hurt. Confirm with Ken what they meant by "try to stop it".

## Rank, tier and difficulty (three different words)

The game has three ladders, and each has its own word so a rep never has to guess: **Rank** is XP (Rookie, Opener, Closer, Rainmaker, Corrido Legend, Master Rep: shown by name in the footer, on the Dashboard and on the map card). **Tier** is bosses beaten (Trainee to Seasoned Seller). **Difficulty** is how hard a mission is (Easy, Medium, Hard or Expert, with no number). `tests/usability.test.js` checks that no screen says "Lv" or "Level 4" and that the three sets of names never share a word. An older saved history that says "Level 4" is shown as "Hard".

## Small usability rules

- **On a phone** (700px or less) the Record button on a mission stays pinned above the stats bar while you read the question, so it is never below the fold.
- **The map** opens on the next stop to play (not at the top of a long road), and a stop you just finished scrolls into view with the next one beside it.
- **The camera reminder** shows on the first question of a mission only, with an "x" that switches it off for good.
- **Feedback** after an answer shows what to fix first (two things at most) and a stronger answer with its Hear it button. What went well, tone and how you sounded are one tap away.
- **Photos** show a soft shimmer in their own space while they load, and stop for anyone who asks for less motion.
- **The manager pages** are full width: the brown header bar runs edge to edge on any screen, with the Tequila Corrido logo, a thin rule and SALES ACADEMY with a MANAGER tag on the left (the same logo as the first screen and the map header), your name and the way back on the right, and the eight pages as one even row of tabs under them. Its logo lines up with the content column (1200px). On a small phone the back button shrinks to an arrow and the tabs slide sideways.
- **The first screen** (age check, then sign-in) is a night market drawn entirely in code: papel picado flags on a string across the top, agave plants along the bottom, the Tequila Corrido logo (their white script) in a gold spotlight where the title goes, a sunburst behind it, a cream age-check card with a red 21+ coin, and a glass card for sign-in. It shows one card at a time: the age check first, then, after "Yes" (which becomes a small "21+ confirmed"), the sign-in card in its place, so it needs no scrolling on a laptop or a phone from 1440x800 down to 320x568 (the logo is one size on both steps and shrinks only as the screen gets shorter, and the tagline gives way on short screens). It never grows wider than the screen, down to 300px (`tests/usability.test.js`, the click-through test, and `tests/a11y.test.js` for its colours).

## Tiers, bosses and merch

- **Tiers:** Trainee, Associate Rep, Field Rep, Senior Rep, Key Account Rep, Seasoned Seller. Your tier is how many bosses you have beaten. Each boss is the last stop of its difficulty, so the five mission difficulties line up with tiers 1 to 5 (`tests/tiers.test.js` checks it).
- **Bosses** use the existing missions, so their timings are unchanged: Priya (3.5 / 5 to win), Mia (3.5), Rafael (4.0, voice only if your browser can record), Dana (4.0, voice only) and the Bad-Tempered Owner (4.2, voice only). A health claim or a pressure tactic loses a boss battle instantly. Brand Brain is ten questions, fifteen seconds each, 80% to win. Three tries a day per boss, and a Practice first option that does not count.
- **Merch:** 42 pieces (36 shirts and polos, 6 hats). The creator shows them as one tabbed photo grid (T-shirts, Polos, Hats) so the page stays short. Twenty are free from the start (fifteen shirts, five hats) so there is a choice in the creator on day one. The other 22 are each unlocked by beating a level (what a stop unlocks is shown on the screen before you start it, not on the map) (see `REWARDS` in `tiers.js`; `tests/tiers.test.js` checks every piece is unlocked exactly once). A boss win also moves you up a tier and shows the Tier Up screen with a shareable tier card (name, avatar and tier only). Some pieces come in one cut only. The Tequila Era tee has a women's cut (its own photo, name and shop page), and a woman sees that one. The Military Green Era tee is the men's cut, so it sits next to the grey one for men only, and a woman gets the Tequila Smuggler Tee at Priya's stop instead (41 pieces for a woman, 42 for a man; `tests/tiers.test.js` checks every piece is still unlocked once). Shirts whose product photo has sleeves splayed out sideways (Mas Tequila, Classic, Delivery, Smuggler, Worth the Shot, Spirit Animal, the Era tees and the Pickleball Raglan) keep the photo's body, and their sleeves are drawn over the arms in the shirt's colour: cap sleeves for a man (shaped like the Tequila On My Mind tee's), a boxier sleeve for a woman (like the women's Era tee). The numbers for each shirt are measured from its photo (the `DRAWN` table in `merch.js`).
- **Smile:** the creator has a Smile row under Lip color (or Facial hair): Neutral, Soft smile, Warm smile, Big smile, Grin, Smirk and Laugh. The smile is drawn over the plain mouth and hides while your character talks, so the lip-sync in missions still works, then it comes back. Older saved characters start Neutral. Randomize picks one too.
- **Name check:** the character's name has to pass a word list in the browser (English and Spanish) before Save & continue turns on, and a note under the field says why when it does not. It catches the obvious cases and the usual dodges (capitals, repeated letters, symbols for letters, spaced-out letters, accents), and leaves names like Hancock or Essex alone. The list is stored encoded in `names.js`; `node tools/names-list.js` prints it and `add` / `remove` change it. Someone who edits their own saved data can get around it, so a server check is still needed once there is one (with Google sign-in, for example).
- **Presenter mode** (for demos): start it from the sign-in screen ("Presenting this? Skip setup with sample progress", available once the age check is done) or from Dashboard > Settings > Prototype tools. It loads a sample rep ("Demo Rep") who is part-way through the season, at a random point each time (never empty, never finished), with history, badges, mistakes to review, a before-and-after knowledge check and demo teammates, and adds a small Presenter menu at the bottom left with 30 jumps: the age check, character, tutorial, map, the screen before a stop, a lesson, a mission, results (a win, not this time), boss intro, Brand Brain, a lost boss, Tier Up, every Dashboard tab, the brand page, all five manager pages and four Avatar check sheets (every shirt's arms and sleeves, its neck and collar, the bottom of the preview, and every hairstyle on every head shape). A 5-minute demo script is in `DEMO.md`. The result and Tier Up screens are played through the real screens with typed answers, so they are the real thing (about a second). Your own progress and character are kept safe while it is on and come back exactly as they were when you leave ("Leave presenter mode" in the menu or in Settings). Three buttons in the menu footer switch the progress while keeping the character: **Start over: nothing complete** (a first-day player: no stops done, 0 XP), **Random sample progress** (a different point part-way through the season each press, never empty and never finished), and **Complete the game** (all 16 stops at three stars, all six bosses, every badge and piece of merch, Tier 5, Master Rep). If you close the tab mid-demo the sample stays until you leave. The menu never appears before the age check.
- **Prototype tools** (Dashboard, Settings): every stop open, every piece of merch unlocked, and unlimited boss tries. All three are off by default: each stop stays locked on the map until the one before it is done, merch has to be earned, and a boss gives three tries a day. Presenter mode turns unlimited tries on for its sample player so a demo can retry a boss.

## Turn on Sign in with Google

The sign-in screen has a Google button, but Google only allows it once the app has a **client ID**. A client ID is free and is meant to be public, but only you can create it because it needs your Google login. Until then the screen shows "Sign in with Google · not set up yet". Takes about five minutes:

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a project (any name).
2. Open **APIs & Services > OAuth consent screen** (or **Google Auth Platform**). Choose **External**, name the app "Tequila Corrido Sales Academy", add your email as the support contact, and keep the default scopes (openid, email, profile). While the app is in **Testing**, add the Google accounts that should be able to sign in under **Test users**.
3. Open **APIs & Services > Credentials > Create credentials > OAuth client ID**, choose **Web application**, and under **Authorized JavaScript origins** add `http://localhost:8766` and `https://corrido-sales-academy-mock.vercel.app` (the address only, no slash at the end and no path). No redirect address is needed.
4. Copy the client ID (it ends in `.apps.googleusercontent.com`). Either paste it into `googleClientId` in `config.js` (on for everyone once pushed), or paste it into **Dashboard > Settings > Account** (this device only, handy for trying it). Reload the page and the Google button appears.

Optional: set `googleDomain` in `config.js` (for example `"tequilacorrido.com"`) to let only that company's Google accounts in.

What it does and does not do: the browser gets a signed token from Google and reads the name and email from it. Only the name and email are kept, on this device, and the character's name starts as the first name. There is no server, so nothing checks the token's signature. That makes it fine for the prototype and **not real security**: the company rollout needs the token verified on a server (for example Firebase Auth or Amazon Cognito) before it protects anything. Google's script is only loaded after the age check, and only when a client ID is set. If you use a university Google account for the Cloud project, check the university's rules first.

## Manager mode (prototype)

Open the link ending in `#manager`, use the "Manager? Open the manager view" link on the first screen, or the "Open manager mode" button on the Dashboard (Team tab, and Settings). There is no sign-in or permission check: anyone with the link can open it. The class on the Cohorts page is **sample data** (labelled), plus your own row. Invite lets you upload a CSV (name, email, team), checks it, and creates a class that is saved **on this device only**. Invites are **not emailed**: you copy an invite message instead. Nudge only records the nudge on this device. A real version needs company sign-in and a shared database.

**Coaching** (manager mode > Coaching) shows the class's skills lowest first, each with the stop that practices it, a team drill for the week with a message to copy, and the reps who need one-to-one coaching (lost a boss 3 times, or no practice for 3+ days). Each rep gets the skill to work on, the stop to practice (the first one that practices the skill and that the rep has reached, an ordinary stop before a boss), one tip, and a message to copy. "Mark as coached" is recorded on this device only, and nothing is sent.

**Answers** (manager mode > Answers) lists what reps actually said, newest first: the customer's line, the question, the rep's words beside a stronger answer, the score split into what was said and tone, what was missed, the pace and filler words, and a box to leave a note. A note on the player's own answer shows on their Review page (a dot on the tab and a line on the Progress tab tell them; it counts as read once they open Review). A rep's answers are kept as text on their own device (never the recording; Dashboard > Settings can clear them), so in this prototype a manager only sees answers made in this browser. The sample reps have sample answers: real answers from the missions, scored by the real coach, the same every time (`answers.js`).

**Team huddle** (on the Coaching page) is the one question the most reps scored under 3.5 on, with how many, what was missed most, a stronger answer, and a plan for five minutes (read it aloud, one sentence each, compare, say it again in pairs, one line to keep) that can be copied or assigned.

**Assign** (manager mode > Assign) picks a stop, who it is for (the class, a team or one rep) and a due date, with an optional note. It shows how many have finished and who has not, and a message to copy. The rep sees one slim line on their map for each stop still to do (two at most) with a button that goes to it, and a card on the Progress tab. The Coaching page has "Assign this stop" beside the team drill, the huddle and each rep's suggested stop (`assign.js`).

**Brand facts** (manager mode > Brand facts) edits what the game says without touching code: the four public bottle prices, the review's one-line promise, Do, Never and what to say to each objection, the "Did you know?" lines, when the prices were last checked, and who at the brand confirmed the wording (shown on the review, or "draft"). A price change reaches every mission, lesson answer, scoring rule, the review and the calculator in one go, and "Back to the original wording" undoes it exactly. Prices must be 20 to 500, all different, with the Añejo the dearest (a lesson asks which is the priciest). Saved on this device only (`facts.js`, `tests/facts.test.js`).

**Spreadsheets:** the Cohorts page downloads a progress report (a row for each rep: stops finished, answers scored, average score, weakest skill, pace, filler words, assignments, last active), the skills for each rep, and every answer; the Answers page downloads the answers. Text that starts with = + - or @ gets a quote in front so a spreadsheet can't run it as a formula.

**On a phone** (700px wide or less) the header buttons give way to a bottom bar with Map, Dashboard, Character, Brand and Website, with the current page marked. It steps aside during a mission or lesson (the X leaves it) and on the first-run and manager screens; the stats footer sits just above it.

## Files

| File | What it holds |
|---|---|
| `index.html` | the page: markup, styles and the script tags (no code of its own) |
| `app.js` | the page's basics: saved progress, toasts, the age gate, difficulty settings, timers, shared helpers. First of the page's own scripts |
| `dialog.js`, `nav.js`, `practice.js` | the popup before a stop; the header buttons and phone tab bar; practice a weak skill |
| `explorer.js`, `map.js` | the shop list and the Who is Tequila Corrido? page; the home page (tier bar, map of stops) |
| `people.js`, `hair.js` | the drawn people (hands, bodies, polos, faces, smiles); skin and hair colours and the hairstyles |
| `merch.js`, `avatar.js`, `creator.js` | the merch photos and the numbers measured from them; the rep's avatar; the character creator |
| `scenes.js`, `results.js`, `start.js` | customers and the bar scene; speech helpers and the results screen; the start of the game (last script) |
| `scenarios.js` | mission scripts, difficulties and the three replies a customer can give (edit here to change missions) |
| `mission.js` | the spoken mission flow: recording, avatar playback with lip movement, customer reply and the scorecard |
| `criteria.js` | the rubric for each question: what to mention and what costs points (draft) |
| `coach.js` | the scoring (`Coach.score`: 4 content points plus 1 tone point) and the old optional Gemini judge |
| `tiers.js` | tiers, bosses, merch rewards and the prototype switches |
| `boss.js` | the boss battle screen, the Brand Brain quiz, Tier Up and the shareable tier card |
| `manager.js` | manager mode: cohorts, coaching, invite and leaderboards, and the spreadsheets |
| `answers.js`, `mgranswers.js` | the answer log, the sample class's sample answers and "the question the class misses most"; manager mode > Answers and the team huddle |
| `assign.js` | assignments: the manager page, progress against it, and the strip on the rep's map |
| `facts.js` | brand facts: prices and wording a manager can change, and the swap that carries a price change through the whole game |
| `surprise.js` | the surprise customer: ten curveball questions, their scoring rules, and the Progress tab card |
| `callcard.js` | the 60-second review on the Who is Tequila Corrido? page, and the pour-cost calculator |
| `icons.js` | `ic(name)`: the drawn icons (sound, hearts, mic) that replace emoji, so they look the same on every device (streak, XP and merch stay emoji); the shapes are the sprite at the top of `index.html` |
| `presenter.js` | presenter mode: the sample player, the jump menu, and safe switching in and out |
| `avatarcheck.js` | the Presenter menu's Avatar check sheets: every shirt, or every hairstyle on every head shape, on one page |
| `sw.js` | the offline copy: the app and the shop photos are kept on the device after one visit, so a demo works on bad Wi-Fi |
| `tools/` | `smoke.js` clicks through the whole game in a real Chrome and fails on any error (`node tools/smoke.js`); `cdp.js` is the tiny Chrome client it uses. No installs |
| `DEMO.md` | a 6-minute demo script that uses Presenter mode |
| `tone.js` | how tone is judged from your words and your voice, for the situation, and the "How you sounded" lines |
| `names.js` | the name check for the character: a free word list in the browser (English and Spanish), stored encoded so the words are not written out in the file; `tools/names-list.js` prints, adds to and removes from it |
| `lessons.js` | brand lessons, question bank, knowledge check |
| `progress.js` | saving, ranks, badges, streak, team share codes |
| `config.js`, `auth.js` | the Google client ID switch, and Sign in with Google (token checks, button, sign out) |
| `badges.js` | the badge medals (boss faces, metals, ribbons), awarding boss badges |
| `voices.js` | giving each customer a distinct voice and accent, and speaking like a person |
| `dashboard.js` | the rep dashboard |
| `grader.js` | the manager Grader page: good and not-good answers, and score any answer to see why |
| `camera.js` | optional camera coach |
| `tests/` | `teamcode`, `usability`, `surprise`, `answers`, `assign`, `facts`, `scoring`, `tone`, `tiers`, `badges`, `voices`, `reactions`, `sound`, `map`, `phone`, `coaching`, `results`, `auth`, `natural`, `globals`, `camera`, `smile`, `presenter`, `callcard`, `learning`, `a11y`, `outfits`, `skills`, `hair`, `offline` and `avatarcheck` tests |

## Tests

```bash
node tests/scoring.test.js  # every model answer scores 4.2+ out of 5, every weak example scores clearly lower
node tests/tone.test.js     # tone rules on words, and voice maths on synthetic audio
node tests/tiers.test.js    # every piece of merch is unlocked once, bosses are in order and on the map
node tests/badges.test.js   # a badge for every boss, awarded once, caught up from earlier progress
node tests/voices.test.js   # each customer gets a different voice, lines are paced like speech
node tests/reactions.test.js # customer faces react to the conversation, and the grader's arithmetic adds up
node tests/sound.test.js    # room music only plays during a mission and the boss theme only on the boss screen; the defeat sting plays for a lost boss; both go quiet when the page is hidden; the tune stays in key
node tests/map.test.js      # tier banners, the pop for a finished stop, side panels and their links, the ladder and the radar
node tests/callcard.test.js  # the first run, Try this question again, the 60-second review (the four bottle links, and no other website links) and the calculator's maths, time estimates
node tests/presenter.test.js # presenter mode: a consistent sample player, real progress always comes back, and the menu can't skip the age check
node tests/smile.test.js    # the rep's smile styles: shapes, the creator row, saving, and the mouth still moving while talking
node tests/phone.test.js    # the phone bottom bar: its five places, when it shows, and that tapping it never sends you home
node tests/coaching.test.js # the manager Coaching page: every skill has a topic, the suggested stop is real and within reach, the messages read well
node tests/results.test.js  # medals, stars, the customer on the results, the tie line, hearts only in lessons
node tests/icons.test.js # every icon a screen asks for is in the sprite, the heart, sound and mic icons are drawn not emoji (streak, XP and merch are emoji), and the Presenter button sits in the footer bar
node tests/bossstars.test.js # the Brand Brain boss gives stars for its score (10 of 10 is 3, 9 of 10 is 2.5, not always one), and a better replay raises them
node tests/auth.test.js     # Google token checks: wrong app, expired, unverified, wrong company
node tests/natural.test.js  # answers in ordinary words score fairly; hype, health claims and pushiness are caught; a question can't lose a boss battle
node tests/globals.test.js  # no two scripts declare the same name (a clash stops a file loading), and the page's own scripts are the last ones, in the order `tests/page.js` lists (that file puts them back into one text for the tests that search the page)
node tests/camera.test.js   # face maths with fake landmarks
node tests/learning.test.js # coach mode defaults, the hint costs 5 XP, every customer's second lines keep the same facts and alternate
node tests/a11y.test.js     # colour contrast of the key pairs, page headings, focus rings, tap size, no tiny text
node tests/outfits.test.js  # the shirts with drawn sleeves (cap sleeves for a man, boxier for a woman, the Raglan's 3/4 sleeves), the polos, the neck skin on every shirt, the shadow under each cuff, and the bottom of the preview (a scooped hem is filled in, the trousers sit narrower than any hem)
node tests/skills.test.js   # the Skills chart: every skill is in one family, no radar label overlaps another, every skill is still listed
node tests/offline.test.js  # the offline copy: photos kept after the first load and served when the network fails, the app's files network-first, nothing else touched
node tests/avatarcheck.test.js # the Avatar check sheets: one picture per shirt or hairstyle in its own frame, and the player's avatar put back
node tests/hair.test.js     # every hairstyle is attached to every head shape (no gap at the temples), and parting or shine lines stay on the head
node tests/usability.test.js # each ladder has its own word, the Record button is pinned on a phone, the map opens on the next stop, the camera reminder shows once, feedback folds, photos have a placeholder, one gold button style, the one-line save note
node tests/names.test.js     # the character's name check: obvious bad names (and the usual ways to dodge it) are refused, ordinary names like Hancock or Essex are not, the list is stored encoded, and the creator, sign-in and loading all use it
node tests/teamcode.test.js # the team board's share codes: about 20 characters, read back exactly, any one typo is caught, forged values refused, old long codes still read
node tests/surprise.test.js # the surprise customer: ten curveballs in five kinds, every right answer scores 4.2+ and every wrong one under 3.4, a round is one of each kind, the mission screen handles a short timer and a silent customer
node tests/answers.test.js  # the answer log (words only), the sample class's answers are real and the same every time, the question the class misses most, a manager's note reaching the rep, and safe spreadsheets
node tests/assign.test.js   # assignments: who it covers, the sample reps' progress, due dates in words, the one line on the map, and nothing a manager types can inject markup
node tests/facts.test.js    # brand facts: a price change reaches every mission, lesson, scoring rule and the review, can be undone exactly, bad input is refused
```

The unit tests need only Node. `node tools/smoke.js` is a separate click-through test: it opens the game in a real Chrome (set `CHROME` if it is not in the usual place), plays the first run, visits every Presenter menu jump, draws every shirt and hairstyle, checks the offline copy, and fails on any error in the page. It needs an internet connection for the shop photos and installs nothing.

## Known limits (be honest about these in the pitch)

- **The "AI" is mostly rules.** The built-in coach matches patterns in the rep's words. It is predictable and free, but it can be fooled by unusual phrasing. A real LLM would be better. The Gemini judge exists as a free option but was **not tested** (no key was available).
- **The camera coach was never run on a real webcam.** The Browser pane blocked the camera. The maths is unit-tested with fake landmarks. Expect to tune thresholds.
- **Voices** depend on what is installed on the computer. Each customer is given their own installed voice by gender and accent (British, Australian, Irish, Indian, South African and American where available), speaks a sentence at a time with natural pauses, and sounds warmer or colder depending on how the rep answered. Dashboard > Settings > Customer voices lists who got which voice, with a play button. Edge's free Natural voices and Premium Mac voices sound much better.
- **Phone layout** was checked in an emulator at 375 px wide, not on a real phone.
- **Manager pages show this browser's data.** Answers, notes, assignments and brand facts are saved on one device. A manager sees the answers made in the same browser, a rep only sees a note or an assignment made in the same browser, and the sample reps are sample data. Making it real needs a shared database and company sign-in.
- **Filler words from speech** are counted from the words the browser heard, and its speech recognition often leaves out "um" and "uh", so the count can be low.
- **The team board** only updates when someone shares a new code. A real shared leaderboard needs a backend (free tiers exist, but they need an account).
- **Merch and bottle photos** are the brand's own images, linked live. The merch is photographed flat, so it is trimmed onto the character, not draped.
- **Content is draft.** Prices and tasting notes come from the public site. Margins, wholesale terms and sales numbers are not public, so right answers never invent them.

## Ideas for the team

1. Decide how real the AI should be: rules only (free, predictable), a free LLM tier, or a hosted model.
2. Get a real "good pitch" from Ken and turn it into the rubric in `criteria.js`.
3. Ask whether reps would use voice on the job, because that decides how much to invest in speech.
4. Decide if the leaderboard needs to be live, which means picking a free backend.
5. Replace hotlinked images with approved assets.
6. Split work by skill: personas and prompts, rubric and grading, front end and gamification, voice and camera, content and QA.

## Design tools (approved for this solo mock)

Five free, MIT-licensed outside tools are installed for the mock's design and quality work, in a local `.claude/` folder that is not part of this repo (the push leaves it out). They are reference material and skills for the AI assistant; nothing in the game's code depends on them.

| Tool | What was installed |
|---|---|
| [UI UX Pro Max skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | The `ui-ux-pro-max` skill only (its search script, style data and references). The repo's other bundled skills (brand, slides, design-system and so on) were left out. |
| [Awesome DESIGN.md](https://github.com/VoltAgent/awesome-design-md) | The 84 company design guides, kept as reference only. Tequila Corrido keeps its own look and does not copy another brand's. |
| [Emil Kowalski's skills](https://github.com/attentiondotnet/emilkowalski_skills) | Four skills copied as plain files: `emil-design-eng`, `review-animations`, `animation-vocabulary`, `apple-design`. |
| [Taste skill](https://github.com/Leonxlnx/taste-skill) | The `design-taste-frontend` skill. Its scripts need Node 22 or newer and Chrome, and its photo search sends only the search words to open image collections. |
| [Web Quality Skills](https://github.com/addyosmani/web-quality-skills) (Addy Osmani) | Six skills copied as plain files: `accessibility`, `performance`, `core-web-vitals`, `best-practices`, `seo` and `web-quality-audit`. Its one script, `analyze.sh`, only reads HTML files and prints what it finds (it needs `jq`); nothing in it touches the network or writes a file. |

Each was cloned, read and scanned for network calls and commands before it was copied. None was installed with `npx`, a plugin command or an install script.

## Questions for Ken (nothing here blocks the mock)

- Who are the typical customers, and which settings matter most (bars, restaurants, retail, distributors)?
- What does a good pitch look like, and what are the top mistakes new reps make?
- Which claims and wording are approved, and what must reps never say?
- Is any real call data or role-play material available?
- What can reps say about pricing, margins and samples?
- Is "celebrity-free" approved wording? The homepage says "It's not about flashy endorsements", and the team described the brand as celebrity-free. The game uses "celebrity-free" in a lesson and in Ray's mission, so confirm the exact phrase.
