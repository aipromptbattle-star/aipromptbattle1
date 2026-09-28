
import fs from "fs";

// 1. Update Schema
let schema = fs.readFileSync("src/lib/firebase/schema.ts", "utf8");
if (!schema.includes("imagePosition?:")) {
  schema = schema.replace(`durationSeconds?: number;`, `durationSeconds?: number;\n  textAlign?: "left" | "center" | "right";\n  imagePosition?: "top" | "bottom" | "bg";`);
  fs.writeFileSync("src/lib/firebase/schema.ts", schema);
}

// 2. Update Display - Submissions Count
let display = fs.readFileSync("src/app/display/page.tsx", "utf8");
if (!display.includes("currentSubmissionsCount")) {
  display = display.replace(`// Leaderboard scored teams`, `
  const currentSubmissionsCount = submissions.filter(s => s.roundId === currentRound?.id && s.status === "FINAL").length;
  const activeTeamsCount = teams.filter(t => t.active !== false).length;

  // Leaderboard scored teams`);

  const timerBlockEnd = `{formatTimer(roundTimeLeft)}\n                </div>`;
  const subCounterBlock = `\n                <div className="mt-8 px-8 py-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
                  <div className="text-sm font-mono text-slate-400 tracking-widest uppercase mb-1">SUBMISSIONS</div>
                  <div className="text-4xl font-black font-mono text-white tracking-widest">
                    <span className={currentSubmissionsCount === activeTeamsCount ? "text-emerald-400" : "text-[var(--color-apb-cyan)]"}>
                      {currentSubmissionsCount}
                    </span>
                    <span className="text-white/30 mx-2">/</span>
                    <span className="text-white/70">{activeTeamsCount}</span>
                  </div>
                </div>`;
  
  display = display.replace(timerBlockEnd, timerBlockEnd + subCounterBlock);
  fs.writeFileSync("src/app/display/page.tsx", display);
}

console.log("Updated Schema and Display Submissions Count");

