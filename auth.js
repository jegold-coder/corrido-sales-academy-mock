"use strict";
// Optional "Sign in with Google". Guest and email need no setup. Google needs a free client ID, put in config.js or pasted in
// Dashboard > Settings > Account. There is no server: Google gives the browser a signed token and the name and email are read from it.
// Nothing checks the signature on a server, so this only says who is using this device. It is not real security, and the company
// rollout needs the token checked on a server first.

const googleClientId = () => {
  let saved = ""; try { saved = localStorage.getItem("csa_google_id") || ""; } catch { /* storage unavailable */ }
  return String(CSA_CONFIG.googleClientId || saved).trim();
};
function decodeJwt(token) {
  const part = String(token).split(".")[1] || "", b64 = part.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = atob(b64 + "=".repeat((4 - b64.length % 4) % 4));
  return JSON.parse(decodeURIComponent(bytes.split("").map(c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")));
}
// Sense checks on the token Google returned. Gives { ok: true, user } or { ok: false, reason }.
function checkGoogleToken(token, clientId, domain, now = Date.now()) {
  let p; try { p = decodeJwt(token); } catch { return { ok: false, reason: "Google sign-in didn't work. Try again, or continue as a guest." }; }
  if (!clientId || p.aud !== clientId) return { ok: false, reason: "That sign-in was meant for a different app. Try again, or continue as a guest." };
  if (!/^(https:\/\/)?accounts\.google\.com$/.test(p.iss || "")) return { ok: false, reason: "That sign-in didn't come from Google. Try again, or continue as a guest." };
  if (!p.exp || p.exp * 1000 < now) return { ok: false, reason: "That sign-in has expired. Try again." };
  if (!p.email || p.email_verified === false) return { ok: false, reason: "Your Google email isn't verified, so it can't be used." };
  if (domain && String(p.hd || "").toLowerCase() !== domain.toLowerCase()) return { ok: false, reason: `Use your @${domain} Google account.` };
  const name = String(p.name || "").trim();
  return { ok: true, user: { email: p.email, name, first: String(p.given_name || name.split(" ")[0] || "").trim() } };
}

let googleLoad = null;
const loadGoogle = () => googleLoad || (googleLoad = new Promise((res, rej) => {
  const s = document.createElement("script"); s.src = "https://accounts.google.com/gsi/client"; s.async = true;
  s.onload = res; s.onerror = () => { googleLoad = null; rej(new Error("Google's sign-in script didn't load")); };
  document.head.appendChild(s);
}));
// Called once the age check is passed. Google's script is only loaded then, and only if a client ID is set.
function showGoogleButton() {
  const box = $("#gbtn"), soon = $("#gsoon"), id = googleClientId();
  if (!id) { soon.hidden = false; return; }
  loadGoogle().then(() => {
    google.accounts.id.initialize({ client_id: id, callback: onGoogleCredential, ...(CSA_CONFIG.googleDomain ? { hd: CSA_CONFIG.googleDomain } : {}) });
    google.accounts.id.renderButton(box, { type: "standard", theme: "filled_blue", size: "large", text: "continue_with", shape: "pill", width: Math.min(360, Math.round(box.parentElement.clientWidth || 320)) });
  }).catch(() => { soon.hidden = false; soon.textContent = "Google sign-in couldn't load (blocked or offline). Use guest or email."; });
}
function onGoogleCredential(resp) {
  const r = checkGoogleToken(resp && resp.credential, googleClientId(), CSA_CONFIG.googleDomain), note = $("#emailnote");
  if (!r.ok) { note.textContent = r.reason; note.classList.add("bad"); return; }
  state.profile = { mode: "google", email: r.user.email, name: r.user.name };
  if (!state.avatarSaved && !(state.avatar.name || "").trim()) state.avatar.name = r.user.first.slice(0, 14);   // start the character with their first name
  Progress.save(state); enterGame();
  setTimeout(() => toast(`Signed in as ${r.user.email}. Only your name and email are used, and they stay on this device.`), 300);
}
function googleSignOut() {
  try { google.accounts.id.disableAutoSelect(); } catch { /* the Google script was never loaded */ }
  state.profile = { mode: "", email: "" }; Progress.save(state);
}
if (typeof module !== "undefined") module.exports = { decodeJwt, checkGoogleToken };
