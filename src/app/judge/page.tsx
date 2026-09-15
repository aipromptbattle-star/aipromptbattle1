"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { useJudgeAssignments, useJudgeScores } from "@/lib/firebase/judging";
import { useEventState, useCurrentRound } from "@/lib/firebase/events";
import { useTeams } from "@/lib/firebase/teams";
import { APBCard } from "@/components/apb/APBCard";
import { APBButton } from "@/components/apb/APBButton";
import { StatusBadge } from "@/components/apb/StatusBadge";
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2, Clock, Scale, ArrowRight, AlertCircle, Sparkles, Search } from "lucide-react";

export default function JudgeDashboard() {
  const { user } = useAuth();
  const { eventState, loading: eventLoading } = useEventState();
  const { currentRound, loading: roundLoading } = useCurrentRound(eventState?.currentRoundId || null);

  const { assignments, loading: assignmentsLoading } = useJudgeAssignments(user?.uid);
  const { scores, loading: scoresLoading } = useJudgeScores(null, null);
  const { teams, loading: teamsLoading } = useTeams();

  const [filter, setFilter] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  if (eventLoading || roundLoading || assignmentsLoading || scoresLoading || teamsLoading) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-apb-cyan)]" />
      </div>
    );
  }

  // Create team map for instant lookup of Team Name
  const teamMap = new Map<string, string>();
  teams.forEach((t) => {
    if (t.teamId) {
      teamMap.set(t.teamId.toUpperCase(), t.displayName || t.teamId);
    }
  });

  // Correlate assignments with scores
  const enrichedAssignments = assignments.map((a) => {
    const scoreDoc = scores.find((s) => s.submissionId === a.submissionId && s.judgeId === user?.uid);
    const isCompleted = scoreDoc?.status === "FINAL";
    const teamName = teamMap.get(a.teamId.toUpperCase()) || "";
    return {
      ...a,
      teamName,
      scoreDoc,
      isCompleted,
    };
  });

  const totalAssigned = enrichedAssignments.length;
  const completedCount = enrichedAssignments.filter((a) => a.isCompleted).length;
  const pendingCount = totalAssigned - completedCount;
  const progressPct = totalAssigned > 0 ? Math.round((completedCount / totalAssigned) * 100) : 0;

  const filteredList = enrichedAssignments.filter((a) => {
    // Tab filter
    if (filter === "PENDING" && a.isCompleted) return false;
    if (filter === "COMPLETED" && !a.isCompleted) return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = a.teamId.toLowerCase().includes(q);
      const matchName = a.teamName.toLowerCase().includes(q);
      return matchId || matchName;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-mono font-bold uppercase tracking-wider text-white">
            Assigned Evaluations
          </h2>
          <p className="text-muted-foreground text-sm">
            Review and score submissions assigned to you by the event organizers.
          </p>
        </div>

        {currentRound && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-apb-surface)] border border-[var(--color-apb-surface-border)]">
            <span className="text-xs font-mono text-muted-foreground uppercase">Current Event Round:</span>
            <span className="text-sm font-mono font-bold text-white">Round {currentRound.roundNumber}: {currentRound.title}</span>
            <StatusBadge status={currentRound.status} className="text-[10px]" />
          </div>
        )}
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <APBCard className="p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-[var(--color-apb-cyan)]/10 border border-[var(--color-apb-cyan)]/30 flex items-center justify-center text-[var(--color-apb-cyan)]">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-white">{totalAssigned}</div>
            <div className="text-[10px] font-mono uppercase text-muted-foreground">Total Assigned</div>
          </div>
        </APBCard>

        <APBCard className="p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-amber-400">{pendingCount}</div>
            <div className="text-[10px] font-mono uppercase text-muted-foreground">Pending Evaluations</div>
          </div>
        </APBCard>

        <APBCard className="p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-emerald-400">{completedCount}</div>
            <div className="text-[10px] font-mono uppercase text-muted-foreground">Completed</div>
          </div>
        </APBCard>

        <APBCard className="p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-mono font-bold text-purple-400">{progressPct}%</div>
            <div className="text-[10px] font-mono uppercase text-muted-foreground">Completion Rate</div>
          </div>
        </APBCard>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-apb-surface-border)] pb-3">
        <div className="flex gap-2">
          <APBButton
            size="sm"
            variant={filter === "ALL" ? "default" : "outline"}
            onClick={() => setFilter("ALL")}
            className="text-xs"
          >
            All ({totalAssigned})
          </APBButton>
          <APBButton
            size="sm"
            variant={filter === "PENDING" ? "default" : "outline"}
            onClick={() => setFilter("PENDING")}
            className="text-xs"
          >
            Pending ({pendingCount})
          </APBButton>
          <APBButton
            size="sm"
            variant={filter === "COMPLETED" ? "default" : "outline"}
            onClick={() => setFilter("COMPLETED")}
            className="text-xs"
          >
            Completed ({completedCount})
          </APBButton>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search Team ID or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 font-mono text-xs bg-black/40"
          />
        </div>
      </div>

      {/* Submissions List */}
      {filteredList.length === 0 ? (
        <div className="h-48 border border-dashed border-[var(--color-apb-surface-border)] rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Scale className="w-8 h-8 opacity-40" />
          <span>No {filter.toLowerCase()} submissions found matching your search.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredList.map((item) => (
            <APBCard
              key={item.id}
              className={`p-5 flex flex-col justify-between space-y-4 border ${
                item.isCompleted ? "border-emerald-500/40" : "border-[var(--color-apb-surface-border)]"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block">
                    Team Workstation
                  </span>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-lg font-mono font-bold text-white">{item.teamId}</h3>
                    {item.teamName && (
                      <span className="text-xs font-mono text-slate-300">
                        ({item.teamName})
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-muted-foreground block mt-0.5">
                    Assigned: {new Date(item.createdAt).toLocaleTimeString()}
                  </span>
                </div>

                <div className="text-right">
                  {item.isCompleted ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Score: {item.scoreDoc?.finalScore}/100</span>
                    </div>
                  ) : item.scoreDoc?.status === "DRAFT" ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Draft Saved</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/30 text-xs font-mono">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Unscored</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--color-apb-surface-border)] flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">
                  Round ID: {item.roundId}
                </span>

                <Link href={`/judge/submissions/${item.submissionId}`}>
                  <APBButton size="sm" glow={!item.isCompleted} variant={item.isCompleted ? "outline" : "default"}>
                    {item.isCompleted ? "Review Score" : "Evaluate"}
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </APBButton>
                </Link>
              </div>
            </APBCard>
          ))}
        </div>
      )}
    </div>
  );
}
