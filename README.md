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
| Tequila Corrido bottle, record and merch photos | the brand's own site (`ilovetequilacorrido.com`, linked live) | always. Needs internet. Swap for approved files from Ken before sharing outside the team. |
| Face model for the camera coach | jsDelivr and Google storage (MediaPipe, open source) | only if you turn the camera coach on |
| Gemini free tier | Google | only if you paste your own free key into the optional AI judge |

## What it covers from the brief

| Brief | In the mock |
|---|---|
| Personas with hidden objections | 13 missions, each customer hides a worry that is revealed on the scorecard |
| Behavioral chat | Spoken sales-script conversations: the customer talks, you answer out loud (or type), your avatar plays your answer back in your own recorded voice with its mouth moving with the sound, and the customer replies to what you said |
| Hints | On Level 1 and 2 missions you see what a strong answer should mention before you record. Later levels hide it |
| Post-session scorecard | Every answer scored out of 5 at the end: 4 points for what you said (what you mentioned, what you missed, what knocked points off) and 1 for tone, with a stronger answer to compare to and a button to hear yourself again. Plus a delivery score from the camera |
| Edge-case library | Pricing pushback (Marco, Dana), competitor comparison (Ray), compliance (Jess), gatekeeper (Sam), product matching (Mia), a store owner who says no (Tony), reading the buyer (Rafael), a store robbery (Ben) |
| Grading | A free rule-based rubric (see `criteria.js`) scores each answer. No account, no cost. The old optional Gemini judge is still in `coach.js` but is not wired into the new flow |
| Voice input | Record button in every mission (browser speech recognition, Chrome or Edge). Typing always works |
| Body-language rating (stretch) | Camera coach is on by default and highly recommended: eye contact, posture, presence and smile, scored out of 5. Video never leaves the device |
| Points, levels, badges, leaderboard (stretch) | XP, 6 levels, 20 badges (6 boss badges with each boss's face on a medal in bronze, silver, gold, emerald, ruby and diamond, plus boss feats and 12 mission badges), daily streak, team board using share codes |
| Tiers, bosses and merch rewards (UI/UX journey, pages 1, 8, 9) | Six tiers from Trainee to Seasoned Seller. A boss battle ends each tier: Brand Brain (ten timed questions), Priya, Mia, Rafael, Dana and the Bad-Tempered Owner. Beating a boss moves you up a tier. Beating any level unlocks real Corrido merch for your character |
| Sign-in (journey page 2) | Age check, then "continue as guest" or an email that is only saved on this device. Company sign-in comes with the rollout |
| Manager mode (journey pages 14 and 15) | Open to anyone with the link while in prototype: a class dashboard, a CSV invite page and leaderboards. Uses sample data. See below |
| Rep dashboard | Skills, history, badges, before/after knowledge check. The first check is required: the map stays locked until it is done |
| "Help people understand who Corrido is" (Ken) | 4 brand lessons, quizzes that get harder with difficulty and a "Who is Tequila Corrido?" page with the promise, lineup, story and selling rules (reached from the header on every screen, next to a link to the real website that opens in a new tab) |
| Practice and review | The Dashboard's Review tab (with a count) collects every wrong answer with a stronger one, and its Progress tab has a Practice button that replays your weakest skill across different customers. Neither is on the map. Missions also open with a different line on replay |

Missions get harder as you go. Each has a level from 1 (Easy) to 5 (Expert) that sets the pass mark, how long an answer can be, how warm the customer starts and whether you see what a strong answer should mention. The ladder runs from an empty bar and a friendly new shop owner, through a gatekeeper, a hotel lounge, a buyer you have to read and a confused gas-station clerk, up to a price-focused distributor, a skeptical bar owner, a crisis, a compliance trap, a flat "no" and finally a bad-tempered bar owner. Brand lessons stay as short quizzes.

How scoring works: each answer is worth 5 points. Four are for what you say, split equally across the things it should mention (for example "give a specific day"), with a point knocked off for each mistake (hype, a health claim, running down another brand, being vague). One point is for **tone**, judged for the situation: a nervous shop owner needs a slow, warm voice, a rude bar owner needs you calm and steady (no snapping, no grovelling), a distributor wants confidence. Tone looks at your words (warmth, pushiness, jargon, hedging) and, when you speak, your voice (pace, long pauses, volume and how flat or lively you sound). Scores are shown only at the end, like a recorded interview.

Your voice is recorded on your device with the browser's MediaRecorder so your avatar can play it back and so the tone can be analysed. The recording stays in memory, is never saved or uploaded, and is gone when you leave the results page. If the browser can't record, or you typed, the avatar reads your words aloud and tone is judged from your words only. The pitch and pace checks were tested on synthetic audio, not on real voices, so treat those notes as guidance.

Three missions come from advice from the team's contact Jay. **The Hard No** (Tony): when an owner says no, find a way in by learning who he sells to and what appeals to them. **Know Your Buyer** (Rafael): fit the pitch to the buyer and stay honest. **Trouble at the Store** (Ben): a robbery. The right answers teach staying calm, complying, calling 911, staying with the owner and checking in later. They do not teach physically stopping the robber, because confronting an armed person can get people hurt. Confirm with Jay what he meant by "try to stop it".

## Tiers, bosses and merch

- **Tiers:** Trainee, Associate Rep, Field Rep, Senior Rep, Key Account Rep, Seasoned Seller. Your tier is how many bosses you have beaten. Each boss is the last stop of its difficulty level, so the five mission levels line up with tiers 1 to 5 (`tests/tiers.test.js` checks it).
- **Bosses** use the existing missions, so their timings are unchanged: Priya (3.5 / 5 to win), Mia (3.5), Rafael (4.0, voice only if your browser can record), Dana (4.0, voice only) and the Bad-Tempered Owner (4.2, voice only). A health claim or a pressure tactic loses a boss battle instantly. Brand Brain is ten questions, fifteen seconds each, 80% to win. Three tries a day per boss, and a Practice first option that does not count.
- **Merch:** 42 pieces (36 shirts and polos, 6 hats). The creator shows them as one tabbed photo grid (T-shirts, Polos, Hats) so the page stays short. Twenty are free from the start (fifteen shirts, five hats) so there is a choice in the creator on day one. The other 22 are each unlocked by beating a level (what a stop unlocks is shown on the screen before you start it, not on the map) (see `REWARDS` in `tiers.js`; `tests/tiers.test.js` checks every piece is unlocked exactly once). A boss win also moves you up a tier and shows the Tier Up screen with a shareable tier card (name, avatar and tier only).
- **Prototype tools** (Dashboard, Settings): every stop open, every piece of merch unlocked, and unlimited boss tries. The first and third are on by default while the game is being tested.

## Manager mode (prototype)

Open the link ending in `#manager`, use the "Manager? Open the manager view" link on the first screen, or the "Open manager mode" button on the Dashboard (Team tab, and Settings). There is no sign-in or permission check: anyone with the link can open it. The class on the Cohorts page is **sample data** (labelled), plus your own row. Invite lets you upload a CSV (name, email, team), checks it, and creates a class that is saved **on this device only**. Invites are **not emailed**: you copy an invite message instead. Nudge only records the nudge on this device. A real version needs company sign-in and a shared database.

## Files

| File | What it holds |
|---|---|
| `index.html` | the app: screens, characters, scenes, mission flow |
| `scenarios.js` | mission scripts, levels and the three replies a customer can give (edit here to change missions) |
| `mission.js` | the spoken mission flow: recording, avatar playback with lip movement, customer reply and the scorecard |
| `criteria.js` | the rubric for each question: what to mention and what costs points (draft) |
| `coach.js` | the scoring (`Coach.score`: 4 content points plus 1 tone point) and the old optional Gemini judge |
| `tiers.js` | tiers, bosses, merch rewards and the prototype switches |
| `boss.js` | the boss battle screen, the Brand Brain quiz, Tier Up and the shareable tier card |
| `manager.js` | manager mode: cohorts, invite and leaderboards |
| `tone.js` | how tone is judged from your words and your voice, for the situation |
| `lessons.js` | brand lessons, question bank, knowledge check |
| `progress.js` | saving, levels, badges, streak, team codes |
| `badges.js` | the badge medals (boss faces, metals, ribbons), awarding boss badges |
| `voices.js` | giving each customer a distinct voice and accent, and speaking like a person |
| `dashboard.js` | the rep dashboard |
| `camera.js` | optional camera coach |
| `tests/` | `scoring`, `tone`, `tiers`, `badges`, `voices`, `globals` and `camera` tests |

## Tests

```bash
node tests/scoring.test.js  # every model answer scores 4.2+ out of 5, every weak example scores clearly lower
node tests/tone.test.js     # tone rules on words, and voice maths on synthetic audio
node tests/tiers.test.js    # every piece of merch is unlocked once, bosses are in order and on the map
node tests/badges.test.js   # a badge for every boss, awarded once, caught up from earlier progress
node tests/voices.test.js   # each customer gets a different voice, lines are paced like speech
node tests/globals.test.js  # no two scripts declare the same name (a clash stops a file loading)
node tests/camera.test.js   # face maths with fake landmarks
```

## Known limits (be honest about these in the pitch)

- **The "AI" is mostly rules.** The built-in coach matches patterns in the rep's words. It is predictable and free, but it can be fooled by unusual phrasing. A real LLM would be better. The Gemini judge exists as a free option but was **not tested** (no key was available).
- **The camera coach was never run on a real webcam.** The Browser pane blocked the camera. The maths is unit-tested with fake landmarks. Expect to tune thresholds.
- **Voices** depend on what is installed on the computer. Each customer is given their own installed voice by gender and accent (British, Australian, Irish, Indian, South African and American where available), speaks a sentence at a time with natural pauses, and sounds warmer or colder depending on how the rep answered. Dashboard > Settings > Customer voices lists who got which voice, with a play button. Edge's free Natural voices and Premium Mac voices sound much better.
- **Phone layout** was checked in an emulator at 375 px wide, not on a real phone.
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

## Questions for Ken (nothing here blocks the mock)

- Who are the typical customers, and which settings matter most (bars, restaurants, retail, distributors)?
- What does a good pitch look like, and what are the top mistakes new reps make?
- Which claims and wording are approved, and what must reps never say?
- Is any real call data or role-play material available?
- What can reps say about pricing, margins and samples?
- Is "celebrity-free" approved wording? The homepage says "It's not about flashy endorsements", and the team described the brand as celebrity-free. The game uses "celebrity-free" in a lesson and in Ray's mission, so confirm the exact phrase.
