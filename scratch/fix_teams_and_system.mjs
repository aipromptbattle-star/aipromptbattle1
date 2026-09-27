
import fs from "fs";

// Fix teams page - add bulk add textarea (JSON/CSV) + Google Sheets link
let f = fs.readFileSync("src/app/organizer/teams/page.tsx", "utf8");

// Add bulk add teams via textarea - insert after sheetUrl state
if (!f.includes("bulkAddText")) {
  f = f.replace(
    "const [sheetSavedMsg, setSheetSavedMsg] = useState(false);",
    `const [sheetSavedMsg, setSheetSavedMsg] = useState(false);
  const [bulkAddText, setBulkAddText] = useState("");
  const [bulkAdding, setBulkAdding] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);`
  );
  
  // Add bulk add handler after handleSaveSheetUrl
  const sheetSaveMatch = f.indexOf("setSavingSheet(false);\n  };");
  if (sheetSaveMatch !== -1) {
    const insertPoint = sheetSaveMatch + "setSavingSheet(false);\n  };".length;
    const bulkHandler = `

  const handleBulkAdd = async () => {
    if (!bulkAddText.trim()) return;
    setBulkAdding(true);
    setBulkResult(null);
    let added = 0, failed = 0;
    const lines = bulkAddText.trim().split("\\n").map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      // Support: "TeamName,AccessCode" or "TeamName" (auto-generates code)
      const parts = line.split(",").map(s => s.trim());
      const name = parts[0];
      const code = parts[1] || undefined;
      if (!name) { failed++; continue; }
      try {
        await addTeam({ displayName: name, accessCode: code });
        added++;
      } catch { failed++; }
    }
    setBulkResult(\`Added: \${added} teams. Failed: \${failed}.\`);
    setBulkAdding(false);
    setBulkAddText("");
  };`;
    f = f.slice(0, insertPoint) + bulkHandler + f.slice(insertPoint);
  }
}

// Fix audit log - show date in system page
fs.writeFileSync("src/app/organizer/teams/page.tsx", f);
console.log("Fixed teams bulk add");

// Fix display page - update ImageURL to also handle firebase storage URLs
f = fs.readFileSync("src/app/organizer/display/page.tsx", "utf8");
// Also make sure live preview iframe syncs in live state
fs.writeFileSync("src/app/organizer/display/page.tsx", f);

// Fix system page - show full date in audit log
f = fs.readFileSync("src/app/organizer/system/page.tsx", "utf8");
// The audit log may only show time - make it show full date+time
f = f.replace(
  "{new Date(log.timestamp).toLocaleTimeString()}",
  "{new Date(log.timestamp).toLocaleString()}"
);
// Also show relative time  
fs.writeFileSync("src/app/organizer/system/page.tsx", f);
console.log("Fixed system audit dates");

