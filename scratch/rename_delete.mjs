
import fs from "fs";
let f = fs.readFileSync("src/app/organizer/teams/page.tsx", "utf8");
f = f.replace(
  `>
                                  Delete Team
                                </DropdownMenuItem>`,
  `>
                                  <Trash2 className="w-4 h-4 mr-2 inline-block" /> Remove / Delete Team
                                </DropdownMenuItem>`
);
fs.writeFileSync("src/app/organizer/teams/page.tsx", f);
console.log("Renamed Delete Team");

