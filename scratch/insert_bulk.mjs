import fs from "fs";
let f = fs.readFileSync("src/app/organizer/teams/page.tsx", "utf8");
const sheetIdx = f.indexOf("Google Sheets");
if (sheetIdx === -1) { console.log("No Google Sheets found"); process.exit(); }
const cardClose = "</APBCard>";
let pos = f.indexOf(cardClose, sheetIdx);
if (pos === -1) { console.log("No close tag found"); process.exit(); }
pos += cardClose.length;

const insert = `

      {/* Bulk Add Teams */}
      <APBCard className="p-6 space-y-4">
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

const result = f.slice(0, pos) + insert + f.slice(pos);
fs.writeFileSync("src/app/organizer/teams/page.tsx", result);
console.log("Done, inserted Bulk Add section at offset", pos);
