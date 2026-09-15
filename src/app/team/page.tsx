"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTeamSession, MemberRole } from "@/lib/auth/TeamSessionContext";
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
import { MemberRoleSelector } from "@/components/apb/MemberRoleSelector";
import { SubmissionReviewDialog } from "@/components/apb/SubmissionReviewDialog";
import { SubmissionSuccessView } from "@/components/apb/SubmissionSuccessView";
import { Loader2, Send, Lock, PauseCircle, WifiOff } from "lucide-react";

export default function ParticipantDashboard() {
  const { teamId, eventId, teamData, memberRole, setMemberRole, loading: sessionLoading, leaveTeam } = useTeamSession();
  const { eventState, loading: eventLoading } = useEventState();
  const { currentRound, loading: roundLoading } = useCurrentRound(eventState?.currentRoundId || null);
  const router = useRouter();

  const [reviewOpen, setReviewOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

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
      <div className="min-h-screen bg-background flex flex-col font-sans">
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
          <APBCard className="max-w-2xl w-full p-8 text-center space-y-6 border-slate-700 bg-slate-900/50 backdrop-blur-md">
            <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 bg-slate-800/80 px-4 py-1.5 rounded-full border border-slate-700">
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

  // State 1: Waiting Room / Round Ready
  if (!currentRound || currentRound.status === "READY" || currentRound.status === "DRAFT") {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <header className="border-b border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-mono font-bold tracking-widest uppercase text-white">
              AI Prompt Battle
            </h1>
            <StatusBadge status={currentRound?.status || "READY"} className="hidden sm:inline-flex" />
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
          <APBCard className="max-w-2xl w-full p-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-[var(--color-apb-surface-border)]/50 mb-2 animate-pulse">
              <Loader2 className="w-8 h-8 text-[var(--color-apb-cyan)] animate-spin" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-mono text-[var(--color-apb-cyan)] uppercase tracking-wider">
              {currentRound ? `ROUND ${currentRound.roundNumber} IS READY` : "WAITING FOR ORGANIZER"}
            </h2>
            <p className="text-white text-lg font-semibold">
              {currentRound ? currentRound.title : "The battle will commence shortly."}
            </p>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Please remain on this screen. When the organizer initiates Round {currentRound ? currentRound.roundNumber : 1}, your competition workspace will unlock automatically.
            </p>
            {currentRound?.qualifiedTeams && currentRound.qualifiedTeams.length > 0 && (
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-apb-cyan)]/10 border border-[var(--color-apb-cyan)]/30 text-[var(--color-apb-cyan)] font-mono text-xs font-bold uppercase tracking-wider">
                  {currentRound.qualifiedTeams.length} Teams Entered
                </span>
              </div>
            )}
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
            memberRole={memberRole}
            saveStatus="SAVED"
            onSwitchRole={() => setRoleModalOpen(true)}
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

  // State 3: Member Role Selection (if member hasn't picked role yet or requested switch)
  if (!memberRole || roleModalOpen) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <header className="border-b border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-mono font-bold tracking-widest uppercase text-white">
              AI Prompt Battle
            </h1>
            <StatusBadge status={currentRound.status} />
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-sm text-white font-bold">{teamId}</span>
            <APBButton variant="ghost" size="sm" onClick={handleLogout}>
              Leave
            </APBButton>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <MemberRoleSelector
            team={teamData}
            round={currentRound}
            onSelectRole={(role: MemberRole) => {
              setMemberRole(role);
              setRoleModalOpen(false);
            }}
          />
        </main>
      </div>
    );
  }

  // State 4: Active Competition Workspace (LIVE, PAUSED, or CLOSED without submission)
  const isRoundClosed = currentRound.status === "CLOSED";
  const isRoundPaused = currentRound.status === "PAUSED";
  const isReadOnly = isRoundClosed || isRoundPaused;

  const currentPrompt = draft?.prompt || draft?.member1Data?.text || "";
  const currentImageUrl = draft?.member2Data?.imageUrl || "";
  const currentFileName = draft?.member2Data?.fileName || "";
  const currentCreativeText = draft?.member2Data?.text || "";

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Header */}
      <TeamWorkspaceHeader
        teamId={teamId}
        teamDisplayName={teamData?.displayName}
        round={currentRound}
        memberRole={memberRole}
        saveStatus={saveStatus}
        onSwitchRole={() => setRoleModalOpen(true)}
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
               }), memberRole);
             }}
            isMyRole={memberRole === "member1"}
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
              }), memberRole);
            }}
            onTextChange={(newText) => {
              updateDraft((prev) => ({
                ...prev,
                member2Data: {
                  ...prev.member2Data,
                  text: newText,
                },
              }), memberRole);
            }}
            isMyRole={memberRole === "member2"}
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
        submittedBy={memberRole || "member1"}
        onSuccess={() => {
          setReviewOpen(false);
        }}
      />
    </div>
  );
}
