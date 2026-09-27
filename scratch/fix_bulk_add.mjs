
import fs from "fs";
let f = fs.readFileSync("src/app/organizer/teams/page.tsx", "utf8");

// We need to replace the state declaration
f = f.replace(`const [bulkAddText, setBulkAddText] = useState("");`, `const [bulkRows, setBulkRows] = useState([{ name: "", teamId: "", accessCode: "" }, { name: "", teamId: "", accessCode: "" }, { name: "", teamId: "", accessCode: "" }]);`);

// We need to replace handleBulkAdd
const newHandleBulkAdd = `
  const handleBulkAdd = async () => {
    const validRows = bulkRows.filter(r => r.name.trim() !== "");
    if (validRows.length === 0) return;
    setBulkAdding(true);
    setBulkResult(null);
    let added = 0, failed = 0;
    for (const row of validRows) {
      const name = row.name.trim();
      const code = row.accessCode.trim() || undefined;
      const tId = row.teamId.trim() || (name.toUpperCase().replace(/\\s+/g, "-") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase());
      try {
        await addTeam({ displayName: name, accessCode: code, member1: name, member2: "", teamId: tId });
        added++;
      } catch { failed++; }
    }
    setBulkResult(\`Added: \${added} team\${added !== 1 ? "s" : ""}. Failed: \${failed}.\`);
    setBulkAdding(false);
    setBulkRows([{ name: "", teamId: "", accessCode: "" }, { name: "", teamId: "", accessCode: "" }, { name: "", teamId: "", accessCode: "" }]);
  };
`;

const oldHandleBulkAddRegex = /const handleBulkAdd = async \(\) => \{[\s\S]*?setBulkAddText\(""\);\s*\};/;
f = f.replace(oldHandleBulkAddRegex, newHandleBulkAdd.trim());

// We need to replace the UI
const oldUI = `        <APBCard className="p-6 space-y-4">
          <div>
            <div className="text-xs font-mono uppercase text-amber-400 font-bold mb-1">QUICK IMPORT</div>
            <h3 className="text-lg font-mono font-bold text-white">Bulk Add Teams</h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              One line per team: TeamName,AccessCode &mdash; or just TeamName to auto-generate a code.
            </p>
          </div>
          <textarea
            className="w-full h-32 px-3 py-2 rounded-md bg-black border border-white/10 text-xs font-mono text-white resize-none focus:outline-none focus:border-cyan-500"
            placeholder="Alpha Squad,ALPHA01"
            value={bulkAddText}
            onChange={e => setBulkAddText(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <APBButton glow size="sm" onClick={handleBulkAdd} disabled={bulkAdding || !bulkAddText.trim()}>
              {bulkAdding ? "Adding..." : "ADD ALL TEAMS"}
            </APBButton>
            {bulkResult && <span className="text-xs font-mono text-emerald-400">{bulkResult}</span>}
          </div>
        </APBCard>`;

const newUI = `        <APBCard className="p-6 space-y-4">
          <div>
            <div className="text-xs font-mono uppercase text-amber-400 font-bold mb-1">QUICK IMPORT</div>
            <h3 className="text-lg font-mono font-bold text-white">Bulk Add Teams</h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Fill in the columns below. Leaving Team ID or Access Code blank will auto-generate them.
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="text-xs font-mono text-muted-foreground uppercase pl-1">Team Name (Required)</div>
              <div className="text-xs font-mono text-muted-foreground uppercase pl-1 hidden md:block">Team ID (Optional)</div>
              <div className="text-xs font-mono text-muted-foreground uppercase pl-1 hidden md:block">Access Code (Optional)</div>
            </div>
            {bulkRows.map((row, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                <Input
                  className="font-mono text-xs"
                  placeholder="e.g. Alpha Squad"
                  value={row.name}
                  onChange={(e) => {
                    const r = [...bulkRows];
                    r[i].name = e.target.value;
                    setBulkRows(r);
                  }}
                />
                <Input
                  className="font-mono text-xs"
                  placeholder="e.g. ALPHA-01"
                  value={row.teamId}
                  onChange={(e) => {
                    const r = [...bulkRows];
                    r[i].teamId = e.target.value;
                    setBulkRows(r);
                  }}
                />
                <Input
                  className="font-mono text-xs"
                  placeholder="e.g. SECRET123"
                  value={row.accessCode}
                  onChange={(e) => {
                    const r = [...bulkRows];
                    r[i].accessCode = e.target.value;
                    setBulkRows(r);
                  }}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-white/5">
            <APBButton 
              size="sm" 
              variant="outline" 
              onClick={() => setBulkRows([...bulkRows, { name: "", teamId: "", accessCode: "" }])}
            >
              + Add Row
            </APBButton>
            <APBButton 
              glow 
              size="sm" 
              onClick={handleBulkAdd} 
              disabled={bulkAdding || bulkRows.filter(r => r.name.trim() !== "").length === 0}
            >
              {bulkAdding ? "Adding..." : "ADD TEAMS"}
            </APBButton>
            {bulkResult && <span className="text-xs font-mono text-emerald-400">{bulkResult}</span>}
          </div>
        </APBCard>`;

f = f.replace(oldUI, newUI);
fs.writeFileSync("src/app/organizer/teams/page.tsx", f);
console.log("Replaced bulk add UI");

