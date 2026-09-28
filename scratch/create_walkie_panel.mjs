
import fs from "fs";

const panelCode = `
"use client";
import React, { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { APBButton } from "@/components/apb/APBButton";
import { Send, Radio, User, Volume2, VolumeX, X, MessageSquare } from "lucide-react";

export function CoordWalkiePanel() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    const stored = localStorage.getItem("apb_coord_name");
    if (stored) {
      setName(stored);
      setJoined(true);
    }
  }, []);

  useEffect(() => {
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
    });
    return () => unsub();
  }, [name, soundEnabled, open]);

  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  const playWalkieSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch(e){}
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    localStorage.setItem("apb_coord_name", name);
    setJoined(true);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !joined) return;
    const msg = text;
    setText(""); 
    try {
      await addDoc(collection(db, "coordMessages"), {
        sender: name,
        text: msg,
        timestamp: Date.now()
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end pointer-events-none">
      
      {/* Floating Chat Box */}
      {open && (
        <div className="pointer-events-auto w-80 sm:w-96 h-[500px] bg-[#0a0f18]/95 backdrop-blur-xl border border-[var(--color-apb-cyan)]/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-[var(--color-apb-cyan)]/30 bg-black/50 shrink-0">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[var(--color-apb-cyan)] animate-pulse" />
              <h3 className="font-mono font-bold text-white text-sm uppercase tracking-widest">Global Walkie</h3>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-1.5 text-slate-400 hover:text-white rounded">
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!joined ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <Radio className="w-10 h-10 text-slate-600 mb-4" />
              <form onSubmit={handleJoin} className="w-full space-y-3">
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your Name..." 
                  className="w-full bg-black border border-slate-700 rounded p-2 text-sm text-white font-mono outline-none"
                  autoFocus
                />
                <APBButton glow type="submit" className="w-full text-xs" disabled={!name.trim()}>JOIN CHANNEL</APBButton>
              </form>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/20">
                {messages.map((msg, i) => {
                  const isMe = msg.sender === name;
                  return (
                    <div key={msg.id} className={\`flex flex-col \${isMe ? "items-end" : "items-start"}\`}>
                      {!isMe && <div className="text-[9px] font-mono text-[var(--color-apb-cyan)] uppercase tracking-widest mb-1 ml-1">{msg.sender}</div>}
                      <div className={\`max-w-[85%] px-3 py-2 text-xs font-sans rounded-xl \${isMe ? "bg-[var(--color-apb-cyan)]/20 border border-[var(--color-apb-cyan)]/30 text-white rounded-tr-sm" : "bg-slate-900 border border-slate-700 text-slate-200 rounded-tl-sm"}\`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              {/* Input */}
              <form onSubmit={handleSend} className="p-2 border-t border-[var(--color-apb-surface-border)] bg-black/50 flex gap-2 shrink-0">
                <input
                  type="text"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Broadcast message..."
                  className="flex-1 bg-black border border-slate-700 rounded-full px-3 py-2 text-xs text-white outline-none focus:border-[var(--color-apb-cyan)]"
                />
                <APBButton type="submit" glow className="w-8 h-8 p-0 rounded-full flex items-center justify-center" disabled={!text.trim()}>
                  <Send className="w-3 h-3 -ml-0.5" />
                </APBButton>
              </form>
            </>
          )}
        </div>
      )}

      {/* Floating Toggle Button */}
      <button 
        onClick={() => setOpen(!open)}
        className={\`pointer-events-auto flex items-center justify-center w-14 h-14 rounded-full shadow-2xl border transition-all duration-300 \${open ? "bg-slate-800 border-slate-700 text-slate-300 scale-90" : "bg-[var(--color-apb-cyan)]/20 border-[var(--color-apb-cyan)] text-[var(--color-apb-cyan)] hover:bg-[var(--color-apb-cyan)]/30 hover:scale-105"}\`}
      >
        {open ? <X className="w-6 h-6" /> : (
          <div className="relative">
            <Radio className="w-6 h-6" />
            {unread > 0 && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full animate-bounce">
                {unread}
              </span>
            )}
          </div>
        )}
      </button>

    </div>
  );
}
`;
fs.writeFileSync("src/components/organizer/CoordWalkiePanel.tsx", panelCode);

let layout = fs.readFileSync("src/app/organizer/layout.tsx", "utf8");
layout = layout.replace(`import { GlobalEventHeader } from "@/components/organizer/GlobalEventHeader";`, `import { GlobalEventHeader } from "@/components/organizer/GlobalEventHeader";\nimport { CoordWalkiePanel } from "@/components/organizer/CoordWalkiePanel";`);
layout = layout.replace(`      </div>\n    </ProtectedRoute>`, `        <CoordWalkiePanel />\n      </div>\n    </ProtectedRoute>`);
fs.writeFileSync("src/app/organizer/layout.tsx", layout);

console.log("Created CoordWalkiePanel and injected into layout");

