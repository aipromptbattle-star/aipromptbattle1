"use client";

import { useState } from "react";
import { APBCard } from "@/components/apb/APBCard";
import { APBButton } from "@/components/apb/APBButton";
import { StatusBadge } from "@/components/apb/StatusBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmationDialog } from "@/components/apb/ConfirmationDialog";
import { EditRoundDialog } from "@/components/apb/EditRoundDialog";
import { useRounds, createRound } from "@/lib/firebase/rounds";
import { startRound, pauseRound, resumeRound, endRound, extendTime, reopenRound, resetRound } from "@/lib/firebase/events";
import { Round } from "@/lib/firebase/schema";
import { Loader2, Plus, Play, Pause, Square, TimerReset, Edit, RotateCcw, RefreshCw, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ConfirmAction = {
  title: string;
  description: string;
  confirmText: string;
  destructive: boolean;
  action: () => Promise<void>;
} | null;

export default function OrganizerRounds() {
  const { rounds, loading } = useRounds();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Edit round state
  const [editingRound, setEditingRound] = useState<Round | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Confirmation dialog state
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    roundNumber: 1,
    title: "",
    description: "",
    durationSeconds: 900,
    challengeType: "COMBINED" as "TEXT" | "IMAGE" | "COMBINED",
    challengeInstructions: "",
    referenceMaterial: "",
    constraintsStr: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const constraints = formData.constraintsStr
        ? formData.constraintsStr.split("\n").map(s => s.trim()).filter(Boolean)
        : [];
      await createRound({
        roundNumber: formData.roundNumber,
        title: formData.title,
        description: formData.description,
        durationSeconds: formData.durationSeconds,
        challengeType: formData.challengeType,
        challengeTitle: formData.title,
        challengeDescription: formData.description,
        challengeInstructions: formData.challengeInstructions,
        referenceMaterial: formData.referenceMaterial,
        constraints,
      });
      setOpen(false);
      setFormData({
        ...formData,
        roundNumber: formData.roundNumber + 1,
        title: "",
        description: "",
        challengeInstructions: "",
        referenceMaterial: "",
        constraintsStr: "",
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create round.");
    } finally {
      setCreating(false);
    }
  };

  const showConfirm = (action: ConfirmAction) => {
    setConfirmAction(action);
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      await confirmAction.action();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActionLoading(false);
      setConfirmOpen(false);
      setConfirmAction(null);
    }
  };

  const openEdit = (round: Round) => {
    setEditingRound(round);
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-mono font-bold uppercase tracking-wider text-white">Round Management</h2>
          <p className="text-muted-foreground">Configure challenges and event flow.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<APBButton />}>
            <Plus className="w-4 h-4 mr-2" />
            Create Round
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] text-white">
            <DialogHeader>
              <DialogTitle className="font-mono uppercase tracking-widest text-[var(--color-apb-cyan)]">New Round</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Round Number</Label>
                  <Input type="number" min={1} value={formData.roundNumber} onChange={e => setFormData({...formData, roundNumber: parseInt(e.target.value)})} required />
                </div>
                <div className="space-y-2">
                  <Label>Duration (seconds)</Label>
                  <Input type="number" min={60} value={formData.durationSeconds} onChange={e => setFormData({...formData, durationSeconds: parseInt(e.target.value)})} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Challenge Type</Label>
                <select
                  value={formData.challengeType}
                  onChange={e => setFormData({...formData, challengeType: e.target.value as "TEXT" | "IMAGE" | "COMBINED"})}
                  className="w-full bg-black/50 border border-[var(--color-apb-surface-border)] rounded-md px-3 py-2 text-sm text-white font-mono"
                >
                  <option value="COMBINED">COMBINED (Prompt + Image)</option>
                  <option value="IMAGE">IMAGE (Visual Creative)</option>
                  <option value="TEXT">TEXT (Prompt Only)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Instructions (Optional)</Label>
                <Input value={formData.challengeInstructions} onChange={e => setFormData({...formData, challengeInstructions: e.target.value})} placeholder="e.g. Generate a photorealistic cyberpunk street scene" />
              </div>
              <div className="space-y-2">
                <Label>Constraints (1 per line)</Label>
                <textarea
                  value={formData.constraintsStr}
                  onChange={e => setFormData({...formData, constraintsStr: e.target.value})}
                  placeholder="Must include neon rain&#10;No vehicles allowed"
                  rows={2}
                  className="w-full bg-black/50 border border-[var(--color-apb-surface-border)] rounded-md px-3 py-2 text-sm text-white font-mono resize-none"
                />
              </div>
              <APBButton type="submit" glow className="w-full mt-4" disabled={creating}>
                {creating ? "Creating..." : "Create Round"}
              </APBButton>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-apb-cyan)]" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {rounds.map(round => (
            <APBCard key={round.id} className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[var(--color-apb-cyan)] font-mono text-sm tracking-widest uppercase">Round {round.roundNumber}</span>
                    {round.challengeType && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white border border-white/20">
                        {round.challengeType}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white">{round.title}</h3>
                  <div className="text-muted-foreground text-sm mt-1">
                    {Math.floor(round.durationSeconds / 60)} min
                    {round.durationSeconds % 60 > 0 ? ` ${round.durationSeconds % 60}s` : ""}
                  </div>
                </div>
                <StatusBadge status={round.status} />
              </div>

              <div className="flex flex-wrap gap-2">
                {round.status === "READY" && (
                  <>
                    <APBButton size="sm" onClick={() => showConfirm({
                      title: "Start Round",
                      description: `Start Round ${round.roundNumber}: "${round.title}"? This will go LIVE for all participants.`,
                      confirmText: "START",
                      destructive: false,
                      action: () => startRound(round.id, round.durationSeconds),
                    })}>
                      <Play className="w-4 h-4 mr-2" /> Start
                    </APBButton>
                    <APBButton size="sm" variant="outline" onClick={() => openEdit(round)}>
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </APBButton>
                  </>
                )}
                
                {round.status === "LIVE" && (
                  <>
                    <APBButton size="sm" variant="outline" onClick={() => pauseRound(round.id)}>
                      <Pause className="w-4 h-4 mr-2" /> Pause
                    </APBButton>
                    <APBButton size="sm" variant="outline" onClick={() => extendTime(round.id, 60)}>
                      <TimerReset className="w-4 h-4 mr-2" /> +1 Min
                    </APBButton>
                    <APBButton size="sm" variant="outline" onClick={() => extendTime(round.id, 120)}>
                      <TimerReset className="w-4 h-4 mr-2" /> +2 Min
                    </APBButton>
                    <APBButton size="sm" variant="outline" onClick={() => extendTime(round.id, 300)}>
                      <TimerReset className="w-4 h-4 mr-2" /> +5 Min
                    </APBButton>
                    <APBButton size="sm" variant="destructive" onClick={() => showConfirm({
                      title: "End Round",
                      description: `End Round ${round.roundNumber} now? Submissions will be locked immediately.`,
                      confirmText: "END ROUND",
                      destructive: true,
                      action: () => endRound(round.id),
                    })}>
                      <Square className="w-4 h-4 mr-2" /> End
                    </APBButton>
                  </>
                )}
                
                {round.status === "PAUSED" && (
                  <>
                    <APBButton size="sm" onClick={() => resumeRound(round.id)}>
                      <Play className="w-4 h-4 mr-2" /> Resume
                    </APBButton>
                    <APBButton size="sm" variant="outline" onClick={() => extendTime(round.id, 60)}>
                      <TimerReset className="w-4 h-4 mr-2" /> +1 Min
                    </APBButton>
                    <APBButton size="sm" variant="outline" onClick={() => extendTime(round.id, 300)}>
                      <TimerReset className="w-4 h-4 mr-2" /> +5 Min
                    </APBButton>
                    <APBButton size="sm" variant="destructive" onClick={() => showConfirm({
                      title: "End Round",
                      description: `End Round ${round.roundNumber} now? Submissions will be locked.`,
                      confirmText: "END ROUND",
                      destructive: true,
                      action: () => endRound(round.id),
                    })}>
                      <Square className="w-4 h-4 mr-2" /> End
                    </APBButton>
                    <APBButton size="sm" variant="outline" onClick={() => openEdit(round)}>
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </APBButton>
                  </>
                )}

                {(round.status === "CLOSED" || round.status === "JUDGING" || round.status === "RESULTS") && (
                  <>
                    <APBButton size="sm" variant="outline" onClick={() => showConfirm({
                      title: "Reopen Round",
                      description: `Reopen Round ${round.roundNumber} for 5 more minutes?`,
                      confirmText: "REOPEN",
                      destructive: false,
                      action: () => reopenRound(round.id, 300),
                    })}>
                      <RefreshCw className="w-4 h-4 mr-2" /> Reopen (5 min)
                    </APBButton>
                    <APBButton size="sm" variant="outline" onClick={() => showConfirm({
                      title: "Reset Round",
                      description: `Reset Round ${round.roundNumber} to READY? Submission data is NOT deleted.`,
                      confirmText: "RESET",
                      destructive: true,
                      action: () => resetRound(round.id),
                    })}>
                      <RotateCcw className="w-4 h-4 mr-2" /> Reset
                    </APBButton>
                    <APBButton size="sm" variant="outline" onClick={() => openEdit(round)}>
                      <Edit className="w-4 h-4 mr-2" /> Edit
                    </APBButton>
                  </>
                )}

                {round.status === "DRAFT" && (
                  <APBButton size="sm" variant="outline" onClick={() => openEdit(round)}>
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </APBButton>
                )}
              </div>

              {round.challengeInstructions && (
                <div className="border-t border-[var(--color-apb-surface-border)] pt-4">
                  <div className="text-xs font-mono uppercase text-muted-foreground mb-1">Challenge</div>
                  <div className="text-sm text-white/80">{round.challengeInstructions}</div>
                </div>
              )}
              {round.constraints && round.constraints.length > 0 && (
                <div className="border-t border-[var(--color-apb-surface-border)] pt-4">
                  <div className="text-xs font-mono uppercase text-muted-foreground mb-2">Constraints</div>
                  <ul className="space-y-1">
                    {round.constraints.map((c, i) => (
                      <li key={i} className="text-xs text-white/70 flex items-start gap-2">
                        <span className="text-[var(--color-apb-cyan)] mt-0.5">▸</span>{c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </APBCard>
          ))}
          {rounds.length === 0 && (
            <div className="col-span-full h-48 border border-dashed border-[var(--color-apb-surface-border)] rounded-lg flex items-center justify-center text-muted-foreground">
              No rounds created yet.
            </div>
          )}
        </div>
      )}

      <EditRoundDialog
        round={editingRound}
        open={editDialogOpen}
        onOpenChange={(o) => { setEditDialogOpen(o); if (!o) setEditingRound(null); }}
      />

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={(o) => { if (!actionLoading) { setConfirmOpen(o); if (!o) setConfirmAction(null); } }}
        title={confirmAction?.title ?? ""}
        description={confirmAction?.description ?? ""}
        confirmText={confirmAction?.confirmText ?? "CONFIRM"}
        destructive={confirmAction?.destructive ?? false}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
