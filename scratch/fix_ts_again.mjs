
import fs from "fs";

let dPage = fs.readFileSync("src/app/organizer/display/page.tsx", "utf8");
dPage = dPage.replace(/draftHeading \|\| null/g, "draftHeading || undefined");
dPage = dPage.replace(/draftSubheading \|\| null/g, "draftSubheading || undefined");
dPage = dPage.replace(/draftBody \|\| null/g, "draftBody || undefined");
dPage = dPage.replace(/draftImageUrl \|\| null/g, "draftImageUrl || undefined");
fs.writeFileSync("src/app/organizer/display/page.tsx", dPage);

let rPage = fs.readFileSync("src/app/organizer/results/page.tsx", "utf8");
rPage = rPage.replace(/import\s*\{\s*MonitorPlay,?\s*useState,\s*useMemo\s*\}\s*from\s*"react";/g, `import { useState, useMemo } from "react";`);
if (!rPage.includes("MonitorPlay,")) {
  rPage = rPage.replace("import {", "import { MonitorPlay,");
}
fs.writeFileSync("src/app/organizer/results/page.tsx", rPage);

console.log("Reverted to undefined");

