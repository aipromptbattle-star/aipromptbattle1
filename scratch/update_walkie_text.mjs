
import fs from "fs";

// 1. Update /coord/page.tsx
let coord = fs.readFileSync("src/app/coord/page.tsx", "utf8");
coord = coord.replace(/Your Name \/ Role/, "Name");
coord = coord.replace(/e\.g\. Volunteer John/, "Your name...");
fs.writeFileSync("src/app/coord/page.tsx", coord);

// 2. Update CoordWalkiePanel.tsx
let panel = fs.readFileSync("src/components/organizer/CoordWalkiePanel.tsx", "utf8");
panel = panel.replace(/placeholder="Your Name..."/, `placeholder="Your name..."`);
fs.writeFileSync("src/components/organizer/CoordWalkiePanel.tsx", panel);

console.log("Updated walkie text");

