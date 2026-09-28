
import fs from "fs";
let f = fs.readFileSync("src/app/organizer/layout.tsx", "utf8");
f = f.replace(`import { GlobalEventHeader } from "@/components/apb/GlobalEventHeader";`, `import { GlobalEventHeader } from "@/components/apb/GlobalEventHeader";\nimport { CoordWalkiePanel } from "@/components/organizer/CoordWalkiePanel";`);
fs.writeFileSync("src/app/organizer/layout.tsx", f);
console.log("Fixed import");

