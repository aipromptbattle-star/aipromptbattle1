
"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { APBButton } from "./APBButton";
import { useDraft } from "@/lib/firebase/drafts";
import { ParticipantScreenMode, Round } from "@/lib/firebase/schema";
import { doc, updateDoc, deleteDoc, addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Lock, Unlock, Clock, ShieldAlert, MonitorPlay, MessageSquare, AlertTriangle, Eye } from "lucide-react";
import { APBCard } from "./APBCard";

interface LiveParticipantViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string | null;
  eventId: string;
  round: Round | null;
  globalScreenState?: ParticipantScreenMode | null;
  teamOverrideMode?: ParticipantScreenMode | null;
  isOnline?: boolean;
}

export function LiveParticipantViewModal({
  open,
  onOpenChange,
  teamId,
  eventId,
  round,
  globalScreenState,
  teamOverrideMode,
  isOnline = false,
}: LiveParticipantViewModalProps) {
  const { draft } = useDraft(eventId, teamId || "", round?.id || "");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ mode: ParticipantScreenMode | "RESUME"; title: string; desc: string; danger?: boolean } | null>(null);

  const currentMode = teamOverrideMode || globalScreenState || "NORMAL";

  const handleUpdateOverride = async (mode: ParticipantScreenMode | "RESUME") => {
    if (!teamId || !round) return;
    try {
      if (mode === "RESUME") {
        await updateDoc(doc(db, `events/${eventId}/teamsRoundState/${teamId}_${round.id}`), {
          overrideScreenMode: null,
          updatedAt: Date.now(),
        });
      } else {
        await updateDoc(doc(db, `events/${eventId}/teamsRoundState/${teamId}_${round.id}`), {
          overrideScreenMode: mode,
          updatedAt: Date.now(),
        });
      }
      await addDoc(collection(db, "auditLogs"), { action: "TEAM_SCREEN_OVERRIDE", mode, teamId, eventId, timestamp: Date.now() });
      setConfirmDialogOpen(false);
    } catch (e) {
      console.error("Failed to update override:", e);
    }
  };

  const confirmAction = (mode: ParticipantScreenMode | "RESUME", title: string, desc: string, danger?: boolean) => {
    setPendingAction({ mode, title, desc, danger });
    setConfirmDialogOpen(true);
  };

  if (!teamId || !round) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] w-[95vw] h-[90vh] flex flex-col border-[var(--color-apb-cyan)]/30 bg-background/95 backdrop-blur-xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-[var(--color-apb-surface-border)] shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="font-mono text-xl text-[var(--color-apb-cyan)] tracking-widest uppercase flex items-center gap-3">
                <MonitorPlay className="w-5 h-5" />
                Live Participant View: {teamId}
              </DialogTitle>
              <div className="flex items-center gap-4 mt-3">
                <span className={`text-xs font-mono px-2 py-1 rounded ${isOnline ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                  ● {isOnline ? "ONLINE" : "OFFLINE"}
                </span>
                <span className="text-xs font-mono text-slate-400">ROUND {round.roundNumber}</span>
                <span className="text-xs font-mono text-slate-400">
                  SCREEN STATE: <span className={teamOverrideMode ? "text-yellow-400" : "text-white"}>{currentMode}</span>
                  {teamOverrideMode && " (OVERRIDE)"}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <APBButton 
                size="sm" 
                variant="outline" 
                className="border-yellow-500/50 hover:bg-yellow-500/10"
                onClick={() => confirmAction("LOCKED", "LOCK TEAM?", `Lock workspace for ${teamId}?`)}
              >
                <Lock className="w-4 h-4 mr-2 text-yellow-500" />
                LOCK
              </APBButton>
              
              <APBButton 
                size="sm" 
                variant="outline"
                className="border-[var(--color-apb-cyan)]/50 hover:bg-[var(--color-apb-cyan)]/10"
                onClick={() => confirmAction("WAITING", "FORCE WAITING?", `Force ${teamId} into WAITING screen?`)}
              >
                <Clock className="w-4 h-4 mr-2 text-[var(--color-apb-cyan)]" />
                WAITING
              </APBButton>
              
              <APBButton 
                size="sm" 
                glow 
                onClick={() => confirmAction("RESUME", "RESUME TEAM?", `Clear override and resume ${teamId} to global state?`)}
              >
                <Unlock className="w-4 h-4 mr-2" />
                RESUME
              </APBButton>
            </div>
          </div>
        </DialogHeader>

        {/* Read Only Workspace Preview */}
        <div className="flex-1 overflow-y-auto bg-black/60 p-6 relative">
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-black/80 text-yellow-500 border border-yellow-500/30 px-3 py-1.5 rounded text-xs font-mono">
            <Eye className="w-4 h-4" /> READ ONLY
          </div>
          
          <APBCard className="min-h-full p-6 border-dashed border-slate-700 pointer-events-none opacity-80">
            {round.templateType === "QUIZ" ? (
              <div>
                <h3 className="font-mono text-lg mb-4 text-white">Quiz Draft</h3>
                <p className="text-slate-400 font-mono mb-6">Answered: {Object.keys(draft?.quizAnswers || {}).length} / {round.quizQuestions?.length || 20}</p>
                <div className="grid grid-cols-5 gap-2">
                  {round.quizQuestions?.map(q => {
                    const ans = draft?.quizAnswers?.[q.id];
                    return (
                      <div key={q.id} className={`p-2 text-center text-xs font-mono rounded border ${ans ? "border-green-500/50 bg-green-500/10 text-green-400" : "border-slate-700 bg-slate-800/50 text-slate-500"}`}>
                        Q{q.id.toString().padStart(2, "0")} {ans && `: ${ans}`}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-mono text-lg mb-4 text-white">Workspace Draft</h3>
                <div className="space-y-4">
                  <div className="bg-background/50 p-4 rounded border border-[var(--color-apb-surface-border)]">
                    <h4 className="text-xs font-mono text-slate-400 mb-2">PROMPT</h4>
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">
                      {draft?.prompt || "No prompt written yet..."}
                    </pre>
                  </div>
                  {draft?.member2Data?.imageUrl && (
                    <div className="bg-background/50 p-4 rounded border border-[var(--color-apb-surface-border)]">
                      <h4 className="text-xs font-mono text-slate-400 mb-2">GENERATED IMAGE</h4>
                      <img src={draft.member2Data.imageUrl} alt="Draft" className="max-w-md rounded" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </APBCard>
        </div>
      </DialogContent>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[400px] border-[var(--color-apb-cyan)]/30 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className={`font-mono tracking-widest uppercase ${pendingAction?.danger ? "text-red-500" : "text-yellow-500"}`}>
              {pendingAction?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 whitespace-pre-line text-sm text-slate-300 font-sans">
            {pendingAction?.desc}
          </div>
          <DialogFooter>
            <APBButton variant="ghost" onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </APBButton>
            <APBButton 
              variant={pendingAction?.danger ? "destructive" : "default"} 
              glow={!pendingAction?.danger}
              onClick={() => pendingAction && handleUpdateOverride(pendingAction.mode)}
            >
              CONFIRM
            </APBButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

