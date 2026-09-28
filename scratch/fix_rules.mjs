
import fs from "fs";
let f = fs.readFileSync("firestore.rules", "utf8");
f = f.replace(`      // NO participant update or delete - submission is immutable once created.
      allow update: if isOrganizer();`, `      // NO participant update or delete - submission is immutable once created.
      allow create: if isOrganizer();
      allow update: if isOrganizer();`);
fs.writeFileSync("firestore.rules", f);
console.log("Fixed rules");

