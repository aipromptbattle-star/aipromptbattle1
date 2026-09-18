
import fs from "fs";
let file = fs.readFileSync("firestore.rules", "utf8");

file = file.replace(
  `&& request.resource.data.roundId == resource.data.roundId;`,
  `&& request.resource.data.roundId == resource.data.roundId\n                    && request.resource.data.get("overrideScreenMode", null) == resource.data.get("overrideScreenMode", null);`
);

fs.writeFileSync("firestore.rules", file);
console.log("Rules updated for overrideScreenMode");

