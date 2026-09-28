
import fs from "fs";

let card = fs.readFileSync("src/components/apb/APBCard.tsx", "utf8");

card = card.replace(
  `"bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] rounded-lg overflow-hidden",`,
  `"bg-[#0a0f18]/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] transition-all duration-300 hover:bg-[#0a0f18]/80 hover:border-white/10",`
);

card = card.replace(
  `glow && "shadow-[0_0_20px_rgba(0,112,243,0.15)] border-[var(--color-apb-blue)]/30",`,
  `glow && "shadow-[0_0_30px_rgba(34,211,238,0.15)] border-[var(--color-apb-cyan)]/30 glow-pulse",`
);

fs.writeFileSync("src/components/apb/APBCard.tsx", card);
console.log("Applied glassmorphism to APBCard");

