
import fs from "fs";
let file = fs.readFileSync("src/components/apb/LiveParticipantViewModal.tsx", "utf8");

if (!file.includes("auditLogs")) {
  file = file.replace(
    "import { doc, updateDoc, deleteDoc } from \"firebase/firestore\";",
    "import { doc, updateDoc, deleteDoc, addDoc, collection } from \"firebase/firestore\";"
  );
  
  file = file.replace(
    "          updatedAt: Date.now(),\n        });\n      }",
    "          updatedAt: Date.now(),\n        });\n      }\n      await addDoc(collection(db, \"auditLogs\"), { action: \"TEAM_SCREEN_OVERRIDE\", mode, teamId, eventId, timestamp: Date.now() });"
  );

  fs.writeFileSync("src/components/apb/LiveParticipantViewModal.tsx", file);
  console.log("Injected auditLogs into LiveParticipantViewModal");
}

