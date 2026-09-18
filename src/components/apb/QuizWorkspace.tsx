
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Default standard 20 questions for Round 1 if not explicitly seeded
export const DEFAULT_QUIZ_QUESTIONS: QuizQuestion[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  question: `Sample Question ${i + 1}`,
  options: ["Option A", "Option B", "Option C"],
  points: 1
}));

interface QuizWorkspaceProps {
  round: Round;
  teamId: string;
  teamDisplayName?: string;
  eventId: string;
  initialAnswers: Record<number, "A" | "B" | "C">;
  initialVisited?: Record<number, boolean>;
  existingSubmission: Submission | null;
}

export function QuizWorkspace({
  round,
  teamId,
  teamDisplayName,
  eventId,
  initialAnswers,
  initialVisited = {},
  existingSubmission
}: QuizWorkspaceProps) {
  const [answers, setAnswers] = useState<Record<number, "A" | "B" | "C">>(initialAnswers || {});
  const [visited, setVisited] = useState<Record<number, boolean>>(initialVisited || { 1: true });
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionWarningOpen, setSubmissionWarningOpen] = useState(false);
  
  const questions = round.quizQuestions && round.quizQuestions.length > 0 ? round.quizQuestions : DEFAULT_QUIZ_QUESTIONS;
  const currentQuestion = questions[currentQIndex];

  // Derive counts
  const answeredCount = Object.keys(answers).length;
  const visitedCount = Object.keys(visited).length;
  const unansweredCount = questions.length - answeredCount;

  // Real-time authoritative draft saving
  const saveDraft = useCallback(async (newAnswers: typeof answers, newVisited: typeof visited) => {
    setIsSaving(true);
    try {
      const draftRef = doc(db, `events/${eventId}/drafts/${teamId}_${round.id}`);
      await setDoc(draftRef, {
        eventId,
        teamId,
        roundId: round.id,
        quizAnswers: newAnswers,
        quizVisited: newVisited,
        updatedAt: Date.now(),
      }, { merge: true });
    } catch (e) {
      console.error("Failed to save draft:", e);
    }
    setIsSaving(false);
  }, [eventId, teamId, round.id]);

  // If a question is shown, mark it visited immediately
  useEffect(() => {
    if (currentQuestion && !visited[currentQuestion.id]) {
      const newVisited = { ...visited, [currentQuestion.id]: true };
      setVisited(newVisited);
      saveDraft(answers, newVisited);
    }
  }, [currentQuestion, visited, answers, saveDraft]);

  const handleOptionSelect = (optionIdx: number) => {
    if (existingSubmission) return;
    const optionLetter = optionIdx === 0 ? "A" : optionIdx === 1 ? "B" : "C";
    const newAnswers = { ...answers, [currentQuestion.id]: optionLetter };
    setAnswers(newAnswers);
    saveDraft(newAnswers, visited);
  };

  const navigateTo = (index: number) => {
    if (existingSubmission) return;
    setCurrentQIndex(index);
    // Draft is saved automatically via the useEffect if not visited
    saveDraft(answers, visited);
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      navigateTo(currentQIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQIndex > 0) {
      navigateTo(currentQIndex - 1);
    }
  };

  const triggerSubmit = () => {
    setSubmissionWarningOpen(true);
  };

  const handleFinalSubmit = async (isAutoSubmit = false) => {
    if (isSubmitting || existingSubmission) return;
    setIsSubmitting(true);
    setSubmissionWarningOpen(false);

    try {
      await submitFinalResponse(eventId, teamId, round.id, {
        prompt: "QUIZ_SUBMISSION", // Required by schema but irrelevant here
        quizAnswers: answers,
        version: Date.now(),
        isAutoSubmitted: isAutoSubmit
      }, "QUIZ");
    } catch (e) {
      console.error("Submission failed:", e);
    }
    setIsSubmitting(false);
  };

  // Auto-submit at deadline
  const timeRemaining = round.endsAt ? round.endsAt - Date.now() : 0;
  
  useEffect(() => {
    if (existingSubmission || !round.endsAt || round.status !== "LIVE") return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= round.endsAt!) {
        handleFinalSubmit(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [round.endsAt, round.status, existingSubmission, handleFinalSubmit]);

  if (existingSubmission) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldCheck className="w-24 h-24 text-[var(--color-apb-cyan)] mb-6 animate-pulse" />
        <h2 className="text-3xl font-mono tracking-widest text-white uppercase mb-4">
          Quiz Submitted
        </h2>
        <p className="text-slate-400 max-w-md">
          Your answers have been securely recorded. Please wait for the round to complete. Correct answers will be revealed by the organizer.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full w-full">
      {/* Left Sidebar: Navigation Grid */}
      <div className="col-span-1 flex flex-col gap-6">
        <APBCard glow className="p-4 border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-sm tracking-widest text-slate-300 uppercase">
              {questions.length} QUESTIONS
            </h3>
          </div>
          
          <div className="grid grid-cols-5 gap-2 mb-6">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentQIndex;
              const hasAnswer = !!answers[q.id];
              const isVisited = !!visited[q.id];

              let bgClass = "bg-slate-800/50 border-slate-700 text-slate-500"; // Unvisited
              if (hasAnswer) bgClass = "bg-[var(--color-apb-cyan)]/20 border-[var(--color-apb-cyan)]/50 text-[var(--color-apb-cyan)]"; // Answered
              else if (isVisited) bgClass = "bg-amber-500/10 border-amber-500/30 text-amber-500/70"; // Visited, not answered

              if (isCurrent) {
                bgClass = hasAnswer 
                  ? "bg-[var(--color-apb-cyan)]/40 border-[var(--color-apb-cyan)] text-white shadow-[0_0_10px_var(--color-apb-cyan)]"
                  : "bg-amber-500/30 border-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.5)]";
              }

              return (
                <button
                  key={q.id}
                  onClick={() => navigateTo(idx)}
                  className={`aspect-square flex items-center justify-center font-mono text-xs rounded border transition-all ${bgClass}`}
                >
                  {q.id.toString().padStart(2, "0")}
                </button>
              );
            })}
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Answered:</span>
              <span className="text-[var(--color-apb-cyan)]">{answeredCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Visited:</span>
              <span className="text-amber-500">{visitedCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Unanswered:</span>
              <span className="text-white">{unansweredCount}</span>
            </div>
          </div>
        </APBCard>

        <APBCard className="p-4 bg-[var(--color-apb-cyan)]/5 border-[var(--color-apb-cyan)]/20">
          <div className="flex justify-between items-center mb-2">
            <span className="font-mono text-xs text-slate-400">TIME REMAINING</span>
            {isSaving ? (
              <span className="font-mono text-[10px] text-yellow-500 flex items-center gap-1 animate-pulse"><Save className="w-3 h-3"/> SAVING</span>
            ) : (
              <span className="font-mono text-[10px] text-green-500 flex items-center gap-1"><Check className="w-3 h-3"/> SAVED</span>
            )}
          </div>
          <CircularTimer
            durationSeconds={round.durationSeconds}
            startsAt={round.startedAt}
            endsAt={round.endsAt}
            pausedRemainingSeconds={round.pausedRemainingSeconds}
            status={round.status}
            size="sm"
          />
        </APBCard>
      </div>

      {/* Main Question Panel */}
      <div className="col-span-1 lg:col-span-3 flex flex-col">
        <APBCard glow className="flex-1 flex flex-col p-6 md:p-10 border-slate-700/50 relative overflow-hidden">
          {/* Question Header */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-700">
            <h2 className="font-mono text-xl md:text-2xl tracking-widest text-[var(--color-apb-cyan)]">
              QUESTION {currentQuestion.id.toString().padStart(2, "0")} <span className="text-slate-500 text-sm">/ {questions.length}</span>
            </h2>
            {answers[currentQuestion.id] && (
              <div className="flex items-center gap-2 text-green-400 bg-green-500/10 px-3 py-1 rounded border border-green-500/20">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-mono text-xs uppercase tracking-widest">Answered</span>
              </div>
            )}
          </div>

          {/* Question Text */}
          <div className="text-lg md:text-xl text-white mb-10 leading-relaxed font-sans font-light">
            {currentQuestion.question}
          </div>

          {/* Options */}
          <div className="space-y-4 flex-1">
            {currentQuestion.options.map((opt, idx) => {
              const letter = idx === 0 ? "A" : idx === 1 ? "B" : "C";
              const isSelected = answers[currentQuestion.id] === letter;
              
              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  className={`w-full text-left p-5 md:p-6 rounded-lg border transition-all flex items-start gap-4 ${
                    isSelected 
                      ? "bg-[var(--color-apb-cyan)]/10 border-[var(--color-apb-cyan)] shadow-[0_0_15px_rgba(0,240,255,0.15)]" 
                      : "bg-background/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected ? "border-[var(--color-apb-cyan)] bg-[var(--color-apb-cyan)] text-black" : "border-slate-500 text-transparent"
                  }`}>
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-black" />}
                  </div>
                  <div className="flex-1">
                    <span className={`font-mono font-bold mr-3 ${isSelected ? "text-[var(--color-apb-cyan)]" : "text-slate-400"}`}>
                      {letter}.
                    </span>
                    <span className={`text-base md:text-lg ${isSelected ? "text-white" : "text-slate-300"}`}>
                      {opt}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation Footer */}
          <div className="mt-8 pt-6 border-t border-slate-700 flex items-center justify-between">
            <APBButton 
              variant="outline" 
              onClick={handlePrev}
              disabled={currentQIndex === 0}
              className="min-w-[120px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              PREVIOUS
            </APBButton>
            
            <div className="flex gap-4">
              {currentQIndex === questions.length - 1 ? (
                <APBButton 
                  glow 
                  onClick={triggerSubmit}
                  className="min-w-[150px] bg-green-600 hover:bg-green-500 border-green-400 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                >
                  <Send className="w-4 h-4 mr-2" />
                  SAVE & SUBMIT
                </APBButton>
              ) : (
                <APBButton 
                  variant="default"
                  onClick={handleNext}
                  className="min-w-[120px]"
                >
                  NEXT
                  <ArrowRight className="w-4 h-4 ml-2" />
                </APBButton>
              )}
            </div>
          </div>
        </APBCard>
      </div>

      {/* Submission Warning Modal */}
      <Dialog open={submissionWarningOpen} onOpenChange={setSubmissionWarningOpen}>
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
                <span className="text-[var(--color-apb-cyan)]">{answeredCount} / {questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unanswered:</span>
                <span className={unansweredCount > 0 ? "text-amber-500 animate-pulse" : "text-white"}>{unansweredCount}</span>
              </div>
            </div>
            
            <div className="text-sm text-slate-300">
              Once submitted, your answers become immutable. The quiz will be locked and automatically evaluated.
            </div>
          </div>
          <DialogFooter>
            <APBButton variant="ghost" onClick={() => setSubmissionWarningOpen(false)}>
              CANCEL
            </APBButton>
            <APBButton glow onClick={() => handleFinalSubmit(false)} disabled={isSubmitting}>
              {isSubmitting ? "SUBMITTING..." : "SUBMIT QUIZ"}
            </APBButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

