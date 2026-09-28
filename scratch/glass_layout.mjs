
import fs from "fs";

let layout = fs.readFileSync("src/app/organizer/layout.tsx", "utf8");

// Add ambient animated background mesh behind everything
const ambientBg = `
        {/* AMBIENT MESH BACKGROUND FOR GLASS EFFECT */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--color-apb-cyan)]/10 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: "8s" }} />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: "12s" }} />
        </div>
`;

// Inject ambient background
layout = layout.replace(
  `<div className="h-[100dvh] w-full bg-background text-foreground flex flex-col font-sans overflow-hidden relative">`,
  `<div className="h-[100dvh] w-full bg-[#03050a] text-foreground flex flex-col font-sans overflow-hidden relative">\n${ambientBg}`
);

// Make Header Glassy
layout = layout.replace(
  `header className="border-b border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)] px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 z-50"`,
  `header className="border-b border-white/5 bg-[#0a0f18]/60 backdrop-blur-2xl px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 z-50 shadow-lg"`
);

// Make Mobile Nav Glassy
layout = layout.replace(
  `className="absolute top-[100px] inset-x-0 bottom-0 bg-black/95 z-40 p-4 overflow-y-auto sm:hidden flex flex-col gap-2"`,
  `className="absolute top-[100px] inset-x-0 bottom-0 bg-[#0a0f18]/80 backdrop-blur-2xl z-40 p-4 overflow-y-auto sm:hidden flex flex-col gap-2"`
);

// Make Main Scroll Area transparent so the ambient BG shows through
layout = layout.replace(
  `<main \n          ref={mainRef}\n          className="flex-1 min-w-0 w-full h-full overflow-y-auto scrollbar-none bg-background relative"`,
  `<main \n          ref={mainRef}\n          className="flex-1 min-w-0 w-full h-full overflow-y-auto scrollbar-none relative z-10"`
);

// Ensure Floating Nav is Glassy
layout = layout.replace(
  `isScrolled ? "pt-4" : "pt-0 bg-[var(--color-apb-surface)]/50 backdrop-blur-md border-b border-white/5 pb-0"`,
  `isScrolled ? "pt-4" : "pt-0 bg-[#0a0f18]/40 backdrop-blur-2xl border-b border-white/5 pb-0"`
);

fs.writeFileSync("src/app/organizer/layout.tsx", layout);
console.log("Applied glassmorphism to layout");

