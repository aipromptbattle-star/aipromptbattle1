"use client";

import React, { useState } from "react";
import { Round, QuizQuestion, ProgressiveConstraintStage } from "@/lib/firebase/schema";
import { APBCard } from "./APBCard";
import { APBButton } from "./APBButton";
import { DEFAULT_QUIZ_QUESTIONS } from "./QuizWorkspace";
import { DEFAULT_PROGRESSIVE_STAGES } from "./ProgressiveConstraintWorkspace";
import { 
  Eye, 
  X, 
  Sparkles, 
  Clock, 
  Check, 
  HelpCircle, 
  ArrowLeft, 
  ArrowRight,
  Send,
  Zap,
  Lock
} from "lucide-react";

interface ParticipantPreviewModalProps {
  open: boolean;
  onClose: () => void;
  round: Partial<Round>;
}

export function ParticipantPreviewModal({
  open,
  onClose,
  round,
}: ParticipantPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"INITIAL" | "CONSTRAINT_REVEAL" | "ACTIVE">("INITIAL");
  const [sampleQuestionIndex, setSampleQuestionIndex] = useState(0);
  const [sampleSelectedOption, setSampleSelectedOption] = useState<"A" | "B" | "C">("B");

  if (!open) return null;

  const isQuiz = round.templateType === "QUIZ" || round.roundNumber === 1;
  const isProgressive = round.templateType === "PROGRESSIVE_CONSTRAINT" || round.roundNumber === 2;

  const questions: QuizQuestion[] = round.quizQuestions && round.quizQuestions.length > 0 
    ? round.quizQuestions 
    : DEFAULT_QUIZ_QUESTIONS;

  const stages: ProgressiveConstraintStage[] = round.progressiveStages && round.progressiveStages.length === 5
    ? round.progressiveStages
    : DEFAULT_PROGRESSIVE_STAGES;

  const currentQ = questions[sampleQuestionIndex] || questions[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-5xl w-full my-8 bg-[#07080b] border border-[var(--color-apb-surface-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Preview Control Header Bar */}
        <div className="px-6 py-4 border-b border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)]/95 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-[var(--color-apb-cyan)]/10 text-[var(--color-apb-cyan)] border border-[var(--color-apb-cyan)]/30">
              <Eye className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[var(--color-apb-cyan)] uppercase tracking-wider">
                  PARTICIPANT VIEW PREVIEW
                </span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30 uppercase">
                  Simulation Only
                </span>
              </div>
              <h3 className="text-sm font-mono text-white font-semibold">
                Round {round.roundNumber || 1}: {round.title || (isQuiz ? "Speed Quiz" : "Prompt Breaker")}
              </h3>
            </div>
          </div>

          {/* Mode Switcher for Progressive Constraint */}
          <div className="flex items-center gap-2">
            {isProgressive && (
              <div className="flex items-center gap-1 bg-black/60 p-1 rounded-lg border border-[var(--color-apb-surface-border)] text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setActiveTab("INITIAL")}
                  className={`px-3 py-1 rounded transition-colors ${activeTab === "INITIAL" ? "bg-[var(--color-apb-cyan)] text-black font-bold" : "text-muted-foreground hover:text-white"}`}
                >
                  0:00 Initial
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("CONSTRAINT_REVEAL")}
                  className={`px-3 py-1 rounded transition-colors ${activeTab === "CONSTRAINT_REVEAL" ? "bg-[var(--color-apb-cyan)] text-black font-bold" : "text-muted-foreground hover:text-white"}`}
                >
                  4:00 Reveal
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("ACTIVE")}
                  className={`px-3 py-1 rounded transition-colors ${activeTab === "ACTIVE" ? "bg-[var(--color-apb-cyan)] text-black font-bold" : "text-muted-foreground hover:text-white"}`}
                >
                  Stage 02 Active
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-white p-2 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Simulation Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-[#0a0b0e] to-black font-sans">
          {/* Header Simulation */}
          <div className="border border-[var(--color-apb-surface-border)] rounded-xl bg-[var(--color-apb-surface)] px-5 py-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono tracking-widest text-[var(--color-apb-cyan)] uppercase font-bold">
                AI PROMPT BATTLE
              </span>
              <div className="text-sm font-mono text-white font-bold">
                APB042 • TEAM ALPHA
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs font-mono text-muted-foreground uppercase">
                ROUND 0{round.roundNumber || 1}
              </span>
              <div className="px-3 py-1 rounded bg-black/60 border border-[var(--color-apb-surface-border)] font-mono text-sm text-[var(--color-apb-cyan)] font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{isQuiz ? "18:42" : activeTab === "INITIAL" ? "03:42" : "03:59"}</span>
              </div>
            </div>
          </div>

          {/* 1. Quiz Simulation Preview */}
          {isQuiz && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-8 space-y-6">
                <APBCard className="p-6 space-y-6 bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
                  <div className="flex items-center justify-between border-b border-[var(--color-apb-surface-border)] pb-3">
                    <span className="font-mono text-xs font-bold px-3 py-1 rounded bg-[var(--color-apb-cyan)]/10 text-[var(--color-apb-cyan)] uppercase">
                      QUESTION {(sampleQuestionIndex + 1).toString().padStart(2, "0")}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">1 Point</span>
                  </div>

                  <h3 className="text-base sm:text-lg font-medium text-white leading-relaxed">
                    {currentQ.question}
                  </h3>

                  <div className="space-y-3 pt-2">
                    {currentQ.options.map((opt, oIdx) => {
                      const label = (["A", "B", "C"] as const)[oIdx];
                      const isSel = sampleSelectedOption === label;
                      return (
                        <div
                          key={label}
                          onClick={() => setSampleSelectedOption(label)}
                          className={`p-4 rounded-xl border text-sm flex items-center gap-3 cursor-pointer transition-all ${
                            isSel
                              ? "bg-[var(--color-apb-cyan)]/15 border-[var(--color-apb-cyan)] text-white shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                              : "bg-black/40 border-[var(--color-apb-surface-border)] text-slate-300 hover:text-white"
                          }`}
                        >
                          <div className={`w-7 h-7 rounded font-mono text-xs font-bold flex items-center justify-center ${isSel ? "bg-[var(--color-apb-cyan)] text-black" : "bg-black/60 text-slate-400"}`}>
                            {label}
                          </div>
                          <span className="flex-1">{opt}</span>
                          {isSel && <Check className="w-4 h-4 text-[var(--color-apb-cyan)]" />}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-[var(--color-apb-surface-border)] flex items-center justify-between">
                    <APBButton
                      variant="outline"
                      size="sm"
                      disabled={sampleQuestionIndex === 0}
                      onClick={() => setSampleQuestionIndex(p => Math.max(0, p - 1))}
                    >
                      <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Previous
                    </APBButton>
                    <APBButton
                      glow
                      size="sm"
                      onClick={() => setSampleQuestionIndex(p => Math.min(questions.length - 1, p + 1))}
                    >
                      Next <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </APBButton>
                  </div>
                </APBCard>
              </div>

              <div className="md:col-span-4">
                <APBCard className="p-4 space-y-4 bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
                  <span className="font-mono text-xs font-bold uppercase text-white block">
                    Questions Navigation (20)
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {questions.slice(0, 20).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSampleQuestionIndex(idx)}
                        className={`h-9 rounded font-mono text-xs font-bold flex items-center justify-center ${
                          idx === sampleQuestionIndex
                            ? "bg-[var(--color-apb-cyan)] text-black"
                            : idx < 8
                            ? "bg-emerald-950/60 border border-emerald-500/50 text-emerald-400"
                            : "bg-black/50 border border-[var(--color-apb-surface-border)] text-muted-foreground"
                        }`}
                      >
                        {(idx + 1).toString().padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                </APBCard>
              </div>
            </div>
          )}

          {/* 2. Progressive Constraint Simulation Preview */}
          {isProgressive && (
            <div className="space-y-6">
              {/* Constraint Reveal Overlay Simulation */}
              {activeTab === "CONSTRAINT_REVEAL" && (
                <div className="p-8 rounded-2xl bg-[var(--color-apb-surface)] border-2 border-[var(--color-apb-cyan)] shadow-[0_0_40px_rgba(0,240,255,0.25)] text-center space-y-5 animate-scaleIn">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-apb-cyan)]/20 text-[var(--color-apb-cyan)] font-mono text-xs font-bold uppercase tracking-widest">
                    <Zap className="w-3.5 h-3.5" /> NEW CONSTRAINT 01 REVEALED
                  </div>
                  <div className="text-4xl font-mono font-black text-white">
                    STAGE 02
                  </div>
                  <p className="text-base text-slate-200 max-w-lg mx-auto">
                    {stages[1]?.statement || "Your solution must now operate in complete offline air-gapped isolation with zero cloud connectivity."}
                  </p>
                </div>
              )}

              {/* Initial or Active Stage Display */}
              {activeTab !== "CONSTRAINT_REVEAL" && (
                <>
                  <APBCard className="p-6 space-y-3 bg-[var(--color-apb-surface)] border-[var(--color-apb-cyan)]/30">
                    <span className="text-xs font-mono font-bold text-[var(--color-apb-cyan)] uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      {activeTab === "INITIAL" ? "ROUND 02 — INITIAL STATEMENT" : "ROUND 02 — CONSTRAINT 01 OF 04"}
                    </span>
                    <p className="text-base text-white leading-relaxed">
                      {activeTab === "INITIAL" ? stages[0]?.statement : stages[1]?.statement}
                    </p>
                  </APBCard>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="font-mono text-xs text-white font-bold uppercase">
                        PROMPT
                      </div>
                      <div className="h-48 rounded-xl bg-black/70 border border-[var(--color-apb-surface-border)] p-4 font-mono text-xs text-slate-300">
                        [ Monaco Prompt Editor ]
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="font-mono text-xs text-white font-bold uppercase">
                        OUTPUT
                      </div>
                      <div className="h-48 rounded-xl bg-black/70 border border-[var(--color-apb-surface-border)] p-4 font-mono text-xs text-slate-300">
                        [ Output Workspace ]
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[var(--color-apb-surface)] border border-[var(--color-apb-surface-border)] flex items-center justify-between">
                    <span className="text-xs font-mono text-muted-foreground">
                      Authoritative Stage Countdown: <strong>03:42</strong>
                    </span>
                    <APBButton glow size="sm" className="font-mono text-xs uppercase px-6">
                      <Send className="w-3.5 h-3.5 mr-1.5" /> Submit Stage 0{activeTab === "INITIAL" ? "1" : "2"}
                    </APBButton>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
