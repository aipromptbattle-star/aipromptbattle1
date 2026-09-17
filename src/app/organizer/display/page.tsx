"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { APBCard } from "@/components/apb/APBCard";
import { APBButton } from "@/components/apb/APBButton";
import { StatusBadge } from "@/components/apb/StatusBadge";
import { useEventState, useCurrentRound, updateEventSettings } from "@/lib/firebase/events";
import { DisplayMode } from "@/lib/firebase/schema";
import { 
  Monitor, 
  ExternalLink, 
  Trophy, 
  Flame, 
  Clock, 
  Layers, 
  Check, 
  Radio, 
  Sparkles,
  Loader2,
  RefreshCw,
  Image,
  Type
} from "lucide-react";

export default function OrganizerDisplayControl() {
  const { eventState, loading: eventLoading } = useEventState();
  const { currentRound } = useCurrentRound(eventState?.currentRoundId || null);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const activeMode: DisplayMode = eventState?.displayOverride || "AUTOMATIC";
  
  const [imageUrl, setImageUrl] = useState(eventState?.displayImageUrl || "");
  const [heading, setHeading] = useState(eventState?.displayHeading || "");
  const [subheading, setSubheading] = useState(eventState?.displaySubheading || "");
  const [body, setBody] = useState(eventState?.displayBody || "");

  useEffect(() => {
    if (eventState) {
      setImageUrl(eventState.displayImageUrl || "");
      setHeading(eventState.displayHeading || "");
      setSubheading(eventState.displaySubheading || "");
      setBody(eventState.displayBody || "");
    }
  }, [eventState]);

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSetMode = async (mode: DisplayMode) => {
    setSaving(true);
    try {
      await updateEventSettings({ displayOverride: mode });
      showNotification(`Host Display switched to: ${mode}`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to update display mode.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateContent = async () => {
    setSaving(true);
    try {
      await updateEventSettings({ 
        displayImageUrl: imageUrl,
        displayHeading: heading,
        displaySubheading: subheading,
        displayBody: body
      });
      showNotification("Display content updated successfully.");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to update content.");
    } finally {
      setSaving(false);
    }
  };

  if (eventLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-apb-cyan)]" />
      </div>
    );
  }

  const currentDisplayLabel = 
    activeMode === "LEADERBOARD" 
      ? "LEADERBOARD" 
      : activeMode === "WAITING" 
      ? "WAITING SCREEN" 
      : activeMode === "LIVE_ROUND" || activeMode === "AUTOMATIC"
      ? (currentRound?.status === "LIVE" ? "LIVE ROUND" : currentRound?.status === "STARTING" ? "COUNTDOWN" : currentRound?.status === "PAUSED" ? "PAUSED" : "WAITING SCREEN")
      : "LIVE ROUND";

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-apb-surface-border)] pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl sm:text-3xl font-mono font-bold uppercase tracking-wider text-white flex items-center gap-3">
              <Monitor className="w-6 h-6 text-[var(--color-apb-cyan)]" />
              <span>DISPLAY CONTROL</span>
            </h2>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              HOST DISPLAY ● CONNECTED
            </span>
          </div>
          <p className="text-muted-foreground text-sm font-mono">
            Directly control what is projected onto the audience screen (/display).
          </p>
        </div>

        <Link href="/display" target="_blank" rel="noopener noreferrer">
          <APBButton glow size="sm" className="font-mono text-xs uppercase tracking-wider">
            <ExternalLink className="w-4 h-4 mr-2" />
            Launch Host Display ↗
          </APBButton>
        </Link>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-lg font-mono text-xs bg-cyan-950/40 border border-[var(--color-apb-cyan)]/40 text-cyan-300 flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-muted-foreground hover:text-white ml-4">✕</button>
        </div>
      )}

      {/* Current Display Status Card */}
      <APBCard className="p-6 bg-gradient-to-r from-[var(--color-apb-surface)] via-black/40 to-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 font-mono">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">CURRENT DISPLAY</div>
            <div className="text-3xl font-black text-white flex items-center gap-3">
              <span className="text-[var(--color-apb-cyan)]">●</span>
              <span>{currentDisplayLabel}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Active Round: {currentRound ? `Round 0${currentRound.roundNumber} (${currentRound.title})` : "None"} • Status: {currentRound?.status || "READY"}
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono text-muted-foreground block mb-1">AUDIENCE URL</span>
            <span className="text-xs font-mono text-[var(--color-apb-cyan)] px-2.5 py-1 rounded bg-black/60 border border-white/10">
              /display
            </span>
          </div>
        </div>
      </APBCard>

      {/* Mode Switch Buttons (§16 & §55) */}
      <div className="space-y-4">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground font-bold">
          SWITCH DISPLAY STATE
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. SHOW LIVE ROUND */}
          <button
            type="button"
            onClick={() => handleSetMode("LIVE_ROUND")}
            disabled={saving}
            className={`p-4 sm:p-6 rounded-2xl border text-left font-mono transition-all cursor-pointer flex flex-col justify-between gap-4 ${
              activeMode === "LIVE_ROUND" || (activeMode === "AUTOMATIC" && currentRound?.status === "LIVE")
                ? "bg-emerald-950/30 border-emerald-500 text-white shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500/50"
                : "bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] text-muted-foreground hover:border-white/30 hover:text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-white uppercase tracking-wider">LIVE ROUND</div>
            </div>
          </button>

          {/* 2. SHOW LEADERBOARD */}
          <button
            type="button"
            onClick={() => handleSetMode("LEADERBOARD")}
            disabled={saving}
            className={`p-4 sm:p-6 rounded-2xl border text-left font-mono transition-all cursor-pointer flex flex-col justify-between gap-4 ${
              activeMode === "LEADERBOARD"
                ? "bg-yellow-950/30 border-yellow-500 text-white shadow-lg shadow-yellow-950/50 ring-1 ring-yellow-500/50"
                : "bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] text-muted-foreground hover:border-white/30 hover:text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                <Trophy className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-white uppercase tracking-wider">LEADERBOARD</div>
            </div>
          </button>

          {/* 3. SHOW WAITING SCREEN */}
          <button
            type="button"
            onClick={() => handleSetMode("WAITING")}
            disabled={saving}
            className={`p-4 sm:p-6 rounded-2xl border text-left font-mono transition-all cursor-pointer flex flex-col justify-between gap-4 ${
              activeMode === "WAITING"
                ? "bg-purple-950/30 border-purple-500 text-white shadow-lg shadow-purple-950/50 ring-1 ring-purple-500/50"
                : "bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] text-muted-foreground hover:border-white/30 hover:text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-white uppercase tracking-wider">WAITING</div>
            </div>
          </button>

          {/* 4. SHOW IMAGE */}
          <button
            type="button"
            onClick={() => handleSetMode("IMAGE")}
            disabled={saving}
            className={`p-4 sm:p-6 rounded-2xl border text-left font-mono transition-all cursor-pointer flex flex-col justify-between gap-4 ${
              activeMode === "IMAGE"
                ? "bg-cyan-950/30 border-cyan-500 text-white shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-500/50"
                : "bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] text-muted-foreground hover:border-white/30 hover:text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Image className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-white uppercase tracking-wider">SHOW IMAGE</div>
            </div>
          </button>

          {/* 5. SHOW TEXT */}
          <button
            type="button"
            onClick={() => handleSetMode("TEXT")}
            disabled={saving}
            className={`p-4 sm:p-6 rounded-2xl border text-left font-mono transition-all cursor-pointer flex flex-col justify-between gap-4 ${
              activeMode === "TEXT"
                ? "bg-pink-950/30 border-pink-500 text-white shadow-lg shadow-pink-950/50 ring-1 ring-pink-500/50"
                : "bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] text-muted-foreground hover:border-white/30 hover:text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <Type className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-white uppercase tracking-wider">SHOW TEXT</div>
            </div>
          </button>
        </div>
      </div>

      {/* Configuration for Image and Text */}
      <APBCard className="p-6 bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] space-y-4">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground font-bold border-b border-white/10 pb-2">
          CUSTOM CONTENT CONFIGURATION
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-mono uppercase text-muted-foreground mb-1 block">IMAGE URL</label>
            <input 
              type="text" 
              value={imageUrl} 
              onChange={e => setImageUrl(e.target.value)} 
              placeholder="https://example.com/image.png"
              className="w-full bg-black/50 border border-[var(--color-apb-surface-border)] rounded-md px-3 py-2 text-sm text-white font-mono"
            />
          </div>
          <div>
            <label className="text-xs font-mono uppercase text-muted-foreground mb-1 block">HEADING</label>
            <input 
              type="text" 
              value={heading} 
              onChange={e => setHeading(e.target.value)} 
              placeholder="e.g. ROUND RULES"
              className="w-full bg-black/50 border border-[var(--color-apb-surface-border)] rounded-md px-3 py-2 text-sm text-white font-mono font-bold uppercase tracking-wider"
            />
          </div>
          <div>
            <label className="text-xs font-mono uppercase text-muted-foreground mb-1 block">SUBHEADING</label>
            <input 
              type="text" 
              value={subheading} 
              onChange={e => setSubheading(e.target.value)} 
              placeholder="e.g. General Guidelines"
              className="w-full bg-black/50 border border-[var(--color-apb-surface-border)] rounded-md px-3 py-2 text-sm text-[var(--color-apb-cyan)] font-mono uppercase tracking-widest"
            />
          </div>
          <div>
            <label className="text-xs font-mono uppercase text-muted-foreground mb-1 block">BODY TEXT</label>
            <textarea 
              value={body} 
              onChange={e => setBody(e.target.value)} 
              placeholder="Enter main content..."
              className="w-full bg-black/50 border border-[var(--color-apb-surface-border)] rounded-md px-3 py-2 text-sm text-white font-mono min-h-[120px] whitespace-pre-wrap"
            />
          </div>
          <APBButton onClick={handleUpdateContent} disabled={saving} size="sm">
            {saving ? "SAVING..." : "UPDATE CONTENT"}
          </APBButton>
        </div>
      </APBCard>

      {/* DISPLAY PREVIEW (§16) */}
      <div className="space-y-3">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground font-bold flex items-center justify-between">
          <span>DISPLAY PREVIEW</span>
          <span className="text-[var(--color-apb-cyan)] text-[11px]">Live mirror of /display</span>
        </div>

        <div className="rounded-2xl border border-[var(--color-apb-surface-border)] overflow-hidden bg-black aspect-video max-w-2xl mx-auto shadow-2xl flex flex-col justify-between p-6 text-center select-none relative">
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span>[HOST DISPLAY PREVIEW]</span>
            <span className="text-emerald-400 uppercase font-bold">● {currentDisplayLabel}</span>
          </div>

          <div className="my-auto space-y-2">
            {activeMode === "LEADERBOARD" ? (
              <div className="space-y-2">
                <div className="text-xs font-mono text-yellow-400 uppercase font-bold tracking-widest">
                  🏆 LEADERBOARD STANDINGS
                </div>
                <div className="text-xl font-mono font-bold text-white uppercase">
                  Round 0{currentRound?.roundNumber || 1} Scores
                </div>
              </div>
            ) : activeMode === "IMAGE" ? (
              <div className="flex flex-col items-center justify-center h-full w-full p-2">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="max-w-full max-h-[200px] object-contain rounded-md" />
                ) : (
                  <div className="text-xs font-mono text-cyan-400/50 uppercase tracking-widest font-bold">
                    NO IMAGE URL PROVIDED
                  </div>
                )}
              </div>
            ) : activeMode === "TEXT" ? (
              <div className="flex flex-col items-center justify-center h-full w-full p-4 overflow-hidden">
                {(heading || subheading || body) ? (
                  <div className="w-full space-y-2">
                    {heading && <div className="text-xl font-black uppercase text-white tracking-wider truncate">{heading}</div>}
                    {subheading && <div className="text-sm font-bold uppercase text-[var(--color-apb-cyan)] tracking-widest truncate">{subheading}</div>}
                    {body && <div className="text-xs text-white/70 line-clamp-3 text-left whitespace-pre-wrap">{body}</div>}
                  </div>
                ) : (
                  <div className="text-xs font-mono text-pink-400/50 uppercase tracking-widest font-bold">
                    NO TEXT PROVIDED
                  </div>
                )}
              </div>
            ) : activeMode === "WAITING" || (!currentRound || currentRound.status === "READY" || currentRound.status === "DRAFT") ? (
              <div className="space-y-2">
                <div className="text-xs font-mono text-[var(--color-apb-cyan)] uppercase tracking-widest font-bold">
                  READY • WAITING FOR START
                </div>
                <div className="text-2xl font-mono font-black text-white uppercase">
                  ROUND 0{currentRound?.roundNumber || 1}
                </div>
                <div className="text-sm font-mono text-white/70 uppercase">
                  {currentRound?.title || "QUIZ"}
                </div>
              </div>
            ) : currentRound.status === "STARTING" ? (
              <div className="space-y-1">
                <div className="text-xs font-mono text-amber-400 uppercase font-bold">ROUND STARTING</div>
                <div className="text-5xl font-mono font-black text-amber-400">5...</div>
              </div>
            ) : currentRound.status === "PAUSED" ? (
              <div className="space-y-1">
                <div className="text-xs font-mono text-amber-400 uppercase font-bold">ROUND PAUSED</div>
                <div className="text-4xl font-mono font-bold text-amber-400">07:42</div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs font-mono text-muted-foreground uppercase">TIME REMAINING</div>
                <div className="text-5xl font-mono font-black text-white">19:38</div>
                <div className="text-xs font-mono text-[var(--color-apb-cyan)] uppercase font-bold">
                  ROUND 0{currentRound.roundNumber} • {currentRound.title}
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] font-mono text-muted-foreground">
            Audience projection mode • Zero client controls visible
          </div>
        </div>
      </div>
    </div>
  );
}
