"use client";

import React, { useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { APBCard } from "./APBCard";
import { APBButton } from "./APBButton";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Trash2, Copy, Check, User, Save, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { OnMount, BeforeMount } from "@monaco-editor/react";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[320px] bg-black/60 border border-[var(--color-apb-surface-border)] rounded-md flex flex-col items-center justify-center text-muted-foreground font-mono text-xs gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--color-apb-cyan)]" />
        <span>Initializing APB Monaco Engine...</span>
      </div>
    ),
  }
);

interface PromptEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  isMyRole: boolean;
  member1Name?: string;
  readOnly?: boolean;
  saveStatus?: "SAVED" | "SAVING" | "OFFLINE" | "ERROR";
  onSave?: () => void;
}

export function PromptEditor({
  value,
  onChange,
  isMyRole,
  member1Name,
  readOnly = false,
  saveStatus,
  onSave,
}: PromptEditorProps) {
  const [copied, setCopied] = React.useState(false);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const charCount = value ? value.length : 0;
  const wordCount = value && value.trim() ? value.trim().split(/\s+/).length : 0;

  // Window-level Ctrl+S shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.code === "KeyS")) {
        e.preventDefault();
        if (onSaveRef.current) {
          onSaveRef.current();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleBeforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme("apb-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "", foreground: "f1f5f9", background: "080c14" },
        { token: "keyword", foreground: "00f5ff", fontStyle: "bold" },
        { token: "string", foreground: "34d399" },
        { token: "number", foreground: "f59e0b" },
        { token: "comment", foreground: "64748b", fontStyle: "italic" },
      ],
      colors: {
        "editor.background": "#080c14",
        "editor.foreground": "#f1f5f9",
        "editorCursor.foreground": "#00f5ff",
        "editor.lineHighlightBackground": "#0f172a",
        "editorLineNumber.foreground": "#475569",
        "editorLineNumber.activeForeground": "#00f5ff",
        "editor.selectionBackground": "#1e293b",
        "editor.inactiveSelectionBackground": "#0f172a",
      },
    });
  };

  const handleOnMount: OnMount = (editor, monaco) => {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (onSaveRef.current) {
        onSaveRef.current();
      }
    });
  };

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
    <APBCard
      className={`p-5 space-y-4 border-[var(--color-apb-surface-border)] ${
        isMyRole
          ? "ring-1 ring-[var(--color-apb-cyan)]/30 bg-[var(--color-apb-surface)]"
          : "bg-[var(--color-apb-surface)]/50"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-apb-surface-border)] pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[var(--color-apb-cyan)]" />
          <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
            Member 01 — Prompt Workspace (Monaco)
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

      {/* Editor Sub-header with Save Status Indicator & Shortcuts */}
      <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
        <p>
          Craft your primary prompt instruction here. Autosaves automatically (<kbd className="px-1 py-0.5 rounded bg-black/40 border border-slate-700 text-slate-300">Ctrl+S</kbd> to save now).
        </p>
        {saveStatus && (
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {saveStatus === "SAVING" && (
              <>
                <Loader2 className="w-3 h-3 text-[var(--color-apb-cyan)] animate-spin" />
                <span className="text-[var(--color-apb-cyan)]">Saving...</span>
              </>
            )}
            {saveStatus === "SAVED" && (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Saved</span>
              </>
            )}
            {saveStatus === "OFFLINE" && (
              <>
                <AlertCircle className="w-3 h-3 text-amber-400" />
                <span className="text-amber-400">Local Draft</span>
              </>
            )}
            {saveStatus === "ERROR" && (
              <>
                <AlertCircle className="w-3 h-3 text-rose-400" />
                <span className="text-rose-400">Save Failed</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Monaco Editor Container */}
      <div className="relative rounded-md overflow-hidden border border-[var(--color-apb-surface-border)] bg-[#080c14] focus-within:ring-2 focus-within:ring-[var(--color-apb-cyan)] transition-all">
        <MonacoEditor
          height="320px"
          language="markdown"
          theme="apb-dark"
          value={value}
          onChange={(val) => onChange(val || "")}
          beforeMount={handleBeforeMount}
          onMount={handleOnMount}
          options={{
            readOnly,
            wordWrap: "on",
            minimap: { enabled: false },
            lineNumbers: "on",
            lineNumbersMinChars: 3,
            scrollBeyondLastLine: false,
            fontSize: 14,
            fontFamily: "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            automaticLayout: true,
            padding: { top: 12, bottom: 12 },
            folding: false,
            overviewRulerLanes: 0,
            renderLineHighlight: "line",
            contextmenu: true,
            tabSize: 2,
          }}
        />
      </div>

      {/* Footer / Counters & Action Buttons */}
      <div className="flex items-center justify-between gap-3 pt-2 text-xs font-mono text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="text-white font-bold">
            {charCount} <span className="text-muted-foreground font-normal">characters</span>
          </span>
          <span className="text-white font-bold">
            {wordCount} <span className="text-muted-foreground font-normal">words</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onSave && (
            <APBButton
              variant="outline"
              size="sm"
              onClick={onSave}
              className="h-8 text-xs font-mono text-[var(--color-apb-cyan)] border-[var(--color-apb-cyan)]/40 hover:bg-[var(--color-apb-cyan)]/10"
              type="button"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              Save
            </APBButton>
          )}

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
