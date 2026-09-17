"use client";

import { useState } from "react";
import { APBCard } from "@/components/apb/APBCard";
import { Input } from "@/components/ui/input";
import { useTeams, useSessions } from "@/lib/firebase/teams";
import { useEventState } from "@/lib/firebase/events";
import { useAllTeamRoundStates, useAllSubmissions } from "@/lib/firebase/submissions";
import { Loader2 } from "lucide-react";

function formatTimeAgo(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

export function TeamStatusBoard() {
  const { eventState } = useEventState();
  const { teams, loading: teamsLoading } = useTeams();
  const { sessions } = useSessions();
  const { states: teamStates, loading: statesLoading } = useAllTeamRoundStates("currentEvent", eventState?.currentRoundId || null);
  const { submissions, loading: subsLoading } = useAllSubmissions("currentEvent", eventState?.currentRoundId || null);
  
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "WORKING" | "SUBMITTED" | "OFFLINE" | "AUTO-CAPTURED" | "PROBLEM">("ALL");

  const isLoading = teamsLoading || statesLoading || subsLoading;

  const getTeamStatusInfo = (teamId: string) => {
    const teamSessions = sessions.filter(s => s.teamId === teamId);
    const isOnline = teamSessions.length > 0;
    const state = teamStates.find(s => s.teamId === teamId);
    const submission = submissions.find(s => s.teamId === teamId);
    
    // Status Logic
    let statusLabel = isOnline ? "WORKING" : "OFFLINE";
    let isProblem = false;
    let lastActivityAt = 0;
    let isAutoCaptured = false;

    // Find the latest activity timestamp
    if (teamSessions.length > 0) {
      lastActivityAt = Math.max(...teamSessions.map(s => s.lastActiveAt));
    }
    if (state?.updatedAt && state.updatedAt > lastActivityAt) {
      lastActivityAt = state.updatedAt;
    }

    if (submission) {
      statusLabel = "SUBMITTED";
      const isAuto = Object.values(submission.stageSubmissions || {}).some(s => s.isAutoSubmitted) || submission.status === "FINAL";
      if (isAuto && !submission.submittedBy) {
         isAutoCaptured = true;
      }
    } else if (state?.status === "SUBMITTED") {
      statusLabel = "SUBMITTED";
    } else if (state?.status === "LOCKED") {
      statusLabel = "AUTO-CAPTURED";
      isAutoCaptured = true;
    } else if (state?.status === "IN_PROGRESS" && isOnline) {
      statusLabel = "WORKING";
    }

    if (isOnline && (Date.now() - lastActivityAt > 120000)) {
        // Just idle
    }
    
    if (statusLabel === "SUBMITTED" && isAutoCaptured) {
      statusLabel = "AUTO-CAPTURED";
    }

    if (filter !== "ALL") {
       if (filter === "WORKING" && statusLabel !== "WORKING") return null;
       if (filter === "SUBMITTED" && statusLabel !== "SUBMITTED") return null;
       if (filter === "OFFLINE" && statusLabel !== "OFFLINE") return null;
       if (filter === "AUTO-CAPTURED" && statusLabel !== "AUTO-CAPTURED") return null;
       if (filter === "PROBLEM" && !isProblem) return null;
    }

    return {
      isOnline,
      statusLabel,
      isProblem,
      lastActivityAt,
      stage: state?.status
    };
  };

  const filteredTeams = teams.filter(t => {
    if (search && !t.teamId.toLowerCase().includes(search.toLowerCase()) && !t.displayName.toLowerCase().includes(search.toLowerCase())) return false;
    return getTeamStatusInfo(t.teamId) !== null;
  });

  return (
    <APBCard className="p-6 space-y-4 border-[var(--color-apb-surface-border)] bg-black/40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-apb-cyan)] font-bold mb-1">
            LIVE MONITORING
          </div>
          <h3 className="text-lg font-mono font-bold text-white">Team Status Board</h3>
        </div>
        <div className="flex items-center gap-3">
           <Input 
            placeholder="Search Team ID/Name..." 
            className="w-48 font-mono text-xs h-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 font-mono text-xs pb-2">
        <span className="text-muted-foreground uppercase mr-1">Filter:</span>
        {(["ALL", "WORKING", "SUBMITTED", "OFFLINE", "AUTO-CAPTURED", "PROBLEM"] as const).map(flt => (
          <button
            key={flt}
            onClick={() => setFilter(flt)}
            className={`px-3 py-1 rounded-md transition-colors ${filter === flt ? "bg-[var(--color-apb-cyan)] text-black font-bold" : "bg-white/5 text-muted-foreground hover:bg-white/10"}`}
          >
            {flt}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm text-left font-mono">
          <thead className="text-muted-foreground uppercase text-xs border-b border-[var(--color-apb-surface-border)]/50">
            <tr>
              <th className="px-4 py-3 font-medium">Team</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Round</th>
              <th className="px-4 py-3 font-medium text-right">Last Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-apb-surface-border)]/50">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--color-apb-cyan)] mx-auto" />
                </td>
              </tr>
            ) : filteredTeams.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-xs italic">
                  No teams matching current filters.
                </td>
              </tr>
            ) : (
              filteredTeams.map((team) => {
                const info = getTeamStatusInfo(team.teamId);
                if (!info) return null;

                let statusColor = "text-muted-foreground";
                let statusDot = "○";
                
                if (info.statusLabel === "WORKING") {
                  statusColor = "text-emerald-400";
                  statusDot = "●";
                } else if (info.statusLabel === "SUBMITTED") {
                  statusColor = "text-purple-400";
                  statusDot = "✓";
                } else if (info.statusLabel === "AUTO-CAPTURED") {
                  statusColor = "text-amber-400";
                  statusDot = "⏱";
                } else if (info.isProblem) {
                  statusColor = "text-rose-400";
                  statusDot = "⚠";
                }

                return (
                  <tr key={team.teamId} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="font-bold text-[var(--color-apb-cyan)]">{team.teamId}</div>
                      <div className="text-xs text-white/80">{team.displayName}</div>
                    </td>
                    <td className={`px-4 py-3 text-xs font-bold ${statusColor} flex items-center gap-1.5`}>
                      <span>{statusDot}</span> {info.statusLabel}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/70">
                       {eventState?.currentRoundId ? `Round ${eventState.currentRoundId.substring(0,4)}` : "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground text-right">
                       {info.lastActivityAt ? formatTimeAgo(info.lastActivityAt) : "Never"}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </APBCard>
  );
}
