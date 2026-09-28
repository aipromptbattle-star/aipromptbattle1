
import fs from "fs";

let f = fs.readFileSync("src/components/apb/LiveParticipantViewModal.tsx", "utf8");

f = f.replace(
  `      <DialogContent className="max-w-5xl bg-black border-[var(--color-apb-surface-border)] text-white p-0 overflow-hidden flex flex-col h-[85vh]">`,
  `      <DialogContent className="w-[100vw] max-w-[100vw] h-[100vh] max-h-[100vh] m-0 rounded-none border-none bg-black text-white p-0 overflow-hidden flex flex-col scrollbar-none">`
);

fs.writeFileSync("src/components/apb/LiveParticipantViewModal.tsx", f);
console.log("Maximized LiveParticipantViewModal");

