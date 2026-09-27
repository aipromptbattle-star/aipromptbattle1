
import fs from "fs";
let f = fs.readFileSync("src/app/organizer/teams/page.tsx", "utf8");
f = f.replace(
  `      <ActiveSessionsModal
        open={sessionsModalOpen}
        onOpenChange={setSessionsModalOpen}
        sessions={sessions}
        teams={teams}
      />
    </div>`,
  `      <ActiveSessionsModal
        open={sessionsModalOpen}
        onOpenChange={setSessionsModalOpen}
        sessions={sessions}
        teams={teams}
      />

      <LiveParticipantViewModal
        teamId={livePreviewTeam}
        open={!!livePreviewTeam}
        onOpenChange={(isOpen) => !isOpen && setLivePreviewTeam(null)}
      />
    </div>`
);
fs.writeFileSync("src/app/organizer/teams/page.tsx", f);
console.log("Added LiveParticipantViewModal");

