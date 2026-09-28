
import fs from "fs";

let f = fs.readFileSync("src/lib/firebase/schema.ts", "utf8");

f = f.replace(`displayBoardState?: DisplayBoardState;`, `displayBoardState?: DisplayBoardState;\n  judgeScreenState?: ParticipantBoardState;`);

fs.writeFileSync("src/lib/firebase/schema.ts", f);
console.log("Added judgeScreenState to Event schema");

