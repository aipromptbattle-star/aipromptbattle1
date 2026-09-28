
import fs from "fs";
let f = fs.readFileSync("src/app/organizer/rounds/page.tsx", "utf8");

// Add ImagePicker import
if (!f.includes("import { ImagePicker }")) {
  f = f.replace(`import { EditRoundDialog }`, `import { ImagePicker } from "@/components/apb/ImagePicker";\nimport { EditRoundDialog }`);
}

// Add imageUrl to formData
f = f.replace(`referenceMaterial: "",\n    constraintsStr: "",\n  });`, `referenceMaterial: "",\n    imageUrl: "",\n    constraintsStr: "",\n  });`);

// Update handleCreate
f = f.replace(`referenceMaterial: formData.referenceMaterial,\n        constraints`, `referenceMaterial: formData.referenceMaterial,\n        imageUrl: formData.imageUrl,\n        constraints`);

// Reset formData
f = f.replace(`referenceMaterial: "",\n        constraintsStr: "",\n      });`, `referenceMaterial: "",\n        imageUrl: "",\n        constraintsStr: "",\n      });`);

// Update UI
const oldUi = `<div className="space-y-1.5">
                  <Label>Reference Material / Scenario</Label>
                  <textarea 
                    className="w-full bg-black/50 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono text-white h-24"
                    value={formData.referenceMaterial}
                    onChange={e => setFormData({ ...formData, referenceMaterial: e.target.value })}
                  />
                </div>`;
const newUi = `<div className="space-y-1.5">
                  <Label>Reference Material / Scenario</Label>
                  <textarea 
                    className="w-full bg-black/50 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono text-white h-24"
                    value={formData.referenceMaterial}
                    onChange={e => setFormData({ ...formData, referenceMaterial: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Reference Image (Optional)</Label>
                  <ImagePicker value={formData.imageUrl} onChange={url => setFormData({ ...formData, imageUrl: url })} />
                </div>`;
f = f.replace(oldUi, newUi);

fs.writeFileSync("src/app/organizer/rounds/page.tsx", f);
console.log("Added ImagePicker to Create Round");

