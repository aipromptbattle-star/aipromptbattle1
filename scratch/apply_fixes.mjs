
import fs from "fs";

// 1. GlobalEventHeader - remove VIGYANTRA
let f = fs.readFileSync("src/components/apb/GlobalEventHeader.tsx", "utf8");
f = f.replace("VIGYANTRA x AI", "AI PROMPT BATTLE").replace("VIGYANTRA \u00d7 AI", "AI PROMPT BATTLE");
fs.writeFileSync("src/components/apb/GlobalEventHeader.tsx", f);
console.log("Fixed GlobalEventHeader");

// 2. System page - add date to audit log
f = fs.readFileSync("src/app/organizer/system/page.tsx", "utf8");
f = f.replace(
  "{new Date(log.timestamp).toLocaleTimeString()}",
  "{new Date(log.timestamp).toLocaleString(undefined, { dateStyle: \"short\", timeStyle: \"medium\" })}"
);
fs.writeFileSync("src/app/organizer/system/page.tsx", f);
console.log("Fixed audit log date");

// 3. Display page - replace image URL input with file upload + URL fallback
f = fs.readFileSync("src/app/organizer/display/page.tsx", "utf8");
// Add firebase storage import if not present
if (!f.includes("getDownloadURL")) {
  f = f.replace(
    `import { useEventState, updateEventSettings } from "@/lib/firebase/events";`,
    `import { useEventState, updateEventSettings } from "@/lib/firebase/events";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebase/config";`
  );
}
// Replace the image URL input with file upload
f = f.replace(
  `<Label>Image URL (Optional)</Label>
                    <Input 
                      placeholder="https://..." 
                      value={draftImageUrl} 
                      onChange={e => setDraftImageUrl(e.target.value)} 
                      className="font-mono text-sm"
                    />`,
  `<Label>Image Upload or URL</Label>
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const storage = getStorage(app);
                            const storageRef = ref(storage, \`display-images/\${Date.now()}_\${file.name}\`);
                            await uploadBytes(storageRef, file);
                            const url = await getDownloadURL(storageRef);
                            setDraftImageUrl(url);
                          } catch (err) {
                            console.error("Upload failed", err);
                          }
                        }}
                        className="w-full text-xs font-mono text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-mono file:bg-[var(--color-apb-cyan)]/20 file:text-[var(--color-apb-cyan)] hover:file:bg-[var(--color-apb-cyan)]/30 cursor-pointer"
                      />
                      <Input
                        placeholder="...or paste image URL"
                        value={draftImageUrl}
                        onChange={e => setDraftImageUrl(e.target.value)}
                        className="font-mono text-sm"
                      />
                      {draftImageUrl && (
                        <img src={draftImageUrl} alt="Preview" className="w-full max-h-32 object-contain rounded border border-white/10" onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
                      )}
                    </div>`
);
fs.writeFileSync("src/app/organizer/display/page.tsx", f);
console.log("Fixed display image upload");

// 4. Fix display/page.tsx img tag (public display page) - ensure Next.js img tag or regular img with proper crossOrigin
f = fs.readFileSync("src/app/display/page.tsx", "utf8");
// Make sure images load with crossOrigin to avoid CORS issues with firebase storage
f = f.replace(
  `<img \n                src={eventState.displayImageUrl} \n                alt="Display Custom" \n                className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-2xl" \n              />`,
  `<img\n                src={eventState.displayImageUrl}\n                alt="Display"\n                crossOrigin="anonymous"\n                referrerPolicy="no-referrer"\n                className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-2xl"\n              />`
);
fs.writeFileSync("src/app/display/page.tsx", f);
console.log("Fixed display public image");

