
import fs from "fs";
let file = fs.readFileSync("src/components/apb/AuthRecoveryPanel.tsx", "utf8");

file = file.replace(
  "/*\n      await addDoc(collection(db, \"auditLogs\"), {",
  "      await import(\"firebase/firestore\").then(({addDoc, collection}) => addDoc(collection(db, \"auditLogs\"), {"
);

file = file.replace(
  "      });\n      */",
  "      }));"
);

fs.writeFileSync("src/components/apb/AuthRecoveryPanel.tsx", file);
console.log("Uncommented auditLog in AuthRecoveryPanel");

