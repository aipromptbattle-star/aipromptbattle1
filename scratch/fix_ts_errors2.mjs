
import fs from "fs";

let f = fs.readFileSync("src/lib/firebase/schema.ts", "utf8");
f = f.replace(`export interface Team {\n  teamId: string;`, `export interface Team {\n  teamId: string;\n  overrideScreenMode?: ParticipantScreenMode | null;`);
fs.writeFileSync("src/lib/firebase/schema.ts", f);

let f2 = fs.readFileSync("src/components/apb/EditRoundDialog.tsx", "utf8");
f2 = f2.replace(`    referenceMaterial: round.referenceMaterial || "",\n    constraintsStr:`, `    referenceMaterial: round.referenceMaterial || "",\n    imageUrl: round.imageUrl || "",\n    constraintsStr:`);
fs.writeFileSync("src/components/apb/EditRoundDialog.tsx", f2);
console.log("Fixed TS errors");

