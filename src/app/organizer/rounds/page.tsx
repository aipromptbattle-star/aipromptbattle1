"use client";

import { useState } from "react";
import { APBCard } from "@/components/apb/APBCard";
import { APBButton } from "@/components/apb/APBButton";
import { StatusBadge } from "@/components/apb/StatusBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmationDialog } from "@/components/apb/ConfirmationDialog";
import { EditRoundDialog } from "@/components/apb/EditRoundDialog";
import { RoundTemplateBuilder } from "@/components/apb/RoundTemplateBuilder";
import { ParticipantPreviewModal } from "@/components/apb/ParticipantPreviewModal";
import { useRounds, createRound, deleteRound } from "@/lib/firebase/rounds";
import { startRound, pauseRound, resumeRound, endRound, extendTime, reopenRound, resetRound } from "@/lib/firebase/events";
import { Round } from "@/lib/firebase/schema";
import { Loader2, Plus, Play, Pause, Square, TimerReset, Edit, RotateCcw, RefreshCw, Clock, Sparkles, Eye, Trash2 } from "lucide-react";
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
  const [templateBuilderOpen, setTemplateBuilderOpen] = useState(false);
  const [previewRound, setPreviewRound] = useState<Round | null>(null);
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

  const handleSaveFromTemplate = async (roundData: Partial<Round>) => {
    try {
      await createRound({
        roundNumber: roundData.roundNumber || rounds.length + 1,
        title: roundData.title || `Round ${roundData.roundNumber || rounds.length + 1}`,
        description: roundData.description || "",
        durationSeconds: roundData.durationSeconds || 1200,
        challengeType: roundData.challengeType || "TEXT",
        challengeTitle: roundData.challengeTitle || roundData.title || "",
        challengeDescription: roundData.challengeDescription || roundData.description || "",
        challengeInstructions: roundData.challengeInstructions || "",
        referenceMaterial: roundData.referenceMaterial || "",
        constraints: roundData.constraints || [],
        templateType: roundData.templateType,
        quizQuestions: roundData.quizQuestions,
        progressiveStages: roundData.progressiveStages,
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create round from template.");
      throw err;
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
          <p className="text-muted-foreground">Configure challenges, select templates, and preview participant experience.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <APBButton glow onClick={() => setTemplateBuilderOpen(true)} className="bg-gradient-to-r from-[var(--color-apb-cyan)]/20 to-[var(--color-apb-purple)]/20 border border-[var(--color-apb-cyan)]/50">
            <Sparkles className="w-4 h-4 mr-2 text-[var(--color-apb-cyan)]" />
            Create from Template
          </APBButton>

          <APBButton variant="outline" onClick={() => setOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Custom Round
          </APBButton>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
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
          {rounds.map(round => {
            const isQuiz = round.templateType === "QUIZ" || round.roundNumber === 1;
            const isProgressive = round.templateType === "PROGRESSIVE_CONSTRAINT" || round.roundNumber === 2;
            const isLive = round.status === "LIVE";
            const isStarting = round.status === "STARTING";

            return (
              <APBCard 
                key={round.id} 
                className={`p-6 sm:p-7 space-y-6 transition-all ${
                  isLive 
                    ? "border-emerald-500/60 bg-gradient-to-b from-emerald-950/10 via-[var(--color-apb-surface)] to-[var(--color-apb-surface)] shadow-[0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30" 
                    : isStarting 
                    ? "border-amber-500/60 bg-amber-950/10 shadow-[0_0_30px_rgba(245,158,11,0.15)]"
                    : "border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)]"
                }`}
              >
                {/* Round Header & Status */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-white/10 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-black tracking-widest text-[var(--color-apb-cyan)] uppercase">
                        ROUND 0{round.roundNumber}
                      </span>
                      {isQuiz && (
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--color-apb-cyan)]/15 text-[var(--color-apb-cyan)] border border-[var(--color-apb-cyan)]/30">
                          🧠 QUIZ
                        </span>
                      )}
                      {isProgressive && (
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--color-apb-purple)]/15 text-purple-300 border border-[var(--color-apb-purple)]/30">
                          ⚡ PROGRESSIVE CONSTRAINT
                        </span>
                      )}
                      {!isQuiz && !isProgressive && (
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-white/80 border border-white/20">
                          STANDARD
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl sm:text-2xl font-mono font-bold text-white tracking-wide">
                      {round.title}
                    </h3>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <StatusBadge status={round.status} pulse={isLive || isStarting} />
                  </div>
                </div>

                {/* Section 5 Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-xs">
                  {isQuiz ? (
                    <>
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground">STRUCTURE</div>
                        <div className="text-sm font-bold text-white mt-0.5">20 QUESTIONS</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground">DURATION</div>
                        <div className="text-sm font-bold text-[var(--color-apb-cyan)] mt-0.5">20 MINUTES</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground">EVALUATION</div>
                        <div className="text-sm font-bold text-emerald-400 mt-0.5">1 PT / Q (A/B/C)</div>
                      </div>
                    </>
                  ) : isProgressive ? (
                    <>
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground">DURATION</div>
                        <div className="text-sm font-bold text-[var(--color-apb-cyan)] mt-0.5">20 MINUTES</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground">STAGES</div>
                        <div className="text-sm font-bold text-purple-300 mt-0.5">5 STAGES</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground">PACE</div>
                        <div className="text-sm font-bold text-white mt-0.5">4 MIN / STAGE</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground">DURATION</div>
                        <div className="text-sm font-bold text-[var(--color-apb-cyan)] mt-0.5">
                          {Math.floor(round.durationSeconds / 60)} MINUTES
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground">CHALLENGE TYPE</div>
                        <div className="text-sm font-bold text-white mt-0.5">{round.challengeType || "TEXT"}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground">EVALUATION</div>
                        <div className="text-sm font-bold text-white mt-0.5">0–100 SCORE</div>
                      </div>
                    </>
                  )}
                </div>

                {/* Accessible Action Rows (Section 5) */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Preview Button */}
                    <APBButton 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setPreviewRound(round)} 
                      className="font-mono text-xs text-white/80 hover:text-white border-white/15 hover:bg-white/5"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5 text-[var(--color-apb-cyan)]" /> Preview
                    </APBButton>

                    {/* Edit Button */}
                    <APBButton 
                      size="sm" 
                      variant="outline" 
                      onClick={() => openEdit(round)}
                      className="font-mono text-xs border-white/15 text-white/80 hover:text-white hover:bg-white/5"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                    </APBButton>

                    {/* Start Action (When READY or DRAFT) */}
                    {(round.status === "READY" || round.status === "DRAFT") && (
                      <APBButton 
                        size="sm" 
                        glow
                        onClick={() => showConfirm({
                          title: "Start Authoritative Round",
                          description: `Start Round 0${round.roundNumber}: "${round.title}"? This will trigger the synchronized 5-second countdown on the Organizer console and Public Host Display screen.`,
                          confirmText: "START ROUND",
                          destructive: false,
                          action: () => startRound(round.id, round.durationSeconds),
                        })}
                        className="font-mono text-xs uppercase"
                      >
                        <Play className="w-3.5 h-3.5 mr-1.5" /> Start
                      </APBButton>
                    )}

                    {/* Live controls */}
                    {round.status === "LIVE" && (
                      <>
                        <APBButton 
                          size="sm" 
                          variant="outline" 
                          onClick={() => pauseRound(round.id)}
                          className="font-mono text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                        >
                          <Pause className="w-3.5 h-3.5 mr-1.5" /> Pause
                        </APBButton>
                        <APBButton 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => showConfirm({
                            title: "End Round",
                            description: `End Round ${round.roundNumber} now? Submissions will be locked immediately.`,
                            confirmText: "END ROUND",
                            destructive: true,
                            action: () => endRound(round.id),
                          })}
                          className="font-mono text-xs"
                        >
                          <Square className="w-3.5 h-3.5 mr-1.5" /> End
                        </APBButton>
                      </>
                    )}

                    {/* Paused controls */}
                    {round.status === "PAUSED" && (
                      <>
                        <APBButton 
                          size="sm" 
                          glow
                          onClick={() => resumeRound(round.id)}
                          className="font-mono text-xs"
                        >
                          <Play className="w-3.5 h-3.5 mr-1.5" /> Resume
                        </APBButton>
                        <APBButton 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => showConfirm({
                            title: "End Round",
                            description: `End Round ${round.roundNumber} now? Submissions will be locked.`,
                            confirmText: "END ROUND",
                            destructive: true,
                            action: () => endRound(round.id),
                          })}
                          className="font-mono text-xs"
                        >
                          <Square className="w-3.5 h-3.5 mr-1.5" /> End
                        </APBButton>
                      </>
                    )}

                    {/* Closed/Reset controls */}
                    {(round.status === "CLOSED" || round.status === "JUDGING" || round.status === "RESULTS" || round.status === "ENDED") && (
                      <>
                        <APBButton 
                          size="sm" 
                          variant="outline" 
                          onClick={() => showConfirm({
                            title: "Reopen Round",
                            description: `Reopen Round ${round.roundNumber} for 5 more minutes?`,
                            confirmText: "REOPEN",
                            destructive: false,
                            action: () => reopenRound(round.id, 300),
                          })}
                          className="font-mono text-xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reopen (5m)
                        </APBButton>
                        <APBButton 
                          size="sm" 
                          variant="outline" 
                          onClick={() => showConfirm({
                            title: "Reset Round",
                            description: `Reset Round ${round.roundNumber} to READY? Submission data is NOT deleted.`,
                            confirmText: "RESET",
                            destructive: true,
                            action: () => resetRound(round.id),
                          })}
                          className="font-mono text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset
                        </APBButton>
                      </>
                    )}

                    {/* Delete Round Button (Guarded) */}
                    <div className="ml-auto">
                      <APBButton
                        size="sm"
                        variant="outline"
                        disabled={round.status === "LIVE"}
                        onClick={() => showConfirm({
                          title: "Delete Round",
                          description: `Permanently delete Round ${round.roundNumber}: "${round.title}"? This round configuration will be completely removed.`,
                          confirmText: "DELETE ROUND",
                          destructive: true,
                          action: () => deleteRound(round.id),
                        })}
                        className="border-red-500/40 text-red-400 hover:bg-red-500/20 disabled:opacity-30 font-mono text-xs"
                        title={round.status === "LIVE" ? "End the round before deleting." : "Delete this round"}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                      </APBButton>
                    </div>
                  </div>
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
          );
        })}
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

      <RoundTemplateBuilder
        open={templateBuilderOpen}
        onOpenChange={setTemplateBuilderOpen}
        onSaveRound={handleSaveFromTemplate}
        nextRoundNumber={rounds.length + 1}
      />

      <ParticipantPreviewModal
        open={!!previewRound}
        onClose={() => setPreviewRound(null)}
        round={previewRound || {}}
      />
    </div>
  );
}
