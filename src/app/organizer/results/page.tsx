"use client";

import { useState } from "react";
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
import {
  Loader2,
  Trophy,
  Eye,
  EyeOff,
  CheckCircle2,
  Medal,
  Play,
  ShieldCheck,
  Award,
  Sparkles,
  HelpCircle,
} from "lucide-react";

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-yellow-400 font-mono font-bold text-lg">🥇 1st</span>;
  if (rank === 2) return <span className="text-gray-300 font-mono font-bold text-lg">🥈 2nd</span>;
  if (rank === 3) return <span className="text-amber-600 font-mono font-bold text-lg">🥉 3rd</span>;
  return <span className="text-muted-foreground font-mono font-bold">#{rank}</span>;
}

export default function OrganizerResults() {
  const { rounds, loading: roundsLoading } = useRounds();
  const { teams } = useTeams();
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  // Qualification State
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

  const getTeamName = (teamId: string) =>
    teams.find((t) => t.teamId === teamId)?.displayName ?? teamId;

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

  // Deterministic Leaderboard Sorting
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

  const effectiveQualified =
    selectedQualified.length > 0 ? selectedQualified : confirmedQualifiedTeams;

  const handleToggleQualify = (teamId: string) => {
    const current = [...effectiveQualified];
    const next = current.includes(teamId)
      ? current.filter((id) => id !== teamId)
      : [...current, teamId];
    setSelectedQualified(next);
  };

  const handleSelectTopN = (n: number) => {
    const topIds = ranked.slice(0, n).map((s) => s.teamId);
    setSelectedQualified(topIds);
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

      await confirmQualifications(
        selectedRound.id,
        selectedRound.id,
        effectiveQualified,
        rankings,
        "ORGANIZER"
      );
      setConfirmQualOpen(false);
      alert(`Confirmed qualification for ${effectiveQualified.length} teams.`);
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
            Deterministic ranking, qualification confirmation, and next-round access management.
          </p>
        </div>

        {/* Tie-Break Legend */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--color-apb-surface)] border border-[var(--color-apb-surface-border)] text-xs font-mono text-muted-foreground">
          <HelpCircle className="w-3.5 h-3.5 text-[var(--color-apb-cyan)]" />
          <span>Tie-Break Order: Score → Prompt Quality → Creativity → Earlier Timestamp</span>
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

                {/* Confirm Qualification */}
                <APBButton
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmQualOpen(true)}
                  disabled={effectiveQualified.length === 0}
                  className="text-xs border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                >
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Confirm Qualification ({effectiveQualified.length})
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

          {/* Quick Selection Helpers */}
          {ranked.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span>Quick Select:</span>
              <button
                onClick={() => handleSelectTopN(2)}
                className="px-2 py-1 rounded bg-black/40 border border-[var(--color-apb-surface-border)] hover:text-white"
              >
                Top 2
              </button>
              <button
                onClick={() => handleSelectTopN(4)}
                className="px-2 py-1 rounded bg-black/40 border border-[var(--color-apb-surface-border)] hover:text-white"
              >
                Top 4
              </button>
              <button
                onClick={() => handleSelectTopN(8)}
                className="px-2 py-1 rounded bg-black/40 border border-[var(--color-apb-surface-border)] hover:text-white"
              >
                Top 8
              </button>
              <button
                onClick={() => setSelectedQualified([])}
                className="px-2 py-1 rounded bg-black/40 border border-[var(--color-apb-surface-border)] hover:text-white"
              >
                Clear Selection
              </button>
            </div>
          )}

          {/* Leaderboard Table / Cards */}
          {subsLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--color-apb-cyan)]" />
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" /> Deterministic Standings ({ranked.length})
              </h3>

              <div className="space-y-2.5">
                {ranked.map((sub) => {
                  const isQualified = effectiveQualified.includes(sub.teamId);
                  return (
                    <APBCard
                      key={sub.id}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-all ${
                        isQualified ? "border-emerald-500/60 bg-emerald-950/10" : ""
                      }`}
                    >
                      <div className="w-20 text-center">
                        <RankBadge rank={sub.rank} />
                      </div>

                      <div className="flex-1 space-y-0.5">
                        <div className="font-mono font-bold text-white text-base">
                          {getTeamName(sub.teamId)}
                        </div>
                        <div className="text-xs font-mono text-muted-foreground flex items-center gap-3">
                          <span>ID: {sub.teamId}</span>
                          <span>•</span>
                          <span>Submitted: {new Date(sub.submittedAt).toLocaleTimeString()}</span>
                          {sub.criteriaScores?.promptQuality !== undefined && (
                            <>
                              <span>•</span>
                              <span>PQ: {sub.criteriaScores.promptQuality}</span>
                              <span>CR: {sub.criteriaScores?.creativity ?? 0}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Score Display */}
                      <div className="text-right sm:px-4">
                        <div className="text-3xl font-mono font-bold text-[var(--color-apb-cyan)]">
                          {sub.score}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground uppercase">
                          Final Score
                        </div>
                      </div>

                      {/* Qualification Toggle */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--color-apb-surface-border)]">
                        {isQualified && (
                          <span className="flex items-center gap-1 text-emerald-400 text-xs font-mono font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Qualified
                          </span>
                        )}

                        <APBButton
                          size="sm"
                          variant={isQualified ? "destructive" : "outline"}
                          onClick={() => handleToggleQualify(sub.teamId)}
                          className="text-xs h-8"
                        >
                          <Medal className="w-3.5 h-3.5 mr-1" />
                          {isQualified ? "Remove" : "Qualify"}
                        </APBButton>
                      </div>
                    </APBCard>
                  );
                })}
              </div>

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

          {/* Confirm Qualification Dialog */}
          <ConfirmationDialog
            open={confirmQualOpen}
            onOpenChange={setConfirmQualOpen}
            title="Confirm Qualifications?"
            description={`You are about to lock in ${effectiveQualified.length} qualified teams for Round ${selectedRound.roundNumber}. This record is preserved in the qualifications audit collection.`}
            confirmText={confirmingQual ? "Saving..." : "Confirm & Save"}
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
