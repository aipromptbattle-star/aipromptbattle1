
import fs from "fs";

let f = fs.readFileSync("src/app/organizer/participant-board/page.tsx", "utf8");
f = f.replace(`const syncToDisplay = async () => {`, `
    const syncToJudges = async () => {
      try {
        await updateEventSettings(cleanNullFallback({
          judgeScreenState: {
            globalScreenMode: "PARTICIPANT_SYNC",
            activeTemplate: {
              heading: draftHeading,
              subheading: draftSubheading,
              body: draftBody,
              imageUrl: draftImageUrl,
            },
            updatedAt: Date.now()
          }
        }));
        toast.success("Synced to Judges");
      } catch (e: any) {
        toast.error(e.message || "Failed to sync to judges");
      }
    };
    
    const returnJudgesToAuto = async () => {
      try {
        await updateEventSettings(cleanNullFallback({
          judgeScreenState: {
            globalScreenMode: "AUTO",
            activeTemplate: null,
            updatedAt: Date.now()
          }
        }));
        toast.success("Judges returned to Auto");
      } catch (e: any) {
        toast.error(e.message || "Failed to return judges to auto");
      }
    };

    const syncToDisplay = async () => {`);

const newSyncUI = `
            <div className="mt-6 pt-6 border-t border-[var(--color-apb-surface-border)]">
              <h3 className="font-mono text-sm uppercase text-white tracking-widest mb-4 flex items-center gap-2">
                <Copy className="w-4 h-4 text-[var(--color-apb-cyan)]" />
                Target Sync
              </h3>
              <p className="text-xs text-slate-400 font-mono mb-4">
                Push the currently previewed template to the public display or judge panels. They remain independent after syncing.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <APBButton onClick={syncToDisplay} className="w-full bg-[var(--color-apb-surface-border)] hover:bg-slate-700 text-white border border-slate-600 flex flex-col items-center gap-1 h-auto py-3">
                  <Monitor className="w-4 h-4" />
                  <span>SYNC TO PUBLIC DISPLAY</span>
                </APBButton>
                <div className="space-y-2">
                  <APBButton onClick={syncToJudges} className="w-full bg-purple-900/40 hover:bg-purple-900/60 text-purple-300 border border-purple-500/50 flex flex-col items-center gap-1 h-auto py-3">
                    <Lock className="w-4 h-4" />
                    <span>SYNC TO JUDGES (LOCK)</span>
                  </APBButton>
                  <APBButton variant="ghost" size="sm" onClick={returnJudgesToAuto} className="w-full text-xs text-purple-400 hover:text-purple-300">
                    Unlock Judges (Return to Auto)
                  </APBButton>
                </div>
              </div>
            </div>
`;

f = f.replace(/<div className="mt-6 pt-6 border-t border-\[var\(--color-apb-surface-border\)\]">[\s\S]*?<\/APBButton>\n            <\/div>/, newSyncUI);

fs.writeFileSync("src/app/organizer/participant-board/page.tsx", f);
console.log("Added Judge Sync to PB");

