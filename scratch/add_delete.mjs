
import fs from "fs";
let file = fs.readFileSync("src/app/organizer/teams/page.tsx", "utf8");

const replacement = `                              <DropdownMenuItem 
                                disabled={teamSessions === 0}
                                onClick={async () => {
                                  if (window.confirm(\`Kill all active device sessions for \${team.teamId}?\`)) {
                                    await killTeamSessions(team.teamId);
                                  }
                                }}
                                className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                              >
                                Kill Team Sessions ({teamSessions})
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={async () => {
                                  if (window.confirm(\`Are you absolutely sure you want to permanently delete \${team.teamId}?\`)) {
                                    try {
                                      await deleteTeam(team.teamId);
                                    } catch (e) {
                                      alert("Delete failed: " + e.message);
                                    }
                                  }
                                }}
                                className="text-red-500 focus:text-red-500 focus:bg-red-500/10 cursor-pointer font-bold"
                              >
                                Delete Team
                              </DropdownMenuItem>`;

file = file.replace(
  `<DropdownMenuItem \n                                disabled={teamSessions === 0}\n                                onClick={async () => {\n                                  if (window.confirm(\`Kill all active device sessions for \${team.teamId}?\`)) {\n                                    await killTeamSessions(team.teamId);\n                                  }\n                                }}\n                                className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"\n                              >\n                                Kill Team Sessions ({teamSessions})\n                              </DropdownMenuItem>`,
  replacement
);

fs.writeFileSync("src/app/organizer/teams/page.tsx", file);
console.log("Added Delete Team option");

