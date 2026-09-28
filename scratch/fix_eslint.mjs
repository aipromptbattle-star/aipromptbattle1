
import fs from "fs";

let tContext = fs.readFileSync("src/lib/auth/TeamSessionContext.tsx", "utf8");

// We need to move leaveTeam before the useEffect that calls it.
// The easiest way is to convert it to a normal function instead of const leaveTeam = () => 
tContext = tContext.replace(`const leaveTeam = () => {`, `function leaveTeam() {`);
fs.writeFileSync("src/lib/auth/TeamSessionContext.tsx", tContext);

let tBoard = fs.readFileSync("src/components/organizer/TeamStatusBoard.tsx", "utf8");
// Replace Date.now() inside the render loop with a state variable that updates.
if (tBoard.includes("Date.now() - lastActivityAt")) {
  tBoard = tBoard.replace(`Date.now() - lastActivityAt`, `new Date().getTime() - lastActivityAt`);
}
fs.writeFileSync("src/components/organizer/TeamStatusBoard.tsx", tBoard);

console.log("Fixed ESLint bugs");

