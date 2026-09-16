"use client";

import { useState } from "react";
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
  RefreshCw
} from "lucide-react";

export default function OrganizerDisplayControl() {
  const { eventState, loading: eventLoading } = useEventState();
  const { currentRound } = useCurrentRound(eventState?.currentRoundId || null);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const activeMode: DisplayMode = eventState?.displayOverride || "AUTOMATIC";

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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. SHOW LIVE ROUND */}
          <button
            type="button"
            onClick={() => handleSetMode("LIVE_ROUND")}
            disabled={saving}
            className={`p-6 rounded-2xl border text-left font-mono transition-all cursor-pointer flex flex-col justify-between gap-4 ${
              activeMode === "LIVE_ROUND" || (activeMode === "AUTOMATIC" && currentRound?.status === "LIVE")
                ? "bg-emerald-950/30 border-emerald-500 text-white shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500/50"
                : "bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] text-muted-foreground hover:border-white/30 hover:text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Flame className="w-5 h-5" />
              </div>
              {(activeMode === "LIVE_ROUND" || (activeMode === "AUTOMATIC" && currentRound?.status === "LIVE")) && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] uppercase font-bold">
                  ACTIVE
                </span>
              )}
            </div>

            <div>
              <div className="text-base font-bold text-white uppercase tracking-wider">
                SHOW LIVE ROUND
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Displays live timer, active challenge statement, and constraint reveals.
              </p>
            </div>
          </button>

          {/* 2. SHOW LEADERBOARD */}
          <button
            type="button"
            onClick={() => handleSetMode("LEADERBOARD")}
            disabled={saving}
            className={`p-6 rounded-2xl border text-left font-mono transition-all cursor-pointer flex flex-col justify-between gap-4 ${
              activeMode === "LEADERBOARD"
                ? "bg-yellow-950/30 border-yellow-500 text-white shadow-lg shadow-yellow-950/50 ring-1 ring-yellow-500/50"
                : "bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] text-muted-foreground hover:border-white/30 hover:text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                <Trophy className="w-5 h-5" />
              </div>
              {activeMode === "LEADERBOARD" && (
                <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 text-[10px] uppercase font-bold">
                  ACTIVE
                </span>
              )}
            </div>

            <div>
              <div className="text-base font-bold text-white uppercase tracking-wider">
                SHOW LEADERBOARD
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pushes official rankings and verified team scores to the projector screen.
              </p>
            </div>
          </button>

          {/* 3. SHOW WAITING SCREEN */}
          <button
            type="button"
            onClick={() => handleSetMode("WAITING")}
            disabled={saving}
            className={`p-6 rounded-2xl border text-left font-mono transition-all cursor-pointer flex flex-col justify-between gap-4 ${
              activeMode === "WAITING"
                ? "bg-purple-950/30 border-purple-500 text-white shadow-lg shadow-purple-950/50 ring-1 ring-purple-500/50"
                : "bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] text-muted-foreground hover:border-white/30 hover:text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Clock className="w-5 h-5" />
              </div>
              {activeMode === "WAITING" && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/40 text-[10px] uppercase font-bold">
                  ACTIVE
                </span>
              )}
            </div>

            <div>
              <div className="text-base font-bold text-white uppercase tracking-wider">
                SHOW WAITING SCREEN
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Displays "READY • WAITING FOR START" standby screen between rounds.
              </p>
            </div>
          </button>
        </div>
      </div>

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
