
import fs from "fs";
let teamPage = fs.readFileSync("src/app/team/page.tsx", "utf8");
teamPage = teamPage.replace(`import { AntiCheatScreen } from "@/components/apb/AntiCheatScreen";\n`, ``);
teamPage = teamPage.replace(`      <AntiCheatScreen />\n`, ``);
fs.writeFileSync("src/app/team/page.tsx", teamPage);
console.log("Removed from page");

