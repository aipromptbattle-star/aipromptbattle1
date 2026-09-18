
import fs from "fs";
let file = fs.readFileSync("src/lib/auth/TeamSessionContext.tsx", "utf8");

file = file.replace(
  `const cred = await signInAnonymously(auth);`,
  `console.log("[JOIN_TEAM] Starting signInAnonymously");\n        const cred = await signInAnonymously(auth);\n        console.log("[JOIN_TEAM] signInAnonymously succeeded:", cred.user.uid);`
);

file = file.replace(
  `const teamSnap = await getDoc(teamRef);`,
  `console.log("[JOIN_TEAM] Starting getDoc for team");\n        const teamSnap = await getDoc(teamRef);\n        console.log("[JOIN_TEAM] getDoc completed, exists:", teamSnap.exists());`
);

fs.writeFileSync("src/lib/auth/TeamSessionContext.tsx", file);
console.log("Injected logs");

