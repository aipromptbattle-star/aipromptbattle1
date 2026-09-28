import fs from "fs";

let pb = fs.readFileSync("src/app/organizer/participant-board/page.tsx", "utf8");

// Add state for new template fields
if (!pb.includes("draftTextAlign")) {
  pb = pb.replace(`const [draftImageUrl, setDraftImageUrl] = useState("");`, `const [draftImageUrl, setDraftImageUrl] = useState("");
  const [draftTextAlign, setDraftTextAlign] = useState<"left" | "center" | "right">("center");
  const [draftImagePos, setDraftImagePos] = useState<"top" | "bottom" | "bg">("bottom");`);

  pb = pb.replace(`setDraftImageUrl(t?.imageUrl || "");`, `setDraftImageUrl(t?.imageUrl || "");
      setDraftTextAlign(t?.textAlign || "center");
      setDraftImagePos(t?.imagePosition || "bottom");`);

  pb = pb.replace(`imageUrl: draftImageUrl,\n          durationSeconds`, `imageUrl: draftImageUrl,\n          textAlign: draftTextAlign,\n          imagePosition: draftImagePos,\n          durationSeconds`);
  pb = pb.replace(`imageUrl: draftImageUrl,\n                    durationSeconds`, `imageUrl: draftImageUrl,\n                    textAlign: draftTextAlign,\n                    imagePosition: draftImagePos,\n                    durationSeconds`);

  const oldUi = `{selectedMode !== "AUTO" && (
                <div className="space-y-1.5">
                  <Label>Image / Visual Asset (Optional)</Label>
                  <ImagePicker value={draftImageUrl} onChange={url => setDraftImageUrl(url)} />
                </div>
              )}`;
  const newUi = `{selectedMode !== "AUTO" && (
                <>
                  <div className="space-y-1.5">
                    <Label>Image / Visual Asset (Optional)</Label>
                    <ImagePicker value={draftImageUrl} onChange={url => setDraftImageUrl(url)} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-700 pt-4 mt-4">
                    <div className="space-y-1.5">
                      <Label>Text Alignment</Label>
                      <select 
                        className="w-full bg-black border border-slate-700 rounded-md px-3 py-2 text-sm font-mono text-white"
                        value={draftTextAlign}
                        onChange={e => setDraftTextAlign(e.target.value as any)}
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Image Position</Label>
                      <select 
                        className="w-full bg-black border border-slate-700 rounded-md px-3 py-2 text-sm font-mono text-white"
                        value={draftImagePos}
                        onChange={e => setDraftImagePos(e.target.value as any)}
                      >
                        <option value="bottom">Below Text</option>
                        <option value="top">Above Text</option>
                        <option value="bg">Full Background Blur</option>
                      </select>
                    </div>
                  </div>
                </>
              )}`;
  pb = pb.replace(oldUi, newUi);
  fs.writeFileSync("src/app/organizer/participant-board/page.tsx", pb);
}

let disp = fs.readFileSync("src/app/organizer/display/page.tsx", "utf8");

if (!disp.includes("draftTextAlign")) {
  disp = disp.replace(`const [draftImageUrl, setDraftImageUrl] = useState("");`, `const [draftImageUrl, setDraftImageUrl] = useState("");
  const [draftTextAlign, setDraftTextAlign] = useState<"left" | "center" | "right">("center");
  const [draftImagePos, setDraftImagePos] = useState<"top" | "bottom" | "bg">("bottom");`);

  disp = disp.replace(`setDraftImageUrl(t?.imageUrl || "");`, `setDraftImageUrl(t?.imageUrl || "");
    setDraftTextAlign(t?.textAlign || "center");
    setDraftImagePos(t?.imagePosition || "bottom");`);

  disp = disp.replace(`imageUrl: draftImageUrl\n      };`, `imageUrl: draftImageUrl,\n        textAlign: draftTextAlign,\n        imagePosition: draftImagePos\n      };`);
  
  disp = disp.replace(`imageUrl: draftImageUrl\n      };`, `imageUrl: draftImageUrl,\n        textAlign: draftTextAlign,\n        imagePosition: draftImagePos\n      };`);

  const oldUiDisplay = `{(selectedMode === "IMAGE" || selectedMode === "TEXT") && (
                <div className="space-y-1.5">
                  <Label className="text-[var(--color-apb-cyan)] font-bold tracking-widest uppercase mb-1">Image / Media (Optional)</Label>
                  <ImagePicker value={draftImageUrl} onChange={setDraftImageUrl} />
                </div>
              )}`;
  const newUiDisplay = `{(selectedMode === "IMAGE" || selectedMode === "TEXT") && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-[var(--color-apb-cyan)] font-bold tracking-widest uppercase mb-1">Image / Media (Optional)</Label>
                    <ImagePicker value={draftImageUrl} onChange={setDraftImageUrl} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-700 pt-4 mt-4">
                    <div className="space-y-1.5">
                      <Label>Text Alignment</Label>
                      <select 
                        className="w-full bg-black border border-slate-700 rounded-md px-3 py-2 text-sm font-mono text-white"
                        value={draftTextAlign}
                        onChange={e => setDraftTextAlign(e.target.value as any)}
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Image Position</Label>
                      <select 
                        className="w-full bg-black border border-slate-700 rounded-md px-3 py-2 text-sm font-mono text-white"
                        value={draftImagePos}
                        onChange={e => setDraftImagePos(e.target.value as any)}
                      >
                        <option value="bottom">Below Text</option>
                        <option value="top">Above Text</option>
                        <option value="bg">Full Background Blur</option>
                      </select>
                    </div>
                  </div>
                </>
              )}`;
  disp = disp.replace(oldUiDisplay, newUiDisplay);
  fs.writeFileSync("src/app/organizer/display/page.tsx", disp);
}

console.log("Updated layout controls");
