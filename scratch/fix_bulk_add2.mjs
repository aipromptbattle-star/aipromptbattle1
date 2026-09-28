
import fs from "fs";

let f = fs.readFileSync("src/app/organizer/teams/page.tsx", "utf8");

// We need to replace the state declaration
f = f.replace(`const [bulkRows, setBulkRows] = useState([{ name: "", teamId: "", accessCode: "" }, { name: "", teamId: "", accessCode: "" }, { name: "", teamId: "", accessCode: "" }]);`, 
`const [bulkNames, setBulkNames] = useState("");
  const [bulkIds, setBulkIds] = useState("");
  const [bulkCodes, setBulkCodes] = useState("");`);

// Replace handleBulkAdd
const oldHandleBulkAddRegex = /const handleBulkAdd = async \(\) => \{[\s\S]*?setBulkRows\(\[\{ name: "", teamId: "", accessCode: "" \}, \{ name: "", teamId: "", accessCode: "" \}, \{ name: "", teamId: "", accessCode: "" \}\]\);\n\s*\};/;
const newHandleBulkAdd = `
  const handleBulkAdd = async () => {
    const names = bulkNames.split("\\n").map(s => s.trim()).filter(Boolean);
    const ids = bulkIds.split("\\n").map(s => s.trim());
    const codes = bulkCodes.split("\\n").map(s => s.trim());
    
    if (names.length === 0) return;
    setBulkAdding(true);
    setBulkResult(null);
    let added = 0, failed = 0;
    
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const code = codes[i] || undefined;
      const tId = ids[i] || (name.toUpperCase().replace(/\\s+/g, "-") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase());
      try {
        await addTeam({ displayName: name, accessCode: code, member1: name, member2: "", teamId: tId });
        added++;
      } catch { failed++; }
    }
    
    setBulkResult(\`Added: \${added} team\${added !== 1 ? "s" : ""}. Failed: \${failed}.\`);
    setBulkAdding(false);
    setBulkNames("");
    setBulkIds("");
    setBulkCodes("");
  };
`;
f = f.replace(oldHandleBulkAddRegex, newHandleBulkAdd.trim());

// We need to replace the UI block
const oldUI = `        <APBCard className="p-6 space-y-4 mb-8">`;
const oldUIEnd = `        </APBCard>`;

const startIdx = f.indexOf(oldUI);
const endIdx = f.indexOf(oldUIEnd, startIdx) + oldUIEnd.length;

const newUI = `        <APBCard className="p-6 space-y-4 mb-8">
          <div>
            <div className="text-xs font-mono uppercase text-amber-400 font-bold mb-1">QUICK IMPORT</div>
            <h3 className="text-lg font-mono font-bold text-white">Bulk Add Teams</h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Paste names, IDs, and codes (one per line). Names are required. IDs and Codes are optional (they will be auto-generated if left blank or if lines run out).
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-xs font-mono text-muted-foreground uppercase pl-1">Team Names (Required)</div>
              <textarea
                className="w-full h-48 px-3 py-2 rounded-md bg-black border border-white/10 text-xs font-mono text-white resize-none focus:outline-none focus:border-cyan-500"
                placeholder="Team Alpha\\nTeam Beta\\nTeam Gamma"
                value={bulkNames}
                onChange={e => setBulkNames(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-mono text-muted-foreground uppercase pl-1">Team IDs (Optional)</div>
              <textarea
                className="w-full h-48 px-3 py-2 rounded-md bg-black border border-white/10 text-xs font-mono text-white resize-none focus:outline-none focus:border-cyan-500"
                placeholder="ALPHA-01\\nBETA-02"
                value={bulkIds}
                onChange={e => setBulkIds(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="text-xs font-mono text-muted-foreground uppercase pl-1">Access Codes (Optional)</div>
              <textarea
                className="w-full h-48 px-3 py-2 rounded-md bg-black border border-white/10 text-xs font-mono text-white resize-none focus:outline-none focus:border-cyan-500"
                placeholder="SEC123\\nSEC456"
                value={bulkCodes}
                onChange={e => setBulkCodes(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-white/5">
            <APBButton 
              glow 
              size="sm" 
              onClick={handleBulkAdd} 
              disabled={bulkAdding || !bulkNames.trim()}
            >
              {bulkAdding ? "Adding..." : "ADD TEAMS"}
            </APBButton>
            {bulkResult && <span className="text-xs font-mono text-emerald-400">{bulkResult}</span>}
          </div>
        </APBCard>`;

f = f.substring(0, startIdx) + newUI + f.substring(endIdx);

// REMOVE Google Sheets Section
const googleSheetsStart = f.indexOf(`{/* Section 8: Google Sheets Registration Configuration */}`);
const googleSheetsEnd = f.indexOf(`</APBCard>`, googleSheetsStart) + `</APBCard>`.length;

if (googleSheetsStart !== -1) {
  f = f.substring(0, googleSheetsStart) + f.substring(googleSheetsEnd);
}

fs.writeFileSync("src/app/organizer/teams/page.tsx", f);
console.log("Updated Bulk Add and removed Google Sheets");

