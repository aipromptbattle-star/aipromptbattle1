
import fs from "fs";

let css = fs.readFileSync("src/app/globals.css", "utf8");

if (!css.includes("-webkit-touch-callout")) {
  const selectionCss = `
/* --- MOBILE & ACCIDENTAL TOUCH PREVENTION --- */
body {
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
  /* Prevent touch highlight color on mobile */
  -webkit-tap-highlight-color: transparent;
}

input, textarea, [contenteditable="true"] {
  -webkit-user-select: auto;
  -ms-user-select: auto;
  user-select: auto;
}
`;
  css += selectionCss;
  fs.writeFileSync("src/app/globals.css", css);
  console.log("Added touch prevention to globals.css");
} else {
  console.log("Already present");
}

