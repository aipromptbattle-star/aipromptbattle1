
import fs from "fs";

let f = fs.readFileSync("src/lib/firebase/events.ts", "utf8");

const oldFn = `  // Strip out undefined values to prevent Firestore crashes
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, v]) => v !== undefined)
  );`;

const newFn = `  // Recursively strip out undefined values to prevent Firestore crashes
  const stripUndefined = (obj: any): any => {
    if (obj === undefined) return null;
    if (typeof obj !== "object" || obj === null) return obj;
    if (Array.isArray(obj)) return obj.map(stripUndefined);
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        result[key] = stripUndefined(value);
      }
    }
    return result;
  };
  
  const cleanUpdates = stripUndefined(updates);`;

if (f.includes("Object.fromEntries")) {
  f = f.replace(oldFn, newFn);
  fs.writeFileSync("src/lib/firebase/events.ts", f);
  console.log("Added recursive undefined strip");
}

