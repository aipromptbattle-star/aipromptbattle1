
import fs from "fs";

const content = `"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { APBCard } from "@/components/apb/APBCard";
import { APBButton } from "@/components/apb/APBButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEventState, updateEventSettings } from "@/lib/firebase/events";
import { DisplayMode, DisplayBoardState, PresentationTemplate } from "@/lib/firebase/schema";
import { Monitor, ExternalLink, Play, Lock, AlertTriangle, Copy, Info, CheckCircle2, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// Note: We use an iframe or a simplified renderer for preview. For a real preview, we should render PublicHostDisplay inside an iframe or scaled container.

const modes: { id: DisplayMode; label: string }[] = [
  { id: "AUTOMATIC", label: "AUTO" },
  { id: "WAITING", label: "WAITING" },
  { id: "EVENT_STATUS", label: "ROUND INTRO" },
  { id: "LIVE_ROUND", label: "LIVE ROUND" },
  { id: "LEADERBOARD", label: "LEADERBOARD" },
  { id: "TEXT", label: "CUSTOM TEXT" },
  { id: "IMAGE", label: "CUSTOM IMAGE" },
  { id: "PARTICIPANT_SYNC", label: "PARTICIPANT SYNC" },
];

export default function OrganizerDisplayControl() {
  const { eventState } = useEventState();
  const boardState = eventState?.displayBoardState || {
    mode: "AUTOMATIC",
    updatedAt: Date.now()
  } as DisplayBoardState;

  const [selectedMode, setSelectedMode] = useState<DisplayMode>("AUTOMATIC");
  
  const [draftHeading, setDraftHeading] = useState("");
  const [draftSubheading, setDraftSubheading] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [draftImageUrl, setDraftImageUrl] = useState("");

  // Load template when selectedMode changes
  useEffect(() => {
    if (selectedMode === "AUTOMATIC") {
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
  }, [selectedMode, boardState.templates]);

  const saveTemplate = async () => {
    if (selectedMode === "AUTOMATIC") return;
    try {
      const newTemplate: PresentationTemplate = {
        heading: draftHeading,
        subheading: draftSubheading,
        body: draftBody,
        imageUrl: draftImageUrl
      };
      
      const newTemplates = { ...(boardState.templates || {}) };
      newTemplates[selectedMode] = newTemplate;
      
      await updateEventSettings({
        displayBoardState: {
          ...boardState,
          templates: newTemplates,
          updatedAt: Date.now()
        }
      });
      toast.success(\`\${selectedMode} template saved\`);
    } catch (e: any) {
      toast.error(e.message || "Failed to save template");
    }
  };

  const showOnDisplay = async () => {
    try {
      const newTemplate: PresentationTemplate = {
        heading: draftHeading,
        subheading: draftSubheading,
        body: draftBody,
        imageUrl: draftImageUrl
      };
      
      // Auto-save the template as well
      const newTemplates = { ...(boardState.templates || {}) };
      newTemplates[selectedMode] = newTemplate;

      await updateEventSettings({
        displayOverride: selectedMode,
        displayBoardState: {
          mode: selectedMode,
          activeTemplate: selectedMode === "AUTOMATIC" ? undefined : newTemplate,
          templates: newTemplates,
          updatedAt: Date.now()
        }
      });
      toast.success(\`Active mode set to \${selectedMode}\`);
    } catch (e: any) {
      toast.error(e.message || "Failed to update display");
    }
  };

  const returnToAuto = async () => {
    try {
      await updateEventSettings({
        displayOverride: "AUTOMATIC",
        displayBoardState: {
          ...boardState,
          mode: "AUTOMATIC",
          activeTemplate: undefined,
          updatedAt: Date.now()
        }
      });
      toast.success("Returned to AUTO mode");
    } catch (e: any) {
      toast.error(e.message || "Failed to return to auto");
    }
  };

  const isEditingActiveState = selectedMode === boardState.mode;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full pb-10">
      
      {/* Controls Column */}
      <div className="xl:col-span-7 space-y-6">
        <APBCard className="p-6">
          <h2 className="text-xl font-mono font-bold uppercase tracking-widest text-white mb-6 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-[var(--color-apb-cyan)]" />
            Display Board Controls
          </h2>

          <div className="flex items-center gap-4 mb-8">
            <Label className="font-mono text-sm uppercase text-slate-400 shrink-0">STATE:</Label>
            <Select value={selectedMode} onValueChange={(val) => setSelectedMode(val as DisplayMode)}>
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

          {selectedMode !== "AUTOMATIC" && (
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

              {selectedMode !== "IMAGE" && (
                <div className="space-y-1.5">
                  <Label>Body Text</Label>
                  <Textarea 
                    value={draftBody} 
                    onChange={e => setDraftBody(e.target.value)} 
                    placeholder="Main content body..."
                    className="font-mono text-sm min-h-[120px]"
                  />
                </div>
              )}
              
              {(selectedMode === "IMAGE" || selectedMode === "TEXT") && (
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

              <div className="pt-4 flex flex-wrap gap-3">
                <APBButton variant="outline" onClick={saveTemplate}>
                  SAVE TEMPLATE
                </APBButton>
                <APBButton glow onClick={showOnDisplay}>
                  SHOW ON DISPLAY
                </APBButton>
              </div>
            </div>
          )}

          {selectedMode === "AUTOMATIC" && (
            <div className="py-8 text-center text-slate-400 font-mono text-sm">
              <p>The public display is following the authoritative event state automatically.</p>
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
              Live Display Preview
            </h2>
            <div className="flex gap-2">
              <APBButton variant="outline" size="sm" className="h-7 text-[10px]" onClick={returnToAuto}>
                RETURN TO AUTO
              </APBButton>
            </div>
          </div>
          
          <div className="relative w-full aspect-video bg-black rounded-lg border border-[var(--color-apb-surface-border)] overflow-hidden shadow-2xl flex items-center justify-center">
            {/* Realtime Iframe preview to guarantee exact renderer matching */}
            <iframe
               src="/display?preview=true"
               className="w-[200%] h-[200%] origin-top-left"
               style={{ transform: "scale(0.5)", pointerEvents: "none" }}
            />
          </div>

          <div className="mt-6 pt-6 border-t border-[var(--color-apb-surface-border)] flex items-center justify-between">
            <div>
              <h3 className="font-mono text-sm uppercase text-white tracking-widest mb-1 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-[var(--color-apb-cyan)]" />
                Public Display Screen
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Launch the display screen on an external monitor.
              </p>
            </div>
            <Link href="/display" target="_blank">
              <APBButton className="bg-[var(--color-apb-surface-border)] hover:bg-slate-700 text-white border border-slate-600">
                OPEN
              </APBButton>
            </Link>
          </div>
        </APBCard>
      </div>

    </div>
  );
}
`;

fs.writeFileSync("src/app/organizer/display/page.tsx", content);
console.log("Updated Display Config");

