
import fs from "fs";
let file = fs.readFileSync("src/components/auth/ProtectedRoute.tsx", "utf8");

file = file.replace(
  "if (loading) return;",
  "if (process.env.NODE_ENV === \"development\") return <>{children}</>;\n    if (loading) return;"
);
fs.writeFileSync("src/components/auth/ProtectedRoute.tsx", file);
console.log("Bypassed Organizer Auth for Dev Mode");

