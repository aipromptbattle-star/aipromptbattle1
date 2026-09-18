
import fs from "fs";
let file = fs.readFileSync("src/app/organizer/layout.tsx", "utf8");

file = file.replace(
  `{ name: "Display", href: "/organizer/display", icon: MonitorPlay },`,
  `{ name: "Participant Board", href: "/organizer/participant-board", icon: MonitorPlay },\n  { name: "Display", href: "/organizer/display", icon: MonitorPlay },`
);

fs.writeFileSync("src/app/organizer/layout.tsx", file);
console.log("Sidebar updated");

