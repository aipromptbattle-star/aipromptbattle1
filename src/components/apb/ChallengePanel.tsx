"use client";

import React from "react";
import { Round } from "@/lib/firebase/schema";
import { APBCard } from "./APBCard";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, CheckSquare, Sparkles, Image as ImageIcon, Layers } from "lucide-react";

interface ChallengePanelProps {
  round: Round;
}

export function ChallengePanel({ round }: ChallengePanelProps) {
  const challengeType = round.challengeType || "TEXT";
  const title = round.challengeTitle || round.title;
  const description = round.challengeDescription || round.description;

  return (
    <APBCard className="p-5 space-y-4 border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)]/60">
      {/* Header with Challenge Type Badge */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-apb-surface-border)] pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--color-apb-cyan)]" />
          <h3 className="font-mono text-xs uppercase tracking-widest text-[var(--color-apb-cyan)]">
            Round Challenge Brief
          </h3>
        </div>
        <Badge
          variant="outline"
          className="font-mono text-xs uppercase tracking-wider bg-white/5 border-[var(--color-apb-cyan)]/30 text-white flex items-center gap-1.5"
        >
          {challengeType === "TEXT" && <FileText className="w-3 h-3 text-[var(--color-apb-cyan)]" />}
          {challengeType === "IMAGE" && <ImageIcon className="w-3 h-3 text-purple-400" />}
          {challengeType === "COMBINED" && <Layers className="w-3 h-3 text-amber-400" />}
          <span>{challengeType} CHALLENGE</span>
        </Badge>
      </div>

      {/* Challenge Title & Overview */}
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white tracking-tight">
          {title}
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Detailed Instructions if available */}
      {round.challengeInstructions && (
        <div className="space-y-1.5 pt-2 border-t border-[var(--color-apb-surface-border)]/50">
          <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Instructions</span>
          </div>
          <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">
            {round.challengeInstructions}
          </p>
        </div>
      )}

      {/* Reference Material / Seed Prompt if available */}
      {round.referenceMaterial && (
        <div className="space-y-1.5 pt-2 border-t border-[var(--color-apb-surface-border)]/50">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Reference / Scenario
          </span>
          <div className="bg-black/40 border border-[var(--color-apb-surface-border)] rounded p-3 text-xs font-mono text-slate-300 leading-relaxed">
            {round.referenceMaterial}
          </div>
        </div>
      )}

      {/* Constraints list if available */}
      {round.constraints && round.constraints.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[var(--color-apb-surface-border)]/50">
          <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Competition Constraints</span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 font-mono">
            {round.constraints.map((constraint, i) => (
              <li key={i} className="flex items-start gap-2 bg-white/[0.02] p-2 rounded border border-[var(--color-apb-surface-border)]/40">
                <span className="text-[var(--color-apb-cyan)] font-bold">[{i + 1}]</span>
                <span>{constraint}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </APBCard>
  );
}
