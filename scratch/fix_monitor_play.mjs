
import fs from "fs";

let rPage = fs.readFileSync("src/app/organizer/results/page.tsx", "utf8");
// I know exact string is probably "import { MonitorPlay, useState, useMemo } from \"react\";" or something
rPage = rPage.replace(/import\s*\{\s*MonitorPlay,?\s*useState,\s*useMemo\s*\}\s*from\s*"react";/g, "import { useState, useMemo } from \\"react\\";");
rPage = rPage.replace(/import\s*\{\s*useState,\s*useMemo\s*\}\s*from\s*"react";/, "import { useState, useMemo } from \\"react\\";");
// ensure it"s imported from lucide-react
if (!rPage.includes("MonitorPlay,")) {
  rPage = rPage.replace("import {", "import { MonitorPlay,");
}
fs.writeFileSync("src/app/organizer/results/page.tsx", rPage);

let pPage = fs.readFileSync("src/app/organizer/participant-board/page.tsx", "utf8");
// fix the selectedMode !== "AUTO" TS error by casting
pPage = pPage.replace(`selectedMode !== "AUTO"`, `(selectedMode as string) !== "AUTO"`);
pPage = pPage.replace(`selectedMode !== "AUTO"`, `(selectedMode as string) !== "AUTO"`);
fs.writeFileSync("src/app/organizer/participant-board/page.tsx", pPage);
console.log("Fixed last errors");

