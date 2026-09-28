
import fs from "fs";

let f = fs.readFileSync("src/app/organizer/participant-board/page.tsx", "utf8");

if (!f.includes("import { ImagePicker }")) {
  f = f.replace(`import { APBCard } from "@/components/apb/APBCard";`, `import { APBCard } from "@/components/apb/APBCard";\nimport { ImagePicker } from "@/components/apb/ImagePicker";`);
}

f = f.replace(`{selectedMode !== "COUNTDOWN" && (
                <div className="space-y-1.5">
                  <Label>Image URL (Optional)</Label>
                  <Input 
                    value={draftImageUrl} 
                    onChange={e => setDraftImageUrl(e.target.value)} 
                    placeholder="https://..."
                    className="font-mono text-sm"
                  />
                </div>
              )}`, `{selectedMode !== "AUTO" && (
                <div className="space-y-1.5">
                  <Label>Image / Visual Asset (Optional)</Label>
                  <ImagePicker value={draftImageUrl} onChange={url => setDraftImageUrl(url)} />
                </div>
              )}`);

// Also fix COUNTDOWN restricting text fields!
f = f.replace(`{selectedMode !== "COUNTDOWN" && (
                <div className="space-y-1.5">
                  <Label>Body Text / Instructions</Label>`, `{selectedMode !== "AUTO" && (
                <div className="space-y-1.5">
                  <Label>Body Text / Instructions</Label>`);

fs.writeFileSync("src/app/organizer/participant-board/page.tsx", f);
console.log("Fixed Participant Board Image Picker");

