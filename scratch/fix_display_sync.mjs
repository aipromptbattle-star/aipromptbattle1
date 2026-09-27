
import fs from "fs";
let f = fs.readFileSync("src/app/display/page.tsx", "utf8");
// 1. Update the other screens to not show if showParticipantSync is true
f = f.replace(
  `{showLeaderboard && !showCustom && (`,
  `{showLeaderboard && !showCustom && !showParticipantSync && (`
);
f = f.replace(
  `{!showLeaderboard && !showCustom && showStarting && (`,
  `{!showLeaderboard && !showCustom && !showParticipantSync && showStarting && (`
);
f = f.replace(
  `{!showLeaderboard && !showCustom && showWaiting && (`,
  `{!showLeaderboard && !showCustom && !showParticipantSync && showWaiting && (`
);
f = f.replace(
  `{!showLeaderboard && !showCustom && showPaused && (`,
  `{!showLeaderboard && !showCustom && !showParticipantSync && showPaused && (`
);
f = f.replace(
  `{!showLeaderboard && !showCustom && showComplete && (`,
  `{!showLeaderboard && !showCustom && !showParticipantSync && showComplete && (`
);
f = f.replace(
  `{!showLeaderboard && !showCustom && showLive && (`,
  `{!showLeaderboard && !showCustom && !showParticipantSync && showLive && (`
);
// 2. Add showParticipantSync block right after showCustom block
const customBlock = `            </div>
          )}`;
const syncBlock = `

          {/* 1.5 PARTICIPANT SYNC OVERRIDE */}
          {showParticipantSync && (
            <div className="w-full flex items-center justify-center animate-in fade-in zoom-in-95 duration-300">
              <div className="relative w-[100vw] h-[100vh] overflow-hidden bg-black flex items-center justify-center">
                <ParticipantScreenOverlay
                  globalScreenMode={eventState.displayBoardState?.mode}
                  boardState={eventState.displayBoardState}
                >
                  <div className="w-full h-full flex flex-col items-center justify-center opacity-30 text-white font-mono text-xl">
                    [PARTICIPANT SYNC MODE]
                  </div>
                </ParticipantScreenOverlay>
              </div>
            </div>
          )}`;
          
const parts = f.split(customBlock);
if (parts.length > 1) {
  // We want to insert it after the FIRST customBlock which corresponds to showCustom.
  // Wait, let us just find the exact string.
  const searchFor = `          {/* 1. OVERRIDE: SHOW LEADERBOARD */}`;
  f = f.replace(searchFor, syncBlock + "\\n\\n          {/* 1. OVERRIDE: SHOW LEADERBOARD */}");
  fs.writeFileSync("src/app/display/page.tsx", f);
  console.log("Fixed display sync");
}

