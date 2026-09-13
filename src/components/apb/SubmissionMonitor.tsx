"use client";

import React, { useState } from "react";
import { Team, TeamRoundState, Submission, Round } from "@/lib/firebase/schema";
import { APBCard } from "./APBCard";
import { APBButton } from "./APBButton";
import { StatusBadge } from "./StatusBadge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Search, Eye, FileText, Image as ImageIcon, Users } from "lucide-react";

interface SubmissionMonitorProps {
  round: Round | null;
  teams: Team[];
  teamRoundStates: TeamRoundState[];
  submissions: Submission[];
}

export function SubmissionMonitor({
  round,
  teams,
  teamRoundStates,
  submissions,
}: SubmissionMonitorProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "IN_PROGRESS" | "SUBMITTED" | "NOT_STARTED">("ALL");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [inspectOpen, setInspectOpen] = useState(false);

  if (!round) {
    return (
      <APBCard className="p-6 text-center text-muted-foreground font-mono text-sm border-dashed">
        No active round selected for submission monitoring.
      </APBCard>
    );
  }

  // Combine team info with state and submission
  const enrichedTeams = teams.map((team) => {
    const state = teamRoundStates.find((s) => s.teamId === team.teamId);
    const submission = submissions.find((s) => s.teamId === team.teamId);
    const status = submission ? "SUBMITTED" : state?.status || "NOT_STARTED";

    return {
      team,
      state,
      submission,
      status,
      lastSavedAt: state?.lastSavedAt,
      submittedAt: submission?.submittedAt,
    };
  });

  // Filter
  const filtered = enrichedTeams.filter((item) => {
    const matchesSearch =
      item.team.teamId.toLowerCase().includes(search.toLowerCase()) ||
      item.team.displayName.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === "ALL") return true;
    return item.status === filter;
  });

  const submittedCount = enrichedTeams.filter((t) => t.status === "SUBMITTED").length;
  const inProgressCount = enrichedTeams.filter((t) => t.status === "IN_PROGRESS").length;
  const notStartedCount = enrichedTeams.filter((t) => t.status === "NOT_STARTED").length;

  const currentInspected = selectedTeam
    ? enrichedTeams.find((t) => t.team.teamId === selectedTeam.teamId)
    : null;

  return (
    <div className="space-y-4">
      {/* Header with Search and Quick Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-mono text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--color-apb-cyan)]" />
            Live Round {round.roundNumber} Submission Monitor
          </h3>
          <p className="text-xs text-muted-foreground">
            Track real-time progress, autosave activity, and final submissions.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-[var(--color-apb-surface-border)] font-mono text-xs overflow-x-auto">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1 rounded transition-colors ${
              filter === "ALL"
                ? "bg-[var(--color-apb-cyan)]/20 text-[var(--color-apb-cyan)] font-bold"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            All ({enrichedTeams.length})
          </button>
          <button
            onClick={() => setFilter("SUBMITTED")}
            className={`px-3 py-1 rounded transition-colors ${
              filter === "SUBMITTED"
                ? "bg-emerald-500/20 text-emerald-400 font-bold"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            Submitted ({submittedCount})
          </button>
          <button
            onClick={() => setFilter("IN_PROGRESS")}
            className={`px-3 py-1 rounded transition-colors ${
              filter === "IN_PROGRESS"
                ? "bg-blue-500/20 text-blue-400 font-bold"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            onClick={() => setFilter("NOT_STARTED")}
            className={`px-3 py-1 rounded transition-colors ${
              filter === "NOT_STARTED"
                ? "bg-zinc-500/20 text-zinc-300 font-bold"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            Not Started ({notStartedCount})
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          placeholder="Search by Team ID or Name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 font-mono text-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[var(--color-apb-surface-border)] overflow-hidden bg-[var(--color-apb-surface)]">
        <table className="w-full text-left text-sm font-sans">
          <thead className="bg-white/[0.03] text-xs font-mono uppercase text-muted-foreground border-b border-[var(--color-apb-surface-border)]">
            <tr>
              <th className="px-4 py-3">Team ID</th>
              <th className="px-4 py-3">Display Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 hidden md:table-cell">Last Saved</th>
              <th className="px-4 py-3">Submitted At</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-apb-surface-border)]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground font-mono text-xs">
                  No teams match the current filter.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr key={item.team.teamId} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-[var(--color-apb-cyan)]">
                    {item.team.teamId}
                  </td>
                  <td className="px-4 py-3 text-white font-medium">
                    {item.team.displayName}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={
                        item.status === "SUBMITTED"
                          ? "ACTIVE"
                          : item.status === "IN_PROGRESS"
                          ? "LIVE"
                          : "OFFLINE"
                      }
                      className={`text-xs ${
                        item.status === "SUBMITTED"
                          ? "!bg-emerald-500/10 !text-emerald-400 !border-emerald-500/30"
                          : item.status === "IN_PROGRESS"
                          ? "!bg-blue-500/10 !text-blue-400 !border-blue-500/30"
                          : "!bg-zinc-800 !text-zinc-400 !border-zinc-700"
                      }`}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground hidden md:table-cell">
                    {item.lastSavedAt
                      ? new Date(item.lastSavedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono">
                    {item.submittedAt ? (
                      <span className="text-emerald-400 font-bold">
                        {new Date(item.submittedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <APBButton
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTeam(item.team);
                        setInspectOpen(true);
                      }}
                      className="h-7 text-xs font-mono"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" /> Inspect
                    </APBButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Inspect Modal */}
      <Dialog open={inspectOpen} onOpenChange={setInspectOpen}>
        <DialogContent className="max-w-2xl bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] text-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-mono uppercase text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-[var(--color-apb-cyan)]" />
              <span>Team Inspection: {selectedTeam?.teamId}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-mono">
              {selectedTeam?.displayName} • Members: {selectedTeam?.member1} & {selectedTeam?.member2}
            </DialogDescription>
          </DialogHeader>

          {currentInspected && (
            <div className="space-y-5 py-3">
              {/* Status Header */}
              <div className="flex items-center justify-between p-3 rounded bg-black/40 border border-[var(--color-apb-surface-border)] font-mono text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">Submission Status</span>
                  <span className="font-bold text-white uppercase">{currentInspected.status}</span>
                </div>
                {currentInspected.submittedAt && (
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Submitted Timestamp</span>
                    <span className="text-emerald-400 font-bold">
                      {new Date(currentInspected.submittedAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}
                {currentInspected.lastSavedAt && (
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase">Last Saved</span>
                    <span className="text-blue-400 font-bold">
                      {new Date(currentInspected.lastSavedAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Recorded Prompt */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-[var(--color-apb-cyan)]">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Submitted Prompt</span>
                </div>
                <div className="bg-black/50 border border-[var(--color-apb-surface-border)] rounded p-3 font-mono text-xs text-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {currentInspected.submission?.prompt || "No prompt submitted yet."}
                </div>
              </div>

              {/* Creative Asset */}
              {currentInspected.submission?.member2Data?.imageUrl && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-mono uppercase text-purple-400">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Creative Visual Asset</span>
                  </div>
                  <div className="rounded border border-[var(--color-apb-surface-border)] bg-black/60 p-2 max-h-64 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentInspected.submission.member2Data.imageUrl}
                      alt="Uploaded Asset"
                      className="max-h-60 object-contain mx-auto"
                    />
                  </div>
                </div>
              )}

              {/* Creative Notes */}
              {currentInspected.submission?.member2Data?.text && (
                <div className="space-y-1.5">
                  <span className="text-xs font-mono uppercase text-muted-foreground block">
                    Creative Notes / Rationale
                  </span>
                  <div className="bg-black/50 border border-[var(--color-apb-surface-border)] rounded p-3 font-mono text-xs text-slate-300 whitespace-pre-wrap">
                    {currentInspected.submission.member2Data.text}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
