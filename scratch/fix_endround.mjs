
import fs from "fs";

let f = fs.readFileSync("src/lib/firebase/events.ts", "utf8");
if (!f.includes("autoCaptureDrafts")) {
  const injectTarget = `import { logAudit } from "./teams";`;
  f = f.replace(injectTarget, `import { logAudit } from "./teams";\nimport { collection, getDocs } from "firebase/firestore";`);
  
  const endRoundStr = `export async function endRound(roundId: string) {`;
  const autoCaptureLogic = `export async function endRound(roundId: string) {
  const now = Date.now();

  // AUTO CAPTURE DRAFTS
  try {
    const draftsRef = collection(db, "drafts");
    const draftsSnap = await getDocs(draftsRef);
    
    await runTransaction(db, async (transaction) => {
      // End the round
      const roundRef = doc(db, "rounds", roundId);
      transaction.update(roundRef, {
        status: "CLOSED",
        endsAt: null,
        pausedRemainingSeconds: null,
        updatedAt: now
      });

      // Capture missing submissions
      for (const d of draftsSnap.docs) {
        const draft = d.data();
        if (draft.roundId === roundId) {
          const subId = \`\${EVENT_ID}_\${draft.teamId}_\${roundId}\`;
          const subRef = doc(db, "submissions", subId);
          const subDoc = await transaction.get(subRef);
          
          if (!subDoc.exists()) {
            // Auto capture
            transaction.set(subRef, {
              eventId: EVENT_ID,
              teamId: draft.teamId,
              roundId: roundId,
              prompt: draft.prompt || "",
              member2Data: draft.member2Data || null,
              quizAnswers: draft.quizAnswers || null,
              stageSubmissions: draft.stageSubmissions || null,
              status: "FINAL",
              submittedAt: now,
              autoCaptured: true
            });
            
            const stateRef = doc(db, "teamRoundState", subId);
            transaction.set(stateRef, {
              eventId: EVENT_ID,
              teamId: draft.teamId,
              roundId: roundId,
              status: "SUBMITTED",
              version: 2,
              updatedAt: now
            }, { merge: true });
          }
        }
      }
    });
    await logAudit("ROUND_ENDED_WITH_AUTOCAPTURE", "ORGANIZER", { roundId });
  } catch (err) {
    console.error("Auto capture failed:", err);
    // Fallback if transaction is too large
    await runTransaction(db, async (transaction) => {
      const roundRef = doc(db, "rounds", roundId);
      transaction.update(roundRef, {
        status: "CLOSED",
        endsAt: null,
        pausedRemainingSeconds: null,
        updatedAt: now
      });
    });
    await logAudit("ROUND_ENDED", "ORGANIZER", { roundId });
  }
}`;
  f = f.replace(/export async function endRound\(roundId: string\) \{[\s\S]*?logAudit\("ROUND_ENDED", "ORGANIZER", \{ roundId \}\);\n\}/, autoCaptureLogic);
  fs.writeFileSync("src/lib/firebase/events.ts", f);
  console.log("Added autoCaptureDrafts to endRound");
}

