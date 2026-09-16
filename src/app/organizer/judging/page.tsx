"use client";

import { useState } from "react";
import { APBCard } from "@/components/apb/APBCard";
import { APBButton } from "@/components/apb/APBButton";
import { StatusBadge } from "@/components/apb/StatusBadge";
import { useRounds } from "@/lib/firebase/rounds";
import { useAllSubmissions } from "@/lib/firebase/submissions";
import { useTeams } from "@/lib/firebase/teams";
import {
  useJudges,
  addJudge,
  toggleJudgeStatus,
  removeJudge,
  useJudgeAssignments,
  assignJudge,
  unassignJudge,
  autoDistributeAssignments,
  useJudgeScores,
  overrideJudgeScore,
} from "@/lib/firebase/judging";
import { aggregateJudgeScores } from "@/lib/scoring";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { logAudit } from "@/lib/firebase/teams";
import { Submission, Judge } from "@/lib/firebase/schema";
import {
  Loader2,
  Star,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Users,
  Scale,
  Plus,
  Trash2,
  Edit3,
  Shuffle,
  ShieldAlert,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─────────────────────────────────────────────────────────────
// Submission Card with Multi-Judge Score & Direct Scoring
// ─────────────────────────────────────────────────────────────
function SubmissionJudgingCard({
  submission,
  teamName,
  judges,
  assignments,
  scores,
  onUpdate,
}: {
  submission: Submission;
  teamName: string;
  judges: Judge[];
  assignments: ReturnType<typeof useJudgeAssignments>["assignments"];
  scores: ReturnType<typeof useJudgeScores>["scores"];
  onUpdate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [directScore, setDirectScore] = useState<number>(submission.score ?? 75);
  const [directComments, setDirectComments] = useState(submission.judgeComments ?? "");
  const [savingDirect, setSavingDirect] = useState(false);

  // Override dialog state
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideScoreVal, setOverrideScoreVal] = useState(submission.score ?? 80);
  const [overrideReason, setOverrideReason] = useState("");
  const [savingOverride, setSavingOverride] = useState(false);

  // Assignment selection state
  const [selectedJudgeId, setSelectedJudgeId] = useState("");

  // Filter judge scores & assignments for this submission
  const subScores = scores.filter((s) => s.submissionId === submission.id);
  const subAssignments = assignments.filter((a) => a.submissionId === submission.id);

  // Multi-judge aggregation
  const aggregated = aggregateJudgeScores(subScores);
  const effectiveScore =
    submission.score !== undefined
      ? submission.score
      : aggregated.scoreCount > 0
      ? aggregated.finalScore
      : undefined;

  const handleSaveDirect = async () => {
    setSavingDirect(true);
    try {
      const ref = doc(db, "submissions", submission.id);
      const now = Date.now();
      const previousScore = submission.score ?? 0;
      const validScore = Math.min(100, Math.max(0, Math.round(directScore)));
      const updates: Partial<Submission> = {
        score: validScore,
        judgeComments: directComments,
        evaluatedBy: "organizer",
        evaluatedAt: now,
      };
      if (previousScore && previousScore !== validScore) {
        updates.scoreHistory = [
          ...(submission.scoreHistory ?? []),
          { previousScore, newScore: validScore, modifiedBy: "organizer", timestamp: now },
        ];
      }
      await updateDoc(ref, updates as Record<string, unknown>);
      await logAudit("SUBMISSION_SCORED", "ORGANIZER", {
        metadata: { submissionId: submission.id, teamId: submission.teamId, score: validScore },
      });
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save score.");
    } finally {
      setSavingDirect(false);
    }
  };

  const handleApplyOverride = async () => {
    if (!overrideReason.trim()) {
      alert("Please specify a reason for the score override.");
      return;
    }
    setSavingOverride(true);
    try {
      const ref = doc(db, "submissions", submission.id);
      const now = Date.now();
      const previousScore = effectiveScore ?? 0;

      await updateDoc(ref, {
        score: overrideScoreVal,
        scoreHistory: [
          ...(submission.scoreHistory ?? []),
          {
            previousScore,
            newScore: overrideScoreVal,
            reason: overrideReason.trim(),
            modifiedBy: "organizer",
            timestamp: now,
          },
        ],
        evaluatedBy: "organizer-override",
        evaluatedAt: now,
      });

      // Also update any judge scores with the override
      for (const s of subScores) {
        await overrideJudgeScore(s.id, overrideScoreVal, overrideReason, "ORGANIZER");
      }

      setOverrideOpen(false);
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to override score.");
    } finally {
      setSavingOverride(false);
    }
  };

  const handleAddAssignment = async () => {
    if (!selectedJudgeId) return;
    const judge = judges.find((j) => j.uid === selectedJudgeId);
    if (!judge) return;

    try {
      await assignJudge({
        eventId: submission.eventId,
        roundId: submission.roundId,
        submissionId: submission.id,
        teamId: submission.teamId,
        judgeId: judge.uid,
        judgeName: judge.displayName,
        assignedBy: "ORGANIZER",
      });
      setSelectedJudgeId("");
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to assign judge.");
    }
  };

  return (
    <APBCard className="p-5 space-y-4">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="text-[10px] font-mono uppercase text-muted-foreground">Team</span>
          <div className="font-mono font-bold text-white text-base">{teamName}</div>
          <span className="text-xs font-mono text-muted-foreground">{submission.teamId}</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Multi-Judge Status Badges */}
          {subScores.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-mono">
                {aggregated.scoreCount} {aggregated.scoreCount === 1 ? "Judge" : "Judges"}
              </span>
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-sm font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Score: {effectiveScore}/100</span>
              </div>
              {aggregated.variance > 0 && (
                <span className="text-[10px] font-mono text-muted-foreground" title="Score variance">
                  (σ²: {aggregated.variance})
                </span>
              )}
            </div>
          ) : effectiveScore !== undefined ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-sm font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Score: {effectiveScore}/100</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-400 font-mono text-xs">
              <AlertCircle className="w-4 h-4" />
              <span>Unscored</span>
            </div>
          )}

          <APBButton
            size="sm"
            variant="outline"
            onClick={() => setOverrideOpen(true)}
            className="text-xs h-8"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1 text-purple-400" /> Override
          </APBButton>

          <APBButton size="sm" variant="ghost" onClick={() => setExpanded(!expanded)} className="h-8">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </APBButton>
        </div>
      </div>

      {/* Expanded Evaluation & Judge Assignment Breakdown */}
      {expanded && (
        <div className="space-y-5 pt-3 border-t border-[var(--color-apb-surface-border)]">
          {/* Submission Work Preview */}
          <div className="border border-[var(--color-apb-surface-border)] rounded-md p-3.5 bg-black/40 space-y-2">
            <span className="text-[10px] font-mono uppercase text-muted-foreground block">
              Submitted Final Prompt
            </span>
            <div className="text-xs text-white/90 font-mono whitespace-pre-wrap leading-relaxed">
              {submission.prompt}
            </div>

            {submission.member1Data?.text && (
              <div className="pt-2">
                <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                  Member 01 Text
                </span>
                <div className="text-xs text-white/80 font-mono">{submission.member1Data.text}</div>
              </div>
            )}

            {submission.member2Data?.imageUrl && (
              <div className="pt-2">
                <span className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">
                  Member 02 Asset
                </span>
                <img
                  src={submission.member2Data.imageUrl}
                  alt="Submission Creative"
                  className="max-h-40 rounded border border-[var(--color-apb-surface-border)] object-contain"
                />
              </div>
            )}
          </div>

          {/* Assigned Judges Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase font-bold text-white flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[var(--color-apb-cyan)]" /> Assigned Judges ({subAssignments.length})
              </span>

              {/* Assign Judge Control */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedJudgeId}
                  onChange={(e) => setSelectedJudgeId(e.target.value)}
                  className="bg-black/60 border border-[var(--color-apb-surface-border)] rounded text-xs font-mono text-white px-2 py-1"
                >
                  <option value="">Select Judge...</option>
                  {judges
                    .filter((j) => j.active && !subAssignments.some((a) => a.judgeId === j.uid))
                    .map((j) => (
                      <option key={j.uid} value={j.uid}>
                        {j.displayName}
                      </option>
                    ))}
                </select>
                <APBButton
                  size="sm"
                  variant="outline"
                  onClick={handleAddAssignment}
                  disabled={!selectedJudgeId}
                  className="h-7 text-xs"
                >
                  Assign
                </APBButton>
              </div>
            </div>

            {subAssignments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {subAssignments.map((a) => {
                  const s = subScores.find((score) => score.judgeId === a.judgeId);
                  return (
                    <div
                      key={a.id}
                      className="p-3 rounded-lg bg-black/40 border border-[var(--color-apb-surface-border)] flex items-center justify-between text-xs font-mono"
                    >
                      <div>
                        <div className="font-bold text-white">{a.judgeName}</div>
                        <div className="text-[10px] text-muted-foreground">
                          Status: {s?.status === "FINAL" ? "Finalized" : s ? "Draft" : "Pending"}
                        </div>
                        {s?.comments && (
                          <div className="text-[10px] text-white/70 italic mt-1">\"{s.comments}\"</div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {s ? (
                          <span className="text-sm font-bold text-[var(--color-apb-cyan)]">
                            {s.overrideScore !== undefined ? s.overrideScore : s.finalScore}/100
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400">Waiting</span>
                        )}
                        <button
                          onClick={() => unassignJudge(a.id).then(onUpdate)}
                          className="text-muted-foreground hover:text-red-400 transition-colors p-1"
                          title="Unassign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Direct Organizer Fallback Scoring */}
          <div className="p-4 rounded-lg bg-[var(--color-apb-surface)]/70 border border-[var(--color-apb-surface-border)] space-y-4">
            <span className="text-xs font-mono uppercase font-bold text-white flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-yellow-400" /> Direct Organizer Evaluation (0–100 Integer Score)
            </span>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={directScore}
                  onChange={(e) => setDirectScore(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="w-full accent-[var(--color-apb-cyan)] bg-slate-800 rounded-lg cursor-pointer h-2 py-1"
                />
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={directScore}
                  onChange={(e) => setDirectScore(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="font-mono text-sm text-center h-9 font-bold text-[var(--color-apb-cyan)]"
                />
              </div>
            </div>

            <textarea
              value={directComments}
              onChange={(e) => setDirectComments(e.target.value)}
              placeholder="Organizer notes..."
              rows={2}
              className="w-full bg-black/50 border border-[var(--color-apb-surface-border)] rounded-md px-3 py-2 text-xs text-white font-mono resize-none"
            />

            <APBButton size="sm" glow className="w-full" onClick={handleSaveDirect} disabled={savingDirect}>
              <Star className="w-4 h-4 mr-1.5" />
              {savingDirect ? "Saving..." : "Commit Direct Score"}
            </APBButton>
          </div>

          {/* Score Audit Trail */}
          {submission.scoreHistory && submission.scoreHistory.length > 0 && (
            <div className="pt-2 border-t border-[var(--color-apb-surface-border)]">
              <span className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">
                Audit History
              </span>
              {submission.scoreHistory.map((h, i) => (
                <div key={i} className="text-[11px] text-muted-foreground font-mono">
                  {h.previousScore} → {h.newScore} by {h.modifiedBy} at{" "}
                  {new Date(h.timestamp).toLocaleTimeString()}{" "}
                  {h.reason && <span className="italic text-purple-300">({h.reason})</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Override Dialog */}
      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
          <DialogHeader>
            <DialogTitle className="text-lg font-mono uppercase text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-purple-400" /> Override Score: {teamName}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4 font-mono text-xs">
            <p className="text-muted-foreground">
              Every score adjustment is tracked in the audit trail. Specify the new score and the reason for correction.
            </p>

            <div className="space-y-2">
              <Label className="uppercase text-muted-foreground">New Score (0 - 100)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={overrideScoreVal}
                onChange={(e) => setOverrideScoreVal(parseInt(e.target.value) || 0)}
                className="text-lg font-bold text-center"
              />
            </div>

            <div className="space-y-2">
              <Label className="uppercase text-muted-foreground">Reason for Adjustment *</Label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Technical submission glitch, reviewer calibration correction..."
                rows={3}
                className="w-full bg-black/60 border border-[var(--color-apb-surface-border)] rounded p-2 text-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <APBButton variant="outline" className="flex-1" onClick={() => setOverrideOpen(false)}>
                Cancel
              </APBButton>
              <APBButton glow className="flex-1" onClick={handleApplyOverride} disabled={savingOverride}>
                {savingOverride ? "Saving..." : "Commit Override"}
              </APBButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </APBCard>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Organizer Judging Page
// ─────────────────────────────────────────────────────────────
export default function OrganizerJudging() {
  const { rounds, loading: roundsLoading } = useRounds();
  const { teams } = useTeams();
  const { judges, loading: judgesLoading } = useJudges();

  const [activeTab, setActiveTab] = useState<"SUBMISSIONS" | "JUDGES">("SUBMISSIONS");
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Add Judge Modal state
  const [addJudgeOpen, setAddJudgeOpen] = useState(false);
  const [judgeUid, setJudgeUid] = useState("");
  const [judgeName, setJudgeName] = useState("");
  const [judgeEmail, setJudgeEmail] = useState("");
  const [addingJudge, setAddingJudge] = useState(false);

  // Auto assign state
  const [judgesPerSub, setJudgesPerSub] = useState(1);
  const [autoAssigning, setAutoAssigning] = useState(false);

  const availableRounds = rounds;
  const selectedRound = availableRounds.find((r) => r.id === selectedRoundId) ?? availableRounds[0] ?? null;
  const activeRoundId = selectedRound?.id ?? null;

  const { submissions, loading: subsLoading } = useAllSubmissions("currentEvent", activeRoundId);
  const { assignments } = useJudgeAssignments(null, activeRoundId);
  const { scores } = useJudgeScores(activeRoundId);

  const getTeamName = (teamId: string) =>
    teams.find((t) => t.teamId === teamId)?.displayName ?? teamId;

  const scoredCount = submissions.filter((s) => {
    const hasSubScore = scores.some((sc) => sc.submissionId === s.id && sc.status === "FINAL");
    return s.score !== undefined || hasSubScore;
  }).length;
  const totalSubmissions = submissions.length;
  const remainingCount = Math.max(0, totalSubmissions - scoredCount);

  const handleAddJudgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judgeUid.trim() || !judgeName.trim()) {
      alert("Please provide both Judge UID and Display Name.");
      return;
    }
    setAddingJudge(true);
    try {
      await addJudge({
        uid: judgeUid.trim(),
        displayName: judgeName.trim(),
        email: judgeEmail.trim(),
      });
      setJudgeUid("");
      setJudgeName("");
      setJudgeEmail("");
      setAddJudgeOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add judge.");
    } finally {
      setAddingJudge(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!selectedRound || submissions.length === 0) return;
    setAutoAssigning(true);
    try {
      const assigned = await autoDistributeAssignments(
        submissions,
        judges,
        judgesPerSub,
        "currentEvent",
        "ORGANIZER"
      );
      alert(`Successfully distributed ${assigned} assignments.`);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Auto-assignment failed.");
    } finally {
      setAutoAssigning(false);
    }
  };

  if (roundsLoading || judgesLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-apb-cyan)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-mono font-bold uppercase tracking-wider text-white">
            Judging Management
          </h2>
          <p className="text-muted-foreground text-sm">
            Configure judges, distribute assignments, and review multi-judge scoring.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex gap-2">
          <APBButton
            size="sm"
            variant={activeTab === "SUBMISSIONS" ? "default" : "outline"}
            onClick={() => setActiveTab("SUBMISSIONS")}
            className="text-xs"
          >
            <Star className="w-3.5 h-3.5 mr-1.5" /> Submissions & Scores
          </APBButton>
          <APBButton
            size="sm"
            variant={activeTab === "JUDGES" ? "default" : "outline"}
            onClick={() => setActiveTab("JUDGES")}
            className="text-xs"
          >
            <Users className="w-3.5 h-3.5 mr-1.5" /> Judges ({judges.length})
          </APBButton>
        </div>
      </header>

      {/* Section 13: Judging Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
        <APBCard className="p-5 bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
          <div className="text-xs uppercase text-muted-foreground font-bold">TOTAL SUBMISSIONS</div>
          <div className="text-4xl font-black text-white mt-1">{totalSubmissions}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Official received submissions</div>
        </APBCard>

        <APBCard className="p-5 bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
          <div className="text-xs uppercase text-muted-foreground font-bold">JUDGED</div>
          <div className="text-4xl font-black text-[var(--color-apb-cyan)] mt-1">{scoredCount}</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {totalSubmissions > 0 ? `${Math.round((scoredCount / totalSubmissions) * 100)}% complete` : "0%"}
          </div>
        </APBCard>

        <APBCard className="p-5 bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
          <div className="text-xs uppercase text-muted-foreground font-bold">REMAINING</div>
          <div className="text-4xl font-black text-amber-400 mt-1">{remainingCount}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Awaiting judge evaluation</div>
        </APBCard>
      </div>

      {/* TAB 1: SUBMISSIONS & MULTI-JUDGE SCORING */}
      {activeTab === "SUBMISSIONS" && (
        <div className="space-y-6">
          {availableRounds.length === 0 ? (
            <div className="h-48 border border-dashed border-[var(--color-apb-surface-border)] rounded-lg flex items-center justify-center text-muted-foreground font-mono">
              No rounds configured yet.
            </div>
          ) : (
            <>
              {/* Round Selector Buttons */}
              <div className="flex flex-wrap gap-2">
                {availableRounds.map((r) => (
                  <APBButton
                    key={r.id}
                    size="sm"
                    variant={selectedRound?.id === r.id ? "default" : "outline"}
                    onClick={() => setSelectedRoundId(r.id)}
                  >
                    Round {r.roundNumber}: {r.title}
                    <StatusBadge status={r.status} className="ml-2 text-[10px]" />
                  </APBButton>
                ))}
              </div>

              {/* Progress & Quick Auto-Assign Toolbar */}
              {selectedRound && (
                <div className="p-4 rounded-lg bg-[var(--color-apb-surface)] border border-[var(--color-apb-surface-border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between text-xs font-mono text-white">
                      <span>Judging Progress</span>
                      <span className="text-[var(--color-apb-cyan)] font-bold">
                        {scoredCount}/{totalSubmissions} evaluated
                      </span>
                    </div>
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-apb-cyan)] rounded-full transition-all"
                        style={{
                          width: totalSubmissions > 0 ? `${(scoredCount / totalSubmissions) * 100}%` : "0%",
                        }}
                      />
                    </div>
                  </div>

                  {/* Auto Assign Controls */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                      <span>Judges/team:</span>
                      <select
                        value={judgesPerSub}
                        onChange={(e) => setJudgesPerSub(parseInt(e.target.value) || 1)}
                        className="bg-black/60 border border-[var(--color-apb-surface-border)] rounded px-2 py-1 text-white"
                      >
                        <option value={1}>1</option>
                        <option value={2}>2</option>
                        <option value={3}>3</option>
                      </select>
                    </div>

                    <APBButton
                      size="sm"
                      variant="outline"
                      onClick={handleAutoAssign}
                      disabled={autoAssigning || totalSubmissions === 0 || judges.length === 0}
                      className="text-xs h-8"
                    >
                      <Shuffle className="w-3.5 h-3.5 mr-1 text-[var(--color-apb-cyan)]" />
                      {autoAssigning ? "Assigning..." : "Auto-Distribute"}
                    </APBButton>
                  </div>
                </div>
              )}

              {/* Submissions List */}
              {subsLoading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--color-apb-cyan)]" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="h-32 border border-dashed border-[var(--color-apb-surface-border)] rounded-lg flex items-center justify-center text-muted-foreground font-mono">
                  No submissions found for this round.
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((sub) => (
                    <SubmissionJudgingCard
                      key={sub.id}
                      submission={sub}
                      teamName={getTeamName(sub.teamId)}
                      judges={judges}
                      assignments={assignments}
                      scores={scores}
                      onUpdate={() => setRefreshKey((k) => k + 1)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 2: JUDGE ACCOUNTS & MANAGEMENT */}
      {activeTab === "JUDGES" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-muted-foreground">
              Official Judge Accounts ({judges.length})
            </span>

            <APBButton size="sm" glow onClick={() => setAddJudgeOpen(true)} className="text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Judge Account
            </APBButton>
          </div>

          {judges.length === 0 ? (
            <div className="h-48 border border-dashed border-[var(--color-apb-surface-border)] rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground font-mono">
              <Scale className="w-8 h-8 opacity-40" />
              <span>No judges authorized yet. Click \"Add Judge Account\" to authorize.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {judges.map((j) => (
                <APBCard key={j.uid} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-mono font-bold text-white text-sm">{j.displayName}</h4>
                      <div className="text-xs font-mono text-muted-foreground">{j.email || "No email"}</div>
                      <div className="text-[10px] font-mono text-muted-foreground mt-0.5 truncate max-w-[200px]">
                        UID: {j.uid}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                        j.active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {j.active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[var(--color-apb-surface-border)] flex items-center justify-between">
                    <APBButton
                      size="sm"
                      variant="outline"
                      onClick={() => toggleJudgeStatus(j.uid, !j.active)}
                      className="text-xs h-7"
                    >
                      {j.active ? "Deactivate" : "Activate"}
                    </APBButton>

                    <button
                      onClick={() => {
                        if (confirm(`Remove judge ${j.displayName}?`)) {
                          removeJudge(j.uid);
                        }
                      }}
                      className="text-muted-foreground hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </APBCard>
              ))}
            </div>
          )}

          {/* Add Judge Modal */}
          <Dialog open={addJudgeOpen} onOpenChange={setAddJudgeOpen}>
            <DialogContent className="sm:max-w-[425px] bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
              <DialogHeader>
                <DialogTitle className="text-lg font-mono uppercase text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[var(--color-apb-cyan)]" /> Add Official Judge
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleAddJudgeSubmit} className="space-y-4 py-2 font-mono text-xs">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground uppercase">Judge UID *</Label>
                  <Input
                    placeholder="Firebase Auth UID"
                    value={judgeUid}
                    onChange={(e) => setJudgeUid(e.target.value)}
                    required
                    className="font-mono text-xs"
                  />
                  <span className="text-[10px] text-muted-foreground block">
                    Copy from Firebase Authentication console.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground uppercase">Display Name *</Label>
                  <Input
                    placeholder="Judge Full Name"
                    value={judgeName}
                    onChange={(e) => setJudgeName(e.target.value)}
                    required
                    className="font-mono text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground uppercase">Judge Email</Label>
                  <Input
                    type="email"
                    placeholder="judge@apb.com"
                    value={judgeEmail}
                    onChange={(e) => setJudgeEmail(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <APBButton type="button" variant="outline" className="flex-1" onClick={() => setAddJudgeOpen(false)}>
                    Cancel
                  </APBButton>
                  <APBButton type="submit" glow className="flex-1" disabled={addingJudge}>
                    {addingJudge ? "Authorizing..." : "Authorize Judge"}
                  </APBButton>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
