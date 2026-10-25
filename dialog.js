"use strict";
// The popup shown before a stop.

// ---------- difficulty dialog ----------
// The popup before a stop. Lessons just start. Missions explain how they work and offer the camera coach, which is on by default.
// About how long a stop takes, so a rep can fit it in. A lesson question takes about half a minute and a mission answer about a minute and a half.
const stopMinutes = st => (st.practice ? 6 : st.qs ? Math.max(2, Math.round(st.qs.length * 0.5)) : st.steps ? Math.max(3, Math.round(st.steps.length * 1.5)) : 3);
function openDiff(go, stop) {
  const dlg = $("#diffDlg"), lesson = !!(stop && stop.qs), L = MLEVEL[(stop && stop.level) || 2];
  dlg.onclick = e => { const r = dlg.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close(); };   // click outside to close
  const rw = !stop.practice && !stop.noReward && stopRewards(stop.id), got = rw && state.done[stop.id];
  const coachOnDefault = state.coachPref === true || state.coachPref === false ? state.coachPref : ((stop && stop.level) || 2) <= 2;
  const secure = window.isSecureContext, hasSR = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  dlg.innerHTML = `<h2>${esc(stop.title)}</h2>
    <p class="note2">${esc(stop.sub)} · ${lesson ? "lesson" : stop.practice ? "practice round" : "Level " + stop.level + " · " + L.name} · about ${stopMinutes(stop)} min</p>
    ${rw ? `<p class="unlockbox ${got ? "got" : ""}"><b>${got ? "✓ Already unlocked" : "🎁 Pass this to unlock"}:</b> ${rw.map(esc).join(", ")}</p>` : ""}
    ${lesson ? `<p>A quick brand quiz to learn the facts you'll use in the missions.</p>` : `
    <p>${stop.practice ? "A short mix of moments from different customers, picked to train one skill." : L.blurb}</p>
    <ul class="hirelist">
      <li><b>The customer speaks</b> and you get a question.</li>
      <li><b>You answer out loud</b>, like a recorded interview, or type it.</li>
      <li><b>Your avatar plays your answer back in your own voice</b>, and the customer replies to what you said.</li>
      <li><b>Scores come at the end</b> (or after each answer in Coach mode): each answer out of 5. Four points are for what you say and one is for <b>tone</b>, judged for the situation. You see what you mentioned and what to improve.</li></ul>
    ${stop.boss ? '<p class="note2 coachnote">💡 Boss battles are scored at the end, with no Coach mode and no hints.</p>' : `<div class="grp"><label class="camopt"><input type="checkbox" id="coachOn" ${coachOnDefault ? "checked" : ""}> 💡 Coach mode <span class="recommend">(feedback after every answer)</span></label>
      <p class="note2 camnote">On by default for the easy levels. Turn it off to be scored only at the end, like a real interview. A hint costs ${HINT_COST} XP.</p></div>`}
    <div class="grp"><label class="camopt"><input type="checkbox" id="camOn" ${state.cam ? "checked" : ""}> 📷 Camera coach <span class="recommend">(highly recommended)</span></label>
      <p class="note2 camnote" id="camnote"><b>Why:</b> you get a delivery score out of 5 for eye contact, posture and smiling, and 25% more XP. Your browser will ask to use the camera. Video stays on your device and is never recorded or uploaded.</p>
      ${secure ? "" : '<p class="note2 warnnote">The camera and microphone only work on https or http://localhost.</p>'}
      ${hasSR ? "" : '<p class="note2 warnnote">Voice recording isn\'t available in this browser. Chrome or Edge have it. You can still type your answers.</p>'}</div>`}
    <div class="dactions"><button class="btn" id="dstart" type="button">Start</button><button class="btn alt" id="dcancel" type="button">Cancel</button></div>`;
  if ($("#camOn")) $("#camOn").onchange = e => { state.cam = e.target.checked; state.camPref = state.cam; Progress.save(state); };
  if ($("#coachOn")) $("#coachOn").onchange = e => { state.coachPref = e.target.checked; Progress.save(state); };
  $("#dstart").onclick = () => { dlg.close(); if (go) go(); };
  $("#dcancel").onclick = () => dlg.close();
  dlg.showModal();
  $("#dstart").focus({ preventScroll: true });
}
