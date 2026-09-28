
import fs from "fs";

function revertServerTimestamp(file) {
  let content = fs.readFileSync(file, "utf8");
  content = content.replace(`timestamp: serverTimestamp()`, `timestamp: Date.now()`);
  fs.writeFileSync(file, content);
}

revertServerTimestamp("src/components/organizer/CoordWalkiePanel.tsx");
revertServerTimestamp("src/app/coord/page.tsx");
console.log("Reverted to Date.now()");

