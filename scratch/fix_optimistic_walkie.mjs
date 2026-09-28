
import fs from "fs";

let panel = fs.readFileSync("src/components/organizer/CoordWalkiePanel.tsx", "utf8");

panel = panel.replace(
  `      const msg = text;
      setText(""); 
      try {
        await addDoc(collection(db, "coordMessages"), {
          sender: name,
          text: msg,
          timestamp: Date.now()
        });
      } catch (e) {
        console.error(e);
      }`,
  `      try {
        await addDoc(collection(db, "coordMessages"), {
          sender: name,
          text: text,
          timestamp: Date.now()
        });
        setText(""); 
      } catch (e: any) {
        console.error("Firebase write error:", e);
        alert("Failed to send message: " + e.message);
      }`
);

fs.writeFileSync("src/components/organizer/CoordWalkiePanel.tsx", panel);

let coord = fs.readFileSync("src/app/coord/page.tsx", "utf8");

coord = coord.replace(
  `    const msg = text;
    setText(""); // Optimistic clear
    
    try {
      await addDoc(collection(db, "coordMessages"), {
        sender: name,
        text: msg,
        timestamp: Date.now()
      });
    } catch (e) {
      console.error(e);
      alert("Failed to send message");
    }`,
  `    try {
      await addDoc(collection(db, "coordMessages"), {
        sender: name,
        text: text,
        timestamp: Date.now()
      });
      setText(""); 
    } catch (e: any) {
      console.error("Firebase write error:", e);
      alert("Failed to send message: " + e.message);
    }`
);

fs.writeFileSync("src/app/coord/page.tsx", coord);
console.log("Fixed optimistic clear");

