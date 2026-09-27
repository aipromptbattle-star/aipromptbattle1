
import fs from "fs";

let f = fs.readFileSync("src/app/organizer/layout.tsx", "utf8");

if (!f.includes("screen-lab")) {
  f = f.replace(
    `{ name: "System", href: "/organizer/system", icon: Settings },
    ];`,
    `{ name: "Results", href: "/organizer/results", icon: Trophy },
      { name: "Screen Lab", href: "/organizer/screen-lab", icon: Maximize },
      { name: "System", href: "/organizer/system", icon: Settings },
    ];`
  );
  fs.writeFileSync("src/app/organizer/layout.tsx", f);
  console.log("Added Results + Screen Lab to nav");
} else {
  console.log("Already has screen-lab");
}

