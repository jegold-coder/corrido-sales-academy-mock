"use strict";
// Manager mode > Answers: what reps actually said, with the score, what was missed and a stronger answer beside it, and a place to leave a note that the rep reads on their
// Review page. Also the team huddle on the Coaching page: the one question the class misses most, as a five-minute plan. The data is in answers.js.
// Uses globals from the other scripts (state, esc, fmt, AnswerLog, allClasses, mgrClass, managerMode...) at call time.

let ansRep = "all", ansLow = true;   // the Answers page's filters, kept while a manager moves between pages

const noteList = a => AnswerLog.notesOf(a.id).map((n, i) => `<div class="mnoteitem"><span><b>${esc(n.from)}</b> · ${esc(n.date)}${a.sample ? "" : n.seen ? " · seen" : " · not seen yet"}</span><p>${esc(n.text)}</p><button type="button" class="linkbtn dark delnote" data-i="${i}">Delete</button></div>`).join("");
const firstName = rep => rep.replace(/ \(you\)$/, "").split(" ")[0];

function answerCard(a, open) {
  const band = a.score >= 4 ? "hi" : a.score >= 2.5 ? "mid" : "lo", first = firstName(a.rep), li = (cls, mark, list) => (list || []).length ? `<ul class="${cls}">${list.map(x => `<li class="${cls === "hits" ? "ok" : cls === "misses" ? "no" : ""}">${mark} ${esc(x)}</li>`).join("")}</ul>` : "";
  return `<details class="acard mans ${band}" ${open ? "open" : ""}>
    <summary><span class="ahead"><b>${esc(a.rep)} · ${esc(a.skill)}</b><span class="score ${band}">${fmt(a.score)} / 5</span></span><span class="abar" aria-hidden="true"><i style="width:${a.score / 5 * 100}%"></i></span><span class="aone">${esc(a.mission)} · ${esc(a.date)} · ${a.spoke ? "spoken" : "typed"}</span></summary>
    <div class="abody">
      <p class="aq"><small>${esc(a.cname)} said:</small> ${esc(a.line)}<br><small>The question:</small> ${esc(String(a.q).replace(/<[^>]+>/g, ""))}</p>
      <div class="mcompare"><div><h4>What ${esc(first)} said</h4><p class="said">${esc(a.text)}</p></div><div><h4>A stronger answer</h4><p class="said good">${esc(a.better)}</p></div></div>
      <p class="split"><span>What was said: <b>${fmt(a.content)} / 4</b></span><span>Tone: <b>${fmt(a.tone)} / 1</b></span>${a.wpm ? `<span>Pace: <b>${a.wpm}</b> words a minute</span>` : ""}${a.fillers != null ? `<span>Filler words: <b>${a.fillers}</b></span>` : ""}</p>
      ${li("hits", "✓", a.hits)}${li("misses", "✗ Missing:", a.misses)}${li("flags", "⚠", a.flags)}
      <div class="mnotes">${noteList(a)}</div>
      <label class="mlab">Leave ${esc(first)} a note<textarea class="minput mnote" rows="2" maxlength="300" placeholder="${a.you || !a.sample ? `${esc(first)} reads it on the Review page.` : "Sample rep: the note is only kept on this device."}"></textarea></label>
      <div class="mcbtns"><button class="mbtn savenote" type="button">Save the note</button></div>
    </div></details>`;
}

function mgrAnswers(el) {
  const c = allClasses().find(x => x.id === mgrClass) || SAMPLE_CLASS, all = AnswerLog.classAnswers(c), names = [...new Set(all.map(a => a.rep))].sort();
  if (ansRep !== "all" && !names.includes(ansRep)) ansRep = "all";
  const shown = all.filter(a => (ansRep === "all" || a.rep === ansRep) && (!ansLow || a.score < AnswerLog.LOW)).sort((x, y) => y.date.localeCompare(x.date)).slice(0, 40);
  el.innerHTML = `<div class="mhead"><div><h1 class="mtitle">Answers</h1><p class="msub">${esc(c.name)}${c.sample ? " · Sample data" : ""} · what reps actually said, with a stronger answer beside it. Leave a note and the rep reads it on their Review page.</p></div>
      <div class="mactions"><button class="mbtn alt" id="ansexp" type="button" ${all.length ? "" : "disabled"}>Download answers (CSV)</button></div></div>
    <div class="mcard mfilters"><label>Rep <select id="ansrep" class="minput"><option value="all">Everyone (${all.length} answers)</option>${names.map(n => `<option value="${esc(n)}" ${n === ansRep ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></label>
      <label class="protorow"><input type="checkbox" id="anslow" ${ansLow ? "checked" : ""}> Only answers under ${AnswerLog.LOW} out of 5</label></div>
    ${shown.length ? shown.map((a, i) => answerCard(a, i < 2)).join("") : `<div class="mcard"><p>${all.length ? "No answers match. Untick “only answers under 3.5” to see them all." : "No answers yet. They appear here as reps play a mission."}</p></div>`}
    <p class="note2">${c.sample ? "The sample reps' answers are made from the real missions and scored by the real coach: they show how the page works. " : ""}A rep's answers are kept as text on their own device (never the recording). In this prototype a manager sees only the answers made in this browser. A real version needs a shared database and company sign-in.</p>`;
  $("#ansrep").onchange = e => { ansRep = e.target.value; mgrAnswers(el); };
  $("#anslow").onchange = e => { ansLow = e.target.checked; mgrAnswers(el); };
  $("#ansexp").onclick = () => download(`${c.name.replace(/\W+/g, "-").toLowerCase()}-answers.csv`, AnswerLog.csvRows(all.sort((x, y) => y.date.localeCompare(x.date))));
  const cards = [...el.querySelectorAll("details.mans")];
  cards.forEach((card, i) => {
    const a = shown[i], box = card.querySelector(".mnote"), list = card.querySelector(".mnotes");
    const wireDel = () => card.querySelectorAll(".delnote").forEach(b => { b.onclick = () => { AnswerLog.removeNote(a.id, +b.dataset.i); list.innerHTML = noteList(a); wireDel(); }; });
    wireDel();
    card.querySelector(".savenote").onclick = () => {
      const n = AnswerLog.addNote(a.id, box.value, state.mgrName && state.mgrName !== "Manager" ? state.mgrName : "Your manager");
      if (!n) { toast("Type a note first."); box.focus(); return; }
      box.value = ""; list.innerHTML = noteList(a); wireDel();
      toast(a.you || !a.sample ? `Note saved. ${firstName(a.rep)} will see it on the Review page.` : "Note saved on this device (a sample rep won't see it).");
    };
  });
}

// ----- the team huddle: the question the class misses most -----
const HUDDLE = [
  ["0:00", "Read it out loud", "Read the customer's line aloud. Ask the room: what would you say?"],
  ["0:30", "One sentence each", "Every rep says their answer in one sentence. No notes."],
  ["2:00", "Compare", "Read the stronger answer. Tick off what it covers that most answers missed."],
  ["3:00", "Say it again", "In pairs, one is the customer. Answer again, using the missing parts."],
  ["4:30", "One line to keep", "Each rep picks one line to use this week."],
];
// The question most of the class scored under 3.5 on (at least four reps for the sample class, any answers for a class of one), or null.
const huddleStat = c => AnswerLog.questionStats(AnswerLog.classAnswers(c), c.sample ? 4 : 1).find(g => g.low > 0) || null;
const huddleText = (g, manager) => `Team huddle (5 minutes): ${g.mission}, ${g.skill}\n\n${g.low} of ${g.n} reps scored under ${AnswerLog.LOW} out of 5 on this one.\n\n${g.cname} says: ${g.line}\nThe question: ${String(g.q).replace(/<[^>]+>/g, "")}\n\n${HUDDLE.map(([t, h, d]) => `${t}  ${h}. ${d}`).join("\n")}\n\nMost missed: ${g.missed.length ? g.missed.map(m => m.label).join("; ") : "see the answers"}.\nA stronger answer: ${g.better}\n\n${manager}`;
function huddleCard(c, g) {
  const stop = ALL_STOPS().find(x => x.id === g.mid);
  return `<div class="mcard mhuddle"><h2>Team huddle: the question the class misses most</h2>
    <p><b>${g.low} of ${g.n} reps</b> (${g.pct}%) scored under ${AnswerLog.LOW} on <b>${esc(g.skill)}</b> in <b>${esc(g.mission)}</b>.${c.sample ? " Sample data." : ""}</p>
    <p class="aq"><small>${esc(g.cname)} said:</small> ${esc(g.line)}<br><small>The question:</small> ${esc(String(g.q).replace(/<[^>]+>/g, ""))}</p>
    ${g.missed.length ? `<p class="note2"><b>Missed most:</b> ${g.missed.map(m => `${esc(m.label)} (${m.count})`).join("; ")}</p>` : ""}
    <p class="said good"><b>A stronger answer:</b> ${esc(g.better)}</p>
    <ol class="huddle">${HUDDLE.map(([t, h, d]) => `<li><b>${t}</b> <span><b>${h}.</b> ${d}</span></li>`).join("")}</ol>
    <div class="mcbtns"><button class="mbtn" id="copyhuddle" type="button">Copy the huddle plan</button>${stop ? '<button class="mbtn alt" id="assignhuddle" type="button">Assign this stop to the class</button>' : ""}</div></div>`;
}
