
import fs from "fs";
let f2 = fs.readFileSync("src/components/apb/EditRoundDialog.tsx", "utf8");
f2 = f2.replace(`referenceMaterial: round.referenceMaterial || "",
    constraintsStr: round.constraints ? round.constraints.join("\\n") : ""`, `referenceMaterial: round.referenceMaterial || "",
    imageUrl: round.imageUrl || "",
    constraintsStr: round.constraints ? round.constraints.join("\\n") : ""`);
fs.writeFileSync("src/components/apb/EditRoundDialog.tsx", f2);
console.log("Fixed TS errors");

