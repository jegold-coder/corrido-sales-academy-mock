# Demo script: 6 minutes

For showing the Corrido Sales Academy mock to the team or the class. It uses **Presenter mode**, which loads a sample player so every page has something on it. Your own progress is kept safe and comes back when you leave.

## Before you start (one minute)

- Open the live site once on the demo computer **with internet**: https://corrido-sales-academy-mock.vercel.app/ . The shop photos are then saved on that computer, so the demo still looks right if the Wi-Fi is bad.
- Use Chrome or Edge. The camera coach is off in Presenter mode, so no permission pop-up. Voice answers need the microphone; typing always works.
- Leave the page on the age check.

## Run of show

| Time | Do | Say |
|---|---|---|
| 0:00 | Click **Yes, I'm 21+**, then **Presenting this? Skip setup with sample progress**. | "A training game for new Tequila Corrido reps: practise sales calls before they go into the field. This sample rep is part-way through." |
| 0:30 | The **map**. Point at the locked stops, the **Next up** bar and the tier row. | "Each stop stays locked until the one before it is done. A boss ends each tier of missions and moves you up." |
| 1:00 | Presenter menu (bottom left) > **Mission question** (The Quiet Bar). Type an answer. Open **Show a hint**. | "The customer speaks, you answer out loud or typed. Coach mode tells you what you got right and missed after every answer. A hint costs 5 XP." |
| 2:00 | Presenter > **Results: not this time**, then **Results: a win**. Press **Try this question again** on a weak answer. | "Each answer is scored out of 5: four points for what you said, one for tone. You can replay just that question." |
| 2:45 | Presenter > **Boss intro**, then **Tier Up**. | "Beating a boss moves you up a tier, unlocks merch and earns a badge you can share." |
| 3:15 | Presenter footer > **Complete the game**, then **Dashboard: Progress**. Open **All skills**, then the Badges and Review tabs. | "The skills chart groups thirty-odd skills into seven areas, in the order of a sales call. Every mistake is saved to Review." |
| 3:45 | Presenter > **Manager: Cohorts**, then **Manager: Coaching** (scroll to the team huddle), **Manager: Answers** and **Manager: Assign**. | "A manager sees the class's progress, the one question most reps missed as a five-minute huddle, what reps actually said next to a stronger answer, and can assign a stop with a due date. A note or assignment shows up on the rep's side." |
| 5:00 | Presenter > **Surprise customer**. Answer one question. | "A harder practice round: customers interrupt, go quiet, change the subject. After each answer, how you sounded: pace, filler words, pauses." |
| 5:45 | Presenter > **Character**. Switch men and women, then change the shirt, hair and head shape. | "Reps build their own character and unlock real Corrido merch as they win." |
| 6:00 | Presenter > **Who is Tequila Corrido?** Open the pour calculator. | "This is the 60-second review before a sale: the promise, the four bottles, do and never, what to say to six objections, and a per-pour cost check." |
| 6:30 | Close. | "Next: one mission with a real AI customer, and Ken's confirmation of prices and wording." |

The footer of the Presenter menu has three buttons to set the scene before you start: **Start over: nothing complete** (the first-day look), **Random sample progress** (a different point part-way through each press) and **Complete the game** (every stop, every badge, every piece of merch).

## Be honest about the limits

- Customers and scoring are **scripted rules today, not AI**. A real AI customer is the next step.
- Prices are the **public shop prices**. Wholesale terms and margins are not public, so the game never quotes them.
- The "celebrity-free" wording and the prices still need Ken to confirm them.

## If something goes wrong

- A page looks odd: reload. Your place is saved in the browser.
- The microphone is blocked: type your answer instead.
- You want your own progress back: Presenter menu > **Leave presenter mode**.
- The Wi-Fi drops mid-demo: the app and the photos open from the copy saved on that computer (after one visit with internet).

## Check it before you present

```bash
node tools/smoke.js            # opens the game in a real Chrome and clicks through it (needs Chrome and internet)
for t in tests/*.test.js; do node $t; done   # all the unit tests
```
