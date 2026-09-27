
import fs from "fs";
let f = fs.readFileSync("src/components/apb/ActiveSessionsModal.tsx", "utf8");
f = f.replace(
  `className="w-full flex-1 overflow-y-auto p-4 md:p-6"`,
  `className="w-full flex-1 overflow-y-auto p-4 md:p-6 scrollbar-none"`
);
fs.writeFileSync("src/components/apb/ActiveSessionsModal.tsx", f);
console.log("Fixed ActiveSessionsModal scrollbar");

