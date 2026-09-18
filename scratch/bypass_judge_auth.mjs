
import fs from "fs";
let file = fs.readFileSync("src/components/auth/JudgeProtectedRoute.tsx", "utf8");

file = file.replace(
  "if (loading) return;",
  "if (process.env.NODE_ENV === \"development\") return <>{children}</>;\n    if (loading) return;"
);
fs.writeFileSync("src/components/auth/JudgeProtectedRoute.tsx", file);
console.log("Bypassed Judge Auth for Dev Mode");

