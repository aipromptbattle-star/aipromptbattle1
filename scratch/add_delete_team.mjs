
import fs from "fs";
let file = fs.readFileSync("src/app/organizer/teams/page.tsx", "utf8");

file = file.replace(
  `Kill Team Sessions ({teamSessions})\n                                </DropdownMenuItem>`,
  `Kill Team Sessions ({teamSessions})\n                                </DropdownMenuItem>\n                                <DropdownMenuItem \n                                  onClick={async () => {\n                                    if (window.confirm(\`Are you absolutely sure you want to completely DELETE team \${team.teamId}?\`)) {\n                                      await deleteTeam(team.teamId);\n                                    }\n                                  }}\n                                  className="text-red-600 focus:text-red-500 focus:bg-red-500/10 cursor-pointer font-bold"\n                                >\n                                  Delete Team\n                                </DropdownMenuItem>`
);

fs.writeFileSync("src/app/organizer/teams/page.tsx", file);
console.log("Added Delete Team option");

