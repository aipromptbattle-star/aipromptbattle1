
import fs from "fs";

let f = fs.readFileSync("src/app/organizer/participant-board/page.tsx", "utf8");

f = f.replace(`import { ParticipantScreenOverlay } from "@/components/apb/ParticipantScreenOverlay";`, `import { ParticipantScreenOverlay } from "@/components/apb/ParticipantScreenOverlay";\nimport { ImagePicker } from "@/components/apb/ImagePicker";`);

// Remove old handleImageUpload and isUploading state since ImagePicker handles it
f = f.replace(`const [isUploading, setIsUploading] = useState(false);`, ``);
const uploadFuncRegex = /const handleImageUpload = async \([\s\S]*?\}\n  \};\n/;
f = f.replace(uploadFuncRegex, "");

// Replace the UI block for Image
const oldUIBlock = `<div className="space-y-1.5 pt-2">
                  <Label>Image (Optional)</Label>
                  <div className="flex gap-2 mb-2">
                    <Input 
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      className="font-mono text-sm"
                    />
                    {isUploading && <span className="text-xs text-amber-500 font-mono flex items-center">Uploading...</span>}
                  </div>
                  <Input 
                    value={draftImageUrl} 
                    onChange={e => setDraftImageUrl(e.target.value)} 
                    placeholder="Or paste image URL here..."
                    className="font-mono text-sm"
                  />
                  {draftImageUrl && (
                    <div className="mt-2 w-full max-w-[200px] h-24 relative rounded-md border border-white/10 overflow-hidden bg-black/50">
                      <img src={draftImageUrl} alt="Preview" className="w-full h-full object-cover" crossOrigin="anonymous" />
                    </div>
                  )}
                </div>`;

const newUIBlock = `<div className="space-y-1.5 pt-4">
                  <Label className="text-[var(--color-apb-cyan)] font-bold tracking-widest uppercase">Image / Media (Optional)</Label>
                  <ImagePicker value={draftImageUrl} onChange={setDraftImageUrl} />
                </div>`;

// If oldUIBlock is not matched perfectly, do a more robust replace:
const startLabel = `<div className="space-y-1.5 pt-2">
                  <Label>Image (Optional)</Label>`;
const endDiv = `</div>
                )}
                </div>`;
                
if(f.includes(oldUIBlock)) {
  f = f.replace(oldUIBlock, newUIBlock);
} else {
  // Let us fallback to string slicing
  let s = f.indexOf(`<div className="space-y-1.5 pt-2">\\n                  <Label>Image (Optional)</Label>`);
  if (s !== -1) {
    let e = f.indexOf(`                </div>`, s + 100);
    f = f.substring(0, s) + newUIBlock + f.substring(e + 22);
  } else {
    console.log("Could not find image UI block");
  }
}

fs.writeFileSync("src/app/organizer/participant-board/page.tsx", f);
console.log("Injected ImagePicker into Participant Board");

