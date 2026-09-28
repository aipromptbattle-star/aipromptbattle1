
import fs from "fs";

function useServerTimestamp(file) {
  let content = fs.readFileSync(file, "utf8");
  
  if (!content.includes("serverTimestamp")) {
    content = content.replace(
      `import { collection, query, orderBy, onSnapshot, addDoc, limit } from "firebase/firestore";`,
      `import { collection, query, orderBy, onSnapshot, addDoc, limit, serverTimestamp } from "firebase/firestore";`
    );
  }
  
  content = content.replace(`timestamp: Date.now()`, `timestamp: serverTimestamp()`);
  
  fs.writeFileSync(file, content);
}

useServerTimestamp("src/components/organizer/CoordWalkiePanel.tsx");
useServerTimestamp("src/app/coord/page.tsx");
console.log("Switched to serverTimestamp");

