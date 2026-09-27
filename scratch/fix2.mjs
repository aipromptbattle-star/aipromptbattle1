
import fs from "fs";
let f = fs.readFileSync("src/app/display/page.tsx", "utf8");
f = f.replace(/{showLeaderboard && !showCustom && \(/g, "{showLeaderboard && !showCustom && !showParticipantSync && (");
f = f.replace(/{!showLeaderboard && !showCustom && showStarting && \(/g, "{!showLeaderboard && !showCustom && !showParticipantSync && showStarting && (");
f = f.replace(/{!showLeaderboard && !showCustom && showWaiting && \(/g, "{!showLeaderboard && !showCustom && !showParticipantSync && showWaiting && (");
f = f.replace(/{!showLeaderboard && !showCustom && showPaused && \(/g, "{!showLeaderboard && !showCustom && !showParticipantSync && showPaused && (");
f = f.replace(/{!showLeaderboard && !showCustom && showComplete && \(/g, "{!showLeaderboard && !showCustom && !showParticipantSync && showComplete && (");
f = f.replace(/{!showLeaderboard && !showCustom && showLive && \(/g, "{!showLeaderboard && !showCustom && !showParticipantSync && showLive && (");
fs.writeFileSync("src/app/display/page.tsx", f);
console.log("Fixed display logic");

