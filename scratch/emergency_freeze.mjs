import fs from "fs";

let f = fs.readFileSync("src/app/organizer/rounds/page.tsx", "utf8");

if (!f.includes("EMERGENCY FREEZE")) {
  const actionsRegex = /<div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-\[var\(--color-apb-surface-border\)\]">/;
  
  const freezeBtn = `
          {currentRound?.status === "LIVE" && (
            <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-[var(--color-apb-cyan)]/20">
              <APBButton 
                onClick={() => {
                  setConfirmAction({
                    title: "EMERGENCY FREEZE",
                    description: "This will instantly pause the round timer and lock all participant screens. Use only for technical difficulties or severe network outages.",
                    confirmText: "FREEZE HALL",
                    destructive: true,
                    action: () => pauseRound(currentRound.id)
                  });
                  setConfirmOpen(true);
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black tracking-widest h-14 text-xl flex items-center justify-center gap-3 animate-pulse border border-red-400"
              >
                <Pause className="w-6 h-6" />
                EMERGENCY FREEZE
              </APBButton>
            </div>
          )}
          
          <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-[var(--color-apb-surface-border)]">`;
  
  f = f.replace(actionsRegex, freezeBtn);
  fs.writeFileSync("src/app/organizer/rounds/page.tsx", f);
  console.log("Added Emergency Freeze");
}
