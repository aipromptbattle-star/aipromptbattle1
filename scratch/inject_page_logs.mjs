
import fs from "fs";
let file = fs.readFileSync("src/app/login/page.tsx", "utf8");

file = file.replace(
  `const result = await joinTeam(teamId, "demo-event-1", accessCode);`,
  `console.log("[LOGIN_PAGE] Calling joinTeam...");\n      const result = await joinTeam(teamId, "demo-event-1", accessCode);\n      console.log("[LOGIN_PAGE] joinTeam returned:", result);`
);

fs.writeFileSync("src/app/login/page.tsx", file);
console.log("Injected page logs");

