
import fs from "fs";

let file = fs.readFileSync("src/app/organizer/layout.tsx", "utf8");

if (!file.includes("GlobalEventHeader")) {
  file = file.replace(
    "import { ProtectedRoute } from \"@/components/auth/ProtectedRoute\";",
    "import { ProtectedRoute } from \"@/components/auth/ProtectedRoute\";\nimport { GlobalEventHeader } from \"@/components/apb/GlobalEventHeader\";"
  );
  
  file = file.replace(
    "</header>",
    "</header>\n\n        <GlobalEventHeader />"
  );

  fs.writeFileSync("src/app/organizer/layout.tsx", file);
  console.log("Injected GlobalEventHeader");
}

