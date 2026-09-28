
import fs from "fs";

let bPage = fs.readFileSync("src/app/organizer/backup/page.tsx", "utf8");
bPage = bPage.replace(`new Date(sub.updatedAt).toISOString()`, `new Date(sub.updatedAt || 0).toISOString()`);
bPage = bPage.replace(`submissions.sort((a,b) => b.updatedAt - a.updatedAt)`, `submissions.sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0))`);
bPage = bPage.replace(`new Date(s.updatedAt).toLocaleTimeString()`, `new Date(s.updatedAt || 0).toLocaleTimeString()`);

fs.writeFileSync("src/app/organizer/backup/page.tsx", bPage);
console.log("Fixed Backup TS");

