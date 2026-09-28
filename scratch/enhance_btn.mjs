
import fs from "fs";

let btn = fs.readFileSync("src/components/apb/APBButton.tsx", "utf8");
btn = btn.replace(`shadow-[0_0_15px_rgba(0,240,255,0.4)] hover:shadow-[0_0_25px_rgba(0,240,255,0.6)]`, `shadow-[0_0_15px_rgba(34,211,238,0.5)] hover:shadow-[0_0_30px_rgba(34,211,238,0.9)] hover:scale-105 active:scale-95 group`);
btn = btn.replace(`shadow-[0_0_15px_rgba(255,50,50,0.4)] hover:shadow-[0_0_25px_rgba(255,50,50,0.6)]`, `shadow-[0_0_15px_rgba(244,63,94,0.5)] hover:shadow-[0_0_30px_rgba(244,63,94,0.9)] hover:scale-105 active:scale-95 group`);
fs.writeFileSync("src/components/apb/APBButton.tsx", btn);
console.log("Updated APBButton");

