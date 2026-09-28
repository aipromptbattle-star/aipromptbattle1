
import fs from "fs";

// 1. display/page.tsx
let f1 = fs.readFileSync("src/app/display/page.tsx", "utf8");
f1 = f1.replace(`scoredSubmissions.slice(0, 8).map`, `scoredSubmissions.slice(0, eventState?.displayLeaderboardTopN || 8).map`);
fs.writeFileSync("src/app/display/page.tsx", f1);

// 2. organizer/results/page.tsx
let f2 = fs.readFileSync("src/app/organizer/results/page.tsx", "utf8");

// Add Top N control
if (!f2.includes("Top N")) {
  const oldControls = `<div className="flex gap-2">
            <APBButton`;
  const newControls = `<div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">DISPLAY TOP:</span>
              <Input 
                type="number" 
                className="w-16 h-8 font-mono text-xs text-center" 
                value={eventState?.displayLeaderboardTopN || 8}
                onChange={async (e) => {
                  try {
                    await updateEventSettings({ displayLeaderboardTopN: parseInt(e.target.value) || 8 });
                  } catch(e){}
                }}
              />
            </div>
            <APBButton`;
  
  // Need to import updateEventSettings and Input if not there.
  f2 = f2.replace(oldControls, newControls);
  if (!f2.includes("Input")) {
    f2 = f2.replace(`import { Label } from "@/components/ui/label";`, `import { Label } from "@/components/ui/label";\nimport { Input } from "@/components/ui/input";`);
  }
  fs.writeFileSync("src/app/organizer/results/page.tsx", f2);
}

console.log("Added Top N");

