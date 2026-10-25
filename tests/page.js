// The page's own code used to be one inline script in index.html. It now lives in the files below, loaded in this order after the other scripts.
// source() puts them back in the place of their tags, so a test can still search the whole page as one text. globals.test.js checks this list matches the page.
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const read = f => fs.readFileSync(path.join(root, f), "utf8");
const PAGE_FILES = ["app.js", "dialog.js", "nav.js", "practice.js", "explorer.js", "map.js", "people.js", "hair.js", "merch.js", "avatar.js", "creator.js", "scenes.js", "results.js", "start.js"];

function source() {
  const tag = f => new RegExp(`<script src="${f}\\?v=[^"]*"></script>\\n?`);
  const code = PAGE_FILES.map(f => read(f).replace(/^"use strict";\n/, "")).join("\n");
  let html = read("index.html");
  PAGE_FILES.forEach((f, i) => { html = html.replace(tag(f), () => (i === 0 ? `<script>\n"use strict";\n${code}</script>\n` : "")); });
  return html;
}
module.exports = { PAGE_FILES, source };
