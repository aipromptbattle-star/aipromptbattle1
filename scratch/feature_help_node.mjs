
import fs from "fs";

// 1. TeamWorkspaceHeader.tsx
let f1 = fs.readFileSync("src/components/apb/TeamWorkspaceHeader.tsx", "utf8");

f1 = f1.replace(`import { Round } from "@/lib/firebase/schema";`, `import { Round } from "@/lib/firebase/schema";\nimport { doc, updateDoc } from "firebase/firestore";\nimport { db } from "@/lib/firebase/config";\nimport { useTeamSession } from "@/lib/firebase/teams";`);
f1 = f1.replace(`import { LogOut, WifiOff, Save } from "lucide-react";`, `import { LogOut, WifiOff, Save, LifeBuoy } from "lucide-react";`);

f1 = f1.replace(`export function TeamWorkspaceHeader({
  teamId,
  teamDisplayName,
  teamMembers,
  round,
  saveStatus,
  onLeave,
}: TeamWorkspaceHeaderProps) {`, `export function TeamWorkspaceHeader({
  teamId,
  teamDisplayName,
  teamMembers,
  round,
  saveStatus,
  onLeave,
}: TeamWorkspaceHeaderProps) {
  const { teamData } = useTeamSession();
  const handleToggleHelp = async () => {
    try {
      await updateDoc(doc(db, "teams", teamId), { needsHelp: !(teamData?.needsHelp) });
    } catch (e) {
      console.error(e);
    }
  };
`);

const saveStatusIndicator = `{saveStatus === "saving" && (`;
const helpButton = `
            <button 
              onClick={handleToggleHelp}
              className={\`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all \${teamData?.needsHelp ? "bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse" : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"}\`}
            >
              <LifeBuoy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{teamData?.needsHelp ? "HELP REQUESTED" : "REQUEST HELP"}</span>
            </button>
`;
f1 = f1.replace(saveStatusIndicator, helpButton + "\n            " + saveStatusIndicator);
fs.writeFileSync("src/components/apb/TeamWorkspaceHeader.tsx", f1);


// 2. ActiveSessionsModal.tsx
let f2 = fs.readFileSync("src/components/apb/ActiveSessionsModal.tsx", "utf8");
f2 = f2.replace(`const displayName = team?.displayName || "";`, `const displayName = team?.displayName || "";\n      const needsHelp = team?.needsHelp;`);

if (!f2.includes("LifeBuoy")) {
  f2 = f2.replace(`Trash2,`, `Trash2,\n  LifeBuoy,`);
}

f2 = f2.replace(`<div className="text-sm font-mono font-bold text-white flex items-center gap-2">
                        {team?.displayName || teamId}`, `<div className="text-sm font-mono font-bold text-white flex items-center gap-2">
                        {team?.needsHelp && <LifeBuoy className="w-4 h-4 text-red-500 animate-pulse" title="Needs Help!" />}
                        {team?.displayName || teamId}`);
fs.writeFileSync("src/components/apb/ActiveSessionsModal.tsx", f2);


// 3. teams/page.tsx
let f3 = fs.readFileSync("src/app/organizer/teams/page.tsx", "utf8");
if (!f3.includes("LifeBuoy")) {
  f3 = f3.replace(`Trash2, Hash, ShieldAlert }`, `Trash2, Hash, ShieldAlert, LifeBuoy }`);
}

f3 = f3.replace(`  const handleToggleDisable = async`, `
  const handleClearHelp = async (teamId: string) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase/config");
      await updateDoc(doc(db, "teams", teamId), { needsHelp: false });
    } catch (e) {}
  };

  const handleToggleDisable = async`);

f3 = f3.replace(`<TableCell className="font-mono text-sm text-[var(--color-apb-cyan)] font-bold">
                        {team.displayName || team.teamId}
                      </TableCell>`, `<TableCell className="font-mono text-sm text-[var(--color-apb-cyan)] font-bold">
                        <div className="flex items-center gap-2">
                          {team.needsHelp && (
                            <button onClick={() => handleClearHelp(team.teamId)} className="w-5 h-5 rounded bg-red-500/20 flex items-center justify-center border border-red-500/50 animate-pulse hover:bg-red-500/40" title="Clear Help Request">
                              <LifeBuoy className="w-3.5 h-3.5 text-red-400" />
                            </button>
                          )}
                          {team.displayName || team.teamId}
                        </div>
                      </TableCell>`);
fs.writeFileSync("src/app/organizer/teams/page.tsx", f3);

console.log("Added Help button");

