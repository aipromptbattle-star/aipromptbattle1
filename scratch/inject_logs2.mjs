
import fs from "fs";
let file = fs.readFileSync("src/lib/auth/TeamSessionContext.tsx", "utf8");

file = file.replace(
  `if (!teamSnap.exists()) {\n        await auth.signOut();\n        setAnonUser(null);\n        return { success: false, error: "TEAM NOT FOUND: Team ID not recognized." };\n      }`,
  `if (!teamSnap.exists()) {\n        console.log("[JOIN_TEAM] team not found, signing out...");\n        await auth.signOut();\n        console.log("[JOIN_TEAM] sign out complete, returning error...");\n        setAnonUser(null);\n        return { success: false, error: "TEAM NOT FOUND: Team ID not recognized." };\n      }`
);

fs.writeFileSync("src/lib/auth/TeamSessionContext.tsx", file);
console.log("Injected more logs");

