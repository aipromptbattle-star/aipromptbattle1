
import fs from "fs";
let f = fs.readFileSync("src/lib/firebase/schema.ts", "utf8");
if (!f.includes("transientAlert")) {
  f = f.replace(`export interface Event {`, `export interface Event {\n  transientAlert?: { text: string; timestamp: number; durationSeconds: number; };`);
  fs.writeFileSync("src/lib/firebase/schema.ts", f);
  console.log("Added transientAlert to schema");
}

