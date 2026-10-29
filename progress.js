"use strict";
// Progress, ranks, badges, streaks and the team board. Everything is saved in this browser only (localStorage).
// Nothing is sent anywhere. The "team board" works by pasting share codes, so it needs no server and costs nothing.

const LEVELS = [["Rookie", 0], ["Opener", 100], ["Closer", 250], ["Rainmaker", 450], ["Corrido Legend", 700], ["Master Rep", 1000]];
// Stars follow the score out of 100, three stars for 100: 50% is 1.5 stars, and halves are the smallest step.
const starsFor = pct => Math.round(Math.max(0, Math.min(100, pct)) / 100 * 6) / 2;
// A history made before the rename says "Level 4": show the difficulty's name (Easy, Medium, Hard, Expert) instead.
const diffLabel = d => { const m = /^Level ([1-5])$/.exec(d || ""); return m ? MLEVEL[m[1]].name : d; };
const levelOf = xp => { let i = 0; LEVELS.forEach((l, n) => { if (xp >= l[1]) i = n; }); return i; };

// Each badge: [name, how to earn it, test(session, P)]. session = the mission that was just finished.
const BADGES = {
  check: ["Knowledge Check", "Complete the knowledge check", () => false],   // first on the list, because the check comes first; awarded by syncBadges once the check is finished
  first: ["First Pitch", "Finish any mission", () => true],
  flawless: ["Flawless", "Earn 3 stars on a mission", s => s.stars === 3],
  hard: ["Tough Crowd", "Pass a Hard or Expert mission", s => s.won && /^(Hard|Expert)$|Level [45]/.test(s.diff || "")],   // a history made before the rename says "Level 4" or "Level 5"
  typed: ["Perfect Answer", "Score 5 out of 5 on a single answer", s => s.perfect],
  voice: ["Say It Out Loud", "Answer a mission question by speaking", s => s.voice],
  brain: ["Brand Brain", "Get every question right in a brand lesson", s => s.lesson && s.won && s.pct === 100],
  comply: ["Clean Hands", "Earn 3 stars in the Compliance Trap", s => s.id === "comply" && s.stars === 3],
  camera: ["On Camera", "Finish a mission with the camera coach", s => s.camera],
  streak3: ["On a Roll", "Practice 3 days in a row", (s, P) => P.streak >= 3],
  all: ["Full Rotation", "Finish every stop on the map", (s, P, total) => Object.keys(P.done).length >= total],
};

const Progress = {
  KEY: "csa_progress_v1",
  blank: () => ({ xp: 0, done: {}, stars: {}, history: [], badges: [], lastDay: null, streak: 0, diff: "medium", mode: "choice", pre: null, post: null, team: {}, llmKey: "", tutorialSeen: false, mistakes: [], opener: {}, camPref: true, voiceOff: false, proto: {}, bossTries: {}, profile: { mode: "", email: "" }, cohorts: [], nudged: {}, mgrName: "Manager", answers: [], notes: {}, assignments: [], facts: null, camNudgeOff: false }),
  load() {
    try { return { ...Progress.blank(), ...JSON.parse(localStorage.getItem(Progress.KEY) || "{}") }; } catch { return Progress.blank(); }
  },
  save(P) {
    try {
      const { hearts, avatar, avatarSaved, sc, cam, ...keep } = P;   // runtime-only fields are not saved
      keep.llmKey = "";                                        // never store an API key
      localStorage.setItem(Progress.KEY, JSON.stringify(keep));
    } catch { /* storage unavailable (private window): progress lasts for this visit only */ }
  },
  reset() { try { localStorage.removeItem(Progress.KEY); } catch { /* ignore */ } },
  today: () => new Date().toLocaleDateString("en-CA"),
  // Update streak, history, XP and badges for a finished mission. Returns the badges earned this time.
  record(P, s, totalStops) {
    const t = Progress.today(), y = new Date(Date.now() - 864e5).toLocaleDateString("en-CA");
    if (P.lastDay !== t) { P.streak = P.lastDay === y ? P.streak + 1 : 1; P.lastDay = t; }
    P.history.push({ id: s.id, title: s.title, diff: s.diff, mode: s.mode, pct: s.pct, stars: s.stars, won: s.won, xp: s.xp, date: t, skills: s.skills, camera: s.cameraScores || null });
    P.history = P.history.slice(-60);
    const earned = [];
    Object.entries(BADGES).forEach(([k, b]) => { if (!P.badges.includes(k) && b[2](s, P, totalStops)) { P.badges.push(k); earned.push(k); } });
    Progress.save(P);
    return earned;
  },
  // Average score (0 to 100) for each skill across past missions, newest 40 entries.
  skillAverages(P) {
    const acc = {};
    P.history.slice(-40).forEach(h => Object.entries(h.skills || {}).forEach(([k, v]) => { (acc[k] = acc[k] || []).push(v / 5 * 100); }));
    return Object.entries(acc).map(([k, v]) => [k, Math.round(v.reduce((a, b) => a + b, 0) / v.length), v.length]).sort((a, b) => a[1] - b[1]);
  },
  // Team board: a share code is the player's rank, XP, badges and streak packed into one number written in base 36, then a check letter and the name:
  // "csa2.2fuxlp1.Taylor" (about 20 characters). The check letter catches any one wrong digit or letter, and most codes cut short; it is not a lock (anyone can make a code), so a code
  // is for a friendly team board, not a contest. Codes from the first version ("csa1." and a long run of letters) are still read.
  CODE_NAME: 14,
  check: t => ([...t].reduce((a, c) => (a * 31 + (Number.isNaN(parseInt(c, 36)) ? c.charCodeAt(0) : parseInt(c, 36))) % 36, 7)).toString(36),   // any one wrong digit or letter changes it
  shareCode(P, name) {
    const xp = Math.max(0, Math.min(1e6, P.xp | 0)), lv = Math.min(7, levelOf(xp)), b = Math.min(31, (P.badges || []).length), s = Math.max(0, Math.min(1023, P.streak | 0));
    const n = String(name || "Rep").replace(/[\u0000-\u001f]/g, "").slice(0, Progress.CODE_NAME) || "Rep", body = (((xp * 8 + lv) * 32 + b) * 1024 + s).toString(36);
    return `csa2.${body}${Progress.check(body + n)}.${n}`;
  },
  readCode(code) {
    const t = String(code == null ? "" : code).trim(), m = /^csa2\.([0-9a-z]{2,10})\.([\s\S]{1,14})$/.exec(t);
    if (m) {
      const body = m[1].slice(0, -1), n = m[2];
      if (Progress.check(body + n) !== m[1].slice(-1)) return null;
      const v = parseInt(body, 36), xp = Math.floor(v / 262144), lv = Math.floor(v / 32768) % 8;
      if (!(v >= 0) || xp > 1e6 || lv > 5) return null;
      return { n, xp, lv, b: Math.floor(v / 1024) % 32, s: v % 1024, d: Progress.today() };
    }
    try {   // the first version's codes
      const raw = t.replace(/^csa1\./, ""), o = JSON.parse(decodeURIComponent(escape(atob(raw))));
      if (typeof o.n !== "string" || typeof o.xp !== "number") return null;
      return { n: o.n.slice(0, 14), xp: Math.max(0, Math.min(1e6, o.xp | 0)), lv: o.lv | 0, b: o.b | 0, s: o.s | 0, d: String(o.d || "").slice(0, 10) };
    } catch { return null; }
  },
};
