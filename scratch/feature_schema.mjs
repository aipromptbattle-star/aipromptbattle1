
import fs from "fs";
let f = fs.readFileSync("src/lib/firebase/schema.ts", "utf8");

if (!f.includes("needsHelp")) {
  f = f.replace(`overrideScreenMode?: ParticipantScreenMode | null;`, `overrideScreenMode?: ParticipantScreenMode | null;\n  needsHelp?: boolean;`);
}

if (!f.includes("displayLeaderboardTopN")) {
  f = f.replace(`export interface EventSettings {`, `export interface EventSettings {\n  displayLeaderboardTopN?: number | null;`);
}

fs.writeFileSync("src/lib/firebase/schema.ts", f);
console.log("Updated Schema");

