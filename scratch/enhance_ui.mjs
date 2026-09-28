
import fs from "fs";

// 1. Global CSS for Scrollbars and Selection
let css = fs.readFileSync("src/app/globals.css", "utf8");
if (!css.includes("::-webkit-scrollbar")) {
  css += `\n
/* --- APB GLOBAL UI ENHANCEMENTS --- */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-left: 1px solid rgba(34, 211, 238, 0.1);
}
::-webkit-scrollbar-thumb {
  background: rgba(34, 211, 238, 0.3);
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(34, 211, 238, 0.6);
}

::selection {
  background: rgba(34, 211, 238, 0.3);
  color: #fff;
}

/* Subtle glow animations for anything with .glow-pulse */
@keyframes intense-glow {
  0% { box-shadow: 0 0 10px rgba(34, 211, 238, 0.2); }
  50% { box-shadow: 0 0 20px rgba(34, 211, 238, 0.6); }
  100% { box-shadow: 0 0 10px rgba(34, 211, 238, 0.2); }
}
.glow-pulse {
  animation: intense-glow 2s infinite ease-in-out;
}
`;
  fs.writeFileSync("src/app/globals.css", css);
  console.log("Added scrollbars to globals.css");
}

// 2. Enhance APBButton.tsx
let btn = fs.readFileSync("src/components/apb/APBButton.tsx", "utf8");
// Look at how glow is currently applied
if (btn.includes("shadow-[0_0_15px_rgba")) {
  btn = btn.replace(`shadow-[0_0_15px_rgba(34,211,238,0.4)]`, `shadow-[0_0_15px_rgba(34,211,238,0.5)] hover:shadow-[0_0_25px_rgba(34,211,238,0.8)]`);
  btn = btn.replace(`shadow-[0_0_15px_rgba(244,63,94,0.4)]`, `shadow-[0_0_15px_rgba(244,63,94,0.5)] hover:shadow-[0_0_25px_rgba(244,63,94,0.8)]`);
}
// Add transition-all duration-300 transform hover:scale-[1.02]
if (!btn.includes("hover:scale-")) {
  btn = btn.replace(`"inline-flex`, `"inline-flex transition-all duration-300 transform active:scale-95 hover:scale-[1.02]`);
}
fs.writeFileSync("src/components/apb/APBButton.tsx", btn);
console.log("Enhanced APBButton");


