"use client";

import React, { useState, useEffect } from "react";
import { Round } from "@/lib/firebase/schema";
import { MemberRole } from "@/lib/auth/TeamSessionContext";
import { EventTimer } from "./EventTimer";
import { StatusBadge } from "./StatusBadge";
import { APBButton } from "./APBButton";
import { WifiOff, CheckCircle2, Loader2, AlertCircle, User, LogOut, ArrowLeftRight } from "lucide-react";

interface TeamWorkspaceHeaderProps {
  teamId: string;
  teamDisplayName?: string;
  round: Round;
  memberRole: MemberRole | null;
  saveStatus: "SAVED" | "SAVING" | "OFFLINE" | "ERROR";
  onSwitchRole: () => void;
  onLeave: () => void;
}

export function TeamWorkspaceHeader({
  teamId,
  teamDisplayName,
  round,
  memberRole,
  saveStatus,
  onSwitchRole,
  onLeave,
}: TeamWorkspaceHeaderProps) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    queueMicrotask(() => {
      setIsOnline(navigator.onLine);
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

  return (
    <header className="border-b border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)]/90 backdrop-blur-md px-4 sm:px-6 py-3 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Branding & Team Info */}
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--color-apb-cyan)]">
                AI PROMPT BATTLE
              </span>
              <StatusBadge status={round.status} />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-lg font-mono font-bold text-white tracking-wider">
                {teamId}
              </h1>
              {teamDisplayName && (
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  • {teamDisplayName}
                </span>
              )}
            </div>
          </div>

          <div className="hidden lg:block h-8 w-[1px] bg-[var(--color-apb-surface-border)] mx-1" />

          {/* Round Indicator */}
          <div className="hidden lg:flex flex-col">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
              Round {round.roundNumber}
            </span>
            <span className="text-sm font-semibold text-white truncate max-w-xs">
              {round.title}
            </span>
          </div>

          {/* Member Role Badge */}
          {memberRole && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[var(--color-apb-cyan)]/30 bg-[var(--color-apb-cyan)]/10 text-[var(--color-apb-cyan)] text-xs font-mono tracking-wide">
              <User className="w-3.5 h-3.5" />
              <span>
                {memberRole === "member1" ? "Member 1 — Prompt" : "Member 2 — Creative"}
              </span>
              <button
                onClick={onSwitchRole}
                title="Switch Role"
                className="ml-1 hover:text-white transition-colors"
              >
                <ArrowLeftRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Center/Right: Statuses & Authoritative Timer */}
        <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-6">
          {/* Realtime Connection & Save Status */}
          <div className="flex items-center gap-3 text-xs font-mono">
            {/* Online Indicator */}
            <div className="flex items-center gap-1.5">
              {isOnline ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 hidden sm:inline">Connected</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-amber-400 flex items-center gap-1">
                    <WifiOff className="w-3 h-3" /> Offline
                  </span>
                </>
              )}
            </div>

            {/* Save Status */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[var(--color-apb-surface-border)]/40 border border-[var(--color-apb-surface-border)]">
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
          </div>

          {/* Authoritative Timer */}
          <div className="flex items-center bg-black/40 border border-[var(--color-apb-surface-border)] px-3 py-1 rounded-md">
            <EventTimer round={round} className="!text-2xl md:!text-3xl" />
          </div>

          {/* Leave Button */}
          <APBButton variant="ghost" size="sm" onClick={onLeave} className="text-muted-foreground hover:text-white">
            <LogOut className="w-4 h-4" />
          </APBButton>
        </div>
      </div>
    </header>
  );
}
