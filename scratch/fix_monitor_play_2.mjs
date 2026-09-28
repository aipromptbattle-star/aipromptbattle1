
import fs from "fs";

let rPage = fs.readFileSync("src/app/organizer/results/page.tsx", "utf8");
rPage = rPage.replace(/import\s*\{\s*MonitorPlay,?\s*useState,\s*useMemo\s*\}\s*from\s*"react";/g, `import { useState, useMemo } from "react";`);
if (!rPage.includes("MonitorPlay,")) {
  rPage = rPage.replace("import {", "import { MonitorPlay,");
}
fs.writeFileSync("src/app/organizer/results/page.tsx", rPage);

let pPage = fs.readFileSync("src/app/organizer/participant-board/page.tsx", "utf8");
pPage = pPage.replace(/selectedMode !== "AUTO"/g, `(selectedMode as string) !== "AUTO"`);
fs.writeFileSync("src/app/organizer/participant-board/page.tsx", pPage);
console.log("Fixed last errors");

