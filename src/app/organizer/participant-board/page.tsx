"use client";

import React, { useState, useEffect } from "react";
import { APBCard } from "@/components/apb/APBCard";
import { APBButton } from "@/components/apb/APBButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useEventState, updateEventSettings } from "@/lib/firebase/events";
import { ParticipantScreenMode, ParticipantBoardState, PresentationTemplate } from "@/lib/firebase/schema";
import { ParticipantScreenOverlay } from "@/components/apb/ParticipantScreenOverlay";
import { Terminal, Play, Lock, AlertTriangle, Monitor, Copy, Info, CheckCircle2, LayoutTemplate } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Simple toast helper - uses browser notification
function showToast(msg: string, type: "success" | "error" = "success") {
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.cssText = `position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 20px;border-radius:8px;font-family:monospace;font-size:13px;color:#fff;background:${type === "success" ? "#059669" : "#dc2626"};border:1px solid ${type === "success" ? "#10b981" : "#ef4444"};box-shadow:0 4px 20px #0004;transition:opacity .3s`;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; setTimeout(() => el.remove(), 300); }, 3000);
}
const toast = { success: (m: string) => showToast(m, "success"), error: (m: string) => showToast(m, "error") };

const modes: { id: ParticipantScreenMode; label: string }[] = [
  { id: "AUTO", label: "AUTO / LIVE" },
  { id: "RULES", label: "RULES" },
  { id: "ROUND_INTRO", label: "ROUND INTRO" },
  { id: "COUNTDOWN", label: "COUNTDOWN" },
  { id: "ANNOUNCEMENT", label: "ANNOUNCEMENT" },
  { id: "CONSTRAINT_REVEAL", label: "CONSTRAINT REVEAL" },
  { id: "PAUSED", label: "PAUSED" },
  { id: "ROUND_COMPLETE", label: "ROUND COMPLETE" },
  { id: "LOCKED", label: "LOCKED" },
];

export default function ParticipantBoardPage() {
  const { eventState } = useEventState();
  const boardState = eventState?.participantScreenState || {
    globalScreenMode: "AUTO",
    updatedAt: Date.now()
  } as ParticipantBoardState;

  const [selectedMode, setSelectedMode] = useState<ParticipantScreenMode>("AUTO");
  
  const [draftHeading, setDraftHeading] = useState("");
  const [draftSubheading, setDraftSubheading] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftImageUrl, setDraftImageUrl] = useState("");
  const [draftDuration, setDraftDuration] = useState("5");

  // Load template when selectedMode changes
  useEffect(() => {
    if (selectedMode === "AUTO") {
      setDraftHeading("");
      setDraftSubheading("");
      setDraftBody("");
      setDraftImageUrl("");
      return;
    }
    const t = boardState.templates?.[selectedMode];
    setDraftHeading(t?.heading || "");
    setDraftSubheading(t?.subheading || "");
    setDraftBody(t?.body || "");
    setDraftImageUrl(t?.imageUrl || "");
    setDraftDuration(t?.durationSeconds?.toString() || (selectedMode === "COUNTDOWN" ? "5" : ""));
  }, [selectedMode, boardState.templates]);

  const saveTemplate = async () => {
    if (selectedMode === "AUTO") return;
    try {
      const newTemplate: PresentationTemplate = {
        heading: draftHeading,
        subheading: draftSubheading,
        body: draftBody,
        imageUrl: draftImageUrl,
        durationSeconds: parseInt(draftDuration) || undefined
      };
      
      const newTemplates = { ...(boardState.templates || {}) };
      newTemplates[selectedMode] = newTemplate;
      
      await updateEventSettings({
        participantScreenState: {
          ...boardState,
          templates: newTemplates,
          updatedAt: Date.now()
        }
      });
      toast.success(`${selectedMode} template saved`);
    } catch (e: any) {
      toast.error(e.message || "Failed to save template");
    }
  };

  const showOnParticipants = async () => {
    try {
      const newTemplate: PresentationTemplate = {
        heading: draftHeading,
        subheading: draftSubheading,
        body: draftBody,
        imageUrl: draftImageUrl,
        durationSeconds: parseInt(draftDuration) || undefined
      };
      
      // Auto-save the template as well
      const newTemplates = { ...(boardState.templates || {}) };
      newTemplates[selectedMode] = newTemplate;

      await updateEventSettings({
        participantScreenState: {
          globalScreenMode: selectedMode,
          activeTemplate: selectedMode === "AUTO" ? undefined : newTemplate,
          templates: newTemplates,
          updatedAt: Date.now()
        }
      });
      toast.success(`Active mode set to ${selectedMode}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to update participants");
    }
  };

  const startCountdown = async () => {
    try {
      const d = parseInt(draftDuration) || 5;
      await updateEventSettings({
        globalCountdown: {
          active: true,
          startedAt: Date.now(),
          endsAt: Date.now() + d * 1000,
          durationSeconds: d,
          heading: draftHeading,
          subheading: draftSubheading,
          updatedAt: Date.now()
        }
      });
      toast.success("Countdown started!");
    } catch (e: any) {
      toast.error(e.message || "Failed to start countdown");
    }
  };

  const syncToDisplay = async () => {
    try {
      await updateEventSettings({
        displayOverride: "PARTICIPANT_SYNC" as any,
        displayHeading: draftHeading || undefined,
        displaySubheading: draftSubheading || undefined,
        displayBody: draftBody || undefined,
        displayImageUrl: draftImageUrl || undefined,
        displayBoardState: {
          mode: "PARTICIPANT_SYNC" as any,
          activeTemplate: {
            heading: draftHeading,
            subheading: draftSubheading,
            body: draftBody,
            imageUrl: draftImageUrl,
          },
          updatedAt: Date.now()
        }
      });
      toast.success("Synced to Public Display");
    } catch (e: any) {
      toast.error(e.message || "Failed to sync to display");
    }
  };

  const returnToAuto = async () => {
    try {
      await updateEventSettings({
        participantScreenState: {
          ...boardState,
          globalScreenMode: "AUTO",
          activeTemplate: undefined,
          updatedAt: Date.now()
        }
      });
      toast.success("Returned to AUTO mode");
    } catch (e: any) {
      toast.error(e.message || "Failed to return to auto");
    }
  };

  const isEditingActiveState = selectedMode === boardState.globalScreenMode;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full pb-10">
      
      {/* Controls Column */}
      <div className="xl:col-span-7 space-y-6">
        <APBCard className="p-6">
          <h2 className="text-xl font-mono font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-[var(--color-apb-cyan)]" />
            Participant Board Controls
          </h2>

          <div className="flex items-center gap-4 mb-8">
            <Label className="font-mono text-sm uppercase text-slate-400 shrink-0">STATE:</Label>
            <Select value={selectedMode} onValueChange={(val) => setSelectedMode(val as ParticipantScreenMode)}>
              <SelectTrigger className="w-64 font-mono">
                <SelectValue placeholder="Select State" />
              </SelectTrigger>
              <SelectContent>
                {modes.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isEditingActiveState && (
              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-mono rounded border border-emerald-500/30 ml-auto">
                CURRENTLY ACTIVE
              </span>
            )}
          </div>

          {selectedMode !== "AUTO" && (
            <div className="space-y-4">
              <h3 className="font-mono text-sm uppercase text-slate-400 tracking-widest border-b border-slate-700 pb-2">
                {selectedMode.replace("_", " ")} TEMPLATE
              </h3>
              
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

              {selectedMode !== "COUNTDOWN" && (
                <div className="space-y-1.5">
                  <Label>Body Text</Label>
                  <textarea 
                    value={draftBody} 
                    onChange={e => setDraftBody(e.target.value)} 
                    placeholder="Main content body..."
                    className="font-mono text-sm min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              )}
              
              {selectedMode !== "COUNTDOWN" && (
                <div className="space-y-1.5">
                  <Label>Image URL (Optional)</Label>
                  <Input 
                    value={draftImageUrl} 
                    onChange={e => setDraftImageUrl(e.target.value)} 
                    placeholder="https://..."
                    className="font-mono text-sm"
                  />
                </div>
              )}

              {selectedMode === "COUNTDOWN" && (
                <div className="space-y-1.5 pt-2">
                  <Label>Countdown Duration (Seconds)</Label>
                  <div className="flex items-center gap-3">
                    <Input 
                      type="number"
                      value={draftDuration} 
                      onChange={e => setDraftDuration(e.target.value)} 
                      className="font-mono text-sm max-w-[150px]"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 flex flex-wrap gap-3">
                <APBButton variant="outline" onClick={saveTemplate}>
                  SAVE TEMPLATE
                </APBButton>
                {selectedMode === "COUNTDOWN" ? (
                  <>
                    <APBButton variant="outline" onClick={showOnParticipants}>
                      PREVIEW COUNTDOWN
                    </APBButton>
                    <APBButton glow onClick={startCountdown}>
                      START COUNTDOWN
                    </APBButton>
                  </>
                ) : (
                  <APBButton glow onClick={showOnParticipants}>
                    SHOW ON PARTICIPANTS
                  </APBButton>
                )}
                
              </div>
            </div>
          )}

          {selectedMode === "AUTO" && (
            <div className="py-8 text-center text-slate-400 font-mono text-sm">
              <p>Participants are following the authoritative event state automatically.</p>
              <p className="mt-2 text-xs">No manual template to edit.</p>
            </div>
          )}

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
            <div className="flex gap-2">
              <APBButton variant="outline" size="sm" className="h-7 text-[10px]" onClick={returnToAuto}>
                RETURN TO AUTO
              </APBButton>
            </div>
          </div>
          
          <div className="relative w-full aspect-video bg-black rounded-lg border border-[var(--color-apb-surface-border)] overflow-hidden shadow-2xl">
            <div className="absolute inset-0 pointer-events-none origin-top-left" style={{ transform: "scale(0.5)", width: "200%", height: "200%" }}>
              {/* Note: This simulates the view using ParticipantScreenOverlay. 
                  We pass a mocked boardState consisting of the draft so they can preview it before showing! */}
              <ParticipantScreenOverlay
                globalScreenMode={selectedMode}
                boardState={{
                  globalScreenMode: selectedMode,
                  activeTemplate: {
                    heading: draftHeading,
                    subheading: draftSubheading,
                    body: draftBody,
                    imageUrl: draftImageUrl,
                    durationSeconds: parseInt(draftDuration)
                  },
                  updatedAt: Date.now()
                }}
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
              Push the currently previewed template to the public display (/display). They remain independent after syncing.
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
