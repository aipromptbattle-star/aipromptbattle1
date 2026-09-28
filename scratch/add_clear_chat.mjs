
import fs from "fs";

let panel = fs.readFileSync("src/components/organizer/CoordWalkiePanel.tsx", "utf8");

// Add Trash icon import
if (!panel.includes("Trash2")) {
  panel = panel.replace(`User, Volume2, VolumeX, X, MessageSquare`, `User, Volume2, VolumeX, X, MessageSquare, Trash2`);
}

// Add handleClearChat function
const clearFunc = `
  const handleClearChat = async () => {
    if (!confirm("Are you sure you want to clear the entire walkie history?")) return;
    try {
      const { deleteDoc, doc } = await import("firebase/firestore");
      for (const msg of messages) {
        await deleteDoc(doc(db, "coordMessages", msg.id));
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to clear chat: " + err.message);
    }
  };
`;

panel = panel.replace(`const handleSend = async`, `${clearFunc}\n  const handleSend = async`);

// Add button to header
const oldHeaderRight = `<button onClick={() => setSoundEnabled(!soundEnabled)} className="p-1.5 text-slate-400 hover:text-white rounded">
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded">
                <X className="w-4 h-4" />
              </button>`;

const newHeaderRight = `<button onClick={handleClearChat} title="Clear Chat History" className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-1.5 text-slate-400 hover:text-white rounded">
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded">
                <X className="w-4 h-4" />
              </button>`;

panel = panel.replace(oldHeaderRight, newHeaderRight);
fs.writeFileSync("src/components/organizer/CoordWalkiePanel.tsx", panel);

console.log("Added Clear Chat button");

