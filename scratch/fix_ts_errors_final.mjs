
import fs from "fs";
let f = fs.readFileSync("src/components/apb/EditRoundDialog.tsx", "utf8");

// We need to find the formData useState initialization and add imageUrl: string to it.
const regex = /const \[formData, setFormData\] = useState\(\{[\s\S]*?constraintsStr: round\.constraints\?\.join\("\\n"\) \|\| "",\n\s*\}\);/;

const replacement = `const [formData, setFormData] = useState({
    title: round.title || "",
    description: round.description || "",
    durationSeconds: round.durationSeconds || 1200,
    challengeType: round.challengeType || "TEXT",
    challengeInstructions: round.challengeInstructions || "",
    referenceMaterial: round.referenceMaterial || "",
    imageUrl: round.imageUrl || "",
    constraintsStr: round.constraints?.join("\\n") || "",
  });`;

if (f.match(regex)) {
  f = f.replace(regex, replacement);
  fs.writeFileSync("src/components/apb/EditRoundDialog.tsx", f);
  console.log("Fixed EditRoundDialog formData initialization");
} else {
  // Let us fallback to string slicing if regex fails
  let s = f.indexOf(`const [formData, setFormData] = useState({`);
  if (s !== -1) {
    let e = f.indexOf(`});`, s);
    f = f.substring(0, s) + replacement + f.substring(e + 3);
    fs.writeFileSync("src/components/apb/EditRoundDialog.tsx", f);
    console.log("Fixed EditRoundDialog via fallback");
  }
}

