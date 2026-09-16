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

const DISPLAY_LAYOUTS = [
  { id: 1, name: "Esports Arena", description: "Default tournament broadcast with high-contrast timer, large mission objective, and telemetry pill" },
  { id: 2, name: "Clean Podium", description: "Ultra-minimalist stage focus with centered countdown and clean typographic hierarchy" },
  { id: 3, name: "Constraint Focus", description: "Designed for Round 2: large multi-line constraint statement with stage timeline" },
  { id: 4, name: "Telemetry Grid", description: "Esports command stats: timer, stage, submission telemetry, and team counter" },
  { id: 5, name: "Cyber Neon", description: "Vibrant dark cyberpunk aesthetic with electric cyan and purple visual accents" },
  { id: 6, name: "Auditorium Wide", description: "Optimized for ultra-wide auditorium projectors (21:9 & 16:9 cinema displays)" },
  { id: 7, name: "Classroom Projector", description: "Enhanced contrast tuned for ambient-light lecture halls and standard projectors" },
  { id: 8, name: "Compact Stage", description: "Tuned for side TVs and judges' auxiliary confidence monitors" },
  { id: 9, name: "Stream Broadcast", description: "Split layout optimized for OBS / streaming overlays and external HDMI capture" },
  { id: 10, name: "Midnight Monolith", description: "Ultra-massive high-contrast numbers designed for 100m+ auditorium legibility" },
];

export default function OrganizerDisplayControl() {
  const { eventState, loading: eventLoading } = useEventState();
  const { currentRound } = useCurrentRound(eventState?.currentRoundId || null);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const activeMode: DisplayMode = eventState?.displayOverride || "AUTOMATIC";
  const activeLayout = eventState?.activeDisplayLayout || 1;

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSetMode = async (mode: DisplayMode) => {
    setSaving(true);
    try {
      await updateEventSettings({ displayOverride: mode });
      showNotification(`Public Display switched to: ${mode}`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to update display mode.");
    } finally {
      setSaving(false);
    }
  };

  const handleSetLayout = async (layoutId: number) => {
    setSaving(true);
    try {
      await updateEventSettings({ activeDisplayLayout: layoutId });
      showNotification(`Display preset set to Layout ${layoutId}`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to update display layout.");
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-apb-surface-border)] pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl sm:text-3xl font-mono font-bold uppercase tracking-wider text-white flex items-center gap-3">
              <Monitor className="w-6 h-6 text-[var(--color-apb-cyan)]" />
              <span>DISPLAY SCREEN CONTROL</span>
            </h2>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE CONNECTION
            </span>
          </div>
          <p className="text-muted-foreground text-sm font-mono">
            Control What the Public Auditorium / Projector Display (/display) is Rendering
          </p>
        </div>

        <Link href="/display" target="_blank" rel="noopener noreferrer">
          <APBButton glow size="sm" className="font-mono text-xs uppercase tracking-wider">
            <ExternalLink className="w-4 h-4 mr-2" />
            Launch Host Display Screen ↗
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

      {/* Current Screen Telemetry Card */}
      <APBCard className="p-6 bg-gradient-to-r from-[var(--color-apb-surface)] via-black/40 to-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 font-mono">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">ACTIVE PRESENTATION STATE</div>
            <div className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
              <span>
                {activeMode === "AUTOMATIC" ? "AUTOMATIC EVENT SYNC" : activeMode}
              </span>
              {activeMode !== "AUTOMATIC" && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs uppercase font-bold">
                  MANUAL OVERRIDE
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Active Round: {currentRound ? `Round 0${currentRound.roundNumber} (${currentRound.title})` : "None"} • Layout: #{activeLayout}
            </div>
          </div>

          {activeMode !== "AUTOMATIC" && (
            <APBButton 
              variant="outline" 
              size="sm" 
              onClick={() => handleSetMode("AUTOMATIC")} 
              disabled={saving}
              className="font-mono text-xs border-white/20 text-white hover:bg-white/10"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Return to Auto Sync
            </APBButton>
          )}
        </div>
      </APBCard>

      {/* Section 16 & 17: Display Mode Controls */}
      <div className="space-y-4">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground font-bold">
          DISPLAY CONTENT MODES
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div 
            onClick={() => handleSetMode("AUTOMATIC")} 
            className={`cursor-pointer transition-all rounded-xl p-5 border font-mono ${
              activeMode === "AUTOMATIC" 
                ? "bg-[var(--color-apb-cyan)]/15 border-[var(--color-apb-cyan)] text-white shadow-lg shadow-cyan-950/40" 
                : "bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] text-muted-foreground hover:border-white/20"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-white font-bold text-sm uppercase">
                <Radio className="w-4 h-4 text-[var(--color-apb-cyan)]" />
                <span>Auto Event Sync</span>
              </div>
              {activeMode === "AUTOMATIC" && <Check className="w-4 h-4 text-[var(--color-apb-cyan)]" />}
            </div>
            <p className="text-xs text-muted-foreground">
              Follows live round, 5s countdown, active stage, and constraint reveal automatically.
            </p>
          </div>

          <div 
            onClick={() => handleSetMode("LEADERBOARD")} 
            className={`cursor-pointer transition-all rounded-xl p-5 border font-mono ${
              activeMode === "LEADERBOARD" 
                ? "bg-yellow-500/15 border-yellow-500 text-white shadow-lg shadow-yellow-950/40" 
                : "bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] text-muted-foreground hover:border-white/20"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-yellow-300 font-bold text-sm uppercase">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span>Show Leaderboard</span>
              </div>
              {activeMode === "LEADERBOARD" && <Check className="w-4 h-4 text-yellow-400" />}
            </div>
            <p className="text-xs text-muted-foreground">
              Pushes official standings and scores to the host display for the audience.
            </p>
          </div>

          <div 
            onClick={() => handleSetMode("WAITING")} 
            className={`cursor-pointer transition-all rounded-xl p-5 border font-mono ${
              activeMode === "WAITING" 
                ? "bg-purple-500/15 border-purple-500 text-white shadow-lg shadow-purple-950/40" 
                : "bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] text-muted-foreground hover:border-white/20"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-sm uppercase">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Show Waiting Screen</span>
              </div>
              {activeMode === "WAITING" && <Check className="w-4 h-4 text-purple-400" />}
            </div>
            <p className="text-xs text-muted-foreground">
              Presents "Next Round Starting Soon • Standby for Instructions" screen.
            </p>
          </div>

          <div 
            onClick={() => handleSetMode("LIVE_ROUND")} 
            className={`cursor-pointer transition-all rounded-xl p-5 border font-mono ${
              activeMode === "LIVE_ROUND" 
                ? "bg-emerald-500/15 border-emerald-500 text-white shadow-lg shadow-emerald-950/40" 
                : "bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] text-muted-foreground hover:border-white/20"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm uppercase">
                <Flame className="w-4 h-4 text-emerald-400" />
                <span>Show Live Round</span>
              </div>
              {activeMode === "LIVE_ROUND" && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
            <p className="text-xs text-muted-foreground">
              Forces display back to active live round statements and timer.
            </p>
          </div>
        </div>
      </div>

      {/* Section 22: 10 Display Layouts System */}
      <div className="space-y-4">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground font-bold flex items-center justify-between">
          <span>DISPLAY LAYOUT PRESETS (10 LAYOUT SYSTEM)</span>
          <span className="text-[var(--color-apb-cyan)] font-normal">Active: Layout {activeLayout}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 font-mono">
          {DISPLAY_LAYOUTS.map((layout) => {
            const isSelected = activeLayout === layout.id;

            return (
              <div
                key={layout.id}
                onClick={() => handleSetLayout(layout.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                  isSelected
                    ? "bg-[var(--color-apb-cyan)]/15 border-[var(--color-apb-cyan)] text-white shadow-md shadow-cyan-950/30 ring-1 ring-[var(--color-apb-cyan)]/40"
                    : "bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] text-muted-foreground hover:border-white/20 hover:text-white"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      #{String(layout.id).padStart(2, "0")}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[var(--color-apb-cyan)]" />}
                  </div>
                  <div className="text-sm font-bold text-white uppercase">{layout.name}</div>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                    {layout.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                  <span>{isSelected ? "ACTIVE" : "CLICK TO APPLY"}</span>
                  <span>→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
