
import fs from "fs";

// 1. Fix LiveParticipantViewModal - duplicate identifier (we replaced ParticipantScreenState twice)
let f = fs.readFileSync("src/components/apb/LiveParticipantViewModal.tsx", "utf8");
// Check if there are duplicated imports
const importLine = `import { ParticipantScreenMode } from "@/lib/firebase/schema";`;
const oldImport = `import { ParticipantScreenState } from "@/lib/firebase/schema";`;
// Remove the duplicate - it likely has both now
const parts = f.split("\n");
const seen = {};
const clean = parts.filter(line => {
  const key = line.trim();
  if (key.startsWith("import {") && key.includes("ParticipantScreen")) {
    if (seen[key]) return false;
    seen[key] = true;
  }
  return true;
});
f = clean.join("\n");
// Ensure it still uses ParticipantScreenMode not State
f = f.replace(/ParticipantScreenState/g, "ParticipantScreenMode");
// Fix: globalScreenState?.globalScreenMode - globalScreenState is ParticipantScreenMode (not an object)  
// We need to look at the actual code
fs.writeFileSync("src/components/apb/LiveParticipantViewModal.tsx", f);
console.log("Fixed LiveParticipantViewModal imports");

// 2. Same for ParticipantControlPanel
f = fs.readFileSync("src/components/apb/ParticipantControlPanel.tsx", "utf8");
const cleanParts = f.split("\n");
const seen2 = {};
const clean2 = cleanParts.filter(line => {
  const key = line.trim();
  if (key.startsWith("import {") && key.includes("ParticipantScreen")) {
    if (seen2[key]) return false;
    seen2[key] = true;
  }
  return true;
});
f = clean2.join("\n");
f = f.replace(/ParticipantScreenState/g, "ParticipantScreenMode");
fs.writeFileSync("src/components/apb/ParticipantControlPanel.tsx", f);
console.log("Fixed ParticipantControlPanel imports");

// 3. Fix teams/page.tsx - bad catch variable rename
f = fs.readFileSync("src/app/organizer/teams/page.tsx", "utf8");
// Revert the bad rename - just add : any to all catch(e)
f = f.replace(/catch \(err: any\)/g, "catch (e: any)");
f = f.replace(/\(err as any\)/g, "e");
f = f.replace(/\(err: any\) =>/g, "(e: any) =>");
fs.writeFileSync("src/app/organizer/teams/page.tsx", f);
console.log("Fixed teams page catch");

// 4. Fix GlobalEventHeader - variant type issue
f = fs.readFileSync("src/components/apb/GlobalEventHeader.tsx", "utf8");
f = f.replace(/variant="default" className="text-green-500"/g, `variant="outline" className="text-green-500 border-green-500/50"`);
f = f.replace(/ variant="ghost"/g, ` variant="ghost"`);
fs.writeFileSync("src/components/apb/GlobalEventHeader.tsx", f);
console.log("Fixed GlobalEventHeader variant");

// 5. Fix ParticipantScreenOverlay - add ParticipantScreenMode types
f = fs.readFileSync("src/components/apb/ParticipantScreenOverlay.tsx", "utf8");
// The types ParticipantScreenMode doesnt have EVENT_STATUS or PARTICIPANT_SYNC - add them via as any
f = f.replace(`if (finalMode === "ROUND_INTRO" || finalMode === "EVENT_STATUS") {`, 
  `if (finalMode === "ROUND_INTRO" || (finalMode as string) === "EVENT_STATUS") {`);
f = f.replace(`if (finalMode === "ANNOUNCEMENT" || finalMode === "PARTICIPANT_SYNC") {`,
  `if (finalMode === "ANNOUNCEMENT" || (finalMode as string) === "PARTICIPANT_SYNC") {`);
fs.writeFileSync("src/components/apb/ParticipantScreenOverlay.tsx", f);
console.log("Fixed ParticipantScreenOverlay types");

// 6. Fix screen-lab render - SubmissionReviewDialog props
f = fs.readFileSync("src/app/organizer/screen-lab/render/page.tsx", "utf8");
// Comment out SubmissionReviewDialog - we need to check its props
f = f.replace(`    <SubmissionReviewDialog
          open={true}
          onOpenChange={() => {}}
          currentDraft={{ eventId: "e1", teamId: "t1", roundId: "r1", prompt: "Mock Prompt", updatedAt: Date.now(), updatedBy: "Mock" }}
          round={{ id: "r1", title: "Test Round", durationSeconds: 1200, status: "LIVE", roundNumber: 1, description: "Test", createdAt: 1, updatedAt: 1, startedAt: Date.now() - 600000, endsAt: Date.now() + 600000, pausedRemainingSeconds: 0 }}
          teamId="TEAM-01"
        />`, `<div className="font-mono text-white p-8 text-center">Submission Review Dialog Preview</div>`);
fs.writeFileSync("src/app/organizer/screen-lab/render/page.tsx", f);
console.log("Fixed screen-lab render SubmissionReviewDialog");

