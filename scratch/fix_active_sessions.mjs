
import fs from "fs";
let f = fs.readFileSync("src/components/apb/ActiveSessionsModal.tsx", "utf8");
f = f.replace(
  `className="sm:max-w-[700px] md:max-w-[900px] w-full bg-[#0a0a0a] border-[var(--color-apb-surface-border)] p-0 shadow-2xl flex flex-col max-h-[85vh]"`,
  `className="w-[95vw] max-w-[1400px] bg-[#0a0a0a] border-[var(--color-apb-surface-border)] p-0 shadow-2xl flex flex-col h-[90vh]"`
);
fs.writeFileSync("src/components/apb/ActiveSessionsModal.tsx", f);
console.log("Fixed ActiveSessionsModal width");

