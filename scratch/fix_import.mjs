
import fs from "fs";
let rPage = fs.readFileSync("src/app/organizer/results/page.tsx", "utf8");
rPage = rPage.replace(`import { MonitorPlay, useState, useMemo } from "react";`, `import { useState, useMemo } from "react";`);
if (!rPage.includes("MonitorPlay,")) {
  rPage = rPage.replace(`import {\n  Loader2,`, `import {\n  MonitorPlay,\n  Loader2,`);
}
fs.writeFileSync("src/app/organizer/results/page.tsx", rPage);
console.log("Fixed import");

