
import fs from "fs";
let file = fs.readFileSync("src/app/organizer/teams/page.tsx", "utf8");

file = file.replace(
  `await deleteTeam(team.teamId);`,
  `try { await deleteTeam(team.teamId); } catch (e) { alert("Delete failed: " + e.message); }`
);

fs.writeFileSync("src/app/organizer/teams/page.tsx", file);
console.log("Added try-catch to deleteTeam");

