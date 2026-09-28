
import fs from "fs";
let f = fs.readFileSync("firestore.rules", "utf8");

const newRule = `
    match /coordMessages/{messageId} {
      allow read, write: if true; // Allows anyone to use the walkie channel
    }
`;

f = f.replace(`match /{document=**} {`, `${newRule}\n    match /{document=**} {`);
fs.writeFileSync("firestore.rules", f);
console.log("Updated firestore rules");

