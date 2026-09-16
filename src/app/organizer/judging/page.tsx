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
  createJudgeAccount,
  toggleJudgeStatus,
  removeJudge,
  useJudgeAssignments,
  assignJudge,
  unassignJudge,
  autoDistributeAssignments,
  autoDistributeTeamsToJudges,
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

  // Section 40: Assignment Filters
  const [assignmentFilter, setAssignmentFilter] = useState<"ALL" | "ASSIGNED" | "UNASSIGNED" | "JUDGED" | "PENDING">("ALL");

  // Add Judge Modal state (§33)
  const [addJudgeOpen, setAddJudgeOpen] = useState(false);
  const [judgeName, setJudgeName] = useState("");
  const [judgeEmail, setJudgeEmail] = useState("");
  const [judgePassword, setJudgePassword] = useState("");
  const [addingJudge, setAddingJudge] = useState(false);

  // Auto assign modal state (§37-39)
  const [autoDistributeOpen, setAutoDistributeOpen] = useState(false);
  const [teamsPerJudgeInput, setTeamsPerJudgeInput] = useState<number>(20);
  const [autoAssigning, setAutoAssigning] = useState(false);

  const availableRounds = rounds;
  const selectedRound = availableRounds.find((r) => r.id === selectedRoundId) ?? availableRounds[0] ?? null;
  const activeRoundId = selectedRound?.id ?? null;

  const { submissions, loading: subsLoading } = useAllSubmissions("currentEvent", activeRoundId);
  const { assignments } = useJudgeAssignments(null, activeRoundId);
  const { scores } = useJudgeScores(activeRoundId);

  const getTeamName = (teamId: string) =>
    teams.find((t) => t.teamId === teamId)?.displayName ?? teamId;

  // Online Presence Reconciliation (§35)
  const isJudgeOnline = (j: Judge) => !!(j.isOnline && (Date.now() - (j.lastHeartbeat || 0) < 90000));
  const onlineJudgesCount = judges.filter(isJudgeOnline).length;

  const scoredCount = submissions.filter((s) => {
    const hasSubScore = scores.some((sc) => sc.submissionId === s.id && sc.status === "FINAL");
    return s.score !== undefined || hasSubScore;
  }).length;
  const totalSubmissions = submissions.length;
  const remainingCount = Math.max(0, totalSubmissions - scoredCount);

  const handleAddJudgeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judgeName.trim() || !judgeEmail.trim() || !judgePassword.trim()) {
      alert("Please provide Judge Name, Email, and Password.");
      return;
    }
    setAddingJudge(true);
    try {
      await createJudgeAccount({
        displayName: judgeName.trim(),
        email: judgeEmail.trim(),
        password: judgePassword.trim(),
      });
      setJudgeName("");
      setJudgeEmail("");
      setJudgePassword("");
      setAddJudgeOpen(false);
      alert(`Judge account created successfully for ${judgeEmail}!`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create judge account.");
    } finally {
      setAddingJudge(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!selectedRound) return;
    const targetTeamIds = teams.map((t) => t.teamId);
    if (targetTeamIds.length === 0) {
      alert("No registered teams found to distribute.");
      return;
    }
    setAutoAssigning(true);
    try {
      const assigned = await autoDistributeTeamsToJudges({
        teamIds: targetTeamIds,
        roundId: selectedRound.id,
        judges,
        teamsPerJudge: teamsPerJudgeInput > 0 ? teamsPerJudgeInput : undefined,
      });
      alert(`Successfully distributed ${assigned} team assignments across active judges.`);
      setAutoDistributeOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Auto-distribution failed.");
    } finally {
      setAutoAssigning(false);
    }
  };

  // Filtered submissions list (§40)
  const filteredSubmissions = submissions.filter((sub) => {
    const subAssigns = assignments.filter((a) => a.submissionId === sub.id || a.teamId === sub.teamId);
    const subScore = scores.find((s) => s.submissionId === sub.id);
    const isJudged = sub.score !== undefined || subScore?.status === "FINAL";

    if (assignmentFilter === "ASSIGNED") return subAssigns.length > 0;
    if (assignmentFilter === "UNASSIGNED") return subAssigns.length === 0;
    if (assignmentFilter === "JUDGED") return isJudged;
    if (assignmentFilter === "PENDING") return !isJudged;
    return true;
  });

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

      {/* Section 48: Judging Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <APBCard className="p-5 bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
          <div className="text-xs uppercase text-muted-foreground font-bold">TOTAL SUBMISSIONS</div>
          <div className="text-3xl sm:text-4xl font-black text-white mt-1">{totalSubmissions}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Official received submissions</div>
        </APBCard>

        <APBCard className="p-5 bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
          <div className="text-xs uppercase text-muted-foreground font-bold">JUDGED</div>
          <div className="text-3xl sm:text-4xl font-black text-[var(--color-apb-cyan)] mt-1">{scoredCount}</div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {totalSubmissions > 0 ? `${Math.round((scoredCount / totalSubmissions) * 100)}% complete` : "0%"}
          </div>
        </APBCard>

        <APBCard className="p-5 bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
          <div className="text-xs uppercase text-muted-foreground font-bold">PENDING</div>
          <div className="text-3xl sm:text-4xl font-black text-amber-400 mt-1">{remainingCount}</div>
          <div className="text-[11px] text-muted-foreground mt-1">Awaiting judge evaluation</div>
        </APBCard>

        <APBCard className="p-5 bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
          <div className="text-xs uppercase text-muted-foreground font-bold">JUDGES ONLINE</div>
          <div className="text-3xl sm:text-4xl font-black text-emerald-400 mt-1">
            {onlineJudgesCount} / {judges.length}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">Live active presence in /judge</div>
        </APBCard>
      </div>

      {/* Section 46 & 48: Judge Assignment & Progress Panel */}
      <APBCard className="p-6 space-y-4 border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-apb-cyan)] font-bold mb-0.5">
              JUDGING PROGRESS & PRESENCE (§46)
            </div>
            <h3 className="text-lg font-mono font-bold text-white">Evaluator Workload & Live Status</h3>
          </div>

          <div className="flex items-center gap-2">
            <APBButton
              glow
              size="sm"
              onClick={() => setAutoDistributeOpen(true)}
              disabled={judges.length === 0}
              className="font-mono text-xs uppercase"
            >
              <Shuffle className="w-3.5 h-3.5 mr-1.5" />
              Auto Distribute (§37)
            </APBButton>
          </div>
        </div>

        {judges.length === 0 ? (
          <div className="text-xs font-mono text-muted-foreground py-2">
            No judge accounts created yet. Switch to the Judges tab to add evaluators.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="text-muted-foreground uppercase border-b border-white/10">
                <tr>
                  <th className="pb-2">Judge</th>
                  <th className="pb-2">Assigned</th>
                  <th className="pb-2">Completed</th>
                  <th className="pb-2 text-right">Live Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {judges.map((j) => {
                  const isOnline = isJudgeOnline(j);
                  const judgeAssigns = assignments.filter((a) => a.judgeId === j.uid);
                  const completedJudge = scores.filter((s) => s.judgeId === j.uid && s.status === "FINAL").length;

                  return (
                    <tr key={j.uid} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 font-bold text-white flex items-center gap-2">
                        <span>{j.displayName}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">({j.email})</span>
                      </td>
                      <td className="py-2.5 text-white/80">{judgeAssigns.length} teams</td>
                      <td className="py-2.5 text-[var(--color-apb-cyan)] font-bold">{completedJudge} evaluated</td>
                      <td className="py-2.5 text-right">
                        {isOnline ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            ONLINE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-white/10 text-[10px]">
                            ○ OFFLINE
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </APBCard>

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

              {/* Section 40: Assignment Filters Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                  <span className="text-muted-foreground uppercase mr-1">Filter Submissions:</span>
                  {(["ALL", "ASSIGNED", "UNASSIGNED", "JUDGED", "PENDING"] as const).map((flt) => (
                    <button
                      key={flt}
                      type="button"
                      onClick={() => setAssignmentFilter(flt)}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                        assignmentFilter === flt
                          ? "bg-[var(--color-apb-cyan)] text-black shadow-md shadow-cyan-950/40"
                          : "bg-white/5 text-muted-foreground hover:text-white"
                      }`}
                    >
                      {flt}
                    </button>
                  ))}
                </div>

                <div className="text-xs font-mono text-muted-foreground">
                  Showing {filteredSubmissions.length} of {submissions.length} submission(s)
                </div>
              </div>

              {/* Submissions List */}
              {subsLoading ? (
                <div className="flex justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[var(--color-apb-cyan)]" />
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="h-32 border border-dashed border-[var(--color-apb-surface-border)] rounded-lg flex items-center justify-center text-muted-foreground font-mono">
                  No submissions found matching filter: {assignmentFilter}.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSubmissions.map((sub) => (
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

            <APBButton size="sm" glow onClick={() => setAddJudgeOpen(true)} className="text-xs font-mono">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Judge Account
            </APBButton>
          </div>

          {judges.length === 0 ? (
            <div className="h-48 border border-dashed border-[var(--color-apb-surface-border)] rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground font-mono">
              <Scale className="w-8 h-8 opacity-40" />
              <span>No judges authorized yet. Click "Add Judge Account" to create evaluator credentials.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {judges.map((j) => {
                const isOnline = isJudgeOnline(j);
                return (
                  <APBCard key={j.uid} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-mono font-bold text-white text-sm flex items-center gap-2">
                          <span>{j.displayName}</span>
                          {isOnline ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Online" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-slate-600" title="Offline" />
                          )}
                        </h4>
                        <div className="text-xs font-mono text-muted-foreground">{j.email}</div>
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
                        className="text-xs h-7 font-mono"
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
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Auto Distribute Confirmation Modal (§37-39) */}
      <Dialog open={autoDistributeOpen} onOpenChange={setAutoDistributeOpen}>
        <DialogContent className="sm:max-w-[480px] bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] font-mono">
          <DialogHeader>
            <DialogTitle className="text-lg uppercase text-white flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-[var(--color-apb-cyan)]" /> Auto Distribute Teams to Judges
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            {/* Assignment Safety Warning */}
            {assignments.length > 0 ? (
              <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 space-y-1">
                <div className="font-bold uppercase flex items-center gap-1.5 text-xs text-rose-400">
                  <ShieldAlert className="w-4 h-4" /> CURRENT ASSIGNMENTS EXIST
                </div>
                <p className="text-[11px]">
                  <strong>{assignments.length}</strong> team assignment(s) currently exist for this round. Applying a new distribution will replace current assignments.
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-300">
                <div className="font-bold uppercase mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> Assignment Safety Check
                </div>
                <p>
                  <strong>{teams.length}</strong> registered teams will be distributed across <strong>{judges.filter((j) => j.active).length}</strong> active judges.
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-muted-foreground uppercase block">Teams Per Judge (Optional Capacity Limit)</Label>
              <Input
                type="number"
                min={1}
                max={200}
                value={teamsPerJudgeInput}
                onChange={(e) => setTeamsPerJudgeInput(parseInt(e.target.value) || 0)}
                placeholder="e.g. 20 (or leave 0 for balanced split)"
                className="font-mono text-xs bg-black/60"
              />
              <span className="text-[11px] text-muted-foreground block">
                If 0, teams are divided evenly with fair remainder distribution (e.g. 100 teams / 3 judges = 34, 33, 33).
              </span>
            </div>

            {/* Live Distribution Preview Table */}
            {(() => {
              const activeJs = judges.filter((j) => j.active);
              if (activeJs.length === 0) return null;
              const totalTms = teams.length;
              const numJ = activeJs.length;
              let caps: number[] = [];
              if (teamsPerJudgeInput > 0) {
                caps = activeJs.map(() => teamsPerJudgeInput);
              } else {
                const base = Math.floor(totalTms / numJ);
                let rem = totalTms % numJ;
                caps = activeJs.map(() => {
                  let c = base;
                  if (rem > 0) {
                    c += 1;
                    rem--;
                  }
                  return c;
                });
              }

              let tmIdx = 0;
              let totalAssigned = 0;
              const previewRows = activeJs.map((j, idx) => {
                const limit = caps[idx] || 0;
                let count = 0;
                for (let c = 0; c < limit && tmIdx < totalTms; c++) {
                  count++;
                  tmIdx++;
                }
                totalAssigned += count;
                return { name: j.displayName, count };
              });

              return (
                <div className="space-y-2 p-3 rounded-lg bg-black/50 border border-[var(--color-apb-surface-border)]">
                  <div className="font-bold text-white uppercase text-[11px] flex justify-between border-b border-[var(--color-apb-surface-border)] pb-1.5">
                    <span>Distribution Preview</span>
                    <span className="text-[var(--color-apb-cyan)]">
                      Capacity: {totalAssigned} / {totalTms} Teams
                    </span>
                  </div>
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {previewRows.map((row, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] text-slate-300 font-mono">
                        <span>Judge 0{idx + 1} ({row.name})</span>
                        <span className="font-bold text-white">{row.count} Teams</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="flex gap-2 pt-2">
              <APBButton
                type="button"
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => setAutoDistributeOpen(false)}
              >
                Cancel
              </APBButton>
              <APBButton
                type="button"
                glow
                className="flex-1 text-xs uppercase"
                onClick={handleAutoAssign}
                disabled={autoAssigning}
              >
                {autoAssigning ? "Distributing..." : "Confirm Distribution"}
              </APBButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Judge Modal (§33) */}
      <Dialog open={addJudgeOpen} onOpenChange={setAddJudgeOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] font-mono">
          <DialogHeader>
            <DialogTitle className="text-lg uppercase text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-[var(--color-apb-cyan)]" /> Add Official Judge
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddJudgeSubmit} className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground uppercase">Judge Name *</Label>
              <Input
                placeholder="e.g. Rahul"
                value={judgeName}
                onChange={(e) => setJudgeName(e.target.value)}
                required
                className="font-mono text-xs bg-black/60"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground uppercase">Email Address *</Label>
              <Input
                type="email"
                placeholder="rahul@example.com"
                value={judgeEmail}
                onChange={(e) => setJudgeEmail(e.target.value)}
                required
                className="font-mono text-xs bg-black/60"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-muted-foreground uppercase">Password *</Label>
              <Input
                type="password"
                placeholder="Minimum 6 characters"
                value={judgePassword}
                onChange={(e) => setJudgePassword(e.target.value)}
                required
                minLength={6}
                className="font-mono text-xs bg-black/60"
              />
              <span className="text-[10px] text-muted-foreground block">
                Securely sets evaluator login credential in Firebase Auth.
              </span>
            </div>

            <div className="flex gap-2 pt-3">
              <APBButton type="button" variant="outline" className="flex-1" onClick={() => setAddJudgeOpen(false)}>
                Cancel
              </APBButton>
              <APBButton type="submit" glow className="flex-1" disabled={addingJudge}>
                {addingJudge ? "Creating..." : "Create Judge"}
              </APBButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
