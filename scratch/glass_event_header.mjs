
import fs from "fs";

let header = fs.readFileSync("src/components/apb/GlobalEventHeader.tsx", "utf8");

header = header.replace(
  `className="bg-[var(--color-apb-surface)] border-b border-[var(--color-apb-surface-border)] px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2 font-mono text-xs uppercase tracking-widest"`,
  `className="bg-black/30 backdrop-blur-md border-b border-white/5 px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2 font-mono text-xs uppercase tracking-widest relative z-20"`
);

fs.writeFileSync("src/components/apb/GlobalEventHeader.tsx", header);
console.log("Applied glassmorphism to EventHeader");

