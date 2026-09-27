
import fs from "fs";

let f = fs.readFileSync("src/app/organizer/display/page.tsx", "utf8");
const importUpload = `import { ImagePicker } from "@/components/apb/ImagePicker";`;
if(!f.includes(importUpload)) {
  f = f.replace(`import { APBCard } from "@/components/apb/APBCard";`, `import { APBCard } from "@/components/apb/APBCard";\nimport { ImagePicker } from "@/components/apb/ImagePicker";`);
}

// Remove old handleImageUpload block from display if it exists (since we built a picker)
const uploadFuncRegex = /const handleImageUpload = async \([\s\S]*?\}\n  \};\n/;
f = f.replace(uploadFuncRegex, "");
f = f.replace(`const [isUploading, setIsUploading] = useState(false);`, ``);

// Remove the old upload UI if it exists in display
const uploadUIRegex = /<div className="space-y-1.5 pt-2">[\s\S]*?<\/Label>[\s\S]*?<div className="flex gap-2 mb-2">[\s\S]*?<\/div>[\s\S]*?<\/div>/;
f = f.replace(uploadUIRegex, "");

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
fs.writeFileSync("src/app/organizer/display/page.tsx", f);
console.log("Replaced Image URL with ImagePicker in display");

