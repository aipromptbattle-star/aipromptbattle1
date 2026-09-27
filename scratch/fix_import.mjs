
import fs from "fs";
let f = fs.readFileSync("src/components/apb/ParticipantScreenOverlay.tsx", "utf8");
f = f.replace(/<LayoutTemplate/g, "<Gavel");
fs.writeFileSync("src/components/apb/ParticipantScreenOverlay.tsx", f);
console.log("Replaced with Gavel");

