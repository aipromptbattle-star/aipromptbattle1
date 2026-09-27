
import fs from "fs";
let f = fs.readFileSync("src/app/display/page.tsx", "utf8");
const syncBlock = `
          {/* 1.5 PARTICIPANT SYNC OVERRIDE */}
          {showParticipantSync && (
            <div className="w-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-300">
              <div className="relative w-[100vw] h-[100vh] overflow-hidden bg-black flex items-center justify-center">
                <ParticipantScreenOverlay
                  globalScreenMode={eventState.displayBoardState?.mode}
                  boardState={eventState.displayBoardState}
                  overrideScreenMode={eventState.displayBoardState?.mode}
                >
                  <div className="w-full h-full flex flex-col items-center justify-center opacity-30 text-white font-mono text-xl">
                  </div>
                </ParticipantScreenOverlay>
              </div>
            </div>
          )}
`;
f = f.replace("{/* 1. OVERRIDE: SHOW LEADERBOARD */}", syncBlock + "\\n          {/* 1. OVERRIDE: SHOW LEADERBOARD */}");
fs.writeFileSync("src/app/display/page.tsx", f);
console.log("Fixed display sync");

