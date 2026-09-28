
import fs from "fs";

let coord = fs.readFileSync("src/app/coord/page.tsx", "utf8");

// Add refs
coord = coord.replace(
  `const messagesEndRef = useRef<HTMLDivElement>(null);`,
  `const messagesEndRef = useRef<HTMLDivElement>(null);\n  const soundRef = useRef(soundEnabled);\n  const lastMsgIdRef = useRef<string | null>(null);\n  const initialLoadRef = useRef(true);`
);

// Sync refs
const effectRefs = `
  useEffect(() => { soundRef.current = soundEnabled; }, [soundEnabled]);
`;
coord = coord.replace(`useEffect(() => {\n    // Read from local storage`, `${effectRefs}\n  useEffect(() => {\n    // Read from local storage`);

// Update onSnapshot logic
const oldEffect = `    useEffect(() => {
      if (!joined) return;
      
      const q = query(collection(db, "coordMessages"), orderBy("timestamp", "asc"), limit(200));
      const unsub = onSnapshot(q, (snap) => {
        const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setMessages(msgs);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        
        // Play tick on new message if sound enabled
        if (soundEnabled && msgs.length > 0 && msgs[msgs.length-1].sender !== name) {
          playWalkieSound();
        }
      }, (err) => {
        console.error("Walkie Sync Error:", err);
        alert("Walkie Sync Error: " + err.message);
      });
      return () => unsub();
    }, [joined, soundEnabled, name]);`;

const newEffect = `    useEffect(() => {
      if (!joined) return;
      
      const q = query(collection(db, "coordMessages"), orderBy("timestamp", "asc"), limit(200));
      const unsub = onSnapshot(q, (snap) => {
        const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setMessages(msgs);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        
        if (msgs.length > 0) {
          const latestMsg = msgs[msgs.length - 1];
          if (initialLoadRef.current) {
            lastMsgIdRef.current = latestMsg.id;
            initialLoadRef.current = false;
          } else if (lastMsgIdRef.current !== latestMsg.id) {
            lastMsgIdRef.current = latestMsg.id;
            if (soundRef.current && latestMsg.sender !== name) {
              playWalkieSound();
            }
          }
        }
      }, (err) => {
        console.error("Walkie Sync Error:", err);
      });
      return () => unsub();
    }, [joined, name]); // Only re-trigger on join/name`;

coord = coord.replace(oldEffect, newEffect);
fs.writeFileSync("src/app/coord/page.tsx", coord);

console.log("Fixed coord route");

