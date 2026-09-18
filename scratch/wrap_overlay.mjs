
import fs from "fs";

let file = fs.readFileSync("src/app/team/page.tsx", "utf8");

const importStmt = "import { ParticipantScreenOverlay } from \"@/components/apb/ParticipantScreenOverlay\";\n";
if (!file.includes("ParticipantScreenOverlay")) {
  file = file.replace("import { TeamWorkspaceHeader }", importStmt + "import { TeamWorkspaceHeader }");
}

file = file.replace(
  /<main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">([\s\S]*?)<\/main>/g,
  (match, inner) => {
    return `<ParticipantScreenOverlay
          globalScreenMode={eventState?.participantScreenState?.globalScreenMode}
          overrideScreenMode={teamRoundState?.overrideScreenMode}
          broadcastMessage={eventState?.participantScreenState?.broadcastMessage}
        >
          <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto flex flex-col relative h-full">
            ${inner}
          </main>
        </ParticipantScreenOverlay>`;
  }
);

file = file.replace(
  /<main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6 pb-32 sm:pb-28">([\s\S]*?)<\/main>/g,
  (match, inner) => {
    return `<ParticipantScreenOverlay
          globalScreenMode={eventState?.participantScreenState?.globalScreenMode}
          overrideScreenMode={teamRoundState?.overrideScreenMode}
          broadcastMessage={eventState?.participantScreenState?.broadcastMessage}
        >
          <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6 pb-32 sm:pb-28 relative h-full">
            ${inner}
          </main>
        </ParticipantScreenOverlay>`;
  }
);

fs.writeFileSync("src/app/team/page.tsx", file);
console.log("Overlay wrapped!");

