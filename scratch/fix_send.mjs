
import fs from "fs";

function fixHandleSend(file) {
  let content = fs.readFileSync(file, "utf8");
  
  // Find handleSend
  const startIdx = content.indexOf("const handleSend =");
  if (startIdx === -1) return;
  
  const endIdx = content.indexOf("  };", startIdx);
  if (endIdx === -1) return;
  
  const oldFunc = content.substring(startIdx, endIdx + 4);
  
  const newFunc = `const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !joined) return;
    
    try {
      await addDoc(collection(db, "coordMessages"), {
        sender: name,
        text: text,
        timestamp: Date.now()
      });
      // Only clear if successful
      setText(""); 
    } catch (err: any) {
      console.error("Walkie Send Error:", err);
      alert("Error sending message: " + err.message);
    }
  };`;
  
  content = content.replace(oldFunc, newFunc);
  fs.writeFileSync(file, content);
}

fixHandleSend("src/components/organizer/CoordWalkiePanel.tsx");
fixHandleSend("src/app/coord/page.tsx");

console.log("Fixed handleSend globally");

