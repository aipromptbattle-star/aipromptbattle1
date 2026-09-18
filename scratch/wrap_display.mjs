
import fs from "fs";

let file = fs.readFileSync("src/app/display/page.tsx", "utf8");

// We want to wrap the content inside the <main> block, OR just replace the entire page return with the wrapper.
// But wait, the standard display states (LEADERBOARD, LIVE_ROUND) need to show up as children of ParticipantScreenOverlay.
// So if displayOverride is something else, ParticipantScreenOverlay will hide the children (if it is an overlay mode).
// Wait, display mode LEADERBOARD and LIVE_ROUND are not in ParticipantScreenOverlay overlay modes.
// Let us check ParticipantScreenOverlay modes: RULES, ROUND_INTRO, COUNTDOWN, CONSTRAINT_REVEAL, ANNOUNCEMENT, PAUSED, ROUND_COMPLETE, LOCKED, WAITING.
// If it is one of those, it renders the overlay and blurs the children.
// This is EXACTLY what we want!

file = file.replace(
  `<main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-4 text-center max-w-6xl mx-auto w-full h-full">`,
  `<main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-4 text-center max-w-6xl mx-auto w-full h-full">
          <ParticipantScreenOverlay
            globalScreenMode={displayOverride as any}
            boardState={eventState?.displayBoardState as any}
          >`
);

file = file.replace(
  `        </main>`,
  `          </ParticipantScreenOverlay>\n        </main>`
);

// We need to also patch showOnDisplay to push displayHeading/displayImageUrl for legacy compatibility? 
// No, ParticipantScreenOverlay reads from boardState.activeTemplate! So we don"t need to populate displayHeading anymore, ParticipantScreenOverlay will handle it!

fs.writeFileSync("src/app/display/page.tsx", file);
console.log("Wrapped display/page.tsx");

