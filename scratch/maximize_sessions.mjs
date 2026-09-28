
import fs from "fs";
let f = fs.readFileSync("src/components/apb/ActiveSessionsModal.tsx", "utf8");

f = f.replace(
  `        <DialogContent className="max-w-4xl bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] text-white max-h-[90vh] overflow-y-auto p-6">`,
  `        <DialogContent className="w-[100vw] max-w-[100vw] h-[100vh] max-h-[100vh] m-0 rounded-none border-none bg-[#0a0f18] text-white overflow-y-auto p-4 md:p-10 scrollbar-none">`
);

fs.writeFileSync("src/components/apb/ActiveSessionsModal.tsx", f);
console.log("Maximized ActiveSessionsModal");

