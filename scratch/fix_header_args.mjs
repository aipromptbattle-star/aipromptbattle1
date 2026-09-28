
import fs from "fs";
let f = fs.readFileSync("src/components/apb/TeamWorkspaceHeader.tsx", "utf8");
f = f.replace(`const { teamData } = useTeam();`, `const { teamData } = useTeam(teamId);`);
fs.writeFileSync("src/components/apb/TeamWorkspaceHeader.tsx", f);
console.log("Fixed args");

