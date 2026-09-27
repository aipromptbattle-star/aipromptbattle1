
import fs from "fs";

let f = fs.readFileSync("src/app/organizer/participant-board/page.tsx", "utf8");
const importUpload = `import { ImagePicker } from "@/components/apb/ImagePicker";`;
if(!f.includes(importUpload)) {
  f = f.replace(`import { ParticipantScreenOverlay } from "@/components/apb/ParticipantScreenOverlay";`, `import { ParticipantScreenOverlay } from "@/components/apb/ParticipantScreenOverlay";\nimport { ImagePicker } from "@/components/apb/ImagePicker";`);
}

const oldUIBlock = `<div className="space-y-1.5">
                    <Label>Image URL (Optional)</Label>
                    <Input 
                      value={draftImageUrl} 
                      onChange={e => setDraftImageUrl(e.target.value)} 
                      placeholder="https://..."
                      className="font-mono text-sm"
                    />
                  </div>`;

const newUIBlock = `<div className="space-y-1.5">
                    <Label className="text-[var(--color-apb-cyan)] font-bold tracking-widest uppercase mb-1">Image / Media (Optional)</Label>
                    <ImagePicker value={draftImageUrl} onChange={setDraftImageUrl} />
                  </div>`;

f = f.replace(oldUIBlock, newUIBlock);
fs.writeFileSync("src/app/organizer/participant-board/page.tsx", f);
console.log("Replaced Image URL with ImagePicker in PB");

