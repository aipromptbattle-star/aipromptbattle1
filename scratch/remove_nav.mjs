
import fs from "fs";

let layout = fs.readFileSync("src/app/organizer/layout.tsx", "utf8");

// 1. Remove the floating nav bar
const startMarker = `{/* FLOATING NAVBAR (Desktop/Tablet) */}`;
const endMarker = `</nav>\n          </div>`;
const startIndex = layout.indexOf(startMarker);
const endIndex = layout.indexOf(endMarker, startIndex) + endMarker.length;

if (startIndex !== -1 && endIndex !== -1) {
  layout = layout.substring(0, startIndex) + layout.substring(endIndex);
}

// 2. Make Hamburger menu available on ALL screen sizes
layout = layout.replace(
  `className="sm:hidden ml-2 text-white"`,
  `className="ml-2 text-white hover:text-[var(--color-apb-cyan)] transition-colors"`
);

// 3. Remove sm:hidden from the menu dropdown
layout = layout.replace(
  `className="absolute top-[100px] inset-x-0 bottom-0 bg-[#0a0f18]/80 backdrop-blur-2xl z-40 p-4 overflow-y-auto sm:hidden flex flex-col gap-2"`,
  `className="absolute top-[65px] left-0 right-0 bottom-0 bg-[#0a0f18]/95 backdrop-blur-2xl z-40 p-4 overflow-y-auto flex flex-col gap-2 border-r border-white/5 sm:w-64 sm:right-auto sm:shadow-2xl"`
);

// Add a cool animation to the menu dropdown
layout = layout.replace(
  `className="absolute top-[65px] left-0 right-0 bottom-0`,
  `className="animate-in slide-in-from-left-5 absolute top-[65px] left-0 right-0 bottom-0`
);

fs.writeFileSync("src/app/organizer/layout.tsx", layout);
console.log("Removed floating nav, upgraded hamburger menu");

