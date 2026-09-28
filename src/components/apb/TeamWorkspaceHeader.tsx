
"use client";

import React, { useState, useEffect } from "react";
import { Round } from "@/lib/firebase/schema";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useTeam } from "@/lib/firebase/teams";
import { APBButton } from "./APBButton";
import { WifiOff, CheckCircle2, Loader2, AlertCircle, LogOut } from "lucide-react";

interface TeamWorkspaceHeaderProps {
  teamId: string;
  teamDisplayName?: string;
  teamMembers?: string[];
  round?: Round | null;
  saveStatus: "SAVED" | "SAVING" | "OFFLINE" | "ERROR";
  onLeave: () => void;
}

export function TeamWorkspaceHeader({
  teamId,
  teamDisplayName,
  teamMembers = [],
  saveStatus,
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
    <header className="border-b border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)]/90 backdrop-blur-md px-4 sm:px-6 py-4 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Left: Branding & Team Info */}
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-mono font-black text-white tracking-wider uppercase drop-shadow-sm">
            {teamDisplayName || teamId}
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="text-sm font-mono font-bold tracking-widest text-[var(--color-apb-cyan)] uppercase">
              {teamId}
            </span>
            {teamMembers.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 border-l border-white/20 pl-4">
                <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                  {teamMembers.join(" & ")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Statuses & Sign Out */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0 mt-2 md:mt-0">
          <div className="flex items-center gap-3 text-xs font-mono">
            {/* Online Indicator */}
            <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-md border border-white/5">
              {isOnline ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400 font-bold uppercase tracking-wider">Connected</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-amber-400 flex items-center gap-1 font-bold uppercase tracking-wider">
                    <WifiOff className="w-3 h-3" /> Offline
                  </span>
                </>
              )}
            </div>

            {/* Save Status */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--color-apb-surface-border)]/40 border border-[var(--color-apb-surface-border)]">
              {saveStatus === "SAVING" && (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-[var(--color-apb-cyan)] animate-spin" />
                  <span className="text-[var(--color-apb-cyan)] font-bold uppercase tracking-wider">Saving...</span>
                </>
              )}
              {saveStatus === "SAVED" && (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold uppercase tracking-wider">Saved</span>
                </>
              )}
              {saveStatus === "OFFLINE" && (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-400 font-bold uppercase tracking-wider">Local Draft</span>
                </>
              )}
              {saveStatus === "ERROR" && (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-400 font-bold uppercase tracking-wider">Save Failed</span>
                </>
              )}
            </div>
          </div>

          {/* Leave Button */}
          <APBButton variant="outline" size="sm" onClick={onLeave} className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10 font-mono tracking-widest uppercase text-xs h-8">
            <LogOut className="w-3.5 h-3.5 mr-2" /> Sign Out
          </APBButton>
        </div>
      </div>
    </header>
  );
}
