
import fs from "fs";

let file = fs.readFileSync("src/app/organizer/teams/page.tsx", "utf8");

if (!file.includes("LiveParticipantViewModal")) {
  file = file.replace(
    "import { AddTeamDialog } from \"@/components/apb/AddTeamDialog\";",
    "import { AddTeamDialog } from \"@/components/apb/AddTeamDialog\";\nimport { LiveParticipantViewModal } from \"@/components/apb/LiveParticipantViewModal\";\nimport { useCurrentRound } from \"@/lib/firebase/events\";"
  );
  
  // Need to add state variable
  file = file.replace(
    "const [previewOpen, setPreviewOpen] = useState(false);",
    "const [previewOpen, setPreviewOpen] = useState(false);\n  const [livePreviewTeam, setLivePreviewTeam] = useState<string | null>(null);\n  const { currentRound } = useCurrentRound(eventState?.currentRoundId || null);"
  );

  file = file.replace(
    "<DropdownMenuItem onClick={() => {",
    `<DropdownMenuItem onClick={() => setLivePreviewTeam(team.teamId)} className="text-[var(--color-apb-cyan)] font-bold">\n                                Live Screen View\n                              </DropdownMenuItem>\n                              <DropdownMenuItem onClick={() => {`
  );
  
  // Add modal component at the end
  file = file.replace(
    "</Tabs>",
    `</Tabs>\n\n      <LiveParticipantViewModal \n        open={!!livePreviewTeam}\n        onOpenChange={(v) => !v && setLivePreviewTeam(null)}\n        teamId={livePreviewTeam}\n        eventId={eventState?.id || "currentEvent"}\n        round={currentRound || null}\n        globalScreenState={eventState?.participantScreenState}\n        isOnline={sessions.some(s => s.teamId === livePreviewTeam)}\n      />`
  );

  fs.writeFileSync("src/app/organizer/teams/page.tsx", file);
  console.log("Injected LiveParticipantViewModal");
}

