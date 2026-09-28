
import fs from "fs";
let f = fs.readFileSync("src/app/organizer/layout.tsx", "utf8");

const oldLink = `{ href: "/organizer/system", icon: Settings, label: "SYSTEM" },`;
const newLinks = `{ href: "/organizer/system", icon: Settings, label: "SYSTEM" },\n    { href: "/organizer/backup", icon: Database, label: "BACKUP" },`;

if (!f.includes("/organizer/backup")) {
  f = f.replace(oldLink, newLinks);
  if (!f.includes("Database,")) {
    f = f.replace(`Settings,`, `Settings,\n  Database,`);
  }
  fs.writeFileSync("src/app/organizer/layout.tsx", f);
  console.log("Added backup to sidebar");
}

