
import fs from "fs";

let file = fs.readFileSync("src/lib/auth/TeamSessionContext.tsx", "utf8");

if (!file.includes("recoveryAuth?.status")) {
  const target = `// Check Access Code if configured on the team
      if (tData.accessCode && tData.accessCode.trim()) {`;
      
  const replacement = `// Check Auth Recovery bypass
      let recoveryUsed = false;
      if (tData.recoveryAuth?.status === "AUTHORIZED" && tData.recoveryAuth.expiresAt > Date.now()) {
        recoveryUsed = true;
      }
      
      // Check Access Code if configured on the team (skip if recovery is active)
      if (!recoveryUsed && tData.accessCode && tData.accessCode.trim()) {`;
      
  file = file.replace(target, replacement);
  
  // Now consume recovery after session creation
  const target2 = `// Record session in Firestore
      const sessionRef = doc(db, "sessions", currentUser!.uid);
      await setDoc(sessionRef, {
        teamId: normalizedTeamId,
        eventId: targetEventId,
        connectedAt: Date.now(),
        lastActiveAt: Date.now()
      });`;
      
  const replacement2 = `// Record session in Firestore
      const sessionRef = doc(db, "sessions", currentUser!.uid);
      await setDoc(sessionRef, {
        teamId: normalizedTeamId,
        eventId: targetEventId,
        connectedAt: Date.now(),
        lastActiveAt: Date.now()
      });
      
      // Consume recovery if used
      if (recoveryUsed) {
        import("firebase/firestore").then(({ updateDoc }) => {
          updateDoc(teamRef, {
            "recoveryAuth.status": "CONSUMED",
            "recoveryAuth.consumedAt": Date.now()
          }).catch(console.error);
        });
      }`;
      
  file = file.replace(target2, replacement2);
  fs.writeFileSync("src/lib/auth/TeamSessionContext.tsx", file);
  console.log("Injected Auth Recovery logic in joinTeam");
}

