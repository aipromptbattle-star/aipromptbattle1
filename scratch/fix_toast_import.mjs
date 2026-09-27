
import fs from "fs";

// Fix the bad const position (it must be AFTER use client and all real imports)
let file = fs.readFileSync("src/app/organizer/display/page.tsx", "utf8");
// The issue is const toast = ... appears between import statements
// Move it to after all imports
file = file.replace(
  `// sonner toast removed - using alerts
const toast = { success: (m: string) => alert(m), error: (m: string) => alert("Error: " + m) };
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";`,
  `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// toast fallback (no sonner)
const toast = { success: (m: string) => window.alert(m), error: (m: string) => window.alert("Error: " + m) };`
);
fs.writeFileSync("src/app/organizer/display/page.tsx", file);

let pbFile = fs.readFileSync("src/app/organizer/participant-board/page.tsx", "utf8");
pbFile = pbFile.replace(
  `// sonner toast removed - using alerts
const toast = { success: (m: string) => alert(m), error: (m: string) => alert("Error: " + m) };
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";`,
  `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// toast fallback (no sonner)
const toast = { success: (m: string) => window.alert(m), error: (m: string) => window.alert("Error: " + m) };`
);
fs.writeFileSync("src/app/organizer/participant-board/page.tsx", pbFile);
console.log("Fixed toast imports");

