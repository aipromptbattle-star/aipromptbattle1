
import fs from "fs";
let f = fs.readFileSync("src/app/organizer/participant-board/page.tsx", "utf8");

f = f.replace(/cleanUndefined/g, "cleanNullFallback");

// Instead of omitting, convert undefined to null
f = f.replace(/function cleanNullFallback\([\s\S]*?\}\n/g, `
function cleanNullFallback(obj: any): any {
  if (obj === undefined) return null;
  if (typeof obj !== "object" || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(cleanNullFallback);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, cleanNullFallback(v)])
  );
}
`);
fs.writeFileSync("src/app/organizer/participant-board/page.tsx", f);
console.log("Replaced with null fallback");

