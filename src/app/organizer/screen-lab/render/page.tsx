"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ParticipantScreenOverlay } from "@/components/apb/ParticipantScreenOverlay";
import { SubmissionSuccessView } from "@/components/apb/SubmissionSuccessView";
import { SubmissionReviewDialog } from "@/components/apb/SubmissionReviewDialog";
import { AuthRecoveryPanel } from "@/components/apb/AuthRecoveryPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { APBButton } from "@/components/apb/APBButton";
import { AlertCircle, WifiOff } from "lucide-react";

function RenderLabContent() {
  const searchParams = useSearchParams();
  const screenId = searchParams.get("screen");

  if (!screenId) return <div className="text-white p-4 font-mono">No screen specified</div>;

  const mockTemplate = {
    heading: "TEST HEADING",
    subheading: "TEST SUBHEADING",
    body: "This is mock body text specifically injected for testing purposes in the Screen Lab. It simulates realistic lengths and typography for the components.",
    imageUrl: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?auto=format&fit=crop&q=80&w=2832",
    durationSeconds: 10
  };

  const mockCountdown = {
    active: true,
    startedAt: Date.now(),
    endsAt: Date.now() + 10000,
    durationSeconds: 10,
    updatedAt: Date.now()
  };

  const wrapParticipant = (mode: any) => (
    <ParticipantScreenOverlay 
      overrideScreenMode={mode}
      boardState={{
        globalScreenMode: mode,
        activeTemplate: mockTemplate,
        updatedAt: Date.now()
      }}
      mockGlobalCountdown={mode === "COUNTDOWN" ? mockCountdown : undefined}
    >
      <div className="w-full h-full min-h-screen bg-[#07080b] flex items-center justify-center p-8">
        <div className="max-w-3xl w-full aspect-video border-2 border-dashed border-slate-700/50 rounded-2xl flex flex-col items-center justify-center text-slate-600 font-mono">
          <span className="text-2xl uppercase tracking-widest mb-2">Participant Workspace</span>
          <span className="text-sm">Underlying content is preserved here</span>
        </div>
      </div>
    </ParticipantScreenOverlay>
  );

  if (screenId.startsWith("p_")) {
    const map: Record<string, string> = {
      p_auto: "NORMAL",
      p_rules: "RULES",
      p_round_intro: "ROUND_INTRO",
      p_countdown: "COUNTDOWN",
      p_announcement: "ANNOUNCEMENT",
      p_constraint_reveal: "CONSTRAINT_REVEAL",
      p_paused: "PAUSED",
      p_round_complete: "ROUND_COMPLETE",
      p_locked: "LOCKED"
    };
    return wrapParticipant(map[screenId] || "NORMAL");
  }

  if (screenId.startsWith("d_")) {
    if (screenId === "d_custom_text") {
      return (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-4 text-center max-w-6xl mx-auto w-full h-full min-h-screen bg-[#07080b]">
          <div className="w-full max-w-5xl flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 p-8 sm:p-12 rounded-3xl bg-black/60 border border-white/10 backdrop-blur-md shadow-2xl">
            <div className="w-full space-y-6 overflow-y-auto max-h-[75vh]">
              <h1 className="text-5xl sm:text-7xl font-mono font-black uppercase text-white tracking-wider text-center drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                {mockTemplate.heading}
              </h1>
              <h2 className="text-2xl sm:text-3xl font-mono uppercase text-[var(--color-apb-cyan)] tracking-widest text-center font-bold">
                {mockTemplate.subheading}
              </h2>
              <div className="text-xl sm:text-2xl md:text-3xl font-mono text-white/90 tracking-wide leading-relaxed text-left whitespace-pre-wrap mt-8 pt-6 border-t border-white/10">
                {mockTemplate.body}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (screenId === "d_custom_image") {
      return (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-4 text-center max-w-6xl mx-auto w-full h-full min-h-screen bg-[#07080b]">
           <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
             <img src={mockTemplate.imageUrl} alt="Custom" className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-2xl" />
           </div>
        </div>
      );
    }
    
    const map: Record<string, string> = {
      d_auto: "NORMAL",
      d_waiting: "WAITING",
      d_event_status: "ROUND_INTRO",
      d_live_round: "NORMAL" 
    };
    return wrapParticipant(map[screenId] || "WAITING");
  }

  if (screenId === "s_offline") {
    return (
      <div className="w-full h-full min-h-screen bg-[#07080b] flex flex-col items-center p-8">
        <div className="flex items-center justify-center gap-3 p-4 w-full max-w-4xl rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-sm tracking-wide animate-pulse">
          <WifiOff className="w-5 h-5 shrink-0 text-amber-400" />
          <span>Connection lost - your draft is preserved locally. Reconnecting to competition server...</span>
        </div>
      </div>
    );
  }

  if (screenId === "s_success") {
    return (
      <div className="w-full h-full min-h-screen bg-[#07080b] overflow-auto flex flex-col p-8">
        <SubmissionSuccessView
          submission={{ id: "sub1", eventId: "e1", teamId: "TEAM-01", roundId: "r1", prompt: "Mock", submittedAt: Date.now(), submittedBy: "Mock", status: "FINAL", version: 1 }}
          round={{ id: "r1", title: "Test Round", durationSeconds: 1200, status: "CLOSED", roundNumber: 1, description: "Test", createdAt: 1, updatedAt: 1, startedAt: Date.now() - 72000000, endsAt: Date.now() - 12000, pausedRemainingSeconds: 0 }}
          teamId="TEAM-01"
          teamData={{ displayName: "Test Team Alpha" }}
        />
      </div>
    );
  }

  if (screenId === "s_review") {
    return (
      <div className="w-full h-full min-h-screen bg-black/80 flex items-center justify-center">
    <div className="font-mono text-white p-8 text-center">Submission Review Dialog Preview</div>
      </div>
    );
  }

  if (screenId === "s_quiz_warn") {
    return (
      <div className="w-full h-full min-h-screen bg-black/80">
        <Dialog open={true}>
          <DialogContent className="sm:max-w-[400px] border-[var(--color-apb-cyan)]/30 bg-background/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="font-mono tracking-widest uppercase text-amber-500 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                SUBMIT QUIZ?
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="p-3 bg-black/40 rounded border border-slate-800 font-mono text-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">Answered:</span>
                  <span className="text-[var(--color-apb-cyan)]">15 / 20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Unanswered:</span>
                  <span className="text-amber-500 animate-pulse">5</span>
                </div>
              </div>
              <div className="text-sm font-mono text-slate-400">
                You cannot edit your answers after submitting.
              </div>
            </div>
            <DialogFooter>
              <APBButton variant="ghost">CANCEL</APBButton>
              <APBButton glow>SUBMIT QUIZ</APBButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  if (screenId === "s_auth_recov") {
    return (
      <div className="w-full h-full min-h-screen bg-[#07080b] p-8">
        <AuthRecoveryPanel eventId="mock-event" />
      </div>
    );
  }
  
  if (screenId === "s_add_team" || screenId === "s_edit_team" || screenId === "s_active_sess" || screenId === "s_confirm") {
    return (
      <div className="w-full h-full min-h-screen bg-black/80 flex items-center justify-center font-mono text-white">
        <div className="p-6 bg-neutral-900 border border-slate-700 rounded-lg max-w-lg text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <p className="mb-4">This specific organizer dialog ({screenId}) is natively invoked via standard Radix UI modals in the Organizer panel.</p>
          <p className="text-sm text-slate-400">Preview simulated successfully.</p>
        </div>
      </div>
    );
  }

  return <div className="text-white p-4 font-mono">Unknown screen: {screenId}</div>;
}

export default function RenderLab() {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <RenderLabContent />
    </Suspense>
  );
}
