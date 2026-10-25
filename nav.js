"use strict";
// The header buttons, the phone tab bar, the sound button, and closing a panel with Escape or a click outside it.

// Header buttons toggle: click again (or click outside, or press Escape) to close without using the in-page buttons.
const closeCreator = () => { const d = $("#cdone"); if (d && !d.disabled) d.click(); else if ($("#cname")) $("#cname").focus(); };   // saves, since the name is required
$("#charBtn").onclick = () => { if ($(".creator")) closeCreator(); else if ($(".map") || $(".dhead")) creator(home); };
$("#dashBtn").onclick = () => ($(".dash") ? home() : dashboard());   // .dash is the dashboard itself; the brand page shares its .dhead header
// the phone bottom bar goes to the same places as the header buttons; tapping the page you are already on does nothing
const TAB_GO = { map: () => { if (!$(".map")) home(); }, dash: () => { if (!$(".dash")) dashboard(); }, char: () => { if (!$(".creator")) creator(home); }, brand: () => { if (!$(".explore")) explorer(); } };
document.querySelectorAll("#tabbar [data-tab]").forEach(b => b.onclick = () => TAB_GO[b.dataset.tab]());
function paintTabs() {
  const at = $(".creator") ? "char" : $(".explore") ? "brand" : $(".dash") ? "dash" : $(".map") ? "map" : "";
  document.querySelectorAll("#tabbar [data-tab]").forEach(b => { if (b.dataset.tab === at) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
}
// Click again to go back. In the middle of a mission it asks first, so answers aren't lost by accident.
$("#brandBtn").onclick = () => { if ($(".explore")) return home(); if ($("#pc") && !confirm("Leave this mission? Your answers so far won't count.")) return; explorer(); };
// tapping your level or XP in the footer opens the dashboard, but only from the map so a mission is never interrupted
["#ftLvl", "#ftXp"].forEach(id => { const el = $(id), go = () => { if ($(".map")) dashboard(); }; el.onclick = go; el.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } }; });
const paintSound = () => { const b = $("#soundBtn"); b.innerHTML = Sound.on ? '🔊 <span>Sound on</span>' : '🔇 <span>Sound off</span>'; b.setAttribute("aria-pressed", String(Sound.on)); b.setAttribute("aria-label", Sound.on ? "Sound is on. Click to mute." : "Sound is off. Click to turn on."); };
$("#soundBtn").onclick = () => { Sound.init(); Sound.setOn(!Sound.on); paintSound(); };
paintSound();
const goHome = () => { if (!document.body.classList.contains("onboarding")) home(); };
$("#logo").onclick = goHome;
$("#logo").onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); goHome(); } };
const closePanel = () => { if (document.body.classList.contains("onboarding")) return; if ($(".dhead")) home(); else if ($(".creator")) closeCreator(); };
document.addEventListener("click", e => { if (!e.target.isConnected || e.target.closest("header, footer, #tabbar, #presenter, dialog, .sheet, #camBox, .gate, a")) return; closePanel(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("dialog[open]")) closePanel(); });
