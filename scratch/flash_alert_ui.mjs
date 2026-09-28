
import fs from "fs";
let f = fs.readFileSync("src/app/organizer/display/page.tsx", "utf8");

if (!f.includes("Flash Alert")) {
  // Add states for flash alert
  f = f.replace(`const [draftImagePos, setDraftImagePos] = useState<"top" | "bottom" | "bg">("bottom");`, `const [draftImagePos, setDraftImagePos] = useState<"top" | "bottom" | "bg">("bottom");\n  const [flashAlertText, setFlashAlertText] = useState("");`);

  // Add the handler
  const handler = `
  const handleSendFlashAlert = async () => {
    if (!flashAlertText) return;
    try {
      await updateEventSettings({
        transientAlert: {
          text: flashAlertText,
          timestamp: Date.now(),
          durationSeconds: 10
        }
      });
      setFlashAlertText("");
      alert("Flash alert sent!");
    } catch(e) {}
  };
`;
  f = f.replace(`const handleOverride = async (mode: DisplayMode) => {`, `${handler}\n  const handleOverride = async (mode: DisplayMode) => {`);

  // Inject UI at the bottom of the left column
  const ui = `
          {/* FLASH ALERT */}
          <div className="bg-[var(--color-apb-surface)]/80 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <h3 className="text-xl font-bold font-mono tracking-widest uppercase text-white mb-2 flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-400" /> Instant Flash Pop-up
            </h3>
            <p className="text-sm text-slate-400 mb-4 font-mono">
              Sends a massive, full-screen text overlay to the display for exactly 10 seconds. It automatically vanishes without disrupting the underlying timer or leaderboard.
            </p>
            <div className="flex gap-2">
              <Input 
                value={flashAlertText} 
                onChange={e => setFlashAlertText(e.target.value)} 
                placeholder="e.g., Pizza has arrived!" 
                className="font-mono text-sm border-indigo-500/50 focus-visible:ring-indigo-500"
                maxLength={60}
              />
              <APBButton glow onClick={handleSendFlashAlert} disabled={!flashAlertText} className="border-indigo-500/50 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/40">
                FLASH
              </APBButton>
            </div>
          </div>
`;
  // find the end of the first column
  const insertionPoint = `          </div>\n\n          {/* RIGHT COLUMN: PREVIEW */}`;
  f = f.replace(insertionPoint, ui + `\n` + insertionPoint);
  
  if (!f.includes("Zap,")) {
    f = f.replace(`import { MonitorPlay, Save,`, `import { MonitorPlay, Save, Zap,`);
  }
  
  fs.writeFileSync("src/app/organizer/display/page.tsx", f);
  console.log("Added Flash Alert UI");
}

