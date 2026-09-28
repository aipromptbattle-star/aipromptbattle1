
import fs from "fs";

// 1. Revert modal
let m = fs.readFileSync("src/components/apb/LiveParticipantViewModal.tsx", "utf8");
m = m.replace(`draft?.content?.text ||`, `draft?.prompt ||`);
m = m.replace(`{draft?.content?.imageUrl && (`, `{draft?.member2Data?.imageUrl && (`);
m = m.replace(`src={draft.content.imageUrl}`, `src={draft.member2Data.imageUrl}`);
fs.writeFileSync("src/components/apb/LiveParticipantViewModal.tsx", m);

// 2. Fix coord page TS
let c = fs.readFileSync("src/app/coord/page.tsx", "utf8");
c = c.replace(`const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));`, `const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));`);
fs.writeFileSync("src/app/coord/page.tsx", c);

console.log("Fixed draft TS and coord TS");

