"use strict";
// The small drawn icons for the hearts and the sound and voice toggles. They stand in for emoji, which look different on every phone and laptop.
// The shapes live once, in the <svg> sprite at the top of index.html. ic("heart") gives the tag that draws one in the text's own colour.
const ic = (name, extra = "") => `<svg class="ic ic-${name}${extra ? " " + extra : ""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;
