"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTeamSession } from "@/lib/auth/TeamSessionContext";
import { useEventState, useCurrentRound } from "@/lib/firebase/events";
import { useDraft } from "@/lib/firebase/drafts";
import { useTeamRoundState, useSubmission } from "@/lib/firebase/submissions";
import { APBCard } from "@/components/apb/APBCard";
import { APBButton } from "@/components/apb/APBButton";
import { StatusBadge } from "@/components/apb/StatusBadge";
import { TeamWorkspaceHeader } from "@/components/apb/TeamWorkspaceHeader";
import { ChallengePanel } from "@/components/apb/ChallengePanel";
import { PromptEditor } from "@/components/apb/PromptEditor";
import { CreativeWorkspace } from "@/components/apb/CreativeWorkspace";
import { SubmissionReviewDialog } from "@/components/apb/SubmissionReviewDialog";
import { SubmissionSuccessView } from "@/components/apb/SubmissionSuccessView";
import { QuizWorkspace } from "@/components/apb/QuizWorkspace";
import { ProgressiveConstraintWorkspace } from "@/components/apb/ProgressiveConstraintWorkspace";
import { Loader2, Send, Lock, PauseCircle, WifiOff, Users, Clock, Sparkles } from "lucide-react";

export default function ParticipantDashboard() {
  const { teamId, eventId, teamData,  loading: sessionLoading, leaveTeam } = useTeamSession();
  const { eventState, loading: eventLoading } = useEventState();
  const { currentRound, loading: roundLoading } = useCurrentRound(eventState?.currentRoundId || null);
  const router = useRouter();

  const [reviewOpen, setReviewOpen] = useState(false);
  
  const [isOnline, setIsOnline] = useState(true);

  // Security UI deterrents (§31): discourage right-click and common inspect shortcuts on participant workstations
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j")) ||
        ((e.ctrlKey || e.metaKey) && (e.key === "u" || e.key === "U"))
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    });
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Draft hook
  const { draft, saveStatus, updateDraft, saveNow } = useDraft(
    eventId,
    teamId,
    currentRound?.id || null
  );

  // Submission & Team State hooks
  const { teamRoundState } = useTeamRoundState(
    eventId,
    teamId,
    currentRound?.id || null
  );
  const { submission } = useSubmission(
    eventId,
    teamId,
    currentRound?.id || null
  );

  const initialLoading = sessionLoading || eventLoading || roundLoading;

  useEffect(() => {
    if (!sessionLoading && (!teamId || !eventId)) {
      router.push("/login");
    }
  }, [teamId, eventId, sessionLoading, router]);

  if (initialLoading || !teamId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-apb-cyan)]" />
      </div>
    );
  }

  const handleLogout = () => {
    leaveTeam();
    router.push("/");
  };

  // Check round eligibility: eliminated teams cannot participate in later rounds
  const isEligibleForRound =
    !currentRound ||
    !teamData?.eligibleRounds ||
    teamData.eligibleRounds.length === 0 ||
    teamData.eligibleRounds.includes(currentRound.roundNumber);

  if (!isEligibleForRound) {
    return (
      <div className="min-h-screen bg-[#07080b] flex flex-col font-sans select-none">
        <header className="border-b border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-mono font-bold tracking-widest uppercase text-white">
              AI Prompt Battle
            </h1>
            <StatusBadge status="CLOSED" className="hidden sm:inline-flex" />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-mono text-white font-bold">{teamId}</div>
              <div className="text-xs text-muted-foreground uppercase">
                {teamData?.displayName || "Participant"}
              </div>
            </div>
            <APBButton variant="ghost" size="sm" onClick={handleLogout}>
              Leave
            </APBButton>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <APBCard className="max-w-2xl w-full p-8 text-center space-y-6 border-slate-800 bg-slate-950/70 backdrop-blur-md">
            <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 bg-slate-900 px-4 py-1.5 rounded-full border border-slate-800">
                Round {currentRound.roundNumber} In Progress
              </span>
              <h2 className="text-2xl sm:text-3xl font-mono text-white uppercase tracking-wider pt-2">
                Team Eliminated
              </h2>
              <p className="text-sm text-slate-300 max-w-md mx-auto">
                Your team was not qualified for Round {currentRound.roundNumber}.
                Only teams qualified from earlier rounds may enter this arena.
              </p>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Thank you for participating! You can follow the live broadcast on the stage display.
            </p>
          </APBCard>
        </main>
      </div>
    );
  }

  // State 1: Participant Waiting Room (§4 Design)
  if (!currentRound || currentRound.status === "READY" || currentRound.status === "DRAFT") {
    const roundNumberFormatted = currentRound ? `ROUND ${currentRound.roundNumber.toString().padStart(2, "0")}` : "ROUND 01";

    return (
      <div className="min-h-screen bg-[#07080b] flex flex-col font-sans select-none relative overflow-hidden">
        {/* Subtle background lighting accent */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,240,255,0.03)_0,_transparent_70%)]" />

        <header className="border-b border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)]/90 backdrop-blur px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold tracking-[0.25em] text-[var(--color-apb-cyan)] uppercase">
              AI PROMPT BATTLE
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm font-mono text-white font-bold tracking-wider">{teamId}</div>
              <div className="text-[11px] text-muted-foreground uppercase font-mono">
                {teamData?.displayName || "Participant"}
              </div>
            </div>
            <APBButton variant="ghost" size="sm" onClick={handleLogout} className="text-xs font-mono uppercase">
              Leave
            </APBButton>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 flex items-center justify-center z-10">
          <APBCard className="max-w-xl w-full p-8 sm:p-12 text-center space-y-8 bg-[var(--color-apb-surface)]/95 border-[var(--color-apb-surface-border)] shadow-2xl">
            {/* Round Title & Status */}
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-[0.25em] text-[var(--color-apb-cyan)]">
                AI PROMPT BATTLE
              </span>
              <h2 className="text-3xl sm:text-4xl font-mono font-black text-white tracking-wider">
                {roundNumberFormatted}
              </h2>
              <div className="pt-2">
                <span className="inline-flex items-center px-4 py-1 rounded-full bg-[var(--color-apb-cyan)]/15 border border-[var(--color-apb-cyan)]/40 text-[var(--color-apb-cyan)] font-mono text-xs font-extrabold tracking-widest uppercase animate-pulse">
                  READY
                </span>
              </div>
            </div>

            {/* Team Identity */}
            <div className="p-4 rounded-xl bg-black/50 border border-[var(--color-apb-surface-border)] space-y-1">
              <div className="text-lg sm:text-xl font-mono font-bold text-white tracking-wider">
                TEAM {teamId}
              </div>
              <div className="text-xs font-mono text-muted-foreground uppercase tracking-wide">
                {teamData?.displayName || "Team Station"}
              </div>
            </div>

            {/* Connected Indicators (§4) */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-300 uppercase tracking-widest block">
                TEAM MEMBERS CONNECTED
              </span>
              <div className="flex items-center justify-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
              </div>
            </div>

            {/* Waiting for Organizer Notice */}
            <div className="space-y-2 pt-2 border-t border-[var(--color-apb-surface-border)]">
              <div className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 animate-spin" />
                <span>WAITING FOR ORGANIZER</span>
              </div>
              <p className="text-xs font-mono text-slate-400 max-w-sm mx-auto">
                The challenge will appear when the round begins.
              </p>
            </div>
          </APBCard>
        </main>
      </div>
    );
  }

  // State 2: Already Submitted (or round closed post-submission)
  if (teamRoundState?.status === "SUBMITTED" || submission) {
    if (submission) {
      return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
          <TeamWorkspaceHeader
            teamId={teamId}
            teamDisplayName={teamData?.displayName}
            round={currentRound}
            
            saveStatus="SAVED"
            
            onLeave={handleLogout}
          />
          <main className="flex-1 p-4 md:p-8">
            <SubmissionSuccessView
              submission={submission}
              round={currentRound}
              teamId={teamId}
              teamData={teamData}
            />
          </main>
        </div>
      );
    }
  }



  // State 4: Active Competition Workspace (LIVE, PAUSED, or CLOSED without submission)
  const isRoundClosed = currentRound.status === "CLOSED";
  const isRoundPaused = currentRound.status === "PAUSED";
  const isReadOnly = isRoundClosed || isRoundPaused;

  const currentPrompt = draft?.prompt || draft?.member1Data?.text || "";
  const currentImageUrl = draft?.member2Data?.imageUrl || "";
  const currentFileName = draft?.member2Data?.fileName || "";
  const currentCreativeText = draft?.member2Data?.text || "";

  // Specialized Round 1: Quiz Engine
  if (currentRound.templateType === "QUIZ" || currentRound.roundNumber === 1) {
    return (
      <div className="min-h-screen bg-[#07080b] flex flex-col font-sans select-none">
        <TeamWorkspaceHeader
          teamId={teamId}
          teamDisplayName={teamData?.displayName}
          round={currentRound}
          
          saveStatus={saveStatus}
          
          onLeave={handleLogout}
        />
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          <QuizWorkspace
            round={currentRound}
            teamId={teamId}
            teamDisplayName={teamData?.displayName}
            eventId={eventId || "currentEvent"}
            initialAnswers={draft?.quizAnswers || {}}
            existingSubmission={submission}
          />
        </main>
      </div>
    );
  }

  // Specialized Round 2: Progressive Constraint Engine
  if (currentRound.templateType === "PROGRESSIVE_CONSTRAINT" || currentRound.roundNumber === 2) {
    return (
      <div className="min-h-screen bg-[#07080b] flex flex-col font-sans select-none">
        <TeamWorkspaceHeader
          teamId={teamId}
          teamDisplayName={teamData?.displayName}
          round={currentRound}
          
          saveStatus={saveStatus}
          
          onLeave={handleLogout}
        />
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          <ProgressiveConstraintWorkspace
            round={currentRound}
            teamId={teamId}
            teamDisplayName={teamData?.displayName}
            eventId={eventId || "currentEvent"}
            
          />
        </main>
      </div>
    );
  }

  // Standard Universal Workspace (Text / Image / Creative)
  return (
    <div className="min-h-screen bg-[#07080b] flex flex-col font-sans select-none">
      {/* Header */}
      <TeamWorkspaceHeader
        teamId={teamId}
        teamDisplayName={teamData?.displayName}
        round={currentRound}
        
        saveStatus={saveStatus}
        
        onLeave={handleLogout}
      />

      <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto space-y-6 pb-32 sm:pb-28">
        {/* Connection Lost Banner */}
        {!isOnline && (
          <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-sm tracking-wide animate-pulse">
            <WifiOff className="w-5 h-5 shrink-0 text-amber-400" />
            <span>Connection lost — your draft is preserved locally. Reconnecting to competition server...</span>
          </div>
        )}

        {/* Paused Banner */}
        {isRoundPaused && (
          <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-sm uppercase tracking-wider animate-pulse">
            <PauseCircle className="w-5 h-5 shrink-0" />
            <span>Round Paused by Organizer. Editing temporarily suspended.</span>
          </div>
        )}

        {/* Closed Banner */}
        {isRoundClosed && (
          <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-sm uppercase tracking-wider">
            <Lock className="w-5 h-5 shrink-0" />
            <span>Round Closed. Competition deadline has ended. Workspace is now locked.</span>
          </div>
        )}

        {/* Challenge Brief Panel */}
        <ChallengePanel round={currentRound} />

        {/* Dual Workspaces (Desktop: 2-column grid, Mobile: stacked) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Member 1: Prompt Workspace */}
          <PromptEditor
            value={currentPrompt}
            onChange={(newPrompt) => {
              updateDraft((prev) => ({
                 ...prev,
                 prompt: newPrompt,
                 member1Data: { ...prev.member1Data, text: newPrompt },
               }), "member1");
             }}
            isMyRole={true}
            member1Name={teamData?.member1}
            readOnly={isReadOnly}
            saveStatus={saveStatus}
            onSave={saveNow}
          />

          {/* Member 2: Creative / Image Workspace */}
          <CreativeWorkspace
            eventId={eventId || "currentEvent"}
            teamId={teamId}
            roundId={currentRound.id}
            challengeType={currentRound.challengeType || "TEXT"}
            imageUrl={currentImageUrl}
            fileName={currentFileName}
            creativeText={currentCreativeText}
            onImageChange={(newImageUrl, newFileName) => {
              updateDraft((prev) => ({
                ...prev,
                member2Data: {
                  ...prev.member2Data,
                  imageUrl: newImageUrl,
                  fileName: newFileName,
                },
              }), "member1");
            }}
            onTextChange={(newText) => {
              updateDraft((prev) => ({
                ...prev,
                member2Data: {
                  ...prev.member2Data,
                  text: newText,
                },
              }), "member1");
            }}
            isMyRole={true}
            member2Name={teamData?.member2}
            readOnly={isReadOnly}
          />
        </div>
      </main>

      {/* Sticky Bottom Submission Action Bar */}
      {!isRoundClosed && (
        <div className="fixed bottom-0 inset-x-0 bg-[var(--color-apb-surface)]/95 backdrop-blur-md border-t border-[var(--color-apb-surface-border)] px-4 sm:px-6 py-3.5 z-30">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span>Team: <strong className="text-white">{teamId}</strong></span>
              <span>•</span>
              <span>Both members contribute to the same submission draft.</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {!isOnline && (
                <span className="text-xs font-mono text-amber-400 flex items-center gap-1.5">
                  <WifiOff className="w-3.5 h-3.5" />
                  Submission paused (Offline)
                </span>
              )}
              <APBButton
                glow={isOnline}
                size="lg"
                onClick={() => setReviewOpen(true)}
                disabled={isReadOnly || !isOnline || (!currentPrompt && !currentImageUrl)}
                className="w-full sm:w-auto font-mono text-sm px-6 h-11"
              >
                <Send className="w-4 h-4 mr-2" />
                {isOnline ? "Review & Submit Response" : "Reconnecting..."}
              </APBButton>
            </div>
          </div>
        </div>
      )}

      {/* Submission Review Modal */}
      <SubmissionReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        round={currentRound}
        teamId={teamId}
        draft={draft}
        submittedBy={"member1"}
        onSuccess={() => {
          setReviewOpen(false);
        }}
      />
    </div>
  );
}


