
import fs from "fs";

let panel = fs.readFileSync("src/components/organizer/CoordWalkiePanel.tsx", "utf8");

// Add refs
panel = panel.replace(
  `const messagesEndRef = useRef<HTMLDivElement>(null);`,
  `const messagesEndRef = useRef<HTMLDivElement>(null);\n  const openRef = useRef(open);\n  const soundRef = useRef(soundEnabled);\n  const lastMsgIdRef = useRef<string | null>(null);`
);

// Sync refs
const effectRefs = `
  useEffect(() => { openRef.current = open; }, [open]);
  useEffect(() => { soundRef.current = soundEnabled; }, [soundEnabled]);
`;
panel = panel.replace(`useEffect(() => {`, `${effectRefs}\n  useEffect(() => {`);

// Update onSnapshot logic
const oldEffect = `    useEffect(() => {
      const q = query(collection(db, "coordMessages"), orderBy("timestamp", "asc"), limit(100));
      const unsub = onSnapshot(q, (snap) => {
        const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
        setMessages(msgs);
        
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
        
        if (!initialLoadRef.current) {
          if (msgs.length > 0 && msgs[msgs.length-1].sender !== name) {
            if (!open) {
              setUnread(prev => prev + 1);
              if (soundEnabled) playWalkieSound();
            } else {
              if (soundEnabled) playWalkieSound();
            }
          }
        } else {
          initialLoadRef.current = false;
        }
      }, (err) => {
        console.error("Walkie Sync Error:", err);
        alert("Walkie Sync Error: " + err.message);
      });
      return () => unsub();
    }, [name, soundEnabled, open]);`;

const newEffect = `    useEffect(() => {
      const q = query(collection(db, "coordMessages"), orderBy("timestamp", "asc"), limit(100));
      const unsub = onSnapshot(q, (snap) => {
        const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
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
            // It is a genuinely NEW message!
            lastMsgIdRef.current = latestMsg.id;
            if (latestMsg.sender !== name) {
              if (!openRef.current) {
                setUnread(prev => prev + 1);
                if (soundRef.current) playWalkieSound();
              } else {
                if (soundRef.current) playWalkieSound();
              }
            }
          }
        }
      }, (err) => {
        console.error("Walkie Sync Error:", err);
      });
      return () => unsub();
    }, [name]); // Only name changes should re-trigger subscription`;

panel = panel.replace(oldEffect, newEffect);
fs.writeFileSync("src/components/organizer/CoordWalkiePanel.tsx", panel);

console.log("Fixed notification bug");

