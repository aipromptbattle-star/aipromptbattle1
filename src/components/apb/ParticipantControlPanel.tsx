
"use client";

import React, { useState } from "react";
import { APBCard } from "./APBCard";
import { APBButton } from "./APBButton";
import { BroadcastMessageDialog } from "./BroadcastMessageDialog";
import { ParticipantScreenMode, ParticipantScreenState } from "@/lib/firebase/schema";
import { Lock, Unlock, Clock, AlertTriangle, MessageSquare, Info } from "lucide-react";
import { doc, updateDoc, addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface ParticipantControlPanelProps {
  eventId: string;
  currentScreenState?: ParticipantScreenState;
  onlineCount: number;
}

export function ParticipantControlPanel({ eventId, currentScreenState, onlineCount }: ParticipantControlPanelProps) {
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ mode: ParticipantScreenMode; title: string; desc: string; danger?: boolean } | null>(null);

  const currentMode = currentScreenState?.globalScreenMode || "NORMAL";
  const hasActiveBroadcast = currentScreenState?.broadcastMessage && (!currentScreenState.broadcastMessage.expiresAt || currentScreenState.broadcastMessage.expiresAt > Date.now());

  const handleUpdateMode = async (mode: ParticipantScreenMode) => {
    try {
      await updateDoc(doc(db, `events/${eventId}/state/current`), {
        "participantScreenState.globalScreenMode": mode,
        "participantScreenState.updatedAt": Date.now(),
      });
      await addDoc(collection(db, "auditLogs"), { action: "SCREEN_MODE_CHANGED", mode, eventId, timestamp: Date.now() });
      setConfirmDialogOpen(false);
    } catch (e) {
      console.error("Failed to update screen mode:", e);
    }
  };

  const handleSendBroadcast = async (msg: { heading: string; message: string; expiresAt: number | null }) => {
    try {
      await updateDoc(doc(db, `events/${eventId}/state/current`), {
        "participantScreenState.broadcastMessage": msg,
        "participantScreenState.updatedAt": Date.now(),
      });
      await addDoc(collection(db, "auditLogs"), { action: "BROADCAST_SENT", heading: msg.heading, eventId, timestamp: Date.now() });
    } catch (e) {
      console.error("Failed to broadcast:", e);
    }
  };

  const handleDismissBroadcast = async () => {
    try {
      await updateDoc(doc(db, `events/${eventId}/state/current`), {
        "participantScreenState.broadcastMessage": null,
        "participantScreenState.updatedAt": Date.now(),
      });
    } catch (e) {
      console.error("Failed to dismiss broadcast:", e);
    }
  };

  const confirmAction = (mode: ParticipantScreenMode, title: string, desc: string, danger?: boolean) => {
    setPendingAction({ mode, title, desc, danger });
    setConfirmDialogOpen(true);
  };

  return (
    <>
      <APBCard glow className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-mono font-bold tracking-widest text-[var(--color-apb-cyan)] uppercase">
            Participant Control
          </h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${currentMode === "NORMAL" ? "bg-green-500" : "bg-yellow-500 animate-pulse"}`} />
            <span className="text-xs font-mono tracking-widest text-muted-foreground">
              {currentMode}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <APBButton
            variant="outline"
            className={`h-auto py-4 flex flex-col gap-2 ${currentMode === "WAITING" ? "border-[var(--color-apb-cyan)] text-[var(--color-apb-cyan)]" : ""}`}
            onClick={() => handleUpdateMode("WAITING")}
          >
            <Clock className="w-5 h-5" />
            <span className="text-xs tracking-widest">WAITING</span>
          </APBButton>

          <APBButton
            variant="outline"
            className={`h-auto py-4 flex flex-col gap-2 ${currentMode === "LOCKED" ? "border-yellow-500 text-yellow-500" : ""}`}
            onClick={() => confirmAction("LOCKED", "LOCK ALL PARTICIPANTS?", `Currently connected: ${onlineCount}\n\nThis will temporarily prevent participants from editing their workspace. Their drafts and saved work will be preserved.`)}
          >
            <Lock className="w-5 h-5" />
            <span className="text-xs tracking-widest">LOCK ALL</span>
          </APBButton>

          <APBButton
            variant="outline"
            className={`h-auto py-4 flex flex-col gap-2 ${currentMode === "NORMAL" ? "border-green-500 text-green-500" : ""}`}
            onClick={() => handleUpdateMode("NORMAL")}
          >
            <Unlock className="w-5 h-5" />
            <span className="text-xs tracking-widest">RESUME ALL</span>
          </APBButton>

          <APBButton
            variant="outline"
            className={`h-auto py-4 flex flex-col gap-2 ${currentMode === "EMERGENCY" ? "border-red-500 text-red-500" : ""}`}
            onClick={() => confirmAction("EMERGENCY", "EMERGENCY PAUSE", "This will immediately place all participant screens into emergency mode. Participant work will be preserved.", true)}
          >
            <AlertTriangle className="w-5 h-5" />
            <span className="text-xs tracking-widest">EMERGENCY</span>
          </APBButton>
        </div>

        <div className="mt-6 pt-6 border-t border-[var(--color-apb-surface-border)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-mono tracking-widest text-slate-300 uppercase mb-1">Broadcast</h3>
              {hasActiveBroadcast ? (
                <p className="text-xs text-[var(--color-apb-cyan)] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Active: "{currentScreenState!.broadcastMessage!.heading}"
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">No active announcements</p>
              )}
            </div>
            <div className="flex gap-3">
              {hasActiveBroadcast && (
                <APBButton variant="ghost" size="sm" onClick={handleDismissBroadcast}>
                  Dismiss
                </APBButton>
              )}
              <APBButton size="sm" onClick={() => setBroadcastOpen(true)}>
                <MessageSquare className="w-4 h-4 mr-2" />
                New Message
              </APBButton>
            </div>
          </div>
        </div>
      </APBCard>

      <BroadcastMessageDialog
        open={broadcastOpen}
        onOpenChange={setBroadcastOpen}
        onSend={handleSendBroadcast}
      />

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
              onClick={() => pendingAction && handleUpdateMode(pendingAction.mode)}
            >
              {pendingAction?.title.includes("?") ? pendingAction.title.replace("?", "") : "CONFIRM"}
            </APBButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

