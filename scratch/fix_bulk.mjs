
import fs from "fs";
let f = fs.readFileSync("src/app/organizer/teams/page.tsx", "utf8");

// Find exact insert point after Google Sheets card closes
const marker = "      </APBCard>\n\n      <APBCard className=\"p-6 space-y-6\">";
const bulkSection = `      </APBCard>

      {/* Bulk Add Teams */}
      <APBCard className="p-6 space-y-4 border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)]">
        <div className="border-b border-white/10 pb-4">
          <div className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold mb-1">QUICK IMPORT</div>
          <h3 className="text-lg font-mono font-bold text-white">Bulk Add Teams</h3>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            One team per line. Format: <code className="text-[var(--color-apb-cyan)]">TeamName,AccessCode</code> or just <code className="text-[var(--color-apb-cyan)]">TeamName</code> (auto-generates code).
          </p>
        </div>
        <textarea
          className="w-full h-32 px-3 py-2 rounded-md bg-black/60 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[var(--color-apb-cyan)] resize-none"
          placeholder={"Alpha Squad,ALPHA01\\nBeta Force,BETA01\\nGamma Team"}
          value={bulkAddText}
          onChange={e => setBulkAddText(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <APBButton glow size="sm" onClick={handleBulkAdd} disabled={bulkAdding || !bulkAddText.trim()} className="h-9 px-6 font-mono text-xs uppercase">
            {bulkAdding ? "Adding..." : "ADD ALL TEAMS"}
          </APBButton>
          {bulkResult && (
            <span className="text-xs font-mono text-emerald-400">{bulkResult}</span>
          )}
        </div>
      </APBCard>

      <APBCard className="p-6 space-y-6">`;

if (f.includes(marker)) {
  f = f.replace(marker, bulkSection);
  fs.writeFileSync("src/app/organizer/teams/page.tsx", f);
  console.log("Inserted bulk add section");
} else {
  // Try alternate marker
  const alt = "      </APBCard>\\r\\n\\r\\n      <APBCard className=\\"p-6 space-y-6\\">";
  console.log("Marker not found exactly. Searching...");
  const idx = f.indexOf("</APBCard>\n\n      <APBCard");
  if (idx !== -1) {
    const before = f.slice(0, idx);
    const after = f.slice(idx);
    const cardInsert = `</APBCard>

      {/* Bulk Add Teams */}
      <APBCard className="p-6 space-y-4 border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)]">
        <div className="border-b border-white/10 pb-4">
          <div className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold mb-1">QUICK IMPORT</div>
          <h3 className="text-lg font-mono font-bold text-white">Bulk Add Teams</h3>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            One team per line. Format: <code className="text-[var(--color-apb-cyan)]">TeamName,AccessCode</code> or just <code className="text-[var(--color-apb-cyan)]">TeamName</code> (auto-generates code).
          </p>
        </div>
        <textarea
          className="w-full h-32 px-3 py-2 rounded-md bg-black/60 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[var(--color-apb-cyan)] resize-none"
          placeholder="Alpha Squad,ALPHA01"
          value={bulkAddText}
          onChange={e => setBulkAddText(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <APBButton glow size="sm" onClick={handleBulkAdd} disabled={bulkAdding || !bulkAddText.trim()} className="h-9 px-6 font-mono text-xs uppercase">
            {bulkAdding ? "Adding..." : "ADD ALL TEAMS"}
          </APBButton>
          {bulkResult && (
            <span className="text-xs font-mono text-emerald-400">{bulkResult}</span>
          )}
        </div>
      </APBCard>

      <APBCard`;
    // Only replace the first occurrence after sheetUrl section
    const sheetIdx = f.indexOf("Google Sheets");
    const target = f.indexOf("</APBCard>\n\n      <APBCard", sheetIdx);
    if (target !== -1) {
      const out = f.slice(0, target) + cardInsert + f.slice(target + "</APBCard>\n\n      <APBCard".length);
      fs.writeFileSync("src/app/organizer/teams/page.tsx", out);
      console.log("Inserted at offset", target);
    } else {
      console.log("Could not find insertion point");
    }
  }
}

