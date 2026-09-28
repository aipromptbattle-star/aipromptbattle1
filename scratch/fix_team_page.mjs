
import fs from "fs";

let teamPage = fs.readFileSync("src/app/team/page.tsx", "utf8");

// Revert the bad replace
teamPage = teamPage.replace(
  `return (\n    <>\n      <AntiCheatScreen />\n    <div className="min-h-screen bg-[#07080b] flex flex-col font-sans select-none">`,
  `return (\n    <div className="min-h-screen bg-[#07080b] flex flex-col font-sans select-none">\n      <AntiCheatScreen />`
);

fs.writeFileSync("src/app/team/page.tsx", teamPage);
console.log("Fixed team page injection");

