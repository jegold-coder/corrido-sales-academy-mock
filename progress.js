"use strict";
// Progress, levels, badges, streaks and the team board. Everything is saved in this browser only (localStorage).
// Nothing is sent anywhere. The "team board" works by pasting share codes, so it needs no server and costs nothing.

const LEVELS = [["Rookie", 0], ["Opener", 100], ["Closer", 250], ["Rainmaker", 450], ["Corrido Legend", 700], ["Master Rep", 1000]];
const levelOf = xp => { let i = 0; LEVELS.forEach((l, n) => { if (xp >= l[1]) i = n; }); return i; };

// Each badge: [name, how to earn it, test(session, P)]. session = the mission that was just finished.
const BADGES = {
  first: ["First Pitch", "Finish any mission", () => true],
  closer: ["Closer", "Win a mission", s => s.won && s.id !== "brand"],
  flawless: ["Flawless", "Earn 3 stars on a mission", s => s.stars === 3],
  hard: ["Hard Mode Hero", "Win a mission on Hard", s => s.won && s.diff === "hard"],
  typed: ["Straight Talker", "Win a mission by typing or speaking your answers", s => s.won && s.mode === "type"],
  voice: ["Say It Out Loud", "Use voice input in a mission", s => s.voice],
  brain: ["Brand Brain", "Get every question right in a brand lesson", s => s.lesson && s.stars === 3],
  comply: ["Clean Hands", "Earn 3 stars in the Compliance Trap", s => s.id === "comply" && s.stars === 3],
  camera: ["On Camera", "Finish a mission with the camera coach", s => s.camera],
  streak3: ["On a Roll", "Practice 3 days in a row", (s, P) => P.streak >= 3],
  all: ["Full Rotation", "Finish every stop on the map", (s, P, total) => Object.keys(P.done).length >= total],
};

const Progress = {
  KEY: "csa_progress_v1",
  blank: () => ({ xp: 0, done: {}, stars: {}, history: [], badges: [], lastDay: null, streak: 0, diff: "medium", mode: "choice", pre: null, post: null, team: {}, llmKey: "", tutorialSeen: false, mistakes: [], opener: {} }),
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
  // Team board: a share code is the player's name, XP and level, packed as text so teammates can paste it in.
  shareCode(P, name) {
    const o = { n: name, xp: P.xp, lv: levelOf(P.xp), b: P.badges.length, s: P.streak, d: Progress.today() };
    return "csa1." + btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/=+$/, "");
  },
  readCode(code) {
    try {
      const raw = code.trim().replace(/^csa1\./, ""), o = JSON.parse(decodeURIComponent(escape(atob(raw))));
      if (typeof o.n !== "string" || typeof o.xp !== "number") return null;
      return { n: o.n.slice(0, 14), xp: Math.max(0, Math.min(1e6, o.xp | 0)), lv: o.lv | 0, b: o.b | 0, s: o.s | 0, d: String(o.d || "").slice(0, 10) };
    } catch { return null; }
  },
};
