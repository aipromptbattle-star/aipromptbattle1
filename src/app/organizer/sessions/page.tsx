"use client";

import { useState } from "react";
import { APBCard } from "@/components/apb/APBCard";
import { APBButton } from "@/components/apb/APBButton";
import { ConfirmationDialog } from "@/components/apb/ConfirmationDialog";
import { useTeams, useSessions, killSession, killTeamSessions, clearAllSessions } from "@/lib/firebase/teams";
import { 
  ShieldAlert, 
  Trash2, 
  Users, 
  Search, 
  Laptop, 
  Sparkles, 
  Clock, 
  AlertTriangle,
  Loader2 
} from "lucide-react";

export default function OrganizerSessionsPage() {
  const { teams, loading: teamsLoading } = useTeams();
  const { sessions } = useSessions();

  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [killAllDialogOpen, setKillAllDialogOpen] = useState(false);

  const showNotification = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleKillSingleSession = async (sessionId: string, teamId: string) => {
    setActionLoading(true);
    try {
      await killSession(sessionId);
      showNotification("success", `Terminated session for team ${teamId}.`);
    } catch (e: unknown) {
      showNotification("error", e instanceof Error ? e.message : "Failed to terminate session.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleKillTeamSessions = async (teamId: string) => {
    setActionLoading(true);
    try {
      const count = await killTeamSessions(teamId);
      showNotification("success", `Terminated ${count} session(s) for team ${teamId}.`);
    } catch (e: unknown) {
      showNotification("error", e instanceof Error ? e.message : "Failed to terminate team sessions.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteKillAllSessions = async () => {
    setActionLoading(true);
    try {
      const count = await clearAllSessions();
      showNotification("success", `Emergency Reset: Terminated all ${count} active workstation session(s).`);
      setKillAllDialogOpen(false);
    } catch (e: unknown) {
      showNotification("error", e instanceof Error ? e.message : "Failed to clear all sessions.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const team = teams.find((t) => t.teamId === s.teamId);
    return (
      s.teamId.toLowerCase().includes(search.toLowerCase()) ||
      (team?.displayName || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.id || "").toLowerCase().includes(search.toLowerCase())
    );
  });

  const connectedTeamIds = new Set(sessions.map((s) => s.teamId));

  if (teamsLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-apb-cyan)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-apb-surface-border)] pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl sm:text-3xl font-mono font-bold uppercase tracking-wider text-white flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-red-400" />
              <span>WORKSTATION SESSIONS CONTROL</span>
            </h2>
            <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 text-xs font-mono font-bold">
              {sessions.length} ACTIVE DEVICES
            </span>
          </div>
          <p className="text-muted-foreground text-sm font-mono">
            Enforce 2-Device Concurrency Limits • Terminate Rogue Workstations • Emergency Conduction Resets
          </p>
        </div>

        <APBButton
          variant="destructive"
          onClick={() => setKillAllDialogOpen(true)}
          disabled={sessions.length === 0 || actionLoading}
          className="font-mono text-xs uppercase tracking-wider whitespace-nowrap"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Emergency: Kill All Sessions
        </APBButton>
      </div>

      {feedback && (
        <div className={`p-3.5 rounded-lg font-mono text-xs flex items-center justify-between border animate-in fade-in duration-200 ${
          feedback.type === "success" 
            ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300" 
            : "bg-red-950/40 border-red-500/40 text-red-300"
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-muted-foreground hover:text-white ml-4">✕</button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <APBCard className="p-5 bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
          <div className="text-xs font-mono uppercase text-muted-foreground">ACTIVE WORKSTATIONS</div>
          <div className="text-3xl sm:text-4xl font-mono font-black text-red-400 mt-1">{sessions.length}</div>
          <div className="text-xs font-mono text-muted-foreground mt-1">Live connected browser clients</div>
        </APBCard>

        <APBCard className="p-5 bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
          <div className="text-xs font-mono uppercase text-muted-foreground">CONNECTED TEAMS</div>
          <div className="text-3xl sm:text-4xl font-mono font-black text-[var(--color-apb-cyan)] mt-1">
            {connectedTeamIds.size} <span className="text-xl font-normal text-muted-foreground">/ {teams.length}</span>
          </div>
          <div className="text-xs font-mono text-muted-foreground mt-1">Teams with &ge;1 active workstation</div>
        </APBCard>

        <APBCard className="p-5 bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
          <div className="text-xs font-mono uppercase text-muted-foreground">DEVICE CAPACITY POLICY</div>
          <div className="text-3xl sm:text-4xl font-mono font-black text-emerald-400 mt-1">MAX 2</div>
          <div className="text-xs font-mono text-muted-foreground mt-1">3rd device rejected at login</div>
        </APBCard>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 p-2 bg-black/40 rounded-lg border border-white/10">
        <Search className="w-4 h-4 text-muted-foreground ml-2" />
        <input
          type="text"
          placeholder="Filter active sessions by Team ID, display name, or device ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-xs font-mono text-white placeholder:text-muted-foreground focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-xs font-mono text-muted-foreground hover:text-white px-2">
            Clear
          </button>
        )}
      </div>

      {/* Sessions Table */}
      <APBCard className="overflow-hidden border-[var(--color-apb-surface-border)]">
        {filteredSessions.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground font-mono text-xs">
            {sessions.length === 0 ? "No active workstation sessions connected to the event." : "No sessions match the current filter query."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-black/60 text-muted-foreground uppercase tracking-wider border-b border-white/10 text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Team ID</th>
                  <th className="py-3.5 px-4 font-bold">Display Name</th>
                  <th className="py-3.5 px-4 font-bold">Workstation UID</th>
                  <th className="py-3.5 px-4 font-bold">Connected Since</th>
                  <th className="py-3.5 px-4 font-bold">Last Active</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSessions.map((session) => {
                  const team = teams.find((t) => t.teamId === session.teamId);
                  const connectedDate = session.connectedAt ? new Date(session.connectedAt).toLocaleTimeString() : "—";
                  const lastActiveDate = session.lastActiveAt ? new Date(session.lastActiveAt).toLocaleTimeString() : "—";

                  return (
                    <tr key={session.id || `${session.teamId}-${session.connectedAt}`} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-[var(--color-apb-cyan)]">
                        {session.teamId}
                      </td>
                      <td className="py-3.5 px-4 text-white">
                        {team?.displayName || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Laptop className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{session.id ? session.id.slice(0, 12) : "Unknown UID"}...</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {connectedDate}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {lastActiveDate}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => session.id && handleKillSingleSession(session.id, session.teamId)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 rounded bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-[11px] font-mono transition-colors"
                            title="Disconnect this specific device"
                          >
                            Kill Device
                          </button>
                          <button
                            onClick={() => handleKillTeamSessions(session.teamId)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 rounded bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 text-[11px] font-mono transition-colors"
                            title="Disconnect both team workstations"
                          >
                            Kill Team
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </APBCard>

      {/* Emergency Reset Confirmation Dialog */}
      <ConfirmationDialog
        open={killAllDialogOpen}
        onOpenChange={setKillAllDialogOpen}
        title="EMERGENCY WORKSTATION RESET"
        description="Terminating all active workstation sessions will immediately kick every participant back to the login screen. Only use this if unresolvable network collisions occur."
        confirmText="TERMINATE ALL SESSIONS"
        destructive
        onConfirm={handleExecuteKillAllSessions}
      />
    </div>
  );
}
