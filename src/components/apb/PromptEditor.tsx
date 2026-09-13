"use client";

import React from "react";
import { APBCard } from "./APBCard";
import { APBButton } from "./APBButton";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Trash2, Copy, Check, User } from "lucide-react";

interface PromptEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  isMyRole: boolean;
  member1Name?: string;
  readOnly?: boolean;
}

export function PromptEditor({
  value,
  onChange,
  isMyRole,
  member1Name,
  readOnly = false,
}: PromptEditorProps) {
  const [copied, setCopied] = React.useState(false);

  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  const handleCopy = async () => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (readOnly) return;
    if (confirm("Are you sure you want to clear your current prompt draft?")) {
      onChange("");
    }
  };

  return (
    <APBCard className={`p-5 space-y-4 border-[var(--color-apb-surface-border)] ${isMyRole ? "ring-1 ring-[var(--color-apb-cyan)]/30 bg-[var(--color-apb-surface)]" : "bg-[var(--color-apb-surface)]/50"}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-apb-surface-border)] pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[var(--color-apb-cyan)]" />
          <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
            Member 01 — Prompt Workspace
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {member1Name && (
            <span className="text-xs text-muted-foreground hidden sm:inline font-mono">
              ({member1Name})
            </span>
          )}
          <Badge
            variant="outline"
            className={`font-mono text-xs uppercase ${
              isMyRole
                ? "bg-[var(--color-apb-cyan)]/15 border-[var(--color-apb-cyan)] text-[var(--color-apb-cyan)] font-bold"
                : "bg-white/5 text-muted-foreground"
            }`}
          >
            <User className="w-3 h-3 mr-1" />
            {isMyRole ? "Your Workspace" : "Partner Editing"}
          </Badge>
        </div>
      </div>

      {/* Editor Description */}
      <p className="text-xs text-muted-foreground">
        Craft your primary prompt instruction here. Both team members see changes synchronize in real-time.
      </p>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          placeholder={
            readOnly
              ? "Prompt submission locked."
              : isMyRole
              ? "Type or refine your master prompt instruction here..."
              : "Member 1 is editing the primary prompt..."
          }
          rows={10}
          className="w-full bg-black/50 border border-[var(--color-apb-surface-border)] rounded-md p-4 font-mono text-sm text-slate-100 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--color-apb-cyan)] focus:border-transparent transition-all resize-y leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed"
        />
      </div>

      {/* Footer / Counters & Action Buttons */}
      <div className="flex items-center justify-between gap-3 pt-2 text-xs font-mono text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="text-white font-bold">{charCount} <span className="text-muted-foreground font-normal">characters</span></span>
          <span className="text-white font-bold">{wordCount} <span className="text-muted-foreground font-normal">words</span></span>
        </div>

        <div className="flex items-center gap-2">
          <APBButton
            variant="outline"
            size="sm"
            onClick={handleCopy}
            disabled={!value}
            className="h-8 text-xs font-mono"
            type="button"
          >
            {copied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {copied ? "Copied" : "Copy"}
          </APBButton>

          {!readOnly && (
            <APBButton
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={!value}
              className="h-8 text-xs font-mono text-muted-foreground hover:text-rose-400"
              type="button"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Clear
            </APBButton>
          )}
        </div>
      </div>
    </APBCard>
  );
}
