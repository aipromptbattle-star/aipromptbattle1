"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { APBCard } from "@/components/apb/APBCard";
import { StatCard } from "@/components/apb/StatCard";
import { StatusBadge } from "@/components/apb/StatusBadge";
import { 
  useEventState, 
  initEvent, 
  useCurrentRound, 
  startRound, 
  pauseRound, 
  resumeRound, 
  extendTime, 
  endRound 
} from "@/lib/firebase/events";
import { useRounds } from "@/lib/firebase/rounds";
import { useTeams, useSessions, clearAllSessions, killSession, killTeamSessions } from "@/lib/firebase/teams";
import { useAllSubmissions, useAllTeamRoundStates } from "@/lib/firebase/submissions";
import { EventTimer } from "@/components/apb/EventTimer";
import { SubmissionMonitor } from "@/components/apb/SubmissionMonitor";
import { APBButton } from "@/components/apb/APBButton";
import { ConfirmationDialog } from "@/components/apb/ConfirmationDialog";
import { ActiveSessionsModal } from "@/components/apb/ActiveSessionsModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Loader2, 
  Play, 
  Pause, 
  Clock, 
  Plus, 
  Square, 
  Download, 
  ExternalLink, 
  Trash2, 
  Users, 
  Flame, 
  Sparkles,
  Layers,
  ShieldAlert,
  Monitor,
  XCircle
} from "lucide-react";

export default function OrganizerDashboard() {
  const { eventState, loading: eventLoading } = useEventState();
  const { currentRound } = useCurrentRound(eventState?.currentRoundId || null);
  const { rounds } = useRounds();
  const { teams } = useTeams();
  const { sessions } = useSessions();
  const { submissions } = useAllSubmissions("currentEvent", currentRound?.id || null);
  const { states: teamRoundStates } = useAllTeamRoundStates("currentEvent", currentRound?.id || null);

  // Quick Action States
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedLaunchRoundId, setSelectedLaunchRoundId] = useState<string>("");
  const [customDuration, setCustomDuration] = useState<number>(300);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Real-time clock ticker for authoritative constraint progression
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const isProgressive = currentRound?.templateType === "PROGRESSIVE_CONSTRAINT" || currentRound?.roundNumber === 2;

  // Authoritative stage calculation
  const elapsedSeconds = currentRound?.startedAt && currentRound?.status === "LIVE"
    ? Math.max(0, Math.floor((now - currentRound.startedAt) / 1000))
    : (currentRound?.pausedRemainingSeconds ? Math.max(0, (currentRound.durationSeconds || 1200) - currentRound.pausedRemainingSeconds) : 0);

  const currentStageNum = Math.min(5, Math.floor(elapsedSeconds / 240) + 1);
  const secondsIntoStage = elapsedSeconds % 240;
  const secondsUntilNextStage = currentStageNum < 5 ? 240 - secondsIntoStage : 0;
  const nextStageMins = Math.floor(secondsUntilNextStage / 60);
  const nextStageSecs = secondsUntilNextStage % 60;

  // Connected telemetry
  const connectedTeamIds = new Set(sessions.map(s => s.teamId));
  const connectedTeamsCount = connectedTeamIds.size;
  const submissionPercentage = teams.length > 0 ? Math.round((submissions.length / teams.length) * 100) : 0;

  // Sessions Management Modal State
  const [sessionsModalOpen, setSessionsModalOpen] = useState(false);
  const [sessionSearch, setSessionSearch] = useState("");
  const [killAllDialogOpen, setKillAllDialogOpen] = useState(false);

  const showNotification = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Kill Single Session
  const handleKillSingleSession = async (sessionId: string, teamId: string) => {
    setActionLoading(true);
    try {
      await killSession(sessionId);
      showNotification("success", `Killed session ${sessionId.slice(0, 8)}... for team ${teamId}.`);
    } catch (e: any) {
      showNotification("error", e.message || "Failed to kill session.");
    } finally {
      setActionLoading(false);
    }
  };

  // Kill All Sessions for a Team
  const handleKillTeamSessions = async (teamId: string) => {
    setActionLoading(true);
    try {
      const count = await killTeamSessions(teamId);
      showNotification("success", `Killed ${count} session(s) for team ${teamId}.`);
    } catch (e: any) {
      showNotification("error", e.message || "Failed to kill team sessions.");
    } finally {
      setActionLoading(false);
    }
  };

  // Emergency Kill All Sessions Handler
  const handleExecuteKillAllSessions = async () => {
    setActionLoading(true);
    try {
      const count = await clearAllSessions();
      showNotification("success", `Emergency Reset: Terminated all ${count} active workstation session(s).`);
    } catch (e: any) {
      showNotification("error", e.message || "Failed to clear sessions.");
    } finally {
      setActionLoading(false);
    }
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    try {
      if (submissions.length === 0) {
        showNotification("error", "No submissions to export for this round yet.");
        return;
      }

      const headers = ["Team ID", "Display Name", "Round Number", "Submitted At", "Version", "Prompt Text", "Asset URL"];
      const rows = submissions.map((sub) => {
        const team = teams.find((t) => t.teamId === sub.teamId);
        const submittedTime = sub.submittedAt ? new Date(sub.submittedAt).toISOString() : "";
        const cleanPrompt = `"${(sub.prompt || "").replace(/"/g, '""')}"`;
        const assetUrl = sub.member2Data?.imageUrl || "";

        return [
          sub.teamId,
          team?.displayName || "",
          currentRound?.roundNumber || "",
          submittedTime,
          sub.version || 1,
          cleanPrompt,
          assetUrl
        ].join(",");
      });

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `apb-round-${currentRound?.roundNumber || "data"}-submissions.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotification("success", `Exported ${submissions.length} submissions to CSV.`);
    } catch (e: any) {
      showNotification("error", e.message || "Failed to export CSV.");
    }
  };

  // Quick Launch Round Handler
  const handleLaunchRound = async () => {
    const roundToLaunch = selectedLaunchRoundId 
      ? rounds.find(r => r.id === selectedLaunchRoundId) 
      : rounds.find(r => r.status === "READY" || r.status === "DRAFT");

    if (!roundToLaunch) {
      showNotification("error", "No available round selected to start.");
      return;
    }

    setActionLoading(true);
    try {
      const duration = customDuration > 0 ? customDuration : roundToLaunch.durationSeconds || 300;
      await startRound(roundToLaunch.id, duration);
      showNotification("success", `Started Round ${roundToLaunch.roundNumber}: ${roundToLaunch.title}!`);
    } catch (e: any) {
      showNotification("error", e.message || "Failed to start round.");
    } finally {
      setActionLoading(false);
    }
  };

  // Direct Round Controls
  const handlePause = async () => {
    if (!currentRound) return;
    setActionLoading(true);
    try {
      await pauseRound(currentRound.id);
      showNotification("success", "Round timer paused.");
    } catch (e: any) {
      showNotification("error", e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    if (!currentRound) return;
    setActionLoading(true);
    try {
      await resumeRound(currentRound.id);
      showNotification("success", "Round timer resumed!");
    } catch (e: any) {
      showNotification("error", e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtend = async (seconds: number) => {
    if (!currentRound) return;
    setActionLoading(true);
    try {
      await extendTime(currentRound.id, seconds);
      showNotification("success", `Added +${seconds / 60} minute(s) to round.`);
    } catch (e: any) {
      showNotification("error", e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnd = async () => {
    if (!currentRound) return;
    if (!window.confirm("End this round now? Participants will no longer be able to submit.")) return;
    setActionLoading(true);
    try {
      await endRound(currentRound.id);
      showNotification("success", `Round ${currentRound.roundNumber} ended.`);
    } catch (e: any) {
      showNotification("error", e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Sessions for modal
  const filteredSessions = sessions.filter((s) => {
    const team = teams.find((t) => t.teamId === s.teamId);
    return (
      s.teamId.toLowerCase().includes(sessionSearch.toLowerCase()) ||
      (team?.displayName || "").toLowerCase().includes(sessionSearch.toLowerCase()) ||
      (s.id || "").toLowerCase().includes(sessionSearch.toLowerCase())
    );
  });

  if (eventLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[var(--color-apb-cyan)]" /></div>;
  }

  if (!eventState) {
    return (
      <div className="space-y-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-3xl font-mono font-bold uppercase tracking-wider text-white">No Event Found</h2>
        <p className="text-muted-foreground max-w-md">The AI Prompt Battle event has not been initialized yet. Click below to set up the default event document.</p>
        <APBButton glow onClick={() => initEvent()}>Initialize Event</APBButton>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-apb-surface-border)] pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl sm:text-3xl font-mono font-bold uppercase tracking-wider text-white flex items-center gap-3">
              <span>AI PROMPT BATTLE — LIVE CONTROL</span>
            </h2>
            {currentRound?.status === "LIVE" ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            ) : (
              <StatusBadge status={eventState.status} />
            )}
          </div>
          <p className="text-muted-foreground text-sm font-mono">
            {currentRound 
              ? `Active: Round ${currentRound.roundNumber} • ${currentRound.title}`
              : "Command Center • Operational Battle Telemetrics"}
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/host" target="_blank" rel="noopener noreferrer">
            <APBButton variant="outline" size="sm" className="font-mono text-xs text-[var(--color-apb-cyan)] border-[var(--color-apb-cyan)]/40 hover:bg-[var(--color-apb-cyan)]/10">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Host Projector
            </APBButton>
          </Link>

          <APBButton 
            variant="outline" 
            size="sm" 
            onClick={handleExportCSV}
            className="font-mono text-xs text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
          </APBButton>

          <APBButton 
            variant="outline" 
            size="sm" 
            onClick={() => setSessionsModalOpen(true)}
            className="font-mono text-xs text-red-400 border-red-500/40 hover:bg-red-500/10"
          >
            <ShieldAlert className="w-3.5 h-3.5 mr-1.5" /> Sessions Control ({sessions.length})
          </APBButton>
        </div>
      </div>

      {/* Notification Toast */}
      {feedback && (
        <div className={`p-3 rounded-md font-mono text-xs flex items-center justify-between animate-in fade-in duration-200 border ${
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

      {/* Primary Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <APBCard className="p-5 border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)]">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">TEAMS REGISTERED</div>
          <div className="text-3xl font-mono font-bold text-white">{teams.length}</div>
          <div className="text-[11px] font-mono text-muted-foreground mt-1">Official battle teams</div>
        </APBCard>

        <APBCard className="p-5 border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)]">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">CONNECTED TEAMS</div>
          <div className="text-3xl font-mono font-bold text-[var(--color-apb-cyan)]">
            {connectedTeamsCount} <span className="text-sm font-normal text-muted-foreground">/ {teams.length}</span>
          </div>
          <div className="text-[11px] font-mono text-muted-foreground mt-1">{sessions.length} active workstation devices</div>
        </APBCard>

        <APBCard className="p-5 border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)]">
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">SUBMISSIONS RECEIVED</div>
          <div className="text-3xl font-mono font-bold text-emerald-400">
            {submissions.length} <span className="text-sm font-normal text-muted-foreground">/ {teams.length}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all duration-500" 
              style={{ width: `${submissionPercentage}%` }} 
            />
          </div>
        </APBCard>

        <div 
          onClick={() => setSessionsModalOpen(true)} 
          className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <APBCard className="p-5 border-red-500/20 bg-red-950/10 hover:border-red-500/40">
            <div className="text-[10px] font-mono uppercase tracking-widest text-red-400 mb-1 flex items-center justify-between">
              <span>ACTIVE SESSIONS</span>
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="text-3xl font-mono font-bold text-red-400">{sessions.length} Active</div>
            <div className="text-[11px] font-mono text-red-300/70 mt-1">Manage & kill sessions ↗</div>
          </APBCard>
        </div>
      </div>

      {/* Progressive Constraint Real-time HUD (Round 2) */}
      {isProgressive && (currentRound?.status === "LIVE" || currentRound?.status === "PAUSED") && (
        <APBCard className="p-6 border-[var(--color-apb-purple)]/40 bg-gradient-to-r from-[var(--color-apb-purple)]/10 via-[var(--color-apb-surface)] to-[var(--color-apb-cyan)]/10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--color-apb-surface-border)]">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-widest text-[var(--color-apb-purple)] font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--color-apb-purple)] animate-ping" />
                ROUND 2 PROGRESSIVE CONSTRAINT ENGINE
              </span>
              <div className="text-2xl font-mono font-bold text-white flex items-center gap-3">
                <span>STAGE 0{currentStageNum} / 05</span>
                <span className="text-sm font-normal text-muted-foreground">
                  (Elapsed: {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s)
                </span>
              </div>
            </div>

            {currentStageNum < 5 ? (
              <div className="p-3 rounded-xl bg-black/60 border border-[var(--color-apb-purple)]/30 text-right">
                <div className="text-[10px] font-mono uppercase text-muted-foreground">Next Constraint Reveals In</div>
                <div className="text-2xl font-mono font-bold text-[var(--color-apb-cyan)]">
                  {String(nextStageMins).padStart(2, "0")}:{String(nextStageSecs).padStart(2, "0")}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-black/60 border border-emerald-500/30 text-right">
                <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">FINAL STAGE ACTIVE</div>
                <div className="text-xs font-mono text-muted-foreground">Auto-freeze on round completion</div>
              </div>
            )}
          </div>

          {/* Stage Progress Bar (5 stages) */}
          <div className="grid grid-cols-5 gap-2 pt-4">
            {[1, 2, 3, 4, 5].map((st) => {
              const isActive = st === currentStageNum;
              const isPast = st < currentStageNum;
              const stageSubmittedCount = submissions.filter(s => 
                (s.progressiveStageSubmissions && s.progressiveStageSubmissions.some(rec => rec.stageNumber === st)) ||
                (s.stageReached && s.stageReached >= st)
              ).length;

              return (
                <div 
                  key={st} 
                  className={`p-3 rounded-lg border font-mono transition-all ${
                    isActive 
                      ? "bg-[var(--color-apb-purple)]/20 border-[var(--color-apb-purple)] text-white shadow-lg shadow-purple-900/30" 
                      : isPast 
                      ? "bg-slate-900/60 border-slate-700 text-slate-300"
                      : "bg-black/30 border-slate-800 text-slate-600"
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold flex items-center justify-between">
                    <span>STAGE {st}</span>
                    {isPast && <span className="text-emerald-400">✓</span>}
                    {isActive && <span className="text-[var(--color-apb-purple)]">LIVE</span>}
                  </div>
                  <div className="text-base font-bold mt-1">
                    {stageSubmittedCount} <span className="text-[10px] font-normal text-muted-foreground">Submissions</span>
                  </div>
                </div>
              );
            })}
          </div>
        </APBCard>
      )}

      {/* Main Control Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Live Round Operations */}
        <div className="lg:col-span-2 space-y-6">
          <APBCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono text-lg text-white uppercase tracking-widest flex items-center gap-2">
                <Flame className="w-5 h-5 text-[var(--color-apb-cyan)]" />
                Live Round Operations
              </h3>
              {currentRound && (
                <StatusBadge 
                  status={currentRound.status} 
                  className={currentRound.status === "LIVE" ? "!bg-emerald-500/10 !text-emerald-400 !border-emerald-500/30" : "!bg-amber-500/10 !text-amber-400 !border-amber-500/30"} 
                />
              )}
            </div>

            {/* Active Round Card */}
            {currentRound && (currentRound.status === "LIVE" || currentRound.status === "PAUSED") ? (
              <div className="space-y-6">
                <div className="p-6 rounded-lg bg-[var(--color-apb-surface)] border border-[var(--color-apb-surface-border)] flex flex-col items-center justify-center">
                  <div className="text-[var(--color-apb-cyan)] font-mono text-sm tracking-widest uppercase mb-1">
                    Round {currentRound.roundNumber}: {currentRound.title}
                  </div>
                  <p className="text-xs text-muted-foreground mb-6 text-center max-w-md">
                    {currentRound.challengeDescription || currentRound.description}
                  </p>
                  <EventTimer round={currentRound} />
                </div>

                {/* Direct Action Buttons */}
                <div className="space-y-3">
                  <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Quick Controls</div>
                  <div className="flex flex-wrap items-center gap-3">
                    {currentRound.status === "LIVE" ? (
                      <APBButton 
                        variant="outline" 
                        onClick={handlePause} 
                        disabled={actionLoading}
                        className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 font-mono text-xs"
                      >
                        <Pause className="w-3.5 h-3.5 mr-1.5" /> Pause Timer
                      </APBButton>
                    ) : (
                      <APBButton 
                        glow 
                        onClick={handleResume} 
                        disabled={actionLoading}
                        className="font-mono text-xs"
                      >
                        <Play className="w-3.5 h-3.5 mr-1.5" /> Resume Timer
                      </APBButton>
                    )}

                    {/* Quick Extends */}
                    <APBButton 
                      variant="outline" 
                      onClick={() => handleExtend(60)} 
                      disabled={actionLoading}
                      className="font-mono text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" /> 1 Min
                    </APBButton>
                    <APBButton 
                      variant="outline" 
                      onClick={() => handleExtend(120)} 
                      disabled={actionLoading}
                      className="font-mono text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" /> 2 Min
                    </APBButton>
                    <APBButton 
                      variant="outline" 
                      onClick={() => handleExtend(300)} 
                      disabled={actionLoading}
                      className="font-mono text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" /> 5 Min
                    </APBButton>

                    <div className="flex-1" />

                    <APBButton 
                      variant="outline" 
                      onClick={handleEnd} 
                      disabled={actionLoading}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10 font-mono text-xs"
                    >
                      <Square className="w-3.5 h-3.5 mr-1.5" /> End Round
                    </APBButton>
                  </div>
                </div>
              </div>
            ) : (
              /* No Round Active - Quick Launcher Deck */
              <div className="space-y-6">
                <div className="p-8 border border-dashed border-[var(--color-apb-surface-border)] rounded-lg bg-black/20 text-center space-y-4">
                  <Clock className="w-10 h-10 text-muted-foreground mx-auto" />
                  <div>
                    <h4 className="font-mono text-white font-bold uppercase tracking-wider">No Active Round</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ready to start the next battle? Launch directly from here or customize duration.
                    </p>
                  </div>

                  {rounds.length > 0 ? (
                    <div className="max-w-md mx-auto space-y-4 pt-2">
                      <div className="flex items-center gap-3">
                        <select 
                          className="flex-1 h-10 rounded-md bg-[var(--color-apb-surface)] border border-[var(--color-apb-surface-border)] px-3 text-xs font-mono text-white uppercase focus:outline-none focus:border-[var(--color-apb-cyan)]"
                          value={selectedLaunchRoundId}
                          onChange={(e) => {
                            setSelectedLaunchRoundId(e.target.value);
                            const found = rounds.find(r => r.id === e.target.value);
                            if (found?.durationSeconds) setCustomDuration(found.durationSeconds);
                          }}
                        >
                          <option value="">Select a Round...</option>
                          {rounds.map((r) => (
                            <option key={r.id} value={r.id}>
                              Round {r.roundNumber}: {r.title} ({r.status})
                            </option>
                          ))}
                        </select>

                        <input 
                          type="number" 
                          min={30} 
                          step={30}
                          value={customDuration}
                          onChange={(e) => setCustomDuration(Number(e.target.value))}
                          placeholder="Secs"
                          title="Round duration in seconds"
                          className="w-24 h-10 rounded-md bg-[var(--color-apb-surface)] border border-[var(--color-apb-surface-border)] px-3 text-xs font-mono text-center text-white focus:outline-none focus:border-[var(--color-apb-cyan)]"
                        />
                      </div>

                      <APBButton 
                        glow 
                        onClick={handleLaunchRound} 
                        disabled={actionLoading}
                        className="w-full h-11 text-sm font-mono uppercase tracking-wider"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {actionLoading ? "Launching..." : "Launch Selected Round"}
                      </APBButton>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <Link href="/organizer/rounds">
                        <APBButton glow size="sm">Create First Round</APBButton>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </APBCard>
        </div>

        {/* Right 1 Col: Quick Links & Summary */}
        <div className="space-y-6">
          {/* Live Progress Card */}
          <APBCard className="p-6">
            <h3 className="font-mono text-lg text-white mb-4 uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--color-apb-cyan)]" />
              Battle Health
            </h3>
            
            <div className="space-y-4 text-sm font-mono">
              <div className="flex justify-between border-b border-[var(--color-apb-surface-border)] pb-2">
                <span className="text-muted-foreground">Registered Teams:</span>
                <span className="text-white font-bold">{teams.length}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--color-apb-surface-border)] pb-2">
                <span className="text-muted-foreground">Submissions:</span>
                <span className="text-emerald-400 font-bold">{submissions.length}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--color-apb-surface-border)] pb-2">
                <span className="text-muted-foreground">In Progress:</span>
                <span className="text-blue-400 font-bold">
                  {teamRoundStates.filter(s => s.status === "IN_PROGRESS").length}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-[var(--color-apb-surface-border)] pb-2">
                <span className="text-muted-foreground">Connected Devices:</span>
                <button 
                  onClick={() => setSessionsModalOpen(true)}
                  className="text-purple-400 font-bold hover:underline cursor-pointer flex items-center gap-1 font-mono"
                  title="Open Active Workstation Sessions Manager"
                >
                  {sessions.length} Active ↗
                </button>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Completion Rate:</span>
                <span className="text-cyan-400 font-bold">
                  {teams.length > 0 ? `${Math.round((submissions.length / teams.length) * 100)}%` : "0%"}
                </span>
              </div>
            </div>
          </APBCard>

          {/* Quick Shortcuts */}
          <APBCard className="p-6">
            <h3 className="font-mono text-sm text-white mb-3 uppercase tracking-widest">
              Quick Navigation
            </h3>
            <div className="space-y-2">
              <Link href="/organizer/teams" className="block">
                <div className="flex items-center justify-between p-2.5 rounded border border-[var(--color-apb-surface-border)] hover:bg-white/[0.03] transition-colors text-xs font-mono">
                  <div className="flex items-center gap-2 text-white">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span>Manage Teams</span>
                  </div>
                  <span className="text-muted-foreground">{teams.length} Active</span>
                </div>
              </Link>

              <Link href="/organizer/rounds" className="block">
                <div className="flex items-center justify-between p-2.5 rounded border border-[var(--color-apb-surface-border)] hover:bg-white/[0.03] transition-colors text-xs font-mono">
                  <div className="flex items-center gap-2 text-white">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Manage Rounds</span>
                  </div>
                  <span className="text-muted-foreground">{rounds.length} Configured</span>
                </div>
              </Link>

              <Link href="/host" target="_blank" rel="noopener noreferrer" className="block">
                <div className="flex items-center justify-between p-2.5 rounded border border-[var(--color-apb-surface-border)] hover:bg-white/[0.03] transition-colors text-xs font-mono">
                  <div className="flex items-center gap-2 text-[var(--color-apb-cyan)]">
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Host Display</span>
                  </div>
                  <span className="text-muted-foreground">Projector</span>
                </div>
              </Link>
            </div>
          </APBCard>
        </div>
      </div>

      {/* Real-time Submissions Monitor Table */}
      <SubmissionMonitor
        round={currentRound}
        teams={teams}
        teamRoundStates={teamRoundStates}
        submissions={submissions}
      />

      {/* Upgraded Workstation Sessions Control Modal */}
      <ActiveSessionsModal
        open={sessionsModalOpen}
        onOpenChange={setSessionsModalOpen}
        sessions={sessions}
        teams={teams}
        onSuccessMessage={(msg) => showNotification("success", msg)}
        onErrorMessage={(msg) => showNotification("error", msg)}
      />
    </div>
  );
}
