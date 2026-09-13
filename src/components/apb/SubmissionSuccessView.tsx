"use client";

import React from "react";
import { APBCard } from "./APBCard";
import { Submission, Round } from "@/lib/firebase/schema";
import { CheckCircle2, Lock, FileText, Image as ImageIcon } from "lucide-react";

interface SubmissionSuccessViewProps {
  submission: Submission;
  round: Round;
  teamId: string;
  teamData?: {
    displayName?: string;
    eligibleRounds?: number[];
    [key: string]: any;
  } | null;
}

export function SubmissionSuccessView({
  submission,
  round,
  teamId,
  teamData,
}: SubmissionSuccessViewProps) {
  const formattedTime = new Date(submission.submittedAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const nextRoundNum = (round.roundNumber || 1) + 1;
  const isQualified =
    Boolean(round.qualifiedTeams?.includes(teamId)) ||
    Boolean(teamData?.eligibleRounds?.includes(nextRoundNum));
  const isResultsPublished = Boolean(round.resultsPublished);
  const isEvaluating = !isResultsPublished && (round.status === "CLOSED" || round.status === "JUDGING" || round.status === "RESULTS");

  return (
    <div className="w-full max-w-4xl mx-auto py-8 space-y-6">
      {/* Dynamic Status Card */}
      {isResultsPublished ? (
        isQualified ? (
          <APBCard className="p-8 text-center space-y-6 border-emerald-500/50 bg-emerald-950/20 backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-4 py-1.5 rounded-full border border-emerald-500/40">
                ★ Round Results Published
              </span>
              <h2 className="text-3xl sm:text-4xl font-mono font-bold uppercase text-white tracking-tight pt-2">
                🎉 Qualified for Round {nextRoundNum}!
              </h2>
              <p className="text-sm text-emerald-200/90 max-w-lg mx-auto">
                Outstanding performance! Your team has advanced to Round {nextRoundNum}.
                Prepare your workstation for the next prompt battle.
              </p>
            </div>

            {/* Score & Rank Highlight if available */}
            {submission.score != null && (
              <div className="inline-flex items-center gap-4 px-6 py-2.5 rounded-xl bg-black/60 border border-emerald-500/40 font-mono">
                <span className="text-xs text-muted-foreground uppercase">Official Final Score</span>
                <span className="text-2xl font-bold text-emerald-400">{submission.score} <span className="text-xs text-slate-400">/ 100</span></span>
              </div>
            )}
          </APBCard>
        ) : (
          <APBCard className="p-8 text-center space-y-6 border-slate-700 bg-slate-900/40 backdrop-blur-md">
            <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 bg-slate-800/80 px-4 py-1.5 rounded-full border border-slate-700">
                Round {round.roundNumber} Complete
              </span>
              <h2 className="text-3xl font-mono font-bold uppercase text-white tracking-tight pt-2">
                Thank You for Participating!
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto">
                Your team did not advance to Round {nextRoundNum}. We appreciate your energy and creativity in the AI Prompt Battle arena!
              </p>
            </div>

            {submission.score != null && (
              <div className="inline-flex items-center gap-4 px-6 py-2.5 rounded-xl bg-black/60 border border-slate-700 font-mono">
                <span className="text-xs text-muted-foreground uppercase">Round Score</span>
                <span className="text-2xl font-bold text-white">{submission.score} <span className="text-xs text-slate-400">/ 100</span></span>
              </div>
            )}
          </APBCard>
        )
      ) : isEvaluating ? (
        <APBCard className="p-8 text-center space-y-6 border-purple-500/40 bg-purple-950/20 backdrop-blur-md shadow-[0_0_25px_rgba(168,85,247,0.15)]">
          <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-400 flex items-center justify-center text-purple-300 mx-auto animate-pulse">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-purple-300 bg-purple-950/80 px-4 py-1.5 rounded-full border border-purple-500/40">
              Evaluation in Progress
            </span>
            <h2 className="text-3xl font-mono font-bold uppercase text-white tracking-tight pt-2">
              Results Pending
            </h2>
            <p className="text-sm text-purple-200/80 max-w-lg mx-auto">
              Judges and organizers are currently evaluating submissions for <strong className="text-white">Round {round.roundNumber}</strong>.
              Official scores and qualifications will appear here once released.
            </p>
          </div>
        </APBCard>
      ) : (
        <APBCard className="p-8 text-center space-y-6 border-emerald-500/30 bg-emerald-950/10 backdrop-blur-md">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
              ✓ Final Submission Recorded
            </span>
            <h2 className="text-3xl font-mono font-bold uppercase text-white tracking-tight">
              Submission Received
            </h2>
            <p className="text-sm text-slate-300 max-w-lg mx-auto">
              Your team&apos;s response for <strong className="text-white">Round {round.roundNumber}: {round.title}</strong> has been safely recorded in the competition vault.
            </p>
          </div>

          <p className="text-xs text-muted-foreground font-mono">
            Please keep this tab open and wait for the organizer to conclude the round and release further instructions.
          </p>
        </APBCard>
      )}

      {/* Read-only Review of Submitted Content */}
      <APBCard className="p-6 space-y-6 border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)]/60">
        <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white border-b border-[var(--color-apb-surface-border)] pb-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <span>Locked Submission Record</span>
        </h3>

        {/* Prompt */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--color-apb-cyan)]">
            <FileText className="w-3.5 h-3.5" />
            <span>Submitted Prompt</span>
          </div>
          <div className="bg-black/50 border border-[var(--color-apb-surface-border)] rounded-md p-4 font-mono text-sm text-slate-200 whitespace-pre-wrap">
            {submission.prompt || <span className="text-muted-foreground italic">No prompt text recorded.</span>}
          </div>
        </div>

        {/* Creative Asset if present */}
        {submission.member2Data?.imageUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-purple-400">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Submitted Creative Asset</span>
            </div>
            <div className="rounded-lg overflow-hidden border border-[var(--color-apb-surface-border)] bg-black/60 max-h-80 flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={submission.member2Data.imageUrl}
                alt="Submitted visual"
                className="max-h-72 object-contain w-auto mx-auto"
              />
            </div>
          </div>
        )}

        {/* Creative Text if present */}
        {submission.member2Data?.text && (
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Submitted Creative Notes
            </div>
            <div className="bg-black/50 border border-[var(--color-apb-surface-border)] rounded-md p-3 font-mono text-xs text-slate-300 whitespace-pre-wrap">
              {submission.member2Data.text}
            </div>
          </div>
        )}
      </APBCard>
    </div>
  );
}
