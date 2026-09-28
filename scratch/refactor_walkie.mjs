
import fs from "fs";

let panel = fs.readFileSync("src/components/organizer/CoordWalkiePanel.tsx", "utf8");

// Change container from "fixed bottom-6 right-6..." to just a relative wrapper for the header
panel = panel.replace(`className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none"`, `className="relative z-[100] flex flex-col items-end"`);

// Change the floating chat box from "animate-in slide-in-from-bottom-5" to "animate-in slide-in-from-top-5 absolute top-12 right-0"
// and remove "mb-4"
panel = panel.replace(`w-80 sm:w-96 h-[500px] bg-[#0a0f18]/95 backdrop-blur-xl border border-[var(--color-apb-cyan)]/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-5`, `absolute top-12 right-0 w-80 sm:w-96 h-[500px] bg-[#0a0f18]/95 backdrop-blur-xl border border-[var(--color-apb-cyan)]/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-top-2 origin-top-right`);

// Change the toggle button to be a header button (small, rectangular, like "Display" or "Sign Out")
const oldButton = `<button 
        onClick={() => setOpen(!open)}
        className={\`pointer-events-auto flex items-center justify-center w-14 h-14 rounded-full shadow-2xl border transition-all duration-300 \${open ? "bg-slate-800 border-slate-700 text-slate-300 scale-90" : "bg-[var(--color-apb-cyan)]/20 border-[var(--color-apb-cyan)] text-[var(--color-apb-cyan)] hover:bg-[var(--color-apb-cyan)]/30 hover:scale-105"}\`}
      >
        {open ? <X className="w-6 h-6" /> : (
          <div className="relative">
            <Radio className="w-6 h-6" />
            {unread > 0 && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full animate-bounce">
                {unread}
              </span>
            )}
          </div>
        )}
      </button>`;

const newButton = `<button 
        onClick={() => setOpen(!open)}
        className={\`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-colors border \${open || unread > 0 ? "bg-[var(--color-apb-cyan)]/20 text-[var(--color-apb-cyan)] border-[var(--color-apb-cyan)]/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]" : "text-slate-300 border-slate-600/50 hover:bg-slate-800"}\`}
        title="Walkie Channel"
      >
        <div className="relative flex items-center justify-center">
          <Radio className="w-3.5 h-3.5" />
          {unread > 0 && (
            <span className="absolute -top-2 -right-2 flex items-center justify-center w-3 h-3 bg-red-500 text-white text-[8px] font-bold rounded-full animate-bounce">
              {unread}
            </span>
          )}
        </div>
        <span className="hidden lg:inline-block">Walkie</span>
      </button>`;

panel = panel.replace(oldButton, newButton);
fs.writeFileSync("src/components/organizer/CoordWalkiePanel.tsx", panel);

// Now inject it into the TOP HEADER of layout.tsx
let layout = fs.readFileSync("src/app/organizer/layout.tsx", "utf8");
const headerActionsStart = `<div className="flex items-center gap-2 sm:gap-3 shrink-0">`;
layout = layout.replace(headerActionsStart, headerActionsStart + `\n            <CoordWalkiePanel />`);

fs.writeFileSync("src/app/organizer/layout.tsx", layout);
console.log("Moved to header");

