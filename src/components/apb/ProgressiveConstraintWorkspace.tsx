"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Round, Submission, ProgressiveConstraintStage, StageSubmissionRecord } from "@/lib/firebase/schema";
import { APBCard } from "./APBCard";
import { APBButton } from "./APBButton";
import { CircularTimer } from "./CircularTimer";
import { PromptEditor } from "./PromptEditor";
import { CreativeWorkspace } from "./CreativeWorkspace";
import { evaluateStageRules } from "@/lib/evaluation/rules";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  AlertTriangle,
  FileText,
  ShieldCheck,
  Zap,
  Info
} from "lucide-react";

// Standard 5 stages for Round 2 if not explicitly configured in Firestore
export const DEFAULT_PROGRESSIVE_STAGES: ProgressiveConstraintStage[] = [
  {
    stageNumber: 1,
    stageName: "Initial Statement",
    unlockMinute: 0,
    statement: "Create a prompt that instructs an AI system to design a resilient distributed autonomous power grid architecture.",
    evaluationRules: [
      { id: "s1_min_words", rule: "MIN_WORDS", expectedValue: 40, points: 2, description: "Prompt must contain at least 40 words" },
      { id: "s1_req_phrase", rule: "REQUIRED_PHRASE", expectedValue: "resilient", points: 1, description: "Must include the term 'resilient'" },
    ]
  },
  {
    stageNumber: 2,
    stageName: "Constraint 01",
    unlockMinute: 4,
    statement: "Your solution must now operate in complete offline air-gapped isolation with zero cloud or satellite connectivity.",
    evaluationRules: [
      { id: "s2_req_airgap", rule: "REQUIRED_PHRASE", expectedValue: "air-gapped", points: 2, description: "Must explicitly specify air-gapped isolation" },
      { id: "s2_forbid_cloud", rule: "FORBIDDEN_PHRASE", expectedValue: "cloud server", points: 1, description: "Must not rely on 'cloud server'" },
    ]
  },
  {
    stageNumber: 3,
    stageName: "Constraint 02",
    unlockMinute: 8,
    statement: "Incorporate autonomous self-healing capabilities capable of restoring full operations within 30 seconds of subsystem failure.",
    evaluationRules: [
      { id: "s3_req_selfheal", rule: "REQUIRED_PHRASE", expectedValue: "self-healing", points: 2, description: "Must specify autonomous self-healing protocols" },
      { id: "s3_item_count", rule: "ITEM_COUNT", expectedValue: 3, points: 2, description: "Must detail at least 3 discrete recovery steps" },
    ]
  },
  {
    stageNumber: 4,
    stageName: "Constraint 03",
    unlockMinute: 12,
    statement: "Strict resource envelope: Limit edge compute consumption to under 15 Watts and maximum 512 MB memory footprint per substation node.",
    evaluationRules: [
      { id: "s4_req_watts", rule: "REQUIRED_PHRASE", expectedValue: "15", points: 2, description: "Must explicitly enforce the 15 Watts power ceiling" },
      { id: "s4_max_words", rule: "MAX_WORDS", expectedValue: 350, points: 1, description: "Prompt must be concise (under 350 words)" },
    ]
  },
  {
    stageNumber: 5,
    stageName: "Constraint 04 (Final Stage)",
    unlockMinute: 16,
    statement: "Provide an automated adversarial verification test bench: simulate simultaneous multi-point EMP attacks and verify zero cascading blackouts.",
    evaluationRules: [
      { id: "s5_req_emp", rule: "REQUIRED_PHRASE", expectedValue: "adversarial", points: 2, description: "Must include an adversarial verification framework" },
      { id: "s5_req_blackout", rule: "REQUIRED_PHRASE", expectedValue: "blackout", points: 2, description: "Must verify zero cascading blackouts" },
    ]
  }
];

interface ProgressiveConstraintWorkspaceProps {
  round: Round;
  teamId: string;
  teamDisplayName?: string;
  eventId: string;
  memberRole?: string | null;
  onSubmissionSuccess?: (sub: Submission) => void;
}

export function ProgressiveConstraintWorkspace({
  round,
  teamId,
  teamDisplayName,
  eventId,
  memberRole,
  onSubmissionSuccess,
}: ProgressiveConstraintWorkspaceProps) {
  const stages = round.progressiveStages && round.progressiveStages.length === 5 
    ? round.progressiveStages 
    : DEFAULT_PROGRESSIVE_STAGES;

  // Authoritative stage calculation
  const totalDuration = round.durationSeconds || 1200; // 20 mins = 1200s
  const stageDuration = 240; // 4 mins = 240s

  const getStageInfo = useCallback(() => {
    if (!round.startedAt || round.status === "READY" || round.status === "DRAFT") {
      return { stageNumber: 1, stageRemaining: 240, elapsed: 0 };
    }

    const now = Date.now();
    let elapsed = 0;

    if (round.status === "PAUSED" && round.pausedRemainingSeconds != null) {
      elapsed = Math.max(0, totalDuration - round.pausedRemainingSeconds);
    } else if (round.endsAt) {
      elapsed = Math.max(0, Math.min(totalDuration, Math.floor((now - round.startedAt) / 1000)));
    }

    const stageNumber = Math.min(5, Math.max(1, Math.floor(elapsed / stageDuration) + 1));
    const stageElapsed = elapsed % stageDuration;
    const stageRemaining = Math.max(0, stageDuration - stageElapsed);

    return { stageNumber, stageRemaining, elapsed };
  }, [round.startedAt, round.status, round.pausedRemainingSeconds, round.endsAt, totalDuration]);

  const [stageState, setStageState] = useState(getStageInfo());
  const currentStageNum = stageState.stageNumber;
  const currentStageDef = stages[currentStageNum - 1] || stages[0];

  // Stage drafts and submissions stored per stage: Record<stageNumber, { prompt, outputText, imageUrl }>
  const [stageDrafts, setStageDrafts] = useState<Record<number, { prompt: string; outputText: string; imageUrl: string }>>({});
  const [stageSubmissions, setStageSubmissions] = useState<Record<number, StageSubmissionRecord>>({});
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Cinematic overlay state for new constraint reveal
  const [showConstraintReveal, setShowConstraintReveal] = useState(false);
  const lastRevealedStageRef = useRef<number>(1);

  // Live timer tick for smooth stage transition
  useEffect(() => {
    const update = () => {
      const info = getStageInfo();
      setStageState(info);

      // Trigger brief cinematic overlay when stage advances (Stage 2..5)
      if (info.stageNumber > lastRevealedStageRef.current && round.status === "LIVE") {
        lastRevealedStageRef.current = info.stageNumber;
        setShowConstraintReveal(true);
        setTimeout(() => setShowConstraintReveal(false), 8000); // 8-second impactful reveal
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [getStageInfo, round.status]);

  // Load existing drafts and submissions for round from Firestore
  useEffect(() => {
    if (!eventId || !teamId || !round.id) return;
    const docId = `${eventId}_${teamId}_${round.id}`;

    // 1. Fetch draft
    getDoc(doc(db, "drafts", docId)).then((snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.stageDrafts) {
          setStageDrafts(d.stageDrafts);
        }
      }
    }).catch(console.error);

    // 2. Fetch submission
    getDoc(doc(db, "submissions", docId)).then((snap) => {
      if (snap.exists()) {
        const s = snap.data() as Submission;
        if (s.stageSubmissions) {
          setStageSubmissions(s.stageSubmissions);
        }
      }
    }).catch(console.error);
  }, [eventId, teamId, round.id]);

  // Active stage content
  const activePrompt = stageDrafts[currentStageNum]?.prompt || "";
  const activeOutputText = stageDrafts[currentStageNum]?.outputText || "";
  const activeImageUrl = stageDrafts[currentStageNum]?.imageUrl || "";
  const isCurrentStageSubmitted = Boolean(stageSubmissions[currentStageNum]);

  // Update draft for current stage
  const handleUpdateDraft = (newPrompt: string, newOutputText: string, newImageUrl: string) => {
    if (isCurrentStageSubmitted || round.status === "CLOSED" || round.status === "PAUSED") return;

    const nextDrafts = {
      ...stageDrafts,
      [currentStageNum]: {
        prompt: newPrompt,
        outputText: newOutputText,
        imageUrl: newImageUrl,
      }
    };
    setStageDrafts(nextDrafts);

    // Debounced persist to Firestore
    const docId = `${eventId}_${teamId}_${round.id}`;
    setDoc(doc(db, "drafts", docId), {
      eventId,
      teamId,
      roundId: round.id,
      prompt: newPrompt,
      currentStage: currentStageNum,
      stageDrafts: nextDrafts,
      updatedAt: Date.now(),
      version: 1,
    }, { merge: true }).catch(console.error);
  };

  // Submit stage
  const handleSubmitStage = async (stageNum: number, autoSubmit = false) => {
    if (stageSubmissions[stageNum] || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const targetDraft = stageDrafts[stageNum] || { prompt: "", outputText: "", imageUrl: "" };
      const currentStageRules = stages[stageNum - 1]?.evaluationRules || [];
      const evalSummary = evaluateStageRules(currentStageRules, targetDraft.prompt, targetDraft.outputText);

      const submissionRecord: StageSubmissionRecord = {
        stageNumber: stageNum,
        prompt: targetDraft.prompt,
        outputText: targetDraft.outputText,
        outputImageUrl: targetDraft.imageUrl,
        submittedAt: Date.now(),
        automaticScore: evalSummary.totalPointsEarned,
        ruleResults: evalSummary.results.map((r) => ({
          ruleId: r.ruleId,
          description: r.description,
          pass: r.pass,
          pointsEarned: r.pointsEarned,
          maxPoints: r.maxPoints,
        })),
      };

      const updatedSubmissions = {
        ...stageSubmissions,
        [stageNum]: submissionRecord,
      };

      setStageSubmissions(updatedSubmissions);
      setConfirmSubmitOpen(false);

      // Write authoritative stage submission to Firestore
      const docId = `${eventId}_${teamId}_${round.id}`;
      const subRef = doc(db, "submissions", docId);
      const subSnap = await getDoc(subRef);

      const totalAutoScore = Object.values(updatedSubmissions).reduce(
        (sum, s) => sum + (s.automaticScore || 0), 0
      );

      const payload: Partial<Submission> = {
        id: docId,
        eventId,
        teamId,
        roundId: round.id,
        prompt: targetDraft.prompt,
        member1Data: { text: targetDraft.prompt },
        member2Data: { text: targetDraft.outputText, imageUrl: targetDraft.imageUrl },
        stageSubmissions: updatedSubmissions,
        automaticScoreTotal: totalAutoScore,
        submittedAt: Date.now(),
        status: "FINAL",
        version: 1,
      };

      if (!subSnap.exists()) {
        await setDoc(subRef, payload);
      } else {
        await updateDoc(subRef, {
          stageSubmissions: updatedSubmissions,
          automaticScoreTotal: totalAutoScore,
          prompt: targetDraft.prompt,
          member1Data: { text: targetDraft.prompt },
          member2Data: { text: targetDraft.outputText, imageUrl: targetDraft.imageUrl },
          version: (subSnap.data()?.version || 1) + 1,
        });
      }

      // Update teamRoundState
      const stateRef = doc(db, "teamRoundState", docId);
      await setDoc(stateRef, {
        eventId,
        teamId,
        roundId: round.id,
        status: stageNum === 5 ? "SUBMITTED" : "IN_PROGRESS",
        lastSavedAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
      }, { merge: true });

      if (onSubmissionSuccess) {
        onSubmissionSuccess(payload as Submission);
      }
    } catch (err) {
      console.error("Stage submission error:", err);
      if (!autoSubmit) alert("Stage submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-submit prior stage at stage boundary if not already submitted
  const autoSubmittedStagesRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    for (let s = 1; s < currentStageNum; s++) {
      if (!stageSubmissions[s] && !autoSubmittedStagesRef.current.has(s)) {
        autoSubmittedStagesRef.current.add(s);
        handleSubmitStage(s, true);
      }
    }
  }, [currentStageNum, stageSubmissions]);

  // Format stage remaining seconds into MM:SS
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60).toString().padStart(2, "0");
    const secs = (totalSec % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const stageSubmittedAtFormatted = stageSubmissions[currentStageNum]?.submittedAt
    ? new Date(stageSubmissions[currentStageNum].submittedAt).toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: false,
      }) + " IST"
    : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-28 font-sans">
      {/* Cinematic Constraint Reveal Overlay (Non-blocking, auto-dismissible) */}
      {showConstraintReveal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="max-w-xl w-full p-8 rounded-2xl bg-[var(--color-apb-surface)] border-2 border-[var(--color-apb-cyan)] shadow-[0_0_50px_rgba(0,240,255,0.3)] text-center space-y-6 animate-scaleIn">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-apb-cyan)]/20 border border-[var(--color-apb-cyan)]/40 text-[var(--color-apb-cyan)] font-mono text-xs font-bold uppercase tracking-widest animate-pulse">
              <Zap className="w-4 h-4" /> NEW CONSTRAINT UNLOCKED
            </div>

            <div className="space-y-2">
              <div className="text-5xl font-mono font-black text-white tracking-widest">
                STAGE 0{currentStageNum}
              </div>
              <h3 className="text-xl font-mono text-[var(--color-apb-cyan)] uppercase font-bold">
                {currentStageDef.stageName}
              </h3>
            </div>

            <div className="p-5 rounded-xl bg-black/60 border border-[var(--color-apb-surface-border)] text-sm sm:text-base text-slate-100 font-sans leading-relaxed text-left">
              {currentStageDef.statement}
            </div>

            <APBButton
              glow
              onClick={() => setShowConstraintReveal(false)}
              className="px-8 font-mono text-xs uppercase"
            >
              Enter Stage 0{currentStageNum} Workspace
            </APBButton>
          </div>
        </div>
      )}

      {/* Top Banner: Round & Stage Overview Bar */}
      <div className="p-4 sm:p-5 rounded-xl bg-[var(--color-apb-surface)]/90 border border-[var(--color-apb-surface-border)] backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[var(--color-apb-cyan)] uppercase tracking-widest">
              ROUND 02 — PROGRESSIVE CONSTRAINT
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              • 5 Stages × 4 Mins Each
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h2 className="text-xl font-mono font-bold text-white uppercase tracking-wider">
              STAGE 0{currentStageNum} OF 05: {currentStageDef.stageName.toUpperCase()}
            </h2>
            {isCurrentStageSubmitted && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> STAGE SUBMITTED
              </span>
            )}
          </div>
        </div>

        {/* Timers: Current Stage Countdown + Authoritative Round Timer */}
        <div className="flex items-center gap-6">
          <div className="text-right font-mono">
            <span className="text-[10px] uppercase text-muted-foreground tracking-wider block">
              STAGE 0{currentStageNum} TIME REMAINING
            </span>
            <span className={`text-2xl font-bold tracking-wider ${stageState.stageRemaining < 60 ? "text-amber-400 animate-pulse" : "text-white"}`}>
              {formatTime(stageState.stageRemaining)}
            </span>
          </div>

          <div className="scale-90 origin-right">
            <CircularTimer round={round} size={50} strokeWidth={4} />
          </div>
        </div>
      </div>

      {/* Active Stage Statement & Evaluation Rules Card */}
      <APBCard className="p-5 sm:p-6 space-y-4 bg-[var(--color-apb-surface)]/95 border-[var(--color-apb-cyan)]/30 shadow-[0_0_20px_rgba(0,240,255,0.08)]">
        <div className="flex items-center justify-between border-b border-[var(--color-apb-surface-border)] pb-3">
          <span className="text-xs font-mono font-bold text-[var(--color-apb-cyan)] uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {currentStageNum === 1 ? "INITIAL PROBLEM STATEMENT" : `ACTIVE CONSTRAINT (STAGE 0${currentStageNum})`}
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            Stage Deadline: Fixed 4-minute interval
          </span>
        </div>

        <p className="text-base sm:text-lg font-sans text-white leading-relaxed">
          {currentStageDef.statement}
        </p>

        {/* Evaluation Rules Checklist */}
        {currentStageDef.evaluationRules && currentStageDef.evaluationRules.length > 0 && (
          <div className="pt-2 border-t border-[var(--color-apb-surface-border)] space-y-1.5">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider block">
              Automated Validation Requirements:
            </span>
            <div className="flex flex-wrap gap-2">
              {currentStageDef.evaluationRules.map((r) => (
                <div
                  key={r.id}
                  className="px-2.5 py-1 rounded bg-black/40 border border-[var(--color-apb-surface-border)] text-xs font-mono text-slate-300 flex items-center gap-1.5"
                >
                  <Info className="w-3 h-3 text-[var(--color-apb-cyan)]" />
                  <span>{r.description || `${r.rule}: ${r.expectedValue}`}</span>
                  <span className="text-[var(--color-apb-cyan)] font-bold">({r.points} pts)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </APBCard>

      {/* Primary Workspaces: Prompt (Left) + Output (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prompt Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 font-mono text-xs">
            <span className="text-white font-bold uppercase tracking-wider">
              PROMPT (STAGE 0{currentStageNum})
            </span>
            {isCurrentStageSubmitted && (
              <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                <Lock className="w-3 h-3" /> READ ONLY
              </span>
            )}
          </div>
          <PromptEditor
            value={activePrompt}
            onChange={(val) => handleUpdateDraft(val, activeOutputText, activeImageUrl)}
            isMyRole={true}
            readOnly={isCurrentStageSubmitted || round.status === "CLOSED" || round.status === "PAUSED"}
            saveStatus={isCurrentStageSubmitted ? "SAVED" : "SAVED"}
          />
        </div>

        {/* Creative / Output Workspace */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 font-mono text-xs">
            <span className="text-white font-bold uppercase tracking-wider">
              OUTPUT (STAGE 0{currentStageNum})
            </span>
            {isCurrentStageSubmitted && (
              <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                <Lock className="w-3 h-3" /> READ ONLY
              </span>
            )}
          </div>
          <CreativeWorkspace
            eventId={eventId}
            teamId={teamId}
            roundId={round.id}
            challengeType="TEXT"
            imageUrl={activeImageUrl}
            creativeText={activeOutputText}
            onTextChange={(val) => handleUpdateDraft(activePrompt, val, activeImageUrl)}
            onImageChange={(imgUrl) => handleUpdateDraft(activePrompt, activeOutputText, imgUrl)}
            isMyRole={true}
            readOnly={isCurrentStageSubmitted || round.status === "CLOSED" || round.status === "PAUSED"}
          />
        </div>
      </div>

      {/* Sticky Bottom Action Bar for Current Stage */}
      <div className="fixed bottom-0 inset-x-0 bg-[var(--color-apb-surface)]/95 backdrop-blur-md border-t border-[var(--color-apb-surface-border)] px-4 sm:px-6 py-3 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 font-mono text-xs">
            {isCurrentStageSubmitted ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  ✓ STAGE 0{currentStageNum} SUBMITTED • {stageSubmittedAtFormatted}
                </span>
              </div>
            ) : (
              <div className="text-muted-foreground">
                Stage 0{currentStageNum} closes in <strong className="text-white">{formatTime(stageState.stageRemaining)}</strong>.
                Submit when ready or work will auto-commit at the 4-minute boundary.
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Toggle Previous Stages History */}
            <button
              type="button"
              onClick={() => setHistoryOpen(!historyOpen)}
              className="text-xs font-mono text-slate-300 hover:text-white px-3 py-2 rounded border border-[var(--color-apb-surface-border)] bg-black/40 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Stages History (5)</span>
              {historyOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {!isCurrentStageSubmitted && (
              <APBButton
                glow
                onClick={() => setConfirmSubmitOpen(true)}
                disabled={round.status !== "LIVE" || !activePrompt.trim()}
                className="font-mono text-xs uppercase px-6"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" /> Submit Stage 0{currentStageNum}
              </APBButton>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Stage History Section */}
      {historyOpen && (
        <APBCard className="p-6 space-y-4 bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
          <div className="flex items-center justify-between border-b border-[var(--color-apb-surface-border)] pb-3">
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              ROUND 02 STAGE TIMELINE & SUBMISSIONS
            </span>
            <span className="text-xs font-mono text-muted-foreground">
              Previous stages are immutable and locked
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((sNum) => {
              const isPast = sNum < currentStageNum;
              const isCurrent = sNum === currentStageNum;
              const isSub = Boolean(stageSubmissions[sNum]);
              const record = stageSubmissions[sNum];

              return (
                <div
                  key={sNum}
                  className={`p-3.5 rounded-lg border font-mono text-xs space-y-2 ${
                    isCurrent
                      ? "border-[var(--color-apb-cyan)] bg-[var(--color-apb-cyan)]/10"
                      : isSub
                      ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-400"
                      : isPast
                      ? "border-slate-800 bg-black/40 text-muted-foreground"
                      : "border-slate-800/60 bg-black/20 text-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">STAGE 0{sNum}</span>
                    {isSub ? (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Submitted
                      </span>
                    ) : isCurrent ? (
                      <span className="text-[10px] text-[var(--color-apb-cyan)] font-bold">
                        ● Current
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Locked
                      </span>
                    )}
                  </div>

                  {record && (
                    <div className="text-[10px] text-muted-foreground space-y-0.5">
                      <div>Submitted: {new Date(record.submittedAt).toLocaleTimeString()} IST</div>
                      {record.automaticScore !== undefined && (
                        <div className="text-[var(--color-apb-cyan)]">Auto Score: {record.automaticScore} pts</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </APBCard>
      )}

      {/* Confirmation Modal before Manual Stage Submission */}
      {confirmSubmitOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[var(--color-apb-surface)] border border-[var(--color-apb-surface-border)] shadow-2xl space-y-6 animate-scaleIn font-sans">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--color-apb-cyan)]/10 border border-[var(--color-apb-cyan)]/30 text-[var(--color-apb-cyan)] flex items-center justify-center mx-auto">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-mono font-bold text-white uppercase tracking-wider">
                Submit Stage 0{currentStageNum}?
              </h3>
              <p className="text-xs font-mono text-muted-foreground">
                Prompt and output for Stage 0{currentStageNum} will be permanently locked after submission.
              </p>
            </div>

            <div className="p-3 bg-black/40 border border-[var(--color-apb-surface-border)] rounded-lg text-[11px] font-mono text-slate-300">
              Your response will be timestamped authoritatively and evaluated against automated validation criteria.
            </div>

            <div className="flex items-center gap-3">
              <APBButton
                variant="outline"
                onClick={() => setConfirmSubmitOpen(false)}
                disabled={isSubmitting}
                className="flex-1 font-mono text-xs uppercase"
              >
                Cancel
              </APBButton>
              <APBButton
                glow
                onClick={() => handleSubmitStage(currentStageNum, false)}
                disabled={isSubmitting}
                className="flex-1 font-mono text-xs uppercase"
              >
                {isSubmitting ? "Locking..." : "Confirm Submission"}
              </APBButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
