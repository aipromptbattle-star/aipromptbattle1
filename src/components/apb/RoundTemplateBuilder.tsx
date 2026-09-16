"use client";

import React, { useState } from "react";
import { Round, RoundTemplateType, QuizQuestion, ProgressiveConstraintStage, EvaluationRule } from "@/lib/firebase/schema";
import { APBCard } from "./APBCard";
import { APBButton } from "./APBButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ParticipantPreviewModal } from "./ParticipantPreviewModal";
import { DEFAULT_QUIZ_QUESTIONS } from "./QuizWorkspace";
import { DEFAULT_PROGRESSIVE_STAGES } from "./ProgressiveConstraintWorkspace";
import { createRound } from "@/lib/firebase/rounds";
import { 
  Sparkles, 
  HelpCircle, 
  Zap, 
  Eye, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock,
  Layers,
  ArrowRight,
  X
} from "lucide-react";

interface RoundTemplateBuilderProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (roundId: string) => void;
  onCancel?: () => void;
  onSaveRound?: (roundData: Partial<Round>) => Promise<void>;
  nextRoundNumber?: number;
  initialRoundNumber?: number;
}

export function RoundTemplateBuilder({
  open,
  onOpenChange,
  onSuccess,
  onCancel,
  onSaveRound,
  nextRoundNumber,
  initialRoundNumber = 1,
}: RoundTemplateBuilderProps) {
  const effectiveInitialNumber = nextRoundNumber || initialRoundNumber;
  const [selectedTemplate, setSelectedTemplate] = useState<RoundTemplateType | null>(null);
  const [roundNumber, setRoundNumber] = useState(effectiveInitialNumber);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [challengeType, setChallengeType] = useState<"TEXT" | "IMAGE" | "COMBINED">("COMBINED");
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // 1. Quiz Template State (default 20 questions, fully editable)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(DEFAULT_QUIZ_QUESTIONS);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // 2. Progressive Constraint Template State (default 5 stages, fully editable)
  const [progressiveStages, setProgressiveStages] = useState<ProgressiveConstraintStage[]>(DEFAULT_PROGRESSIVE_STAGES);

  const handleSelectTemplate = (type: RoundTemplateType) => {
    setSelectedTemplate(type);
    if (type === "QUIZ") {
      setTitle("Speed Quiz Challenge");
      setDescription("Round 1: Rapid-fire AI prompt engineering quiz.");
      setDurationMinutes(20);
      setChallengeType("TEXT");
    } else if (type === "PROGRESSIVE_CONSTRAINT") {
      setTitle("Progressive Prompt Breaker");
      setDescription("Round 2: Adaptive prompt engineering across progressive constraint stages.");
      setDurationMinutes(20);
      setChallengeType("COMBINED");
    } else {
      setTitle("Open Prompt Challenge");
      setDescription("Standard prompt battle round with freeform text, prompt engineering, and asset generation.");
      setDurationMinutes(25);
      setChallengeType("COMBINED");
    }
  };

  const handleUpdateQuizQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const next = [...quizQuestions];
    next[index] = { ...next[index], [field]: value };
    setQuizQuestions(next);
  };

  const handleUpdateQuizOption = (qIndex: number, optIndex: number, text: string) => {
    const next = [...quizQuestions];
    const options = [...next[qIndex].options] as [string, string, string];
    options[optIndex] = text;
    next[qIndex] = { ...next[qIndex], options };
    setQuizQuestions(next);
  };

  const handleAddQuizQuestion = () => {
    const newQ: QuizQuestion = {
      id: Date.now(),
      question: `New Question #${quizQuestions.length + 1}`,
      options: ["Option A", "Option B", "Option C"],
      correctAnswer: "A",
      points: 1,
    };
    const next = [...quizQuestions, newQ];
    setQuizQuestions(next);
    setActiveQuestionIndex(next.length - 1);
  };

  const handleRemoveQuizQuestion = (index: number) => {
    if (quizQuestions.length <= 1) return;
    const next = quizQuestions.filter((_, i) => i !== index);
    setQuizQuestions(next);
    setActiveQuestionIndex(Math.max(0, index - 1));
  };

  const handleUpdateStageStatement = (stageNum: number, statement: string) => {
    const next = progressiveStages.map((s) => (s.stageNumber === stageNum ? { ...s, statement } : s));
    setProgressiveStages(next);
  };

  const handleAddStage = () => {
    const nextStageNum = progressiveStages.length + 1;
    const stageDuration = Math.max(1, Math.floor(durationMinutes / nextStageNum));
    const newStage: ProgressiveConstraintStage = {
      stageNumber: nextStageNum,
      stageName: `Stage 0${nextStageNum}`,
      unlockMinute: (nextStageNum - 1) * stageDuration,
      statement: `Constraint ${nextStageNum}: Specify new dynamic requirement.`,
    };
    setProgressiveStages([...progressiveStages, newStage]);
  };

  const handleRemoveStage = () => {
    if (progressiveStages.length <= 2) return;
    setProgressiveStages(progressiveStages.slice(0, progressiveStages.length - 1));
  };

  const handleCreateRound = async () => {
    if (!selectedTemplate) return;
    setLoading(true);

    try {
      const durationSeconds = Math.max(60, durationMinutes * 60);

      // Re-derive unlock minutes for progressive stages according to duration
      const stageInterval = Math.max(1, Math.floor(durationMinutes / progressiveStages.length));
      const adjustedStages = progressiveStages.map((stg, idx) => ({
        ...stg,
        unlockMinute: idx * stageInterval,
      }));

      const payload: Partial<Round> = {
        roundNumber,
        title: title.trim() || (selectedTemplate === "QUIZ" ? "Speed Quiz" : selectedTemplate === "PROGRESSIVE_CONSTRAINT" ? "Prompt Breaker" : "Prompt Challenge"),
        description: description.trim(),
        durationSeconds,
        templateType: selectedTemplate,
        challengeType: selectedTemplate === "QUIZ" ? "TEXT" : (selectedTemplate === "PROGRESSIVE_CONSTRAINT" ? "COMBINED" : challengeType),
        status: "READY",
        quizQuestions: selectedTemplate === "QUIZ" ? quizQuestions : undefined,
        progressiveStages: selectedTemplate === "PROGRESSIVE_CONSTRAINT" ? adjustedStages : undefined,
        initialStatement: selectedTemplate === "PROGRESSIVE_CONSTRAINT" ? adjustedStages[0]?.statement : undefined,
      };

      if (onSaveRound) {
        await onSaveRound(payload);
      } else {
        const roundId = await createRound(payload as any);
        if (onSuccess) onSuccess(roundId);
      }

      if (onOpenChange) {
        onOpenChange(false);
      }
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to create round.");
    } finally {
      setLoading(false);
    }
  };

  // Draft preview object
  const previewRound: Partial<Round> = {
    roundNumber,
    title,
    templateType: selectedTemplate || "QUIZ",
    quizQuestions,
    progressiveStages,
    durationSeconds: durationMinutes * 60,
  };

  const content = (
    <div className="space-y-6 font-sans">
      {/* Template Chooser Cards (§24) */}
      {!selectedTemplate ? (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-xl font-mono font-bold uppercase text-white tracking-wider">
              Choose Competition Round Template
            </h3>
            <p className="text-xs font-mono text-muted-foreground">
              Select an automated event template to instantly configure duration, constraints, and evaluation rules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* 1. Quiz Template Card */}
            <div
              onClick={() => handleSelectTemplate("QUIZ")}
              className="p-6 rounded-2xl bg-[var(--color-apb-surface)] border-2 border-[var(--color-apb-surface-border)] hover:border-[var(--color-apb-cyan)] hover:shadow-[0_0_25px_rgba(0,240,255,0.15)] cursor-pointer transition-all group space-y-4 text-left flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-apb-cyan)]/10 border border-[var(--color-apb-cyan)]/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    🧠
                  </div>
                  <span className="text-[10px] font-mono uppercase font-bold px-2.5 py-1 rounded bg-[var(--color-apb-cyan)]/15 text-[var(--color-apb-cyan)] border border-[var(--color-apb-cyan)]/30">
                    ROUND 01
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-mono font-bold text-white uppercase group-hover:text-[var(--color-apb-cyan)] transition-colors">
                    QUIZ TEMPLATE
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    20 Questions • 20 Mins • Exactly 3 Options • 1 Pt Each • Auto-Submit
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center text-xs font-mono text-[var(--color-apb-cyan)] font-semibold">
                Configure Quiz Round <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* 2. Progressive Constraint Template Card */}
            <div
              onClick={() => handleSelectTemplate("PROGRESSIVE_CONSTRAINT")}
              className="p-6 rounded-2xl bg-[var(--color-apb-surface)] border-2 border-[var(--color-apb-surface-border)] hover:border-[var(--color-apb-cyan)] hover:shadow-[0_0_25px_rgba(0,240,255,0.15)] cursor-pointer transition-all group space-y-4 text-left flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    ⚡
                  </div>
                  <span className="text-[10px] font-mono uppercase font-bold px-2.5 py-1 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    ROUND 02
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-mono font-bold text-white uppercase group-hover:text-purple-400 transition-colors">
                    PROGRESSIVE CONSTRAINT
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    20 Mins • 5 Stages × 4 Mins • New Constraint Every 4 Mins • Auto Freeze
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center text-xs font-mono text-purple-400 font-semibold">
                Configure Constraint <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* 3. Standard Prompt Battle Card */}
            <div
              onClick={() => handleSelectTemplate("STANDARD")}
              className="p-6 rounded-2xl bg-[var(--color-apb-surface)] border-2 border-[var(--color-apb-surface-border)] hover:border-amber-400 hover:shadow-[0_0_25px_rgba(251,191,36,0.15)] cursor-pointer transition-all group space-y-4 text-left flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    🎯
                  </div>
                  <span className="text-[10px] font-mono uppercase font-bold px-2.5 py-1 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    STANDARD
                  </span>
                </div>

                <div>
                  <h4 className="text-base font-mono font-bold text-white uppercase group-hover:text-amber-400 transition-colors">
                    STANDARD BATTLE
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    Freeform AI Prompting • Text & Image Assets • Custom Timer • Judge Rubrics
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center text-xs font-mono text-amber-400 font-semibold">
                Configure Standard <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Template Configuration Deck */
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--color-apb-surface-border)] pb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {selectedTemplate === "QUIZ" ? "🧠" : selectedTemplate === "PROGRESSIVE_CONSTRAINT" ? "⚡" : "🎯"}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[var(--color-apb-cyan)] uppercase">
                    {selectedTemplate === "QUIZ"
                      ? "Round 01 — Quiz Template"
                      : selectedTemplate === "PROGRESSIVE_CONSTRAINT"
                      ? "Round 02 — Progressive Constraint Template"
                      : "Standard Prompt Battle Template"}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    ({durationMinutes} Minutes Configured)
                  </span>
                </div>
                <h3 className="text-lg font-mono font-bold text-white uppercase">
                  {title || "New Competition Round"}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Preview Button (§27) */}
              <APBButton
                variant="outline"
                size="sm"
                onClick={() => setPreviewOpen(true)}
                className="font-mono text-xs uppercase text-[var(--color-apb-cyan)] border-[var(--color-apb-cyan)]/40 hover:bg-[var(--color-apb-cyan)]/10"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview Participant View
              </APBButton>

              <button
                type="button"
                onClick={() => setSelectedTemplate(null)}
                className="text-xs font-mono text-muted-foreground hover:text-white px-2.5 py-1"
              >
                Change Template
              </button>
            </div>
          </div>

          {/* General Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <Label className="font-mono text-xs text-muted-foreground uppercase block mb-1">Round Number</Label>
              <Input
                type="number"
                value={roundNumber}
                onChange={(e) => setRoundNumber(parseInt(e.target.value) || 1)}
                className="font-mono text-sm bg-black/50"
              />
            </div>
            <div>
              <Label className="font-mono text-xs text-muted-foreground uppercase block mb-1">Duration (Minutes)</Label>
              <Input
                type="number"
                min={1}
                max={180}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                className="font-mono text-sm bg-black/50"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="font-mono text-xs text-muted-foreground uppercase block mb-1">Round Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Prompt Breaker"
                className="font-mono text-sm bg-black/50"
              />
            </div>
            <div className="sm:col-span-4">
              <Label className="font-mono text-xs text-muted-foreground uppercase block mb-1">Round Description / Brief</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Event instructions displayed to participants..."
                className="font-mono text-sm bg-black/50"
              />
            </div>
          </div>

          {/* 0. STANDARD ROUND PROMPT BRIEF */}
          {selectedTemplate === "STANDARD" && (
            <APBCard className="p-6 space-y-4 bg-black/40 border-[var(--color-apb-surface-border)]">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                    Standard Challenge Settings
                  </h4>
                  <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                    Configure participant submission requirements for open prompt challenges.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="font-mono text-xs text-muted-foreground uppercase">Challenge Mode:</Label>
                  <select
                    value={challengeType}
                    onChange={(e: any) => setChallengeType(e.target.value)}
                    className="bg-black/60 border border-[var(--color-apb-surface-border)] rounded px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-[var(--color-apb-cyan)]"
                  >
                    <option value="COMBINED">Combined (Text + Image Prompting)</option>
                    <option value="TEXT">Text Only</option>
                    <option value="IMAGE">Image / Creative Only</option>
                  </select>
                </div>
              </div>
            </APBCard>
          )}

          {/* 1. QUIZ QUESTIONS EDITOR (§25) */}
          {selectedTemplate === "QUIZ" && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  Quiz Questions (20 Total)
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  Editing Question {(activeQuestionIndex + 1).toString().padStart(2, "0")}
                </span>
              </div>

              {/* Question Navigation Tabs (1..20) */}
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-black/50 border border-[var(--color-apb-surface-border)]">
                {quizQuestions.map((q, idx) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setActiveQuestionIndex(idx)}
                    className={`w-8 h-8 rounded font-mono text-xs font-bold transition-all ${
                      idx === activeQuestionIndex
                        ? "bg-[var(--color-apb-cyan)] text-black font-extrabold shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                        : "bg-black/60 text-slate-400 hover:text-white"
                    }`}
                  >
                    {(idx + 1).toString().padStart(2, "0")}
                  </button>
                ))}
              </div>

              {/* Single Question Editor Card */}
              {quizQuestions[activeQuestionIndex] && (
                <APBCard className="p-6 space-y-4 bg-black/40 border-[var(--color-apb-surface-border)]">
                  <div>
                    <Label className="font-mono text-xs text-muted-foreground uppercase block mb-1">
                      Question Text #{activeQuestionIndex + 1}
                    </Label>
                    <textarea
                      rows={2}
                      value={quizQuestions[activeQuestionIndex].question}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleUpdateQuizQuestion(activeQuestionIndex, "question", e.target.value)}
                      className="w-full bg-black/60 border border-[var(--color-apb-surface-border)] rounded-md px-3 py-2 text-xs font-mono text-white resize-none focus:outline-none focus:border-[var(--color-apb-cyan)]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(["A", "B", "C"] as const).map((optLabel, oIdx) => (
                      <div key={optLabel} className="space-y-1">
                        <Label className="font-mono text-xs text-muted-foreground uppercase block">
                          Option {optLabel}
                        </Label>
                        <Input
                          value={quizQuestions[activeQuestionIndex].options[oIdx] || ""}
                          onChange={(e) => handleUpdateQuizOption(activeQuestionIndex, oIdx, e.target.value)}
                          className="font-mono text-xs bg-black/60"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--color-apb-surface-border)] text-xs font-mono">
                    <div className="flex items-center gap-3">
                      <Label className="text-muted-foreground uppercase">Correct Answer (Privileged / Hidden from client):</Label>
                      <select
                        value={quizQuestions[activeQuestionIndex].correctAnswer || "A"}
                        onChange={(e) => handleUpdateQuizQuestion(activeQuestionIndex, "correctAnswer", e.target.value)}
                        className="h-8 rounded bg-black/80 border border-[var(--color-apb-surface-border)] px-3 text-xs font-mono text-[var(--color-apb-cyan)] font-bold uppercase"
                      >
                        <option value="A">Option A</option>
                        <option value="B">Option B</option>
                        <option value="C">Option C</option>
                      </select>
                    </div>

                    <span className="text-muted-foreground">Points: 1</span>
                  </div>
                </APBCard>
              )}
            </div>
          )}

          {/* 2. PROGRESSIVE CONSTRAINT STAGES EDITOR (§26) */}
          {selectedTemplate === "PROGRESSIVE_CONSTRAINT" && (
            <div className="space-y-4 pt-2">
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider block">
                5 Progressive Stages (4 Minutes Each)
              </span>

              <div className="space-y-4">
                {progressiveStages.map((stg) => (
                  <APBCard key={stg.stageNumber} className="p-5 space-y-3 bg-black/40 border-[var(--color-apb-surface-border)]">
                    <div className="flex items-center justify-between border-b border-[var(--color-apb-surface-border)] pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded bg-[var(--color-apb-cyan)]/15 text-[var(--color-apb-cyan)] border border-[var(--color-apb-cyan)]/30 font-mono text-xs font-bold uppercase">
                          STAGE 0{stg.stageNumber}
                        </span>
                        <span className="font-mono text-xs text-white font-bold uppercase">
                          {stg.stageName}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">
                        Revealed at {stg.unlockMinute}:00 ({stg.unlockMinute === 0 ? "Start" : `${stg.unlockMinute} mins in`})
                      </span>
                    </div>

                    <div>
                      <Label className="font-mono text-xs text-muted-foreground uppercase block mb-1">
                        Constraint / Challenge Statement
                      </Label>
                      <textarea
                        rows={2}
                        value={stg.statement}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleUpdateStageStatement(stg.stageNumber, e.target.value)}
                        className="w-full bg-black/60 border border-[var(--color-apb-surface-border)] rounded-md px-3 py-2 text-xs font-mono text-white resize-none focus:outline-none focus:border-[var(--color-apb-cyan)]"
                      />
                    </div>

                    {/* Evaluation Rules Summary */}
                    {stg.evaluationRules && stg.evaluationRules.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-mono text-muted-foreground">
                        <span className="text-slate-400">Rules:</span>
                        {stg.evaluationRules.map((r) => (
                          <span key={r.id} className="px-2 py-0.5 rounded bg-black/60 border border-[var(--color-apb-surface-border)] text-slate-300">
                            {r.description} ({r.points} pts)
                          </span>
                        ))}
                      </div>
                    )}
                  </APBCard>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-6 border-t border-[var(--color-apb-surface-border)]">
            <APBButton 
              variant="outline" 
              onClick={() => onOpenChange ? onOpenChange(false) : (onCancel ? onCancel() : null)} 
              disabled={loading} 
              className="font-mono text-xs uppercase"
            >
              Cancel
            </APBButton>

            <div className="flex items-center gap-3">
              <APBButton
                variant="outline"
                onClick={() => setPreviewOpen(true)}
                className="font-mono text-xs uppercase"
              >
                <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview View
              </APBButton>

              <APBButton
                glow
                onClick={handleCreateRound}
                disabled={loading}
                className="font-mono text-xs uppercase px-6"
              >
                {loading ? "Creating..." : "Save & Create Round"}
              </APBButton>
            </div>
          </div>
        </div>
      )}

      {/* Participant Preview Modal Integration (§27) */}
      <ParticipantPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        round={previewRound}
      />
    </div>
  );

  if (open !== undefined) {
    if (!open) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <div className="max-w-4xl w-full my-8 bg-[#07080b] border border-[var(--color-apb-surface-border)] rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
          <button 
            onClick={() => onOpenChange ? onOpenChange(false) : (onCancel ? onCancel() : null)}
            className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {content}
        </div>
      </div>
    );
  }

  return content;
}
