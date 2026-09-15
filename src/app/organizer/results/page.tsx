"use client";

import { useState, useMemo } from "react";
import { APBCard } from "@/components/apb/APBCard";
import { APBButton } from "@/components/apb/APBButton";
import { StatusBadge } from "@/components/apb/StatusBadge";
import { ConfirmationDialog } from "@/components/apb/ConfirmationDialog";
import { useRounds } from "@/lib/firebase/rounds";
import { useAllSubmissions } from "@/lib/firebase/submissions";
import { useTeams } from "@/lib/firebase/teams";
import { useQualifications, confirmQualifications, releaseNextRound } from "@/lib/firebase/qualifications";
import { useJudgeScores } from "@/lib/firebase/judging";
import { compareSubmissionsDeterministically, aggregateJudgeScores } from "@/lib/scoring";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { logAudit } from "@/lib/firebase/teams";
import { Submission } from "@/lib/firebase/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Trophy,
  Eye,
  EyeOff,
  CheckCircle2,
  Play,
  ShieldCheck,
  HelpCircle,
  Download,
  ListFilter,
  Check,
  AlertTriangle,
  XCircle,
  Copy,
  Users,
} from "lucide-react";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-yellow-400 font-mono font-bold text-base">🥇 1st</span>;
  if (rank === 2) return <span className="text-gray-300 font-mono font-bold text-base">🥈 2nd</span>;
  if (rank === 3) return <span className="text-amber-600 font-mono font-bold text-base">🥉 3rd</span>;
  return <span className="text-muted-foreground font-mono font-bold">#{rank}</span>;
}

export default function OrganizerResults() {
  const { rounds, loading: roundsLoading } = useRounds();
  const { teams } = useTeams();
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  // Dual Qualification Mode: "TOP_N" vs "MANUAL"
  const [qualMode, setQualMode] = useState<"TOP_N" | "MANUAL">("TOP_N");
  const [topNInput, setTopNInput] = useState<number>(8);
  const [manualInput, setManualInput] = useState<string>("");

  // Staged / Confirmed Qualified Team IDs
  const [selectedQualified, setSelectedQualified] = useState<string[]>([]);
  const [confirmQualOpen, setConfirmQualOpen] = useState(false);
  const [confirmingQual, setConfirmingQual] = useState(false);

  // Release Next Round State
  const [releaseNextOpen, setReleaseNextOpen] = useState(false);
  const [releasingNext, setReleasingNext] = useState(false);

  const closedRounds = rounds.filter(
    (r) => r.status === "CLOSED" || r.status === "JUDGING" || r.status === "RESULTS"
  );
  const selectedRound = closedRounds.find((r) => r.id === selectedRoundId) ?? closedRounds[0] ?? null;
  const activeRoundId = selectedRound?.id ?? null;

  const { submissions, loading: subsLoading } = useAllSubmissions("currentEvent", activeRoundId);
  const { scores } = useJudgeScores(activeRoundId);
  const { qualifications } = useQualifications(activeRoundId);

  const teamMap = useMemo(() => {
    const map = new Map<string, string>();
    teams.forEach((t) => {
      if (t.teamId) {
        map.set(t.teamId.toUpperCase(), t.displayName || t.teamId);
      }
    });
    return map;
  }, [teams]);

  const getTeamName = (teamId: string) => teamMap.get(teamId.toUpperCase()) || teamId;

  // Next round candidate if exists
  const nextRound = selectedRound
    ? rounds.find((r) => r.roundNumber === selectedRound.roundNumber + 1)
    : null;

  // Aggregate multi-judge scores onto each submission if judge scores exist
  const enrichedSubmissions = submissions.map((sub) => {
    const subJudgeScores = scores.filter((s) => s.submissionId === sub.id && s.status === "FINAL");
    if (subJudgeScores.length > 0) {
      const agg = aggregateJudgeScores(subJudgeScores);
      return {
        ...sub,
        score: sub.score !== undefined ? sub.score : agg.finalScore,
      };
    }
    return sub;
  });

  // Deterministic Leaderboard Sorting: 1. Final score DESC, 2. Earlier valid submission timestamp ASC
  const scoredSubmissions = enrichedSubmissions.filter((s) => s.score !== undefined);
  const unscoredSubmissions = enrichedSubmissions.filter((s) => s.score === undefined);

  const ranked: (Submission & { rank: number })[] = [...scoredSubmissions]
    .sort((a, b) => compareSubmissionsDeterministically(a, b))
    .map((s, idx) => ({ ...s, rank: idx + 1 }));

  // Existing confirmed qualified teams list from qualifications collection or round doc
  const confirmedQualifiedTeams =
    selectedRound?.qualifiedTeams && selectedRound.qualifiedTeams.length > 0
      ? selectedRound.qualifiedTeams
      : qualifications.filter((q) => q.qualified).map((q) => q.teamId);

  // Manual input validation parsing
  const manualValidation = useMemo(() => {
    const tokens = manualInput
      .split(/[\n,\s]+/)
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);

    const seen = new Set<string>();
    const duplicates = new Set<string>();
    const validTeams: string[] = [];
    const invalidTeams: string[] = [];

    tokens.forEach((id) => {
      if (seen.has(id)) {
        duplicates.add(id);
      } else {
        seen.add(id);
        if (teamMap.has(id)) {
          validTeams.push(id);
        } else {
          invalidTeams.push(id);
        }
      }
    });

    return {
      tokens,
      validTeams,
      invalidTeams,
      duplicateTeams: Array.from(duplicates),
    };
  }, [manualInput, teamMap]);

  // Derived effective qualified teams depending on user action / mode
  const effectiveQualified = useMemo(() => {
    if (selectedQualified.length > 0) {
      return selectedQualified;
    }
    if (qualMode === "TOP_N") {
      const n = Math.max(0, topNInput || 0);
      return ranked.slice(0, n).map((s) => s.teamId);
    }
    if (qualMode === "MANUAL") {
      return manualValidation.validTeams;
    }
    return confirmedQualifiedTeams;
  }, [selectedQualified, qualMode, topNInput, ranked, manualValidation.validTeams, confirmedQualifiedTeams]);

  const handleToggleQualify = (teamId: string) => {
    const current = [...effectiveQualified];
    const next = current.includes(teamId)
      ? current.filter((id) => id !== teamId)
      : [...current, teamId];
    setSelectedQualified(next);
  };

  const handleConfirmQualification = async () => {
    if (!selectedRound) return;
    setConfirmingQual(true);
    try {
      const rankings = ranked.map((r) => ({
        teamId: r.teamId,
        rank: r.rank,
        score: r.score ?? 0,
      }));

      // Automatic next-round entry on publish
      const nextRoundInfo = nextRound
        ? { nextRoundId: nextRound.id, nextRoundNumber: nextRound.roundNumber }
        : undefined;

      await confirmQualifications(
        "currentEvent",
        selectedRound.id,
        effectiveQualified,
        rankings,
        "ORGANIZER",
        nextRoundInfo
      );

      // Also publish results for the round
      await updateDoc(doc(db, "rounds", selectedRound.id), {
        resultsPublished: true,
        status: "RESULTS",
        updatedAt: Date.now(),
      });

      setConfirmQualOpen(false);
      alert(
        `Success! Qualification published for ${effectiveQualified.length} teams.${
          nextRound
            ? ` ${effectiveQualified.length} teams have been automatically placed into Round ${nextRound.roundNumber} waiting room.`
            : ""
        }`
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to confirm qualifications.");
    } finally {
      setConfirmingQual(false);
    }
  };

  const handleReleaseNextRound = async () => {
    if (!selectedRound || !nextRound) return;
    if (effectiveQualified.length === 0) {
      alert("Please qualify at least one team before releasing the next round.");
      return;
    }
    setReleasingNext(true);
    try {
      await releaseNextRound(
        selectedRound.id,
        nextRound.id,
        nextRound.roundNumber,
        effectiveQualified,
        "ORGANIZER"
      );
      setReleaseNextOpen(false);
      alert(
        `Round ${nextRound.roundNumber} released! ${effectiveQualified.length} qualified teams now have access.`
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to release next round.");
    } finally {
      setReleasingNext(false);
    }
  };

  const handlePublish = async (publish: boolean) => {
    if (!selectedRound) return;
    setPublishing(true);
    try {
      await updateDoc(doc(db, "rounds", selectedRound.id), {
        resultsPublished: publish,
        status: publish ? "RESULTS" : "JUDGING",
        updatedAt: Date.now(),
      });
      await logAudit(publish ? "RESULTS_PUBLISHED" : "RESULTS_UNPUBLISHED", "ORGANIZER", {
        metadata: { roundId: selectedRound.id, roundNumber: selectedRound.roundNumber },
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update results.");
    } finally {
      setPublishing(false);
    }
  };

  const handleExportCSV = () => {
    if (!selectedRound || ranked.length === 0) return;
    const headers = ["Rank", "Team ID", "Team Name", "Score", "Qualification Status", "Submission Timestamp"];
    const rows = ranked.map((sub) => {
      const isQual = effectiveQualified.includes(sub.teamId);
      const tName = getTeamName(sub.teamId).replace(/"/g, '""');
      const timeStr = new Date(sub.submittedAt).toISOString();
      return [
        sub.rank,
        `"${sub.teamId}"`,
        `"${tName}"`,
        sub.score ?? 0,
        isQual ? "QUALIFIED" : "NOT_QUALIFIED",
        `"${timeStr}"`,
      ].join(",");
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `APB_Round_${selectedRound.roundNumber}_Leaderboard.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (roundsLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-apb-cyan)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-mono font-bold uppercase tracking-wider text-white">
            Results & Leaderboard
          </h2>
          <p className="text-muted-foreground text-sm">
            Deterministic ranking, dual qualification (Top N or Manual), and automated next-round entry.
          </p>
        </div>

        {/* Tie-Break Legend & Export Button */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-apb-surface)] border border-[var(--color-apb-surface-border)] text-xs font-mono text-muted-foreground">
            <HelpCircle className="w-3.5 h-3.5 text-[var(--color-apb-cyan)]" />
            <span>Tie-Break: 1. Final Score DESC → 2. Earlier Timestamp ASC</span>
          </div>

          <APBButton
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={ranked.length === 0}
            className="text-xs font-mono"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-[var(--color-apb-cyan)]" />
            Export CSV
          </APBButton>
        </div>
      </header>

      {closedRounds.length === 0 ? (
        <div className="h-48 border border-dashed border-[var(--color-apb-surface-border)] rounded-lg flex items-center justify-center text-muted-foreground font-mono">
          No completed rounds available.
        </div>
      ) : (
        <>
          {/* Round Selector Buttons */}
          <div className="flex flex-wrap gap-2">
            {closedRounds.map((r) => (
              <APBButton
                key={r.id}
                size="sm"
                variant={selectedRound?.id === r.id ? "default" : "outline"}
                onClick={() => {
                  setSelectedRoundId(r.id);
                  setSelectedQualified([]);
                }}
              >
                Round {r.roundNumber}: {r.title}
                <StatusBadge status={r.status} className="ml-2 text-[10px]" />
              </APBButton>
            ))}
          </div>

          {/* Action Toolbar: Results Publication & Next Round Release */}
          {selectedRound && (
            <div className="p-5 rounded-lg bg-[var(--color-apb-surface)] border border-[var(--color-apb-surface-border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-sm font-mono text-white flex items-center gap-2">
                  <span>Participant Visibility:</span>
                  {selectedRound.resultsPublished ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Eye className="w-4 h-4" /> Published (Live to participants)
                    </span>
                  ) : (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <EyeOff className="w-4 h-4" /> Draft / Hidden (Participants see &quot;Results Pending&quot;)
                    </span>
                  )}
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  Qualified Teams: <strong className="text-white">{effectiveQualified.length}</strong> selected
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Publish Toggle */}
                {selectedRound.resultsPublished ? (
                  <APBButton
                    size="sm"
                    variant="outline"
                    onClick={() => handlePublish(false)}
                    disabled={publishing}
                    className="text-xs"
                  >
                    <EyeOff className="w-3.5 h-3.5 mr-1.5" /> Unpublish
                  </APBButton>
                ) : (
                  <APBButton
                    size="sm"
                    glow
                    onClick={() => handlePublish(true)}
                    disabled={publishing || ranked.length === 0}
                    className="text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" /> Publish Results
                  </APBButton>
                )}

                {/* Confirm & Publish Qualification */}
                <APBButton
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmQualOpen(true)}
                  disabled={effectiveQualified.length === 0}
                  className="text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Confirm & Publish Qualification ({effectiveQualified.length})
                </APBButton>

                {/* Release Next Round Button */}
                {nextRound && (
                  <APBButton
                    size="sm"
                    glow
                    onClick={() => setReleaseNextOpen(true)}
                    disabled={effectiveQualified.length === 0}
                    className="text-xs"
                  >
                    <Play className="w-3.5 h-3.5 mr-1.5" /> Release Round {nextRound.roundNumber}
                  </APBButton>
                )}
              </div>
            </div>
          )}

          {/* DUAL QUALIFICATION CONTROL PANEL */}
          <APBCard className="p-5 space-y-4 border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)]">
            <div className="flex items-center justify-between border-b border-[var(--color-apb-surface-border)] pb-3">
              <div className="flex items-center gap-2">
                <ListFilter className="w-5 h-5 text-[var(--color-apb-cyan)]" />
                <h3 className="text-base font-mono font-bold uppercase text-white">
                  Qualification Management (Dual Mode)
                </h3>
              </div>
              {/* Mode Toggle Tabs */}
              <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-[var(--color-apb-surface-border)]">
                <button
                  type="button"
                  onClick={() => {
                    setQualMode("TOP_N");
                    setSelectedQualified([]);
                  }}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                    qualMode === "TOP_N"
                      ? "bg-[var(--color-apb-cyan)] text-black"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  Option A: Top N
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQualMode("MANUAL");
                    setSelectedQualified([]);
                  }}
                  className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                    qualMode === "MANUAL"
                      ? "bg-[var(--color-apb-cyan)] text-black"
                      : "text-muted-foreground hover:text-white"
                  }`}
                >
                  Option B: Manual Team IDs
                </button>
              </div>
            </div>

            {/* OPTION A: TOP N */}
            {qualMode === "TOP_N" && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Label htmlFor="topNInput" className="font-mono text-sm uppercase text-white shrink-0">
                      Qualify Top:
                    </Label>
                    <div className="w-28">
                      <Input
                        id="topNInput"
                        type="number"
                        min={1}
                        max={ranked.length || 100}
                        value={topNInput}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setTopNInput(val);
                          setSelectedQualified([]);
                        }}
                        className="font-mono text-lg font-bold text-center h-10 border-[var(--color-apb-cyan)]/50 bg-black/60 text-[var(--color-apb-cyan)]"
                      />
                    </div>
                    <span className="font-mono text-sm text-white">Teams</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-muted-foreground">Presets:</span>
                    {[2, 4, 8, 16, 20, 32].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => {
                          setTopNInput(n);
                          setSelectedQualified([]);
                        }}
                        className={`px-2.5 py-1 rounded border text-xs font-mono ${
                          topNInput === n
                            ? "bg-[var(--color-apb-cyan)] text-black border-[var(--color-apb-cyan)] font-bold"
                            : "bg-black/40 border-slate-700 text-slate-300 hover:text-white"
                        }`}
                      >
                        Top {n}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Preview Banner / Edge Case Feedback */}
                {topNInput <= 0 ? (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs font-mono text-amber-400">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Validation: 0 teams entered. Please enter a positive number of teams (e.g. 8, 16, 20).</span>
                    </div>
                    <span className="text-muted-foreground">0 teams selected</span>
                  </div>
                ) : topNInput > ranked.length ? (
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-between text-xs font-mono text-yellow-300">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        Notice: Input ({topNInput}) exceeds available evaluated teams ({ranked.length}). All {ranked.length} evaluated teams will be selected.
                      </span>
                    </div>
                    <span className="text-muted-foreground">({ranked.length} teams selected)</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-[var(--color-apb-cyan)]/10 border border-[var(--color-apb-cyan)]/30 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2 text-[var(--color-apb-cyan)]">
                      <Check className="w-4 h-4" />
                      <span>
                        Live Preview: <strong>{Math.min(topNInput, ranked.length)} teams</strong> will qualify for Round {nextRound ? nextRound.roundNumber : (selectedRound ? selectedRound.roundNumber + 1 : 2)}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      (Top {Math.min(topNInput, ranked.length)} rows highlighted below in leaderboard)
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* OPTION B: MANUAL TEAM IDS */}
            {qualMode === "MANUAL" && (
              <div className="space-y-3">
                <div>
                  <Label className="font-mono text-xs uppercase text-muted-foreground block mb-1">
                    Enter Team IDs (one per line or comma/space-separated):
                  </Label>
                  <textarea
                    value={manualInput}
                    onChange={(e) => {
                      setManualInput(e.target.value);
                      setSelectedQualified([]);
                    }}
                    placeholder={"APB-001\nAPB-002, APB-003"}
                    rows={4}
                    className="w-full bg-black/60 border border-[var(--color-apb-surface-border)] rounded-md p-3 font-mono text-xs text-white placeholder:text-muted-foreground focus:outline-none focus:border-[var(--color-apb-cyan)]"
                  />
                </div>

                {/* Real-time Validation Counters */}
                <div className="flex items-center gap-3 flex-wrap text-xs font-mono">
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Valid Teams: {manualValidation.validTeams.length}</span>
                  </div>

                  {manualValidation.invalidTeams.length > 0 && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Invalid IDs ({manualValidation.invalidTeams.length}): {manualValidation.invalidTeams.join(", ")}</span>
                    </div>
                  )}

                  {manualValidation.duplicateTeams.length > 0 && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Duplicates ({manualValidation.duplicateTeams.length}): {manualValidation.duplicateTeams.join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </APBCard>

          {/* SIMPLE LEADERBOARD TABLE */}
          {subsLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--color-apb-cyan)]" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" /> Leaderboard Standings ({ranked.length})
                </h3>
                <span className="text-xs font-mono text-muted-foreground">
                  Showing all evaluated teams
                </span>
              </div>

              {ranked.length === 0 ? (
                <div className="p-8 border border-dashed border-[var(--color-apb-surface-border)] rounded-lg text-center text-muted-foreground font-mono text-xs">
                  No evaluated submissions available for this round.
                </div>
              ) : (
                <div className="rounded-lg border border-[var(--color-apb-surface-border)] overflow-hidden bg-[var(--color-apb-surface)]">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-[var(--color-apb-surface-border)] bg-black/40 text-muted-foreground uppercase text-[11px]">
                        <th className="py-3 px-4 w-20 text-center">Rank</th>
                        <th className="py-3 px-4 w-36">Team ID</th>
                        <th className="py-3 px-4">Team Name</th>
                        <th className="py-3 px-4 w-28 text-right">Score</th>
                        <th className="py-3 px-4 w-44 text-center">Qualification Status</th>
                        <th className="py-3 px-4 w-24 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-apb-surface-border)]/60">
                      {ranked.map((sub) => {
                        const isQualified = effectiveQualified.includes(sub.teamId);
                        return (
                          <tr
                            key={sub.id}
                            className={`transition-colors ${
                              isQualified
                                ? "bg-emerald-950/20 hover:bg-emerald-950/30"
                                : "hover:bg-white/[0.02]"
                            }`}
                          >
                            <td className="py-3 px-4 text-center font-bold">
                              <RankBadge rank={sub.rank} />
                            </td>
                            <td className="py-3 px-4 font-bold text-white tracking-wider">
                              {sub.teamId}
                            </td>
                            <td className="py-3 px-4 text-slate-200">
                              {getTeamName(sub.teamId)}
                            </td>
                            <td className="py-3 px-4 text-right text-base font-bold text-[var(--color-apb-cyan)]">
                              {sub.score}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {isQualified ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase text-[10px]">
                                  <CheckCircle2 className="w-3 h-3" /> Qualified
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 uppercase text-[10px]">
                                  Not Qualified
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => handleToggleQualify(sub.teamId)}
                                className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                                  isQualified
                                    ? "border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                                    : "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                                }`}
                              >
                                {isQualified ? "Remove" : "Qualify"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Unscored section */}
              {unscoredSubmissions.length > 0 && (
                <div className="space-y-2 pt-4">
                  <h4 className="text-xs font-mono uppercase text-muted-foreground">
                    Pending Evaluations ({unscoredSubmissions.length})
                  </h4>
                  {unscoredSubmissions.map((sub) => (
                    <APBCard key={sub.id} className="p-3 flex items-center gap-3 opacity-60">
                      <div className="text-muted-foreground font-mono text-sm">—</div>
                      <div className="flex-1">
                        <div className="font-mono text-sm text-white">{getTeamName(sub.teamId)}</div>
                        <div className="text-xs text-muted-foreground">{sub.teamId}</div>
                      </div>
                      <div className="text-xs text-amber-400 font-mono">Evaluation pending</div>
                    </APBCard>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CONFIRMATION & PUBLISH QUALIFICATION DIALOG */}
          <ConfirmationDialog
            open={confirmQualOpen}
            onOpenChange={setConfirmQualOpen}
            title={`Confirm & Publish Qualification (Round ${selectedRound.roundNumber})`}
            description={`QUALIFICATION SUMMARY:
• Method: ${qualMode === "TOP_N" ? `Option A — Top ${Math.max(0, topNInput)}` : "Option B — Manual Team IDs"}
• Selected Teams: ${effectiveQualified.length} teams
• Target Next Round: Round ${nextRound ? nextRound.roundNumber : (selectedRound.roundNumber + 1)}

SELECTED TEAMS FOR PROMOTION:
${effectiveQualified.map((id) => {
  const tName = getTeamName(id);
  const rk = ranked.find(r => r.teamId === id)?.rank;
  return `${rk ? `#${rk} ` : ""}${id}${tName && tName !== id ? ` (${tName})` : ""}`;
}).slice(0, 20).join("\n")}${effectiveQualified.length > 20 ? `\n...and ${effectiveQualified.length - 20} more teams` : ""}

IMPORTANT:
Publishing commits qualification for this round and automatically enrolls these teams into the Round ${nextRound ? nextRound.roundNumber : 2} participant pool. The organizer still manually releases Round ${nextRound ? nextRound.roundNumber : 2} when ready.`}
            confirmText={confirmingQual ? "Publishing..." : "Confirm & Publish Qualification"}
            onConfirm={handleConfirmQualification}
          />

          {/* Release Next Round Dialog */}
          {nextRound && (
            <ConfirmationDialog
              open={releaseNextOpen}
              onOpenChange={setReleaseNextOpen}
              title={`Release Round ${nextRound.roundNumber}: ${nextRound.title}?`}
              description={`This action authoritatively unlocks Round ${nextRound.roundNumber} exclusively for the ${effectiveQualified.length} qualified teams. Non-qualified teams will remain locked out.`}
              confirmText={releasingNext ? "Releasing..." : "Release Next Round"}
              onConfirm={handleReleaseNextRound}
            />
          )}
        </>
      )}
    </div>
  );
}

