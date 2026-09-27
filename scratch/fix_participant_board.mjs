
import fs from "fs";

let f = fs.readFileSync("src/app/organizer/participant-board/page.tsx", "utf8");

// Helper to remove undefineds
const cleanUndefined = `
function cleanUndefined(obj: any): any {
  if (obj === undefined) return undefined;
  if (typeof obj !== "object" || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(cleanUndefined);
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => [k, cleanUndefined(v)])
  );
}
`;

// Insert cleanUndefined after imports
f = f.replace(/const toast = \{/g, cleanUndefined + "\nconst toast = {");

// Wrap all updateEventSettings with cleanUndefined
f = f.replace(/await updateEventSettings\(\{/g, "await updateEventSettings(cleanUndefined({");
f = f.replace(/\}\);\n\s*toast\.success/g, "}));\n        toast.success");

fs.writeFileSync("src/app/organizer/participant-board/page.tsx", f);
console.log("Fixed undefineds in participant-board");

