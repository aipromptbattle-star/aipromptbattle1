
import fs from "fs";
let file = fs.readFileSync("src/app/display/page.tsx", "utf8");

const importReplacement = `import { ParticipantScreenOverlay } from "@/components/apb/ParticipantScreenOverlay";\nimport { Clock } from "lucide-react";`;
file = file.replace(`import { \n  Clock, `, `import { ParticipantScreenOverlay } from "@/components/apb/ParticipantScreenOverlay";\nimport { \n  Clock, `);

const overrideCheckReplacement = `  const showCustom = displayOverride === "IMAGE" || displayOverride === "TEXT";\n  const showParticipantSync = displayOverride === "PARTICIPANT_SYNC";`;
file = file.replace(`  const showCustom = displayOverride === "IMAGE" || displayOverride === "TEXT";`, overrideCheckReplacement);

// Insert the participant sync render block
const syncBlock = `
          {/* PARTICIPANT SYNC MODE */}
          {showParticipantSync && (
            <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 relative">
              <ParticipantScreenOverlay
                globalScreenMode={eventState?.participantScreenState?.globalScreenMode || "AUTO"}
                boardState={eventState?.participantScreenState}
              >
                <div />
              </ParticipantScreenOverlay>
            </div>
          )}
`;
file = file.replace(`          {/* CUSTOM IMAGE MODE */}`, `${syncBlock}\n          {/* CUSTOM IMAGE MODE */}`);

fs.writeFileSync("src/app/display/page.tsx", file);
console.log("Updated display page");

