
import fs from "fs";

let rPage = fs.readFileSync("src/app/organizer/results/page.tsx", "utf8");
// I accidentally injected `import { MonitorPlay,` in the first import which was `import { useState, useMemo } from "react";`.
rPage = rPage.replace(`import { MonitorPlay,\n  useState, useMemo } from "react";`, `import { useState, useMemo } from "react";`);
rPage = rPage.replace(`import { MonitorPlay,useState, useMemo } from "react";`, `import { useState, useMemo } from "react";`);
if (!rPage.includes(`MonitorPlay,`)) {
  rPage = rPage.replace(`import {\n  Loader2,`, `import {\n  MonitorPlay,\n  Loader2,`);
}
fs.writeFileSync("src/app/organizer/results/page.tsx", rPage);

let dPage = fs.readFileSync("src/app/display/page.tsx", "utf8");
const regexAudioDouble = /\/\/ Synthesize a generic UI tick sound[\s\S]*?function playTick[\s\S]*?\/\/ Synthesize a generic UI tick sound/m;
if (dPage.match(regexAudioDouble)) {
  // It means the first one didn"t get deleted. Let"s just find the first playTick and playGong block and delete it.
  dPage = dPage.replace(/\/\/ Synthesize a generic UI tick sound[\s\S]*?\} catch \(e\) \{\}\n\}\n\n\/\/ Synthesize a heavy gong\/chord for GO[\s\S]*?\} catch \(e\) \{\}\n\}/m, "");
  fs.writeFileSync("src/app/display/page.tsx", dPage);
}
console.log("Fixed part 2");

