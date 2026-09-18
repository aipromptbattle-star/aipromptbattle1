
import fs from "fs";

let file = fs.readFileSync("src/app/organizer/live/page.tsx", "utf8");

if (!file.includes("ParticipantControlPanel")) {
  file = file.replace(
    "import { ChallengePanel }", 
    "import { ParticipantControlPanel } from \"@/components/apb/ParticipantControlPanel\";\nimport { ChallengePanel }"
  );
  
  const target = `<APBCard className="p-6">
              <h2 className="text-lg font-mono font-bold tracking-widest text-white uppercase mb-6">
                Global System Alerts
              </h2>`;
              
  const replacement = `<ParticipantControlPanel 
                eventId={"currentEvent"} 
                currentScreenState={eventState?.participantScreenState}
                onlineCount={sessions.length}
              />
              
              ` + target;
              
  file = file.replace(target, replacement);
  fs.writeFileSync("src/app/organizer/live/page.tsx", file);
  console.log("Injected ParticipantControlPanel");
}

