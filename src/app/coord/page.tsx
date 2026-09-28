
"use client";
import React, { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, limit, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { APBButton } from "@/components/apb/APBButton";
import { Send, Radio, User, Volume2, VolumeX } from "lucide-react";

export default function CoordWalkie() {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const soundRef = useRef(soundEnabled);
  const lastMsgIdRef = useRef<string | null>(null);
  const initialLoadRef = useRef(true);

  
  useEffect(() => { soundRef.current = soundEnabled; }, [soundEnabled]);

  useEffect(() => {
    // Read from local storage to remember name
    const stored = localStorage.getItem("apb_coord_name");
    if (stored) {
      setName(stored);
      setJoined(true);
    }
  }, []);

  useEffect(() => {
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
    });
    return () => unsub();
  }, [joined, soundEnabled, name]);

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
  };

  if (!joined) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0a0f18] p-8 rounded-2xl border border-[var(--color-apb-cyan)]/30 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <Radio className="w-16 h-16 text-[var(--color-apb-cyan)] mb-4 animate-pulse" />
            <h1 className="text-3xl font-mono font-black uppercase text-white tracking-widest text-center">Coordinator<br/>Walkie</h1>
          </div>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-slate-400 uppercase tracking-widest block mb-2">Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name..." 
                className="w-full bg-black border border-slate-700 rounded-md px-4 py-3 text-white font-mono focus:border-[var(--color-apb-cyan)] focus:ring-1 focus:ring-[var(--color-apb-cyan)] outline-none"
                autoFocus
              />
            </div>
            <APBButton glow type="submit" className="w-full h-12 text-lg" disabled={!name.trim()}>
              JOIN WALKIE CHANNEL
            </APBButton>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col h-screen fixed inset-0">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-[var(--color-apb-cyan)]/30 bg-[#0a0f18] shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 bg-[var(--color-apb-cyan)]/20 rounded-full border border-[var(--color-apb-cyan)]/50">
            <Radio className="w-5 h-5 text-[var(--color-apb-cyan)]" />
            <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0f18]" />
          </div>
          <div>
            <h1 className="text-lg font-mono font-black uppercase text-white tracking-widest">Global Walkie</h1>
            <div className="text-xs font-mono text-emerald-400">Connected as {name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700">
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button onClick={() => { localStorage.removeItem("apb_coord_name"); setJoined(false); }} className="text-xs font-mono px-3 py-1.5 rounded-full border border-rose-500/50 text-rose-400 hover:bg-rose-500/10">
            DISCONNECT
          </button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black">
        {messages.map((msg, i) => {
          const isMe = msg.sender === name;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              {!isMe && <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1 ml-1">{msg.sender}</div>}
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-sans ${isMe ? "bg-[var(--color-apb-cyan)]/20 border border-[var(--color-apb-cyan)]/30 text-white rounded-tr-sm" : "bg-slate-900 border border-slate-700 text-slate-200 rounded-tl-sm"}`}>
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <footer className="p-4 bg-[#0a0f18] border-t border-[var(--color-apb-surface-border)] shrink-0 pb-safe">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Broadcast to all coords..."
            className="flex-1 bg-black border border-slate-700 rounded-full px-5 py-3 text-sm text-white focus:border-[var(--color-apb-cyan)] focus:ring-1 focus:ring-[var(--color-apb-cyan)] outline-none"
          />
          <APBButton type="submit" glow className="rounded-full w-12 h-12 p-0 flex items-center justify-center shrink-0 disabled:opacity-50" disabled={!text.trim()}>
            <Send className="w-5 h-5 -ml-1" />
          </APBButton>
        </form>
      </footer>
    </div>
  );
}
