
import fs from "fs";

let file = fs.readFileSync("src/components/apb/ParticipantControlPanel.tsx", "utf8");

if (!file.includes("auditLogs")) {
  file = file.replace(
    "import { doc, updateDoc } from \"firebase/firestore\";",
    "import { doc, updateDoc, addDoc, collection } from \"firebase/firestore\";"
  );
  
  file = file.replace(
    "\"participantScreenState.updatedAt\": Date.now(),\n      });\n      setConfirmDialogOpen(false);",
    "\"participantScreenState.updatedAt\": Date.now(),\n      });\n      await addDoc(collection(db, \"auditLogs\"), { action: \"SCREEN_MODE_CHANGED\", mode, eventId, timestamp: Date.now() });\n      setConfirmDialogOpen(false);"
  );
  
  file = file.replace(
    "\"participantScreenState.updatedAt\": Date.now(),\n      });\n    } catch",
    "\"participantScreenState.updatedAt\": Date.now(),\n      });\n      await addDoc(collection(db, \"auditLogs\"), { action: \"BROADCAST_SENT\", heading: msg.heading, eventId, timestamp: Date.now() });\n    } catch"
  );

  fs.writeFileSync("src/components/apb/ParticipantControlPanel.tsx", file);
  console.log("Injected auditLogs into ParticipantControlPanel");
}

