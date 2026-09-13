"use client";

import { useState, useEffect, useCallback } from "react";
import { APBCard } from "@/components/apb/APBCard";
import { APBButton } from "@/components/apb/APBButton";
import { ConfirmationDialog } from "@/components/apb/ConfirmationDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEventState, updateEventSettings } from "@/lib/firebase/events";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { AuditLog } from "@/lib/firebase/schema";
import { logAudit } from "@/lib/firebase/teams";
import Link from "next/link";
import {
  runSystemHealthChecks,
  resetCurrentTestRound,
  HealthCheckItem,
} from "@/lib/firebase/system";
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  Settings,
  ScrollText,
  UserCheck,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Users,
  RotateCcw,
} from "lucide-react";

function useAuditLogs(limitCount = 50) {
  const [logs, setLogs] = useState<(AuditLog & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const q = query(
      collection(db, "auditLogs"),
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setLogs(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog & { id: string }))
        );
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, [limitCount]);
  return { logs, loading };
}

function useOrganizerAccounts() {
  const [organizers, setOrganizers] = useState<
    { id: string; uid: string; addedAt?: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "organizers"),
      (snap) => {
        setOrganizers(
          snap.docs.map((d) => ({
            id: d.id,
            uid: d.id,
            ...(d.data() as { addedAt?: number }),
          }))
        );
        setLoading(false);
      },
      () => setLoading(false)
    );
    return unsub;
  }, []);
  return { organizers, loading };
}

export default function OrganizerSystem() {
  const { eventState, loading: eventLoading } = useEventState();
  const { logs, loading: logsLoading } = useAuditLogs(50);
  const { organizers, loading: orgsLoading } = useOrganizerAccounts();

  // Health Checks State
  const [healthChecks, setHealthChecks] = useState<HealthCheckItem[]>([]);
  const [checksLoading, setChecksLoading] = useState(true);

  // Form State
  const [eventForm, setEventForm] = useState({ eventName: "", totalRounds: 4 });
  const [savingEvent, setSavingEvent] = useState(false);
  const [newUid, setNewUid] = useState("");
  const [addingOrg, setAddingOrg] = useState(false);
  const [logFilter, setLogFilter] = useState("");

  // Dialog States
  const [resetRoundOpen, setResetRoundOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchHealthChecks = useCallback(async () => {
    setChecksLoading(true);
    try {
      const results = await runSystemHealthChecks();
      setHealthChecks(results);
    } catch (err: any) {
      console.error("Health check failed:", err);
    } finally {
      setChecksLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthChecks();
  }, [fetchHealthChecks]);

  useEffect(() => {
    if (eventState) {
      setEventForm({
        eventName: eventState.eventName,
        totalRounds: eventState.totalRounds,
      });
    }
  }, [eventState]);

  const handleSaveEvent = async () => {
    setSavingEvent(true);
    try {
      await updateEventSettings({
        eventName: eventForm.eventName.trim(),
        totalRounds: eventForm.totalRounds,
      });
      setActionMessage({ type: "success", text: "Event settings updated successfully." });
      fetchHealthChecks();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to save settings." });
    } finally {
      setSavingEvent(false);
    }
  };

  const handleAddOrganizer = async () => {
    const uid = newUid.trim();
    if (!uid) return;
    setAddingOrg(true);
    try {
      await setDoc(doc(db, "organizers", uid), { addedAt: Date.now() });
      await logAudit("ORGANIZER_ADDED", "ORGANIZER", { metadata: { uid } });
      setNewUid("");
      setActionMessage({ type: "success", text: `Organizer ${uid} added.` });
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to add organizer." });
    } finally {
      setAddingOrg(false);
    }
  };

  const handleRemoveOrganizer = async (uid: string) => {
    if (!window.confirm(`Remove organizer UID: ${uid}? They will lose access immediately.`)) return;
    try {
      await deleteDoc(doc(db, "organizers", uid));
      await logAudit("ORGANIZER_REMOVED", "ORGANIZER", { metadata: { uid } });
      setActionMessage({ type: "success", text: `Organizer ${uid} removed.` });
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to remove organizer." });
    }
  };

  const handleResetCurrentRound = async () => {
    if (!eventState?.currentRoundId) {
      setActionMessage({ type: "error", text: "No active round to reset." });
      return;
    }
    setActionInProgress(true);
    setActionMessage(null);
    try {
      const res = await resetCurrentTestRound("currentEvent", eventState.currentRoundId);
      setActionMessage({
        type: "success",
        text: `Current test round reset: Cleared ${res.clearedSubmissions} submission(s) and ${res.clearedDrafts} draft(s). Team registrations preserved.`,
      });
      fetchHealthChecks();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to reset round." });
    } finally {
      setActionInProgress(false);
    }
  };

  const filteredLogs = logFilter.trim()
    ? logs.filter(
        (l) =>
          l.action.toLowerCase().includes(logFilter.toLowerCase()) ||
          (l.metadata && JSON.stringify(l.metadata).toLowerCase().includes(logFilter.toLowerCase()))
      )
    : logs;

  return (
    <div className="space-y-10 pb-16">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-mono font-bold uppercase tracking-wider text-white">
            System & Event Readiness
          </h2>
          <p className="text-muted-foreground text-sm">
            Event-day pre-flight verification, system health, safe pre-event controls, and audit logs.
          </p>
        </div>
        <APBButton
          variant="outline"
          size="sm"
          onClick={fetchHealthChecks}
          disabled={checksLoading}
          className="font-mono self-start"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${checksLoading ? "animate-spin" : ""}`} />
          Refresh Checks
        </APBButton>
      </header>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={`p-4 rounded-lg font-mono text-sm border flex items-center justify-between gap-4 ${
            actionMessage.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
              : "bg-rose-950/40 border-rose-500/40 text-rose-300"
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs uppercase hover:underline opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── SECTION 1: LIVE EVENT-DAY HEALTH CHECKS ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-[var(--color-apb-cyan)]" />
            Live Pre-Flight Readiness Checklist
          </h3>
          <span className="text-xs font-mono text-muted-foreground">
            Target: 500 Concurrent Sessions
          </span>
        </div>

        <APBCard className="p-0 overflow-hidden border-[var(--color-apb-surface-border)]">
          {checksLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--color-apb-cyan)]" />
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-apb-surface-border)]">
              {healthChecks.map((item) => {
                let badgeClass = "";
                let Icon = CheckCircle2;

                if (item.status === "PASS") {
                  badgeClass = "bg-emerald-950/60 border-emerald-500/40 text-emerald-400";
                  Icon = CheckCircle2;
                } else if (item.status === "WARNING") {
                  badgeClass = "bg-amber-950/60 border-amber-500/40 text-amber-400";
                  Icon = AlertTriangle;
                } else if (item.status === "ACTION_REQUIRED") {
                  badgeClass = "bg-rose-950/60 border-rose-500/40 text-rose-400";
                  Icon = XCircle;
                } else {
                  badgeClass = "bg-purple-950/60 border-purple-500/40 text-purple-400";
                  Icon = ShieldAlert;
                }

                return (
                  <div
                    key={item.id}
                    className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="font-mono text-sm font-bold text-white flex items-center gap-2">
                        <span>{item.name}</span>
                      </div>
                      <p className="text-xs text-slate-300 font-mono">{item.message}</p>
                    </div>

                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold uppercase tracking-wider shrink-0 ${badgeClass}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.status.replace("_", " ")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </APBCard>
      </section>

      {/* ── SECTION 2: SAFE PRE-EVENT RESET CONTROLS ── */}
      <section className="space-y-4">
        <h3 className="text-lg font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          Safe Pre-Event Reset Controls
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Action A: Session Cleanup Policy (Informational) */}
          <APBCard className="p-6 space-y-4 border-cyan-500/20 bg-cyan-950/10">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="font-mono font-bold text-white uppercase text-base flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[var(--color-apb-cyan)]" />
                  Session Cleanup
                </h4>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
                  Production Safe
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Global session cleanup is disabled for production safety to prevent accidental termination of active participant workstations.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Use <span className="text-white font-semibold">Team Management → Kill Team Sessions</span> to terminate sessions for a specific team.
              </p>
            </div>
            <div className="text-[11px] font-mono text-emerald-400 bg-black/40 p-2 rounded border border-emerald-500/20">
              ✓ Event-Day Safety: Active workstations cannot be wiped globally by accident.
            </div>
            <Link href="/organizer/teams" className="block">
              <APBButton
                variant="outline"
                size="sm"
                className="w-full font-mono border-[var(--color-apb-cyan)]/40 text-[var(--color-apb-cyan)] hover:bg-[var(--color-apb-cyan)]/10"
              >
                <Users className="w-3.5 h-3.5 mr-2" />
                Go to Team Management
              </APBButton>
            </Link>
          </APBCard>

          {/* Action B: Reset Current Test Round */}
          <APBCard className="p-6 space-y-4 border-rose-500/20 bg-rose-950/10">
            <div className="space-y-1">
              <h4 className="font-mono font-bold text-white uppercase text-base flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                Reset Current Test Round
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Clears drafts, test submissions, and round states for the current test round only.
                Permitted only when round status is DRAFT or READY.
              </p>
            </div>
            <div className="text-[11px] font-mono text-emerald-400 bg-black/40 p-2 rounded border border-emerald-500/20">
              ✓ Safely Preserves: Team Registrations, Other Rounds, Event Configuration.
            </div>
            <APBButton
              variant="destructive"
              size="sm"
              onClick={() => setResetRoundOpen(true)}
              disabled={actionInProgress || !eventState?.currentRoundId}
              className="w-full font-mono"
            >
              Reset Test Round Data
            </APBButton>
          </APBCard>
        </div>
      </section>

      {/* ── SECTION 3: EVENT SETTINGS ── */}
      <section className="space-y-4">
        <h3 className="text-lg font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-[var(--color-apb-cyan)]" /> Event Settings
        </h3>
        <APBCard className="p-6">
          {eventLoading ? (
            <div className="flex justify-center p-6">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--color-apb-cyan)]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase text-muted-foreground">
                  Event Name
                </Label>
                <Input
                  value={eventForm.eventName}
                  onChange={(e) => setEventForm({ ...eventForm, eventName: e.target.value })}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase text-muted-foreground">
                  Total Rounds
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={eventForm.totalRounds}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, totalRounds: parseInt(e.target.value) || 1 })
                  }
                  className="font-mono"
                />
              </div>
              <div className="col-span-full">
                <APBButton glow onClick={handleSaveEvent} disabled={savingEvent}>
                  <Save className="w-4 h-4 mr-2" />
                  {savingEvent ? "Saving..." : "Save Event Settings"}
                </APBButton>
              </div>
            </div>
          )}
        </APBCard>
      </section>

      {/* ── SECTION 4: ORGANIZER ACCOUNTS ── */}
      <section className="space-y-4">
        <h3 className="text-lg font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-[var(--color-apb-blue)]" /> Organizer Accounts
        </h3>
        <APBCard className="p-6 space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Paste Firebase UID..."
              value={newUid}
              onChange={(e) => setNewUid(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddOrganizer()}
              className="font-mono text-sm flex-1"
            />
            <APBButton onClick={handleAddOrganizer} disabled={addingOrg || !newUid.trim()}>
              <Plus className="w-4 h-4 mr-1" />
              Add
            </APBButton>
          </div>
          {orgsLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--color-apb-cyan)]" />
            </div>
          ) : (
            <div className="space-y-2">
              {organizers.map((org) => (
                <div
                  key={org.uid}
                  className="flex items-center justify-between p-3 rounded-md bg-black/30 border border-[var(--color-apb-surface-border)]"
                >
                  <span className="font-mono text-sm text-white">{org.uid}</span>
                  <APBButton
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemoveOrganizer(org.uid)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </APBButton>
                </div>
              ))}
              {organizers.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No organizer accounts. Add a UID above.
                </div>
              )}
            </div>
          )}
        </APBCard>
      </section>

      {/* ── SECTION 5: AUDIT LOGS ── */}
      <section className="space-y-4">
        <h3 className="text-lg font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-purple-400" /> System Audit Log
        </h3>
        <APBCard className="p-4 space-y-3">
          <Input
            placeholder="Filter by action or metadata..."
            value={logFilter}
            onChange={(e) => setLogFilter(e.target.value)}
            className="font-mono text-sm"
          />
          {logsLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="w-5 h-5 animate-spin text-[var(--color-apb-cyan)]" />
            </div>
          ) : (
            <div className="max-h-[500px] overflow-y-auto space-y-1 pr-1">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="grid grid-cols-[auto_1fr_auto] gap-3 items-start p-2.5 rounded bg-black/30 border border-[var(--color-apb-surface-border)]"
                >
                  <span className="text-[10px] font-mono text-muted-foreground mt-0.5 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <div>
                    <span className="text-xs font-mono text-[var(--color-apb-cyan)] font-bold">
                      {log.action}
                    </span>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate max-w-xs">
                        {JSON.stringify(log.metadata)}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">{log.actor}</span>
                </div>
              ))}
              {filteredLogs.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No audit logs found.
                </div>
              )}
            </div>
          )}
        </APBCard>
      </section>


      {/* Two-Step Confirmation Dialog: Reset Test Round */}
      <ConfirmationDialog
        open={resetRoundOpen}
        onOpenChange={setResetRoundOpen}
        title="Reset Current Test Round?"
        description="This will erase test drafts and test submissions for the current test round only. Team accounts, other rounds, and event configuration will NOT be touched."
        confirmText="YES, RESET TEST ROUND"
        destructive={true}
        onConfirm={handleResetCurrentRound}
      />
    </div>
  );
}
