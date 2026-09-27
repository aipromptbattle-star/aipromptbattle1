
import fs from "fs";
let f = fs.readFileSync("src/app/organizer/display/page.tsx", "utf8");
f = f.replace(`{/* Realtime Iframe preview to guarantee exact renderer matching */}`, `{/* Realtime Iframe preview to guarantee exact renderer matching */}
            <div className="absolute top-2 right-2 z-10 bg-black/60 px-2 py-1 rounded text-[10px] text-white/50 font-mono pointer-events-none">
              Previews update after saving
            </div>`);
fs.writeFileSync("src/app/organizer/display/page.tsx", f);
console.log("Added note to display iframe");

