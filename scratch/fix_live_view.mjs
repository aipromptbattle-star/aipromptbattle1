
import fs from "fs";
let f = fs.readFileSync("src/components/apb/LiveParticipantViewModal.tsx", "utf8");

f = f.replace(`draft?.prompt ||`, `draft?.content?.text ||`);
f = f.replace(`{draft?.member2Data?.imageUrl && (`, `{draft?.content?.imageUrl && (`);
f = f.replace(`src={draft.member2Data.imageUrl}`, `src={draft.content.imageUrl}`);

// Wait, what if it"s also looking at draft.prompt inside TeamWorkspace?
// No, TeamWorkspace uses draft.content.text.

fs.writeFileSync("src/components/apb/LiveParticipantViewModal.tsx", f);
console.log("Fixed draft references in Live View");

