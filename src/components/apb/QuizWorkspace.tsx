"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Round, QuizQuestion, Submission } from "@/lib/firebase/schema";
import { APBCard } from "./APBCard";
import { APBButton } from "./APBButton";
import { CircularTimer } from "./CircularTimer";
import { 
  CheckCircle2, 
  HelpCircle, 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Send, 
  AlertCircle, 
  Clock, 
  Check,
  ShieldCheck,
  Lock
} from "lucide-react";
import { submitFinalResponse } from "@/lib/firebase/submissions";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// Default standard 20 questions for Round 1 if not explicitly seeded
export const DEFAULT_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "In prompt engineering, what does 'few-shot prompting' specifically refer to?",
    options: ["Providing input-output demonstrations within the prompt", "Limiting the generation token count to a small budget", "Running multiple inference passes and voting"],
    points: 1
  },
  {
    id: 2,
    question: "Which technique is designed to encourage an LLM to generate explicit intermediate reasoning steps?",
    options: ["Temperature scaling", "Chain-of-Thought (CoT) prompting", "Top-k sampling truncation"],
    points: 1
  },
  {
    id: 3,
    question: "What is the primary risk of setting temperature to 0.0 in creative text generation?",
    options: ["Total token starvation error", "High repetition and lack of novelty in outputs", "Hallucinated system instructions"],
    points: 1
  },
  {
    id: 4,
    question: "What role does a 'system prompt' primarily play in modern instruction-tuned LLMs?",
    options: ["Sets persistent persona, constraints, and baseline rules", "Calculates runtime GPU memory limits", "Compiles external Python tools into byte code"],
    points: 1
  },
  {
    id: 5,
    question: "What is 'hallucination' in the context of Large Language Models?",
    options: ["Generating plausible-sounding but factually false statements", "Exceeding the model context window limit", "Overheating the server infrastructure during batching"],
    points: 1
  },
  {
    id: 6,
    question: "Which approach best mitigates hallucinations when factual ground-truth is critical?",
    options: ["Increasing top-p parameter to 1.0", "Retrieval-Augmented Generation (RAG) with verified sources", "Removing negative constraints from prompts"],
    points: 1
  },
  {
    id: 7,
    question: "In diffusion-based image generation, what does a 'negative prompt' instruct the model to do?",
    options: ["Avoid generating specific traits, artifacts, or styles", "Invert the color palette of the output image", "Reduce rendering resolution to save computation"],
    points: 1
  },
  {
    id: 8,
    question: "What does CFG (Classifier-Free Guidance) scale control in image generation models?",
    options: ["How strictly the model adheres to the text prompt vs creative freedom", "The aspect ratio and canvas dimensions", "The compression ratio of the final output file"],
    points: 1
  },
  {
    id: 9,
    question: "What is a 'jailbreak' in prompt security?",
    options: ["Bypassing safety guardrails using crafted adversarial inputs", "Rooting the local participant computer operating system", "Downloading raw neural network weight matrices"],
    points: 1
  },
  {
    id: 10,
    question: "What does 'zero-shot' prompting mean?",
    options: ["Asking the model to perform a task without providing example demonstrations", "Submitting a prompt with zero word count", "Disabling model output generation completely"],
    points: 1
  },
  {
    id: 11,
    question: "What is 'ReAct' prompting in autonomous AI agents?",
    options: ["Interleaving Reasoning (Thought) with Action and Observation", "React.js frontend rendering of streamed markdown", "Re-prompting on every second without context"],
    points: 1
  },
  {
    id: 12,
    question: "Which of the following is a classic example of indirect prompt injection?",
    options: ["Malicious instructions embedded inside retrieved untrusted documents", "A user typing 'ignore previous instructions' directly into chat", "A server crash due to low RAM memory"],
    points: 1
  },
  {
    id: 13,
    question: "What is the effect of lowering 'top_p' (nucleus sampling)?",
    options: ["Restricts generation to the smallest set of tokens whose cumulative probability exceeds p", "Doubles the maximum output token context limit", "Forces deterministic random seed reset on every word"],
    points: 1
  },
  {
    id: 14,
    question: "What does 'role prompting' (e.g., 'Act as an expert astrophysicist') accomplish?",
    options: ["Conditions the model's vocabulary and framing toward specific domain expertise", "Grants the model administrative access to scientific databases", "Enforces strict word count limits automatically"],
    points: 1
  },
  {
    id: 15,
    question: "What is 'context window' in modern LLM architectures?",
    options: ["The total token capacity (input + output) the model can process in a single request", "The browser window viewport dimensions", "The floating dock showing live inference latency"],
    points: 1
  },
  {
    id: 16,
    question: "What technique involves asking the model to evaluate and refine its own generated answer?",
    options: ["Self-Correction / Reflexion", "Gradient descent inference", "Latent space interpolation"],
    points: 1
  },
  {
    id: 17,
    question: "In text-to-image prompting, what is 'style transfer'?",
    options: ["Applying the visual characteristics of a reference style onto a generated subject", "Exporting SVG vector paths to PNG raster format", "Translating textual prompt strings across languages"],
    points: 1
  },
  {
    id: 18,
    question: "What is 'prompt leakage'?",
    options: ["An attack that reveals the hidden internal system instructions or proprietary prompt", "A memory leak causing memory exhaustion in Chrome", "An accidental paste of user data into a public forum"],
    points: 1
  },
  {
    id: 19,
    question: "Which delimiter format is best suited for clearly isolating distinct sections of a complex prompt?",
    options: ["XML tags (e.g. <context>, <rules>) or triple backticks", "Single spaces between consecutive words", "Random emoji icons scattered across lines"],
    points: 1
  },
  {
    id: 20,
    question: "Why should prompt engineers prefer explicit positive constraints over purely negative prohibitions?",
    options: ["LLMs follow clear constructive directions more reliably than negative constraints", "Negative constraints are forbidden by GPU compilers", "Positive constraints take zero token context"],
    points: 1
  },
];

interface QuizWorkspaceProps {
  round: Round;
  teamId: string;
  teamDisplayName?: string;
  eventId: string;
  initialAnswers?: Record<number, "A" | "B" | "C">;
  existingSubmission?: Submission | null;
  onSubmissionSuccess?: (sub: Submission) => void;
}

export function QuizWorkspace({
  round,
  teamId,
  teamDisplayName,
  eventId,
  initialAnswers = {},
  existingSubmission,
  onSubmissionSuccess,
}: QuizWorkspaceProps) {
  // Questions pool: use round configured questions or default 20 questions
  const questions: QuizQuestion[] = round.quizQuestions && round.quizQuestions.length > 0 
    ? round.quizQuestions 
    : DEFAULT_QUIZ_QUESTIONS;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, "A" | "B" | "C">>(initialAnswers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(Boolean(existingSubmission));
  const [saveIndicator, setSaveIndicator] = useState<"IDLE" | "SAVING" | "SAVED">("IDLE");
  const [autoSubmitTriggered, setAutoSubmitTriggered] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const currentQ = questions[currentIndex] || questions[0];
  const qId = currentQ.id;
  const currentSelectedOption = answers[qId];

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  // Sync initial answers when draft updates
  useEffect(() => {
    if (initialAnswers && Object.keys(initialAnswers).length > 0) {
      setAnswers((prev) => ({ ...initialAnswers, ...prev }));
    }
  }, [initialAnswers]);

  // Debounced draft save to Firestore
  const saveDraftAnswers = useCallback(async (updatedAnswers: Record<number, "A" | "B" | "C">) => {
    if (!eventId || !teamId || !round.id || submitted) return;
    try {
      setSaveIndicator("SAVING");
      const draftDocId = `${eventId}_${teamId}_${round.id}`;
      const draftRef = doc(db, "drafts", draftDocId);
      const stateRef = doc(db, "teamRoundState", draftDocId);

      await setDoc(draftRef, {
        eventId,
        teamId,
        roundId: round.id,
        quizAnswers: updatedAnswers,
        prompt: `[QUIZ DRAFT] Answered ${Object.keys(updatedAnswers).length} / ${totalQuestions} questions`,
        updatedAt: Date.now(),
        version: 1,
      }, { merge: true });

      await setDoc(stateRef, {
        eventId,
        teamId,
        roundId: round.id,
        status: "IN_PROGRESS",
        lastSavedAt: Date.now(),
        version: 1,
        updatedAt: Date.now(),
      }, { merge: true });

      setSaveIndicator("SAVED");
      setTimeout(() => setSaveIndicator("IDLE"), 2000);
    } catch (e) {
      console.warn("Quiz draft save error:", e);
      setSaveIndicator("IDLE");
    }
  }, [eventId, teamId, round.id, submitted, totalQuestions]);

  const handleSelectOption = (option: "A" | "B" | "C") => {
    if (submitted || round.status === "CLOSED") return;
    const nextAnswers = { ...answers, [qId]: option };
    setAnswers(nextAnswers);
    saveDraftAnswers(nextAnswers);
  };

  // Submit Final Quiz Response
  const handleSubmitQuiz = async (isAutoSubmit = false) => {
    if (submitted || isSubmitting) return;
    setIsSubmitting(true);

    try {
      // Serialize answers into readable summary text for the submission prompt field
      const answersSummary = questions.map((q) => {
        const ans = answers[q.id] || "UNANSWERED";
        return `Q${q.id.toString().padStart(2, "0")}: [${ans}]`;
      }).join("\n");

      const payload = {
        eventId,
        teamId,
        roundId: round.id,
        prompt: `[QUIZ SUBMISSION - ${answeredCount}/${totalQuestions} Answered]\n\n${answersSummary}`,
        member1Data: {
          text: JSON.stringify(answers),
        },
        member2Data: {
          text: `Answered: ${answeredCount}/${totalQuestions}`,
          imageUrl: "",
          fileName: "",
        },
        submittedBy: "participant_quiz",
      };

      const res = await submitFinalResponse(payload);

      if (res.success) {
        setSubmitted(true);
        setShowConfirmSubmit(false);
        if (isAutoSubmit) {
          setAutoSubmitTriggered(true);
        }
        if (onSubmissionSuccess) {
          onSubmissionSuccess({
            id: `${eventId}_${teamId}_${round.id}`,
            ...payload,
            submittedAt: Date.now(),
            status: "FINAL",
            version: 1,
            quizAnswers: answers,
          } as Submission);
        }
      } else {
        alert(`Submission notice: ${res.error || "Could not commit submission."}`);
      }
    } catch (err: unknown) {
      console.error(err);
      alert("Submission encountered an issue. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-submit when round time hits 00:00
  const hasAutoSubmittedRef = useRef(false);
  useEffect(() => {
    if (round.status === "CLOSED" && !submitted && !hasAutoSubmittedRef.current) {
      hasAutoSubmittedRef.current = true;
      handleSubmitQuiz(true);
    }
  }, [round.status, submitted]);

  // If already submitted, display submission confirmation view
  if (submitted) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-8 animate-fadeIn">
        <APBCard className="p-8 md:p-12 text-center space-y-6 border-emerald-500/40 bg-[var(--color-apb-surface)]/95 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/40 px-3.5 py-1 rounded-full border border-emerald-500/30">
              Round 01 — Quiz Concluded
            </span>
            <h2 className="text-3xl sm:text-4xl font-mono font-bold text-white uppercase tracking-wider pt-2">
              SUBMISSION RECORDED
            </h2>
            <p className="text-sm font-mono text-muted-foreground max-w-lg mx-auto">
              Your quiz responses have been officially recorded into the competition ledger.
            </p>
          </div>

          {autoSubmitTriggered && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 font-mono text-xs max-w-md mx-auto">
              TIME UP — YOUR QUIZ HAS BEEN AUTOMATICALLY SUBMITTED
            </div>
          )}

          {/* Submission Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto pt-4 font-mono text-xs">
            <div className="p-3.5 rounded-lg bg-black/40 border border-[var(--color-apb-surface-border)]">
              <span className="text-muted-foreground block text-[10px] uppercase">Team ID</span>
              <span className="text-white font-bold text-base">{teamId}</span>
            </div>
            <div className="p-3.5 rounded-lg bg-black/40 border border-[var(--color-apb-surface-border)]">
              <span className="text-muted-foreground block text-[10px] uppercase">Answered</span>
              <span className="text-[var(--color-apb-cyan)] font-bold text-base">
                {answeredCount} / {totalQuestions}
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-black/40 border border-[var(--color-apb-surface-border)]">
              <span className="text-muted-foreground block text-[10px] uppercase">Status</span>
              <span className="text-emerald-400 font-bold text-base flex items-center justify-center gap-1">
                <Lock className="w-3.5 h-3.5" /> LOCKED
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--color-apb-surface-border)] text-xs font-mono text-muted-foreground flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-[var(--color-apb-cyan)] animate-spin" />
            <span>WAITING FOR RESULTS & ROUND 02 QUALIFICATION ANNOUNCEMENT</span>
          </div>
        </APBCard>
      </div>
    );
  }

  const optionLabels: ("A" | "B" | "C")[] = ["A", "B", "C"];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24 font-sans">
      {/* Quiz Top Subheader Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[var(--color-apb-surface)]/80 border border-[var(--color-apb-surface-border)] backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--color-apb-cyan)]/10 border border-[var(--color-apb-cyan)]/30 flex items-center justify-center text-[var(--color-apb-cyan)]">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[var(--color-apb-cyan)] tracking-widest uppercase">
                ROUND 01 — SPEED QUIZ
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                • 20 Questions / 1 Pt Each / No Negative Marking
              </span>
            </div>
            <div className="text-sm font-mono text-white font-bold">
              Team: {teamId} {teamDisplayName ? `(${teamDisplayName})` : ""}
            </div>
          </div>
        </div>

        {/* Status Indicators & Compact Timer */}
        <div className="flex items-center gap-4">
          <div className="font-mono text-xs text-muted-foreground flex items-center gap-2">
            {saveIndicator === "SAVING" && (
              <span className="text-[var(--color-apb-cyan)] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 animate-spin" /> Saving...
              </span>
            )}
            {saveIndicator === "SAVED" && (
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            )}
            <span className="px-2.5 py-1 rounded bg-black/40 border border-[var(--color-apb-surface-border)]">
              Answered: <strong className="text-white">{answeredCount}</strong> / {totalQuestions}
            </span>
          </div>

          <div className="scale-90 origin-right">
            <CircularTimer round={round} size={50} strokeWidth={4} />
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Main: Question & Answer Card (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <APBCard className="p-6 sm:p-8 space-y-8 bg-[var(--color-apb-surface)]/90 border-[var(--color-apb-surface-border)] shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--color-apb-surface-border)] pb-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold px-3 py-1 rounded bg-[var(--color-apb-cyan)]/10 text-[var(--color-apb-cyan)] border border-[var(--color-apb-cyan)]/30 uppercase tracking-wider">
                  QUESTION {currentQ.id.toString().padStart(2, "0")}
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  Question {currentIndex + 1} of {totalQuestions}
                </span>
              </div>
              <span className="text-xs font-mono text-muted-foreground uppercase">
                Worth 1 Point
              </span>
            </div>

            {/* Question Text */}
            <div className="min-h-[90px] flex items-center">
              <h3 className="text-lg sm:text-xl font-medium text-white leading-relaxed">
                {currentQ.question}
              </h3>
            </div>

            {/* Exactly 3 Large Clickable Option Cards */}
            <div className="space-y-3.5 pt-2">
              {currentQ.options.map((optText, optIndex) => {
                const label = optionLabels[optIndex];
                const isSelected = currentSelectedOption === label;

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleSelectOption(label)}
                    className={`w-full text-left p-4 sm:p-5 rounded-xl border font-sans text-sm transition-all flex items-center gap-4 group cursor-pointer ${
                      isSelected
                        ? "bg-[var(--color-apb-cyan)]/15 border-[var(--color-apb-cyan)] text-white shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                        : "bg-black/40 border-[var(--color-apb-surface-border)] text-slate-300 hover:border-slate-600 hover:bg-black/60 hover:text-white"
                    }`}
                  >
                    {/* Option Indicator Badge */}
                    <div
                      className={`w-9 h-9 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 border transition-all ${
                        isSelected
                          ? "bg-[var(--color-apb-cyan)] text-black border-[var(--color-apb-cyan)] font-extrabold"
                          : "bg-black/60 border-slate-700 text-slate-400 group-hover:border-slate-500 group-hover:text-white"
                      }`}
                    >
                      {label}
                    </div>

                    {/* Option Text */}
                    <span className="flex-1 leading-relaxed text-sm sm:text-base">
                      {optText}
                    </span>

                    {/* Checkmark circle when selected */}
                    <div className="shrink-0">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                          isSelected
                            ? "border-[var(--color-apb-cyan)] bg-[var(--color-apb-cyan)] text-black"
                            : "border-slate-700 bg-black/40"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quiz Navigation & Submission Action Controls */}
            <div className="pt-6 border-t border-[var(--color-apb-surface-border)] flex flex-wrap items-center justify-between gap-4">
              <APBButton
                variant="outline"
                size="sm"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                className="font-mono text-xs uppercase"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Previous
              </APBButton>

              <div className="flex items-center gap-3">
                {/* Save Current Answer Button */}
                <APBButton
                  variant="outline"
                  size="sm"
                  onClick={() => saveDraftAnswers(answers)}
                  className="font-mono text-xs uppercase text-slate-300"
                >
                  <Save className="w-3.5 h-3.5 mr-1.5" /> Save
                </APBButton>

                {/* Next or Save & Submit Button */}
                {currentIndex < totalQuestions - 1 ? (
                  <APBButton
                    glow
                    size="sm"
                    onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                    className="font-mono text-xs uppercase"
                  >
                    Next <ArrowRight className="w-4 h-4 ml-2" />
                  </APBButton>
                ) : (
                  <APBButton
                    glow
                    size="sm"
                    onClick={() => setShowConfirmSubmit(true)}
                    className="font-mono text-xs uppercase bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" /> Save & Submit
                  </APBButton>
                )}
              </div>
            </div>
          </APBCard>
        </div>

        {/* Right / Navigation Grid (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <APBCard className="p-5 space-y-5 bg-[var(--color-apb-surface)]/90 border-[var(--color-apb-surface-border)]">
            <div className="flex items-center justify-between border-b border-[var(--color-apb-surface-border)] pb-3">
              <span className="font-mono text-xs font-bold uppercase text-white tracking-widest">
                QUESTIONS (20)
              </span>
              <span className="text-[10px] font-mono text-[var(--color-apb-cyan)] uppercase">
                {answeredCount} of {totalQuestions} Done
              </span>
            </div>

            {/* 4x5 Grid for Questions 01–20 */}
            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = Boolean(answers[q.id]);

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-11 rounded-lg font-mono text-xs font-bold transition-all flex flex-col items-center justify-center relative cursor-pointer ${
                      isCurrent
                        ? "bg-[var(--color-apb-cyan)] text-black border-2 border-white shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                        : isAnswered
                        ? "bg-emerald-950/60 border border-emerald-500/50 text-emerald-400 hover:border-emerald-400"
                        : "bg-black/50 border border-[var(--color-apb-surface-border)] text-muted-foreground hover:text-white hover:border-slate-600"
                    }`}
                  >
                    <span>{q.id.toString().padStart(2, "0")}</span>
                    {isAnswered && !isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute bottom-1.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-[var(--color-apb-surface-border)] grid grid-cols-3 gap-2 font-mono text-[10px] text-muted-foreground text-center">
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[var(--color-apb-cyan)]" />
                <span>Current</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500/80" />
                <span>Answered</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-black/60 border border-[var(--color-apb-surface-border)]" />
                <span>Unanswered</span>
              </div>
            </div>

            {/* Submit Early Button */}
            <div className="pt-2">
              <APBButton
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmSubmit(true)}
                disabled={answeredCount === 0}
                className="w-full font-mono text-xs uppercase border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Review & Submit Quiz ({answeredCount}/{totalQuestions})
              </APBButton>
            </div>
          </APBCard>
        </div>
      </div>

      {/* Confirmation Dialog before Final Quiz Submission */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[var(--color-apb-surface)] border border-[var(--color-apb-surface-border)] shadow-2xl space-y-6 animate-scaleIn font-sans">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-mono font-bold text-white uppercase tracking-wider">
                Submit Quiz Responses?
              </h3>
              <p className="text-xs font-mono text-muted-foreground">
                You have answered <strong className="text-white">{answeredCount} of {totalQuestions}</strong> questions.
                {answeredCount < totalQuestions && (
                  <span className="text-amber-400 block mt-1">
                    Warning: {totalQuestions - answeredCount} question(s) remain unanswered!
                  </span>
                )}
              </p>
            </div>

            <div className="p-3 bg-black/40 border border-[var(--color-apb-surface-border)] rounded-lg text-[11px] font-mono text-slate-300">
              Once confirmed, your answers will be permanently locked and cannot be modified.
            </div>

            <div className="flex items-center gap-3">
              <APBButton
                variant="outline"
                onClick={() => setShowConfirmSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 font-mono text-xs uppercase"
              >
                Cancel
              </APBButton>
              <APBButton
                glow
                onClick={() => handleSubmitQuiz(false)}
                disabled={isSubmitting}
                className="flex-1 font-mono text-xs uppercase bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {isSubmitting ? "Submitting..." : "Confirm & Submit"}
              </APBButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
