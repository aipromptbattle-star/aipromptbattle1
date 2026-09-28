
import fs from "fs";

let f = fs.readFileSync("src/app/team/page.tsx", "utf8");
// Replace teamRoundState?.overrideScreenMode with (teamData?.overrideScreenMode || teamRoundState?.overrideScreenMode)
f = f.replace(/overrideScreenMode=\{teamRoundState\?\.overrideScreenMode\}/g, 
  `overrideScreenMode={teamData?.overrideScreenMode || teamRoundState?.overrideScreenMode}`);

fs.writeFileSync("src/app/team/page.tsx", f);
console.log("Updated team page override mode");

