
import fs from "fs";

let file = fs.readFileSync("src/lib/firebase/schema.ts", "utf8");
file = file.replace(
  `quizScore?: number;`,
  `quizScore?: number;\n  isAutoSubmitted?: boolean;`
);

fs.writeFileSync("src/lib/firebase/schema.ts", file);
console.log("Updated schema.ts");

