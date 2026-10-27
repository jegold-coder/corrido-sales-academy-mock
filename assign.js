"use strict";
// Assignments: a manager picks a stop, who it is for (the class, a team or one rep) and a due date, and the rep sees it on their map until it is done.
// There is no server yet, so an assignment is saved on this device and shows on the map in this browser; to tell reps the manager copies a message.
// The sample reps' progress comes from the sample data (how many bosses each has beaten). Uses globals from the other scripts at call time.

const Assign = (() => {
  let draft = null;   // set by the Coaching page's "Assign this" buttons: the Assign page opens with the form filled in
  const list = () => state.assignments || [];
  const stopTitle = id => (ALL_STOPS().find(x => x.id === id) || {}).title || id;
  let seq = 0;
  const newId = () => "g" + Date.now().toString(36) + (seq++).toString(36);
  const dayDiff = date => Math.round((new Date(date + "T00:00:00") - new Date(Progress.today() + "T00:00:00")) / 864e5);
  const dueText = date => { const d = dayDiff(date); return d < 0 ? `overdue by ${-d} day${d === -1 ? "" : "s"}` : d === 0 ? "due today" : d === 1 ? "due tomorrow" : `due in ${d} days`; };
  const dateLabel = date => new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const inDays = n => { const t = new Date(); t.setDate(t.getDate() + n); return t.toLocaleDateString("en-CA"); };

  function add({ stop, who, due, note, cls }) {
    const a = { id: newId(), stop, who, due, note: String(note || "").trim().slice(0, 160), by: state.mgrName || "Manager", created: Progress.today(), cls: cls || "sample" };
    state.assignments = [...list(), a]; Progress.save(state);
    return a;
  }
  function remove(id) { state.assignments = list().filter(a => a.id !== id); Progress.save(state); }

  // who is "class", "team:Miami", "rep:Ava R." or "rep:you"
  const whoLabel = who => (who === "class" ? "The whole class" : who === "rep:you" ? "You" : who.startsWith("team:") ? `Team ${who.slice(5)}` : who.slice(4));
  const covers = (a, reps) => reps.filter(r => a.who === "class" || a.who === "team:" + r.team || a.who === "rep:" + r.name || (a.who === "rep:you" && r.you));
  // The stops a sample rep has finished: everything up to the boss they last beat (a rep with no boss yet has done about one stop for every 110 XP).
  const stopsDone = r => new Set(PATH.slice(0, r.bosses > 0 ? PATH.indexOf(BOSSES[Math.min(BOSSES.length, r.bosses) - 1].id) + 1 : Math.min(PATH.length, Math.floor(r.xp / 110))));
  const repDone = (a, r) => (r.you ? !!state.done[a.stop] : r.invited ? false : stopsDone(r).has(a.stop));
  function progress(a, c) {
    const reps = covers(a, classReps(c)), left = reps.filter(r => !repDone(a, r)).map(r => r.name);
    return { total: reps.length, done: reps.length - left.length, left };
  }
  const classList = c => list().filter(a => (a.cls || "sample") === c.id).sort((x, y) => x.due.localeCompare(y.due));

  const message = (a, manager) => {
    const st = ALL_STOPS().find(x => x.id === a.stop), who = a.who.startsWith("rep:") && a.who !== "rep:you" ? a.who.slice(4).split(" ")[0] : "team";
    return `Hi ${who},\n\nPlease finish "${stopTitle(a.stop)}" by ${dateLabel(a.due)}.${a.note ? "\n\n" + a.note : ""}\n\nOpen the game, find the stop on your map and play it through. It takes about ${st ? stopMinutes(st) : 5} minutes.\n\n${manager}`;
  };

  // ----- what the rep sees -----
  const forPlayer = () => list().filter(a => (a.who === "class" || a.who === "rep:you") && ALL_STOPS().some(x => x.id === a.stop)).sort((x, y) => x.due.localeCompare(y.due));
  const pending = () => forPlayer().filter(a => !state.done[a.stop]);
  const isOpen = id => { const n = ALL_STOPS(), i = n.findIndex(x => x.id === id); return i === 0 || PROTO("unlockStops") || (i > 0 && !!state.done[n[i - 1].id]); };
  // One slim line on the map for each stop still to do (two at most), so the map stays clear.
  function strip() {
    const todo = pending(); if (!todo.length) return "";
    const n = ALL_STOPS();
    return `<div class="assigned" role="note">${todo.slice(0, 2).map(a => {
      const i = n.findIndex(x => x.id === a.stop);
      const open = isOpen(a.stop);   // the text wraps inside its own box, so the button always stays on the same line
      return `<p><span class="atext"><span aria-hidden="true">📌</span> <b>${esc(a.by)} assigned:</b> ${esc(stopTitle(a.stop))}, <span class="${dayDiff(a.due) < 0 ? "late" : ""}">${dueText(a.due)}</span>${a.note ? ` <i>“${esc(a.note)}”</i>` : ""}${open ? "" : ` <small>It opens after ${esc(n[i - 1].title)}.</small>`}</span>${open ? `<button class="btn alt agostart" type="button" data-id="${a.stop}">Go to it</button>` : ""}</p>`;
    }).join("")}${todo.length > 2 ? `<small>${todo.length - 2} more in your progress.</small>` : ""}</div>`;
  }
  // The Progress tab's card: everything assigned to the rep, done or not.
  function card() {
    const all = forPlayer(); if (!all.length) return "";
    return `<div class="card acard"><h3>Assigned to you</h3><ul class="alist">${all.map(a => { const done = !!state.done[a.stop];
      return `<li class="${done ? "done" : dayDiff(a.due) < 0 ? "late" : ""}"><span><b>${esc(stopTitle(a.stop))}</b> <small>${done ? "Done ✓" : `${dueText(a.due)} · ${dateLabel(a.due)}`}${a.note ? ` · “${esc(a.note)}”` : ""}</small></span>${!done && isOpen(a.stop) ? `<button class="btn alt agostart" type="button" data-id="${a.stop}">Go to it</button>` : ""}</li>`; }).join("")}</ul></div>`;
  }
  function start(id) { if (!$(".map")) home(); const b = $(`.node[data-id="${id}"]`); if (b) b.click(); }
  const wire = root => root.querySelectorAll(".agostart").forEach(b => { b.onclick = () => start(b.dataset.id); });

  return { list, add, remove, whoLabel, covers, stopsDone, repDone, progress, classList, message, forPlayer, pending, strip, card, wire, start, stopTitle, dayDiff, dueText, dateLabel, inDays,
    setDraft: d => { draft = d; }, takeDraft: () => { const d = draft; draft = null; return d; } };
})();

// ----- manager mode > Assign -----
function mgrAssign(el) {
  const c = allClasses().find(x => x.id === mgrClass) || SAMPLE_CLASS, reps = classReps(c), manager = state.mgrName && state.mgrName !== "Manager" ? state.mgrName : "[Your name]";
  const teams = [...new Set(reps.map(r => r.team).filter(t => t && t !== "—"))].sort(), d = Assign.takeDraft() || {}, stops = ALL_STOPS(), mine = Assign.classList(c);
  const opt = (v, label, sel) => `<option value="${esc(v)}" ${sel ? "selected" : ""}>${esc(label)}</option>`;
  el.innerHTML = `<div class="mhead"><div><h1 class="mtitle">Assign</h1><p class="msub">${esc(c.name)}${c.sample ? " · Sample data" : ""} · pick a stop, who it is for and a due date. Reps see it on their map until it is done.</p></div></div>
    <div class="mrow2">
      <div class="mcard"><h2>New assignment</h2>
        <label class="mlab" for="astop">Stop</label><select id="astop" class="minput">${stops.map((s, i) => opt(s.id, `${i + 1}. ${s.title} (${s.sub})`, s.id === d.stop)).join("")}</select>
        <label class="mlab" for="awho">Who</label><select id="awho" class="minput">${opt("class", `The whole class (${reps.length} rep${reps.length === 1 ? "" : "s"})`, !d.who || d.who === "class")}
          ${teams.length ? `<optgroup label="A team">${teams.map(t => opt("team:" + t, `Team ${t}`, d.who === "team:" + t)).join("")}</optgroup>` : ""}
          <optgroup label="One rep">${reps.map(r => opt(r.you ? "rep:you" : "rep:" + r.name, r.name, d.who === (r.you ? "rep:you" : "rep:" + r.name))).join("")}</optgroup></select>
        <label class="mlab" for="adue">Due</label><input id="adue" class="minput" type="date" value="${Assign.inDays(7)}" min="${Progress.today()}">
        <label class="mlab" for="anote">Note (optional)</label><textarea id="anote" class="minput" rows="2" maxlength="160" placeholder="For example: aim for three stars."></textarea>
        <div class="mcbtns"><button class="mbtn" id="aadd" type="button">Assign it</button></div>
        <p class="note2">Prototype: an assignment is saved on this device and shows on a rep's map in this browser. To tell your reps, copy the message from the list.</p></div>
      <div class="mcard"><h2>Assigned</h2>${mine.length ? mine.map(a => { const p = Assign.progress(a, c), late = Assign.dayDiff(a.due) < 0 && p.done < p.total;
        return `<div class="massign ${late ? "late" : ""}"><div class="mawho"><b>${esc(Assign.stopTitle(a.stop))}</b><small>${esc(Assign.whoLabel(a.who))} · ${Assign.dateLabel(a.due)} (${Assign.dueText(a.due)})${a.note ? ` · “${esc(a.note)}”` : ""}</small></div>
          <div class="mabar" role="img" aria-label="${p.done} of ${p.total} done"><i style="width:${p.total ? Math.round(p.done / p.total * 100) : 0}%"></i></div>
          <small>${p.done} of ${p.total} done${p.left.length ? `. Still to do: ${esc(p.left.slice(0, 6).join(", "))}${p.left.length > 6 ? ` and ${p.left.length - 6} more` : ""}` : ". Everyone is done."}</small>
          <div class="mcbtns"><button class="mbtn alt acopy" type="button" data-id="${a.id}">Copy the message</button><button class="mbtn alt arm" type="button" data-id="${a.id}">Remove</button></div></div>`; }).join("")
        : '<p class="note2">Nothing assigned yet. Pick a stop and press Assign it.</p>'}</div></div>`;
  $("#aadd").onclick = () => {
    const stop = $("#astop").value, who = $("#awho").value, due = $("#adue").value;
    if (!due) { toast("Pick a due date."); $("#adue").focus(); return; }
    if (due < Progress.today()) { toast("The due date has already passed."); $("#adue").focus(); return; }
    Assign.add({ stop, who, due, note: $("#anote").value, cls: c.id });
    toast(`Assigned “${Assign.stopTitle(stop)}” to ${Assign.whoLabel(who).toLowerCase()}.`);
    mgrAssign(el);
  };
  el.querySelectorAll(".acopy").forEach(b => b.onclick = () => {
    const a = Assign.list().find(x => x.id === b.dataset.id);
    navigator.clipboard?.writeText(Assign.message(a, manager)).then(() => toast("Message copied.")).catch(() => toast("Copy did not work. Select the text and press Ctrl+C."));
  });
  el.querySelectorAll(".arm").forEach(b => b.onclick = () => { if (confirm("Remove this assignment?")) { Assign.remove(b.dataset.id); mgrAssign(el); } });
}
