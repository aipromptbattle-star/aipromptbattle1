
import fs from "fs";

let f = fs.readFileSync("src/app/organizer/teams/page.tsx", "utf8");

// Add select dropdown to the Registered Teams table
const selectImport = `import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";`;
if(!f.includes("SelectContent")) {
  f = f.replace(`import { APBButton } from "@/components/apb/APBButton";`, `import { APBButton } from "@/components/apb/APBButton";\n${selectImport}`);
}

const overrideFunction = `
  const handleOverrideScreen = async (teamId: string, mode: string) => {
    try {
      const modeValue = mode === "NONE" ? null : mode;
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase/config");
      await updateDoc(doc(db, "teams", teamId), { overrideScreenMode: modeValue });
    } catch (e: any) {
      alert("Failed to override screen: " + e.message);
    }
  };
`;

f = f.replace(`const handleToggleDisable = async`, overrideFunction + `\n  const handleToggleDisable = async`);

const tableHead = `<TableHead>Members</TableHead>`;
const tableHeadNew = `<TableHead>Members</TableHead>\n                  <TableHead>Screen Override</TableHead>`;
f = f.replace(tableHead, tableHeadNew);

const tableRow = `</TableCell>\n                      <TableCell className="text-right">`;
const tableRowNew = `</TableCell>\n                      <TableCell>
                        <Select 
                          value={(team as any).overrideScreenMode || "NONE"} 
                          onValueChange={(val) => handleOverrideScreen(team.teamId, val)}
                        >
                          <SelectTrigger className="w-[140px] h-8 text-xs font-mono bg-black/40 border-slate-700">
                            <SelectValue placeholder="AUTO" />
                          </SelectTrigger>
                          <SelectContent className="font-mono text-xs">
                            <SelectItem value="NONE">-- NONE --</SelectItem>
                            <SelectItem value="RULES">RULES</SelectItem>
                            <SelectItem value="LOCKED">LOCKED</SelectItem>
                            <SelectItem value="PAUSED">PAUSED</SelectItem>
                            <SelectItem value="ROUND_COMPLETE">ROUND_COMPLETE</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>\n                      <TableCell className="text-right">`;
f = f.replace(tableRow, tableRowNew);

fs.writeFileSync("src/app/organizer/teams/page.tsx", f);
console.log("Updated teams table with Screen Override");

