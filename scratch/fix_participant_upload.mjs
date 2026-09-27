
import fs from "fs";

let f = fs.readFileSync("src/app/organizer/participant-board/page.tsx", "utf8");

const importUpload = `import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebase/config";`;

f = f.replace(`import { useEventState, updateEventSettings } from "@/lib/firebase/events";`, importUpload + `\nimport { useEventState, updateEventSettings } from "@/lib/firebase/events";`);

// Add isUploading state
f = f.replace(`const [draftImageUrl, setDraftImageUrl] = useState("");`, `const [draftImageUrl, setDraftImageUrl] = useState("");\n  const [isUploading, setIsUploading] = useState(false);`);

// Add handleImageUpload function
const handleImageUpload = `
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const storage = getStorage(app);
      const storageRef = ref(storage, \`display/\${Date.now()}_\${file.name}\`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      setDraftImageUrl(url);
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };
`;

f = f.replace(`const saveTemplate = async () => {`, handleImageUpload + `\n  const saveTemplate = async () => {`);

// Replace UI
const oldUI = `<div className="space-y-1.5 pt-2">
                  <Label>Image URL (Optional)</Label>
                  <Input 
                    value={draftImageUrl} 
                    onChange={e => setDraftImageUrl(e.target.value)} 
                    placeholder="https://..."
                    className="font-mono text-sm"
                  />
                </div>`;

const newUI = `<div className="space-y-1.5 pt-2">
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

f = f.replace(oldUI, newUI);

fs.writeFileSync("src/app/organizer/participant-board/page.tsx", f);
console.log("Added Image Upload");

