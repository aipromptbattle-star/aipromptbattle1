
import fs from "fs";
let file = fs.readFileSync("src/lib/firebase/schema.ts", "utf8");

file = file.replace(/\\nexport type ChallengeType/g, "\nexport type ChallengeType");

fs.writeFileSync("src/lib/firebase/schema.ts", file);
console.log("Fixed schema.ts");

