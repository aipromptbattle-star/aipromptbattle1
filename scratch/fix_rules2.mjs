
import fs from "fs";

let f = fs.readFileSync("firestore.rules", "utf8");

const newRule = `
    match /coordMessages/{messageId} {
      allow read, write: if true;
    }
`;

f = f.replace(`match /databases/{database}/documents {`, `match /databases/{database}/documents {\n${newRule}`);
fs.writeFileSync("firestore.rules", f);
console.log("Updated firestore rules");

