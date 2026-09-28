
import fs from "fs";

// Fix Team interface
let f = fs.readFileSync("src/lib/firebase/schema.ts", "utf8");
if (!f.includes("overrideScreenMode?: ParticipantScreenMode | null;")) {
  f = f.replace(`export interface Team {
  teamId: string;`, `export interface Team {
  teamId: string;
  overrideScreenMode?: ParticipantScreenMode | null;`);
  fs.writeFileSync("src/lib/firebase/schema.ts", f);
}

// Fix EditRoundDialog formData
let f2 = fs.readFileSync("src/components/apb/EditRoundDialog.tsx", "utf8");
f2 = f2.replace(`referenceMaterial: round.referenceMaterial || "",
        imageUrl: round.imageUrl || "",
      });`, `referenceMaterial: round.referenceMaterial || "",
        imageUrl: round.imageUrl || "",
      });`);
      
// Wait, the formData type is inferred from initial state!
const stateMatch = f2.indexOf(`const [formData, setFormData] = useState({`);
if (stateMatch !== -1) {
  f2 = f2.replace(`const [formData, setFormData] = useState({
    title: round.title,
    description: round.description || "",
    durationSeconds: round.durationSeconds,
    challengeType: round.challengeType || "TEXT",
    challengeInstructions: round.challengeInstructions || "",
    referenceMaterial: round.referenceMaterial || "",
    constraintsStr: round.constraints ? round.constraints.join("\\n") : ""
  });`, `const [formData, setFormData] = useState({
    title: round.title,
    description: round.description || "",
    durationSeconds: round.durationSeconds,
    challengeType: round.challengeType || "TEXT",
    challengeInstructions: round.challengeInstructions || "",
    referenceMaterial: round.referenceMaterial || "",
    imageUrl: round.imageUrl || "",
    constraintsStr: round.constraints ? round.constraints.join("\\n") : ""
  });`);
}
fs.writeFileSync("src/components/apb/EditRoundDialog.tsx", f2);
console.log("Fixed TS errors");

