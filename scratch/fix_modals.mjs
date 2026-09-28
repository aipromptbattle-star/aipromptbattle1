
import fs from "fs";

let f1 = fs.readFileSync("src/components/apb/ActiveSessionsModal.tsx", "utf8");
f1 = f1.replace(`className="w-[100vw] max-w-[100vw] h-[100vh] max-h-[100vh]`, `className="sm:max-w-none w-screen max-w-none h-screen max-h-none`);
fs.writeFileSync("src/components/apb/ActiveSessionsModal.tsx", f1);

let f2 = fs.readFileSync("src/components/apb/LiveParticipantViewModal.tsx", "utf8");
f2 = f2.replace(`className="w-[100vw] max-w-[100vw] h-[100vh] max-h-[100vh]`, `className="sm:max-w-none w-screen max-w-none h-screen max-h-none`);
fs.writeFileSync("src/components/apb/LiveParticipantViewModal.tsx", f2);

console.log("Fixed modals max-w");

