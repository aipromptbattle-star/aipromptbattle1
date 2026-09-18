
import fs from "fs";

let file = fs.readFileSync("src/components/apb/ParticipantScreenOverlay.tsx", "utf8");

file = file.replace(
  `if (finalMode === "ROUND_INTRO") {`,
  `if (finalMode === "ROUND_INTRO" || finalMode === "EVENT_STATUS") {`
);

const modesReplacement = `  const overlayModes = ["RULES", "ROUND_INTRO", "EVENT_STATUS", "COUNTDOWN", "CONSTRAINT_REVEAL", "ANNOUNCEMENT", "PAUSED", "EMERGENCY", "ROUND_COMPLETE", "LOCKED", "WAITING", "PARTICIPANT_SYNC"];`;
file = file.replace(`  const overlayModes = ["RULES", "ROUND_INTRO", "COUNTDOWN", "CONSTRAINT_REVEAL", "ANNOUNCEMENT", "PAUSED", "EMERGENCY", "ROUND_COMPLETE", "LOCKED", "WAITING", "PARTICIPANT_SYNC"];`, modesReplacement);

fs.writeFileSync("src/components/apb/ParticipantScreenOverlay.tsx", file);
console.log("Fixed EVENT_STATUS in overlay");

