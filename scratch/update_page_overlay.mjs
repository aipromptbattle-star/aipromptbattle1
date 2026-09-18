
import fs from "fs";

let page = fs.readFileSync("src/app/team/page.tsx", "utf8");
page = page.replace(
  /<ParticipantScreenOverlay\n\s*globalScreenMode=\{eventState\?\.participantScreenState\?\.globalScreenMode\}\n\s*overrideScreenMode=\{teamRoundState\?\.overrideScreenMode\}\n\s*broadcastMessage=\{eventState\?\.participantScreenState\?\.broadcastMessage\}\n\s*>/g,
  `<ParticipantScreenOverlay
          globalScreenMode={eventState?.participantScreenState?.globalScreenMode}
          overrideScreenMode={teamRoundState?.overrideScreenMode}
          boardState={eventState?.participantScreenState}
        >`
);
fs.writeFileSync("src/app/team/page.tsx", page);
console.log("Updated team page.tsx");

