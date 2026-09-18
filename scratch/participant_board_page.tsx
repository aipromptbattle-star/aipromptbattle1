
"use client";

import React, { useState, useEffect } from "react";
import { APBCard } from "@/components/apb/APBCard";
import { APBButton } from "@/components/apb/APBButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEventState, updateEventSettings } from "@/lib/firebase/events";
import { ParticipantScreenMode, ParticipantScreenState } from "@/lib/firebase/schema";
import { ParticipantScreenOverlay } from "@/components/apb/ParticipantScreenOverlay";
import { Terminal, Play, Lock, AlertTriangle, Monitor, Copy, Info, CheckCircle2, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";

export default function ParticipantBoardPage() {
  const { eventState } = useEventState();
  const boardState = eventState?.participantScreenState || {
    globalScreenMode: "AUTO",
    updatedAt: Date.now()
  };

  const currentMode = boardState.globalScreenMode;

  const [draftHeading, setDraftHeading] = useState("");
  const [draftSubheading, setDraftSubheading] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftImageUrl, setDraftImageUrl] = useState("");
  const [draftCountdownSeconds, setDraftCountdownSeconds] = useState("10");

  useEffect(() => {
    setDraftHeading(boardState.heading || "");
    setDraftSubheading(boardState.subheading || "");
    setDraftBody(boardState.body || "");
    setDraftImageUrl(boardState.imageUrl || "");
  }, [boardState.globalScreenMode]); // Reset drafts when mode changes externally

  const handleUpdate = async (mode: ParticipantScreenMode, overrides: Partial<ParticipantScreenState> = {}) => {
    try {
      const newState: ParticipantScreenState = {
        globalScreenMode: mode,
        heading: overrides.heading !== undefined ? overrides.heading : draftHeading,
        subheading: overrides.subheading !== undefined ? overrides.subheading : draftSubheading,
        body: overrides.body !== undefined ? overrides.body : draftBody,
        imageUrl: overrides.imageUrl !== undefined ? overrides.imageUrl : draftImageUrl,
        countdownEndsAt: overrides.countdownEndsAt || boardState.countdownEndsAt,
        targetRoundId: eventState?.currentRoundId || null,
        updatedAt: Date.now()
      };
      await updateEventSettings({ participantScreenState: newState });
      toast.success(`Participant Board set to ${mode}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to update board");
    }
  };

  const startCountdown = async () => {
    const secs = parseInt(draftCountdownSeconds) || 10;
    handleUpdate("COUNTDOWN", {
      heading: draftHeading || "STARTING IN",
      countdownEndsAt: Date.now() + (secs * 1000)
    });
  };

  const syncToDisplay = async () => {
    try {
      await updateEventSettings({
        displayOverride: "PARTICIPANT_SYNC",
        displayHeading: boardState.heading,
        displaySubheading: boardState.subheading,
        displayBody: boardState.body,
        displayImageUrl: boardState.imageUrl,
      });
      toast.success("Synced to Public Display");
    } catch (e: any) {
      toast.error(e.message || "Failed to sync to display");
    }
  };

  const modes = [
    { id: "AUTO", label: "AUTO / LIVE", icon: Play, desc: "Follow authoritative event state" },
    { id: "RULES", label: "RULES", icon: LayoutTemplate, desc: "Display event rules" },
    { id: "ROUND_INTRO", label: "ROUND INTRO", icon: Info, desc: "Intro screen for next round" },
    { id: "COUNTDOWN", label: "COUNTDOWN", icon: Clock, desc: "Generic countdown overlay" },
    { id: "ANNOUNCEMENT", label: "ANNOUNCEMENT", icon: Terminal, desc: "Broadcast a message" },
    { id: "CONSTRAINT_REVEAL", label: "CONSTRAINT", icon: AlertTriangle, desc: "Reveal current round constraint" },
    { id: "PAUSED", label: "PAUSED", icon: AlertTriangle, desc: "Pause screen" },
    { id: "ROUND_COMPLETE", label: "COMPLETED", icon: CheckCircle2, desc: "Round over screen" },
    { id: "LOCKED", label: "LOCKED", icon: Lock, desc: "Lock participant workspace" },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full pb-10">
      
      {/* Controls Column */}
      <div className="xl:col-span-7 space-y-6">
        <APBCard className="p-6">
          <h2 className="text-xl font-mono font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-[var(--color-apb-cyan)]" />
            Participant Board Controls
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
            {modes.map(m => {
              const Icon = m.icon;
              const isActive = currentMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    if (m.id === "AUTO") handleUpdate("AUTO", { heading: "", subheading: "", body: "", imageUrl: "" });
                    else handleUpdate(m.id as ParticipantScreenMode);
                  }}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border font-mono text-xs uppercase tracking-wider transition-all
                    ${isActive 
                      ? "bg-[var(--color-apb-cyan)]/20 border-[var(--color-apb-cyan)] text-[var(--color-apb-cyan)]" 
                      : "bg-black/40 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-500 hover:text-white"
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  {m.label}
                </button>
              )
            })}
          </div>

          <div className="space-y-4">
            <h3 className="font-mono text-sm uppercase text-slate-400 tracking-widest border-b border-slate-700 pb-2">Content Editor</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Heading</Label>
                <Input 
                  value={draftHeading} 
                  onChange={e => setDraftHeading(e.target.value)} 
                  placeholder="e.g. EVENT RULES"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Subheading</Label>
                <Input 
                  value={draftSubheading} 
                  onChange={e => setDraftSubheading(e.target.value)} 
                  placeholder="Optional subheading"
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Body Text</Label>
              <Textarea 
                value={draftBody} 
                onChange={e => setDraftBody(e.target.value)} 
                placeholder="Main content body..."
                className="font-mono text-sm min-h-[120px]"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label>Image URL (Optional)</Label>
              <Input 
                value={draftImageUrl} 
                onChange={e => setDraftImageUrl(e.target.value)} 
                placeholder="https://..."
                className="font-mono text-sm"
              />
            </div>

            {currentMode === "COUNTDOWN" && (
              <div className="space-y-1.5 pt-2">
                <Label>Countdown Duration (Seconds)</Label>
                <div className="flex items-center gap-3">
                  <Input 
                    type="number"
                    value={draftCountdownSeconds} 
                    onChange={e => setDraftCountdownSeconds(e.target.value)} 
                    className="font-mono text-sm max-w-[150px]"
                  />
                  <APBButton onClick={startCountdown} variant="outline" className="h-10">Start Sync Countdown</APBButton>
                </div>
              </div>
            )}

            <div className="pt-4 flex gap-3">
              <APBButton glow onClick={() => handleUpdate(currentMode as ParticipantScreenMode)}>
                Update Active State
              </APBButton>
              <APBButton variant="outline" onClick={() => handleUpdate("AUTO", { heading: "", subheading: "", body: "", imageUrl: "" })}>
                Return to Auto
              </APBButton>
            </div>

          </div>
        </APBCard>
      </div>

      {/* Preview Column */}
      <div className="xl:col-span-5 space-y-6">
        <APBCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-mono font-bold uppercase tracking-widest text-white flex items-center gap-2">
              <Monitor className="w-5 h-5 text-emerald-400" />
              Live Participant Preview
            </h2>
            <div className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-mono tracking-widest rounded border border-emerald-500/30">
              ACTIVE
            </div>
          </div>
          
          <div className="relative w-full aspect-video bg-black rounded-lg border border-[var(--color-apb-surface-border)] overflow-hidden shadow-2xl">
            <div className="absolute inset-0 pointer-events-none origin-top-left" style={{ transform: "scale(0.5)", width: "200%", height: "200%" }}>
              <ParticipantScreenOverlay
                globalScreenMode={boardState.globalScreenMode}
                boardState={boardState}
              >
                <div className="w-full h-full p-8 flex items-center justify-center opacity-30">
                  <div className="w-full h-full max-w-4xl border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center text-slate-600 font-mono text-4xl">
                    PARTICIPANT WORKSPACE
                  </div>
                </div>
              </ParticipantScreenOverlay>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-[var(--color-apb-surface-border)]">
            <h3 className="font-mono text-sm uppercase text-white tracking-widest mb-4 flex items-center gap-2">
              <Copy className="w-4 h-4 text-[var(--color-apb-cyan)]" />
              Display Sync
            </h3>
            <p className="text-xs text-slate-400 font-mono mb-4">
              Push the current participant board state to the public display (/display). They remain independent after syncing.
            </p>
            <APBButton onClick={syncToDisplay} className="w-full bg-[var(--color-apb-surface-border)] hover:bg-slate-700 text-white border border-slate-600">
              SYNC TO DISPLAY
            </APBButton>
          </div>
        </APBCard>
      </div>

    </div>
  );
}

