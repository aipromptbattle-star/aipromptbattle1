"use client";

import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { APBButton } from "./APBButton";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { killSession, killTeamSessions, clearAllSessions } from "@/lib/firebase/teams";
import { Session, Team } from "@/lib/firebase/schema";
import {
  ShieldAlert,
  Laptop,
  Trash2,
  Search,
  Users,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Clock,
  X,
} from "lucide-react";

interface ActiveSessionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessions: Session[];
  teams: Team[];
  onSuccessMessage?: (message: string) => void;
  onErrorMessage?: (message: string) => void;
}

export function ActiveSessionsModal({
  open,
  onOpenChange,
  sessions,
  teams,
  onSuccessMessage,
  onErrorMessage,
}: ActiveSessionsModalProps) {
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"ALL" | "FULL" | "SINGLE">("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [killAllDialogOpen, setKillAllDialogOpen] = useState(false);

  // Group sessions by teamId
  const groupedByTeam = useMemo(() => {
    const map = new Map<string, Session[]>();
    sessions.forEach((s) => {
      const existing = map.get(s.teamId) || [];
      existing.push(s);
      map.set(s.teamId, existing);
    });
    return map;
  }, [sessions]);

  // Telemetry counts
  const totalSessions = sessions.length;
  const teamsWith2 = Array.from(groupedByTeam.values()).filter((arr) => arr.length >= 2).length;
  const teamsWith1 = Array.from(groupedByTeam.values()).filter((arr) => arr.length === 1).length;
  const totalActiveTeams = groupedByTeam.size;

  // Filtered team IDs
  const filteredTeamEntries = useMemo(() => {
    return Array.from(groupedByTeam.entries()).filter(([teamId, teamSessions]) => {
      const team = teams.find((t) => t.teamId === teamId);
      const displayName = team?.displayName || "";
      const searchMatch =
        !search.trim() ||
        teamId.toLowerCase().includes(search.toLowerCase()) ||
        displayName.toLowerCase().includes(search.toLowerCase());

      if (!searchMatch) return false;

      if (filterTab === "FULL") return teamSessions.length >= 2;
      if (filterTab === "SINGLE") return teamSessions.length === 1;
      return true;
    });
  }, [groupedByTeam, teams, search, filterTab]);

  // Terminate Single Device
  const handleKillSingle = async (sessionId: string, teamId: string) => {
    setActionLoading(sessionId);
    try {
      await killSession(sessionId);
      onSuccessMessage?.(`Terminated device session for ${teamId}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to terminate device.";
      onErrorMessage?.(msg);
    } finally {
      setActionLoading(null);
    }
  };

  // Terminate All Devices for a Team
  const handleKillTeam = async (teamId: string) => {
    setActionLoading(`team-${teamId}`);
    try {
      const count = await killTeamSessions(teamId);
      onSuccessMessage?.(`Disconnected all ${count} device(s) for team ${teamId}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to disconnect team devices.";
      onErrorMessage?.(msg);
    } finally {
      setActionLoading(null);
    }
  };

  // Hall-wide emergency kill
  const handleExecuteKillAll = async () => {
    setActionLoading("ALL");
    try {
      const count = await clearAllSessions();
      onSuccessMessage?.(`Emergency Reset: Terminated ${count} participant session(s) across all teams.`);
      setKillAllDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to clear all sessions.";
      onErrorMessage?.(msg);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] text-white max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="border-b border-[var(--color-apb-surface-border)] pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-mono uppercase tracking-wider text-white">
                    Active Workstation Sessions
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground font-mono mt-0.5">
                    Real-time monitoring and termination of participant device slots (2 devices max per team).
                  </DialogDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                  <Radio className="w-3 h-3 animate-pulse" />
                  Live Sync
                </span>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-lg bg-black/40 border border-[var(--color-apb-surface-border)]">
                <div className="text-xs font-mono text-muted-foreground uppercase flex items-center gap-1.5 mb-1">
                  <Laptop className="w-3.5 h-3.5 text-[var(--color-apb-cyan)]" />
                  Connected Devices
                </div>
                <div className="text-2xl font-mono font-bold text-white">
                  {totalSessions}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-black/40 border border-[var(--color-apb-surface-border)]">
                <div className="text-xs font-mono text-muted-foreground uppercase flex items-center gap-1.5 mb-1">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  Active Teams
                </div>
                <div className="text-2xl font-mono font-bold text-blue-400">
                  {totalActiveTeams} / {teams.length}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-black/40 border border-[var(--color-apb-surface-border)]">
                <div className="text-xs font-mono text-muted-foreground uppercase flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  At 2/2 Limit
                </div>
                <div className="text-2xl font-mono font-bold text-amber-400">
                  {teamsWith2} teams
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-black/40 border border-[var(--color-apb-surface-border)]">
                <div className="text-xs font-mono text-muted-foreground uppercase flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Single Device
                </div>
                <div className="text-2xl font-mono font-bold text-emerald-400">
                  {teamsWith1} teams
                </div>
              </div>
            </div>

            {/* Filter Bar & Emergency Button */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by Team ID or Name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 rounded-md bg-black/50 border border-[var(--color-apb-surface-border)] text-xs font-mono text-white placeholder:text-muted-foreground focus:outline-none focus:border-[var(--color-apb-cyan)] transition-colors"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center bg-black/40 border border-[var(--color-apb-surface-border)] rounded-md p-0.5">
                  <button
                    onClick={() => setFilterTab("ALL")}
                    className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                      filterTab === "ALL"
                        ? "bg-[var(--color-apb-cyan)]/20 text-[var(--color-apb-cyan)] font-bold"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    All ({groupedByTeam.size})
                  </button>
                  <button
                    onClick={() => setFilterTab("FULL")}
                    className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                      filterTab === "FULL"
                        ? "bg-amber-500/20 text-amber-300 font-bold"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    At Limit ({teamsWith2})
                  </button>
                  <button
                    onClick={() => setFilterTab("SINGLE")}
                    className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                      filterTab === "SINGLE"
                        ? "bg-emerald-500/20 text-emerald-300 font-bold"
                        : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    1 Device ({teamsWith1})
                  </button>
                </div>
              </div>

              <APBButton
                variant="outline"
                size="sm"
                onClick={() => setKillAllDialogOpen(true)}
                disabled={actionLoading !== null || sessions.length === 0}
                className="text-xs font-mono text-red-400 border-red-500/40 hover:bg-red-500/20 hover:text-red-300 whitespace-nowrap h-9"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Emergency: Disconnect All ({sessions.length})
              </APBButton>
            </div>

            {/* Grouped Team Device Sessions List */}
            {filteredTeamEntries.length === 0 ? (
              <div className="py-12 border border-dashed border-[var(--color-apb-surface-border)] rounded-lg text-center font-mono space-y-2">
                <Laptop className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {sessions.length === 0
                    ? "No active device sessions connected."
                    : "No active sessions match the current filter."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTeamEntries.map(([teamId, teamSessions]) => {
                  const team = teams.find((t) => t.teamId === teamId);
                  const isAtLimit = teamSessions.length >= 2;
                  const isTeamKilling = actionLoading === `team-${teamId}`;

                  return (
                    <div
                      key={teamId}
                      className="p-4 rounded-lg bg-black/40 border border-[var(--color-apb-surface-border)] hover:border-[var(--color-apb-surface-border)]/80 transition-all space-y-3"
                    >
                      {/* Team Header Row */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--color-apb-surface-border)] pb-3">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-[var(--color-apb-cyan)]/15 border border-[var(--color-apb-cyan)]/30 text-[var(--color-apb-cyan)]">
                            {teamId}
                          </span>
                          <span className="font-bold text-sm text-white">
                            {team?.displayName || "Unknown Team"}
                          </span>
                          {(team?.member1 || team?.member2) && (
                            <span className="text-xs font-mono text-muted-foreground hidden md:inline">
                              ({team?.member1} {team?.member2 && `& ${team?.member2}`})
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase ${
                              isAtLimit
                                ? "bg-amber-500/15 border border-amber-500/40 text-amber-300"
                                : "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300"
                            }`}
                          >
                            {teamSessions.length} / 2 Slots Used
                          </span>

                          <APBButton
                            size="sm"
                            variant="destructive"
                            onClick={() => handleKillTeam(teamId)}
                            disabled={actionLoading !== null}
                            className="h-7 px-2.5 text-xs font-mono"
                            title={`Terminate both device sessions for team ${teamId}`}
                          >
                            {isTeamKilling ? "Disconnecting..." : "Kill Both"}
                          </APBButton>
                        </div>
                      </div>

                      {/* Device Sessions Sub-grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {teamSessions.map((session, idx) => {
                          const isDeviceKilling = actionLoading === session.id;
                          const connectedDate = session.connectedAt
                            ? new Date(session.connectedAt)
                            : null;

                          return (
                            <div
                              key={session.id || `${teamId}-${idx}`}
                              className="p-3 rounded-md bg-[var(--color-apb-surface)] border border-[var(--color-apb-surface-border)] flex items-center justify-between gap-3 text-xs font-mono"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-7 h-7 rounded bg-white/5 border border-white/10 flex items-center justify-center shrink-0 text-muted-foreground">
                                  <Laptop className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-white font-semibold flex items-center gap-1.5">
                                    <span>Device #{idx + 1}</span>
                                    {session.id && (
                                      <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                                        ({session.id.slice(0, 8)})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>
                                      {connectedDate
                                        ? connectedDate.toLocaleTimeString()
                                        : "Just now"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {session.id && (
                                <button
                                  onClick={() => handleKillSingle(session.id!, teamId)}
                                  disabled={actionLoading !== null}
                                  className="px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 text-[11px] font-mono transition-colors shrink-0 disabled:opacity-50"
                                  title="Disconnect this device only"
                                >
                                  {isDeviceKilling ? "Disconnecting..." : "Disconnect"}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Emergency Disconnect All Confirmation Modal */}
      <ConfirmationDialog
        open={killAllDialogOpen}
        onOpenChange={setKillAllDialogOpen}
        title="EMERGENCY: DISCONNECT ALL WORKSTATIONS?"
        description={`WARNING: This is a hall-wide emergency reset operation.\n\nIt will immediately disconnect ALL ${sessions.length} active participant devices across every team in the event.\n\nActive participant screens will immediately be kicked back to the login screen. Team registrations, submissions, scores, and round configurations will NOT be deleted, but all participants will be required to re-authenticate.\n\nThis action should only be used if there is a hall-wide connection jam or device limit blockage.`}
        confirmText="TERMINATE ALL SESSIONS"
        destructive={true}
        typedConfirmationPhrase="KILL ALL SESSIONS"
        onConfirm={handleExecuteKillAll}
      />
    </>
  );
}
