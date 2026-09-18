
import fs from "fs";

let file = fs.readFileSync("src/components/apb/ParticipantScreenOverlay.tsx", "utf8");

// List of modes that are rendered by the Overlay itself.
// Other modes like TEXT, IMAGE, LEADERBOARD, LIVE_ROUND are rendered by the parent component (e.g. display/page.tsx)
const replacement = `  const overlayModes = ["RULES", "ROUND_INTRO", "COUNTDOWN", "CONSTRAINT_REVEAL", "ANNOUNCEMENT", "PAUSED", "EMERGENCY", "ROUND_COMPLETE", "LOCKED", "WAITING"];
  const isOverlayMode = overlayModes.includes(finalMode);`;

file = file.replace(
  `const isOverlayMode = finalMode !== "AUTO" && finalMode !== "NORMAL";`,
  replacement
);

fs.writeFileSync("src/components/apb/ParticipantScreenOverlay.tsx", file);
console.log("Fixed Overlay isOverlayMode");

