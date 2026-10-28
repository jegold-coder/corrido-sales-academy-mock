"use strict";
// Names a rep may not use for the character. The name shows on the map, the results and the manager's team view, so it has to be fine at work.
// This is a check in the browser, free and with no server: it keeps out the obvious cases and it can be got around by someone who edits their own
// saved data, so it is not a replacement for checking on a server once there is one (see the Google sign-in notes in README).

// One word per line, in base64 so none of them is written out in this file. A line starting with "=" only counts as a whole word
// (so "Hancock" or "Essex" is fine); any other line counts anywhere inside a word. Add to it with tools/names-list.js.
const NAME_WORDS = "ZnVjawptb3RoZXJmdWNrCmJ1bGxzaGl0CnNoaXRoZWFkCnNoaXRmYWNlCnNoaXRiYWcKYml0Y2gKYmFzdGFyZApjdW50Cndob3JlCmFzc2hvbGUKYXJzZWhvbGUKYXNzaGF0CmR1bWJhc3MKZGlja2hlYWQKY29ja3N1Y2tlcgpwdXNzeQp3YW5rZXIKZGlsZG8KYmxvd2pvYgpoYW5kam9iCnJpbWpvYgpvcmdhc20KY3Vtc2hvdApqaXp6CnBlZG9waGlsZQptb2xlc3RlcgpyYXBpc3QKbmlnZ2VyCm5pZ2dhCm5pZ2dhaApmYWdnb3QKdHJhbm55CnNoZW1hbGUKcmV0YXJkCndldGJhY2sKdG93ZWxoZWFkCnJhZ2hlYWQKc2FuZG5pZ2dlcgpoaXRsZXIKbWllcmRhCm1hcmljb24KcGVuZGVqbwpwZW5kZWphCmNhYnJvbgpjYWJyb25hCmNoaW5nYWRhCmNoaW5nYWRvCmNoaW5nYWRlcmEKY2hpbmdhdHVtYWRyZQpwdXRhbWFkcmUKaGlqdWVwdXRhCmhpam9wdXRhCmhpam9kZXB1dGEKZ2lsaXBvbGxhcwpwcm9zdGl0dXRhCj1hc3MKPWFzc2VzCj1hcnNlCj1kaWNrCj1jb2NrCj1jdW0KPXRpdAo9dGl0cwo9dGl0dHkKPWJvb2IKPWJvb2JzCj1hbmFsCj1hbnVzCj1zZXgKPXNleHkKPWhvcm55Cj1wb3JuCj1wb3Jubwo9d2Fuawo9dHdhdAo9cHJpY2sKPXBpc3MKPXNoaXQKPXNoaXR0eQo9c2x1dAo9c2x1dHR5Cj1za2Fuawo9c2xhZwo9cGVuaXMKPXJhcGUKPXBlZG8KPWZhZwo9ZHlrZQo9aG9tbwo9bnVkZQo9bnVkZXMKPW1pbGYKPXRob3QKPWhvZQo9Y2hpbmsKPWdvb2sKPXNwaWMKPWtpa2UKPWJlYW5lcgo9Y29vbgo9ZGFya2llCj1wYWtpCj1uYXppCj1ra2sKPXB1dGEKPXB1dG8KPWNoaW5nYQo9Y2hpbmdhcgo9dmVyZ2EKPWN1bG8KPWN1bGVybwo9am9kZXIKPWpvZGV0ZQo9am90bwo9bWFyaWNhCj1tYW1vbgo9bWFtYWRhCj16b3JyYQo9cGVycmEKPWJvbHVkbwo9cGVsb3R1ZG8KPW9qZXRlCj1wdW5ldGE=";

const NameCheck = (() => {
  // Letters people swap in to dodge a filter (0 for o, $ for s), and look-alike letters from other alphabets.
  const LEET = { 0: "o", 3: "e", 4: "a", 5: "s", 7: "t", 8: "b", "@": "a", $: "s", "!": "i", "+": "t", "|": "i", "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "х": "x", "і": "i" };
  // A 1 is an i in "sh1t" but an l in "1ame", so both readings are checked.
  const reading = (name, one) => String(name).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z\s]/g, c => (c === "1" ? one : LEET[c] || " "));
  // Each word becomes a pattern that allows repeated letters ("fuuuck"); a whole-word entry also allows a trailing s.
  const build = line => { const whole = line[0] === "=", w = whole ? line.slice(1) : line, body = [...w].map(c => c + "+").join(""); return whole ? new RegExp("^" + body + "s*$") : new RegExp(body); };
  let rules = null;
  const load = () => rules || (rules = atob(NAME_WORDS).split("\n").filter(Boolean).map(build));
  // The pieces of a name to test: each word on its own, plus each run of one- and two-letter pieces joined up ("f u c k", "a.s.s"),
  // so a spaced-out word is caught but two ordinary words side by side never join into a third.
  const pieces = text => {
    const words = text.split(/\s+/).filter(Boolean), out = new Set(words);
    for (let i = 0; i < words.length; i++) { let run = ""; for (let j = i; j < words.length && words[j].length <= 2; j++) { run += words[j]; if (j > i) out.add(run); } }
    return [...out];
  };
  const blocked = name => ["i", "l"].some(one => pieces(reading(name, one)).some(p => load().some(re => re.test(p))));
  return { blocked };
})();
