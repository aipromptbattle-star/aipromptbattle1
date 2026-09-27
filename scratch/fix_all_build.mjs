
import fs from "fs";

// 1. Fix ParticipantScreenOverlay - replace framer-motion with CSS animations since framer-motion may not be available
let overlayFile = fs.readFileSync("src/components/apb/ParticipantScreenOverlay.tsx", "utf8");
overlayFile = overlayFile.replace(
  `import { motion, AnimatePresence } from "framer-motion";`,
  `// framer-motion replaced with CSS animations`
);
overlayFile = overlayFile.replace(
  `          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-40 flex items-center justify-center p-4 md:p-8 overflow-y-auto bg-background/80 backdrop-blur-xl"
          >`,
  `          <div className="absolute inset-0 z-40 flex items-center justify-center p-4 md:p-8 overflow-y-auto bg-background/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">`
);
overlayFile = overlayFile.replace(
  `<AnimatePresence>
        {isOverlayMode && (
          <motion.div`,
  `{isOverlayMode && (
          <div`
);
overlayFile = overlayFile.replace(
  `          </motion.div>
        )}
      </AnimatePresence>`,
  `          </div>
        )}`
);
fs.writeFileSync("src/components/apb/ParticipantScreenOverlay.tsx", overlayFile);
console.log("Fixed ParticipantScreenOverlay");

// 2. Fix organizer layout - add missing nav items
let layoutFile = fs.readFileSync("src/app/organizer/layout.tsx", "utf8");
layoutFile = layoutFile.replace(
  `      { name: "Judging", href: "/organizer/judging", icon: Star },
      { name: "Participant Board", href: "/organizer/participant-board", icon: Monitor },
      { name: "Display", href: "/organizer/display", icon: Monitor },
      { name: "Sessions", href: "/organizer/sessions", icon: ShieldAlert },
      { name: "System", href: "/organizer/system", icon: Settings },
    ];`,
  `      { name: "Judging", href: "/organizer/judging", icon: Star },
      { name: "Participant Board", href: "/organizer/participant-board", icon: Monitor },
      { name: "Display", href: "/organizer/display", icon: Monitor },
      { name: "Results", href: "/organizer/results", icon: Trophy },
      { name: "Sessions", href: "/organizer/sessions", icon: ShieldAlert },
      { name: "System", href: "/organizer/system", icon: Settings },
      { name: "Screen Lab", href: "/organizer/screen-lab", icon: Maximize },
    ];`
);
fs.writeFileSync("src/app/organizer/layout.tsx", layoutFile);
console.log("Fixed organizer layout nav items");

// 3. Fix organizer/display page - replace sonner toast with console.log fallback
let displayPage = fs.readFileSync("src/app/organizer/display/page.tsx", "utf8");
displayPage = displayPage.replace(
  `import { toast } from "sonner";`,
  `// sonner toast removed - using alerts
const toast = { success: (m: string) => alert(m), error: (m: string) => alert("Error: " + m) };`
);
displayPage = displayPage.replace(
  `import { Textarea } from "@/components/ui/textarea";`,
  ``
);
// Replace Textarea with textarea native element
displayPage = displayPage.replace(
  `<Textarea `,
  `<textarea `
);
displayPage = displayPage.replace(
  ` className="font-mono text-sm min-h-[120px]"`,
  ` className="font-mono text-sm min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"`
);
fs.writeFileSync("src/app/organizer/display/page.tsx", displayPage);
console.log("Fixed organizer display page");

// 4. Fix organizer/participant-board page - replace sonner toast with alerts  
let pbPage = fs.readFileSync("src/app/organizer/participant-board/page.tsx", "utf8");
pbPage = pbPage.replace(
  `import { toast } from "sonner";`,
  `// sonner toast removed - using alerts
const toast = { success: (m: string) => alert(m), error: (m: string) => alert("Error: " + m) };`
);
pbPage = pbPage.replace(
  `import { Textarea } from "@/components/ui/textarea";`,
  ``
);
pbPage = pbPage.replace(
  /<Textarea\s/g,
  `<textarea `
);
pbPage = pbPage.replace(
  /<\/Textarea>/g,
  `</textarea>`
);
pbPage = pbPage.replace(
  /className="font-mono text-sm min-h-\[120px\]"/g,
  `className="font-mono text-sm min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"`
);
fs.writeFileSync("src/app/organizer/participant-board/page.tsx", pbPage);
console.log("Fixed organizer participant-board page");

