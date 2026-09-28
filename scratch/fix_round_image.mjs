
import fs from "fs";

let f = fs.readFileSync("src/lib/firebase/schema.ts", "utf8");
f = f.replace(`referenceMaterial?: string;`, `referenceMaterial?: string;\n    imageUrl?: string;`);
fs.writeFileSync("src/lib/firebase/schema.ts", f);

let f2 = fs.readFileSync("src/components/apb/ChallengePanel.tsx", "utf8");
f2 = f2.replace(`{round.referenceMaterial && (`, `{round.imageUrl && (
        <div className="space-y-1.5 pt-2 border-t border-[var(--color-apb-surface-border)]/50">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" /> Reference Image
          </span>
          <div className="rounded-md overflow-hidden border border-[var(--color-apb-surface-border)]">
            <img src={round.imageUrl} alt="Challenge Reference" className="w-full h-auto" />
          </div>
        </div>
      )}
      
      {round.referenceMaterial && (`);
f2 = f2.replace(`import { AlertCircle, Target, FileText, CheckSquare } from "lucide-react";`, `import { AlertCircle, Target, FileText, CheckSquare, Image as ImageIcon } from "lucide-react";`);
fs.writeFileSync("src/components/apb/ChallengePanel.tsx", f2);

let f3 = fs.readFileSync("src/components/apb/EditRoundDialog.tsx", "utf8");
const impUpload = `import { ImagePicker } from "./ImagePicker";`;
if(!f3.includes(impUpload)) f3 = f3.replace(`import { APBButton } from "./APBButton";`, `import { APBButton } from "./APBButton";\n${impUpload}`);

f3 = f3.replace(`referenceMaterial: round.referenceMaterial || "",`, `referenceMaterial: round.referenceMaterial || "",\n        imageUrl: round.imageUrl || "",`);

const uiStr = `<div className="space-y-1.5">
              <label className="text-xs font-mono text-muted-foreground uppercase">Reference Material / Scenario</label>
              <textarea 
                className="w-full bg-black/50 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono text-white h-24"
                value={formData.referenceMaterial}
                onChange={e => setFormData({ ...formData, referenceMaterial: e.target.value })}
              />
            </div>`;
const newUiStr = uiStr + `
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-muted-foreground uppercase">Reference Image (Optional)</label>
              <ImagePicker value={formData.imageUrl || ""} onChange={url => setFormData({ ...formData, imageUrl: url })} />
            </div>`;
f3 = f3.replace(uiStr, newUiStr);
fs.writeFileSync("src/components/apb/EditRoundDialog.tsx", f3);
console.log("Added image upload to rounds");

