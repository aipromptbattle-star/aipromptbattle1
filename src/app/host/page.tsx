"use client";

import { StatusBadge } from "@/components/apb/StatusBadge";
import { useEventState, useCurrentRound } from "@/lib/firebase/events";
import { useTeams } from "@/lib/firebase/teams";
import { useAllSubmissions } from "@/lib/firebase/submissions";
import { useRounds } from "@/lib/firebase/rounds";
import { useJudgeScores } from "@/lib/firebase/judging";
import { compareSubmissionsDeterministically, aggregateJudgeScores } from "@/lib/scoring";
import { EventTimer } from "@/components/apb/EventTimer";
import { Loader2, CheckCircle2, Trophy, Clock, Users, Scale, Medal, Sparkles } from "lucide-react";

function WaitingScreen() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 text-center">
      <div className="space-y-2">
        <Clock className="w-16 h-16 text-[var(--color-apb-cyan)] mx-auto animate-pulse" />
        <h2 className="text-5xl md:text-6xl font-mono font-bold uppercase tracking-widest text-white">
          Get Ready
        </h2>
        <p className="text-2xl text-muted-foreground font-mono uppercase tracking-wider">
          Next round starting soon
        </p>
      </div>
    </div>
  );
}

function JudgingScreen({ roundNumber, roundTitle, scoredCount, totalCount }: {
  roundNumber: number;
  roundTitle: string;
  scoredCount: number;
  totalCount: number;
}) {
  const pct = totalCount > 0 ? Math.round((scoredCount / totalCount) * 100) : 0;
  return (
    <div className="flex flex-col items-center justify-center gap-8 text-center w-full max-w-2xl mx-auto">
      <div className="space-y-3">
        <Scale className="w-16 h-16 text-purple-400 mx-auto animate-bounce" />
        <h2 className="text-4xl md:text-5xl font-mono font-bold uppercase tracking-widest text-white">
          Round {roundNumber} Evaluations
        </h2>
        <p className="text-xl text-muted-foreground font-mono">{roundTitle}</p>
      </div>

      <div className="w-full space-y-3 bg-black/40 border border-[var(--color-apb-surface-border)] p-6 rounded-2xl">
        <div className="flex justify-between font-mono text-sm text-white">
          <span>Official Judging Progress</span>
          <span className="text-[var(--color-apb-cyan)] font-bold">{scoredCount} / {totalCount} Evaluations ({pct}%)</span>
        </div>
        <div className="h-4 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--color-apb-cyan)] to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs font-mono text-muted-foreground pt-2">
          Judges are currently reviewing and scoring submissions. Results will appear on this display shortly.
        </p>
      </div>
    </div>
  );
}

function ResultsScreen({
  roundNumber,
  roundTitle,
  submissions,
  teams,
  qualifiedTeams = [],
}: {
  roundNumber: number;
  roundTitle: string;
  submissions: { id: string; teamId: string; score?: number; criteriaScores?: Record<string, number | undefined>; submittedAt: number }[];
  teams: { teamId: string; displayName: string }[];
  qualifiedTeams?: string[];
}) {
  const scored = [...submissions]
    .filter((s) => s.score !== undefined)
    .sort((a, b) => compareSubmissionsDeterministically(a, b));

  const getTeamName = (teamId: string) => teams.find((t) => t.teamId === teamId)?.displayName ?? teamId;

  return (
    <div className="flex flex-col items-center gap-8 text-center w-full max-w-4xl mx-auto">
      <div className="space-y-2">
        <Trophy className="w-14 h-14 text-yellow-400 mx-auto" />
        <h2 className="text-4xl md:text-6xl font-mono font-bold uppercase tracking-widest text-white">
          Round {roundNumber} Standings
        </h2>
        <p className="text-xl text-muted-foreground font-mono">{roundTitle}</p>
      </div>

      <div className="w-full space-y-3">
        {scored.slice(0, 6).map((sub, i) => {
          const medals = ["🥇", "🥈", "🥉"];
          const medal = medals[i] ?? `#${i + 1}`;
          const isQualified = qualifiedTeams.includes(sub.teamId);

          return (
            <div
              key={sub.teamId}
              className={`flex items-center gap-4 px-6 py-4 rounded-xl bg-white/5 border transition-all ${
                isQualified ? "border-emerald-500/50 bg-emerald-950/20" : "border-white/10"
              }`}
              style={{ borderColor: i === 0 ? "rgba(250,204,21,0.5)" : undefined }}
            >
              <div className="text-3xl w-12 text-center">{medal}</div>
              <div className="flex-1 text-left">
                <div className="text-xl font-mono font-bold text-white flex items-center gap-3">
                  {getTeamName(sub.teamId)}
                  {isQualified && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-normal border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Qualified
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground font-mono">{sub.teamId}</div>
              </div>
              <div className="text-3xl font-mono font-bold text-[var(--color-apb-cyan)]">
                {sub.score}
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
            </div>
          );
        })}
        {scored.length === 0 && (
          <p className="text-xl text-muted-foreground font-mono">Scores not yet published.</p>
        )}
      </div>
    </div>
  );
}

export default function HostDisplay() {
  const { eventState, loading: eventLoading } = useEventState();
  const { currentRound, loading: roundLoading } = useCurrentRound(eventState?.currentRoundId || null);
  const { teams } = useTeams();
  const { rounds } = useRounds();
  const { submissions } = useAllSubmissions("currentEvent", currentRound?.id || null);

  // Find the last closed round with results published
  const publishedRound = [...rounds]
    .filter((r) => r.resultsPublished && (r.status === "RESULTS" || r.status === "JUDGING" || r.status === "CLOSED"))
    .sort((a, b) => b.roundNumber - a.roundNumber)[0];

  const { submissions: resultSubmissions } = useAllSubmissions("currentEvent", publishedRound?.id || null);
  const { scores: resultScores } = useJudgeScores(publishedRound?.id || null);

  if (eventLoading || roundLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[var(--color-apb-cyan)]" />
      </div>
    );
  }

  const isLive = currentRound && (currentRound.status === "LIVE" || currentRound.status === "PAUSED");
  const isJudging = currentRound && (currentRound.status === "CLOSED" || currentRound.status === "JUDGING") && !currentRound.resultsPublished;
  const showResults = publishedRound && !isLive;

  // Enriched result submissions with multi-judge scores
  const enrichedResultSubs = resultSubmissions.map((sub) => {
    const subScores = resultScores.filter((s) => s.submissionId === sub.id && s.status === "FINAL");
    if (subScores.length > 0) {
      const agg = aggregateJudgeScores(subScores);
      return {
        ...sub,
        score: sub.score !== undefined ? sub.score : agg.finalScore,
      };
    }
    return sub;
  });

  const scoredInCurrentRound = submissions.filter((s) => s.score !== undefined).length;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 relative overflow-hidden font-sans text-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[var(--color-apb-surface)] via-background to-background" />

      <div className="z-10 w-full max-w-5xl space-y-12">
        <header className="space-y-3">
          <h1 className="text-5xl md:text-7xl font-mono font-bold tracking-tighter uppercase text-white drop-shadow-[0_0_20px_rgba(0,240,255,0.4)]">
            AI Prompt Battle
          </h1>
          {eventState?.status === "ENDED" && (
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 font-mono text-sm uppercase">
              <Sparkles className="w-4 h-4" /> Championship Concluded
            </div>
          )}
        </header>

        {isLive ? (
          <div className="flex flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-4">
              <h2 className="text-4xl md:text-5xl font-mono font-bold text-white uppercase tracking-widest">
                Round {currentRound.roundNumber}: {currentRound.title}
              </h2>
              <StatusBadge status={currentRound.status} className="text-2xl px-4 py-1" />
            </div>
            <div className="py-8">
              <EventTimer round={currentRound} className="scale-150 transform" />
            </div>

            {/* Live Submission Counter */}
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-black/50 border border-[var(--color-apb-surface-border)] font-mono text-xl tracking-wider text-white">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <span>Teams Submitted:</span>
              <strong className="text-[var(--color-apb-cyan)]">
                {submissions.length} / {teams.length}
              </strong>
            </div>

            {/* Per-team progress bar */}
            <div className="w-full max-w-xl">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-apb-cyan)] rounded-full transition-all duration-500"
                  style={{ width: teams.length > 0 ? `${(submissions.length / teams.length) * 100}%` : "0%" }}
                />
              </div>
              <div className="flex justify-between text-xs font-mono text-muted-foreground mt-1">
                <span>0</span>
                <span>{teams.length} teams</span>
              </div>
            </div>
          </div>
        ) : isJudging ? (
          <JudgingScreen
            roundNumber={currentRound.roundNumber}
            roundTitle={currentRound.title}
            scoredCount={scoredInCurrentRound}
            totalCount={submissions.length}
          />
        ) : showResults ? (
          <ResultsScreen
            roundNumber={publishedRound.roundNumber}
            roundTitle={publishedRound.title}
            submissions={enrichedResultSubs}
            teams={teams}
            qualifiedTeams={publishedRound.qualifiedTeams || []}
          />
        ) : (
          <WaitingScreen />
        )}

        {/* Team count footer */}
        <footer className="flex items-center justify-center gap-2 text-muted-foreground font-mono text-sm">
          <Users className="w-4 h-4" />
          <span>{teams.filter((t) => t.active).length} active teams</span>
        </footer>
      </div>
    </div>
  );
}
