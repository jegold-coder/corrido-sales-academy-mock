// Checks the Google sign-in token handling with made-up tokens. Run from the mock-prototype folder: node tests/auth.test.js
const { checkGoogleToken, decodeJwt } = require("../auth.js");
let fails = 0; const ok = (n, c, x = "") => { console.log((c ? "ok   " : "FAIL ") + n + (x ? " " + x : "")); if (!c) fails++; };
const b64 = o => Buffer.from(JSON.stringify(o), "utf8").toString("base64url");
const ID = "1234567890-abc123.apps.googleusercontent.com", NOW = Date.UTC(2026, 9, 24, 12), good = { iss: "https://accounts.google.com", aud: ID, exp: NOW / 1000 + 3600, email: "sam@example.com", email_verified: true, name: "Sam Rivera", given_name: "Sam" };
const tok = p => `${b64({ alg: "RS256" })}.${b64(p)}.sig`;

const r = checkGoogleToken(tok(good), ID, "", NOW);
ok("a good token gives the name and email", r.ok && r.user.email === "sam@example.com" && r.user.name === "Sam Rivera" && r.user.first === "Sam");
ok("accents and other letters survive", checkGoogleToken(tok({ ...good, name: "José Núñez", given_name: "José" }), ID, "", NOW).user.first === "José");
ok("the first name is taken from the full name if Google doesn't send one", checkGoogleToken(tok({ ...good, given_name: undefined }), ID, "", NOW).user.first === "Sam");
ok("a token for a different app is refused", !checkGoogleToken(tok({ ...good, aud: "other.apps.googleusercontent.com" }), ID, "", NOW).ok);
ok("a token not from Google is refused", !checkGoogleToken(tok({ ...good, iss: "https://evil.example" }), ID, "", NOW).ok);
ok("an expired token is refused", !checkGoogleToken(tok({ ...good, exp: NOW / 1000 - 5 }), ID, "", NOW).ok);
ok("a token with no expiry is refused", !checkGoogleToken(tok({ ...good, exp: undefined }), ID, "", NOW).ok);
ok("an unverified email is refused", !checkGoogleToken(tok({ ...good, email_verified: false }), ID, "", NOW).ok);
ok("a token with no email is refused", !checkGoogleToken(tok({ ...good, email: undefined }), ID, "", NOW).ok);
ok("garbage is refused without crashing", !checkGoogleToken("not.a.token", ID, "", NOW).ok && !checkGoogleToken("", ID, "", NOW).ok && !checkGoogleToken(undefined, ID, "", NOW).ok);
ok("with no client ID set nothing is accepted", !checkGoogleToken(tok(good), "", "", NOW).ok);
ok("a company domain lets that company in", checkGoogleToken(tok({ ...good, hd: "tequilacorrido.com" }), ID, "tequilacorrido.com", NOW).ok);
ok("a company domain keeps others out", !checkGoogleToken(tok({ ...good, hd: "other.com" }), ID, "tequilacorrido.com", NOW).ok);
ok("a company domain keeps personal Gmail out", !checkGoogleToken(tok(good), ID, "tequilacorrido.com", NOW).ok);
ok("the domain message says which account to use", /@tequilacorrido\.com/.test(checkGoogleToken(tok(good), ID, "tequilacorrido.com", NOW).reason));
ok("decodeJwt reads a payload", decodeJwt(tok(good)).email === "sam@example.com");
console.log(fails ? `${fails} FAILED` : "OK"); process.exit(fails ? 1 : 0);
