"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { APBCard } from "@/components/apb/APBCard";
import { StatusBadge } from "@/components/apb/StatusBadge";
import { 
  useEventState, 
  useCurrentRound, 
  startRound, 
  pauseRound, 
  resumeRound, 
  extendTime, 
  endRound,
  finalizeRoundStart
} from "@/lib/firebase/events";
import { useRounds } from "@/lib/firebase/rounds";
import { useTeams, useSessions } from "@/lib/firebase/teams";
import { useAllSubmissions, useAllTeamRoundStates } from "@/lib/firebase/submissions";
import { EventTimer } from "@/components/apb/EventTimer";
import { SubmissionMonitor } from "@/components/apb/SubmissionMonitor";
import { APBButton } from "@/components/apb/APBButton";
import { ConfirmationDialog } from "@/components/apb/ConfirmationDialog";
import { 
  Loader2, 
  Play, 
  Pause, 
  Clock, 
  Square, 
  Download, 
  Sparkles,
  Flame,
  Plus,
  Monitor,
  AlertCircle,
  CheckCircle2,
  CalendarCheck
} from "lucide-react";

export default function OrganizerLiveControl() {
  const { eventState, loading: eventLoading } = useEventState();
  const { currentRound } = useCurrentRound(eventState?.currentRoundId || null);
  const { rounds } = useRounds();
  const { teams } = useTeams();
  const { sessions } = useSessions();
  const { submissions } = useAllSubmissions("currentEvent", currentRound?.id || null);
  const { states: teamRoundStates } = useAllTeamRoundStates("currentEvent", currentRound?.id || null);

  const [actionLoading, setActionLoading] = useState(false);
  const [selectedLaunchRoundId, setSelectedLaunchRoundId] = useState<string>("");
  const [customDuration, setCustomDuration] = useState<number>(1200);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [extensionNotice, setExtensionNotice] = useState<{ addedText: string; newEndTimeText: string } | null>(null);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);

  // Authoritative clock ticker
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);

  // 5-second countdown detection
  const countdownEndsAt = currentRound?.countdownEndsAt || 0;
  const isStarting = currentRound?.status === "STARTING";
  const countdownRemainingMs = Math.max(0, countdownEndsAt - now);
  const countdownRemainingSecs = Math.ceil(countdownRemainingMs / 1000);

  useEffect(() => {
    if (isStarting && currentRound && countdownRemainingMs === 0) {
      finalizeRoundStart(currentRound.id);
    }
  }, [isStarting, currentRound, countdownRemainingMs]);

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

  const connectedTeamIds = new Set(sessions.map(s => s.teamId));
  const connectedTeamsCount = connectedTeamIds.size;

  const showNotification = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Launch Round Handler (Idempotent & Debounced)
  const handleLaunchRound = async () => {
    const roundToLaunch = selectedLaunchRoundId 
      ? rounds.find(r => r.id === selectedLaunchRoundId) 
      : (currentRound?.status === "READY" ? currentRound : rounds.find(r => r.status === "READY" || r.status === "DRAFT"));

    if (!roundToLaunch) {
      showNotification("error", "No available round selected to start.");
      return;
    }

    if (actionLoading || roundToLaunch.status === "STARTING" || roundToLaunch.status === "LIVE") {
      return;
    }

    setActionLoading(true);
    try {
      const duration = customDuration > 0 ? customDuration : roundToLaunch.durationSeconds || 1200;
      await startRound(roundToLaunch.id, duration);
      showNotification("success", `Initiated 5-second countdown for Round ${roundToLaunch.roundNumber}: ${roundToLaunch.title}!`);
    } catch (e: unknown) {
      showNotification("error", e instanceof Error ? e.message : "Failed to start round.");
    } finally {
      setActionLoading(false);
    }
  };

  // Pause Round
  const handlePause = async () => {
    if (!currentRound) return;
    setActionLoading(true);
    try {
      await pauseRound(currentRound.id);
      showNotification("success", "Authoritative round timer paused.");
    } catch (e: unknown) {
      showNotification("error", e instanceof Error ? e.message : "Pause error.");
    } finally {
      setActionLoading(false);
    }
  };

  // Resume Round
  const handleResume = async () => {
    if (!currentRound) return;
    setActionLoading(true);
    try {
      await resumeRound(currentRound.id);
      showNotification("success", "Authoritative round timer resumed!");
    } catch (e: unknown) {
      showNotification("error", e instanceof Error ? e.message : "Resume error.");
    } finally {
      setActionLoading(false);
    }
  };

  // Time Extension Handler (Sections 18 & 4)
  const handleExtend = async (seconds: number) => {
    if (!currentRound) return;
    setActionLoading(true);
    try {
      await extendTime(currentRound.id, seconds);
      const addedMinutes = seconds / 60;
      const calculatedNewEndTime = currentRound.endsAt 
        ? new Date(currentRound.endsAt + seconds * 1000).toLocaleTimeString()
        : "Updated";

      setExtensionNotice({
        addedText: `+${addedMinutes}:00`,
        newEndTimeText: calculatedNewEndTime,
      });

      showNotification("success", `Added +${addedMinutes} minute(s) to authoritative round deadline.`);
      setTimeout(() => setExtensionNotice(null), 8000);
    } catch (e: unknown) {
      showNotification("error", e instanceof Error ? e.message : "Extension error.");
    } finally {
      setActionLoading(false);
    }
  };

  // End Round
  const handleEnd = async () => {
    if (!currentRound) return;
    setActionLoading(true);
    try {
      await endRound(currentRound.id);
      showNotification("success", `Round ${currentRound.roundNumber} officially ended. Submissions locked.`);
      setEndConfirmOpen(false);
    } catch (e: unknown) {
      showNotification("error", e instanceof Error ? e.message : "Failed to end round.");
    } finally {
      setActionLoading(false);
    }
  };

  // Export CSV
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
    } catch (e: unknown) {
      showNotification("error", e instanceof Error ? e.message : "Failed to export CSV.");
    }
  };

  if (eventLoading) {
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
              <Flame className="w-6 h-6 text-[var(--color-apb-cyan)]" />
              <span>AI PROMPT BATTLE — LIVE CONTROL</span>
            </h2>
            {currentRound && (
              <StatusBadge status={currentRound.status} pulse={currentRound.status === "LIVE" || isStarting} />
            )}
          </div>
          <p className="text-muted-foreground text-sm font-mono">
            {currentRound 
              ? `Operational Command: Round 0${currentRound.roundNumber} • ${currentRound.title} (${currentRound.templateType || "STANDARD"})`
              : "Live Competition Conduction & Server-Authoritative Timer Control"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/display" target="_blank" rel="noopener noreferrer">
            <APBButton variant="outline" size="sm" className="font-mono text-xs text-[var(--color-apb-cyan)] border-[var(--color-apb-cyan)]/40 hover:bg-[var(--color-apb-cyan)]/10">
              <Monitor className="w-3.5 h-3.5 mr-1.5" /> Public Display
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
        </div>
      </div>

      {/* Notifications */}
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

      {/* Section 18: Authoritative Time Extension HUD Banner */}
      {extensionNotice && (
        <div className="p-4 rounded-xl bg-cyan-950/60 border-2 border-[var(--color-apb-cyan)] text-cyan-200 font-mono text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_30px_rgba(0,240,255,0.2)] animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3">
            <CalendarCheck className="w-6 h-6 text-[var(--color-apb-cyan)]" />
            <div>
              <div className="text-xs uppercase tracking-widest text-white/70">AUTHORITATIVE DEADLINE EXTENSION</div>
              <div className="text-lg font-bold text-white">TIME EXTENDED {extensionNotice.addedText}</div>
            </div>
          </div>
          <div className="text-right sm:border-l sm:border-white/20 sm:pl-4">
            <div className="text-xs uppercase text-muted-foreground">NEW END TIME</div>
            <div className="text-xl font-black text-[var(--color-apb-cyan)]">{extensionNotice.newEndTimeText}</div>
          </div>
        </div>
      )}

      {/* Authoritative 5-Second Countdown HUD (Sections 12 & 13) */}
      {isStarting && (
        <APBCard className="p-8 text-center bg-gradient-to-r from-amber-950/30 via-black to-amber-950/30 border-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.2)] animate-in zoom-in-95 duration-200">
          <div className="px-4 py-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 font-mono text-xs uppercase tracking-widest font-bold inline-flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 animate-spin" />
            SYNCHRONIZED AUTHORITATIVE COUNTDOWN
          </div>

          <div className="font-mono text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-amber-400 drop-shadow-[0_0_30px_rgba(245,158,11,0.5)] leading-none">
            {countdownRemainingSecs > 0 ? countdownRemainingSecs : "GO!"}
          </div>

          <div className="text-sm font-mono text-white/80 mt-4 uppercase tracking-wider">
            Round {currentRound?.roundNumber}: {currentRound?.title} starting on all screens...
          </div>
        </APBCard>
      )}

      {/* Section 7: Organizer Live Round Panel */}
      {currentRound && (currentRound.status === "LIVE" || currentRound.status === "PAUSED") && (
        <APBCard className="p-6 bg-gradient-to-r from-[var(--color-apb-surface)] via-black/40 to-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="space-y-1">
              <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-apb-cyan)] font-bold flex items-center gap-2">
                <Flame className="w-4 h-4 text-[var(--color-apb-cyan)]" />
                LIVE ROUND PANEL
              </div>
              <h3 className="text-2xl sm:text-3xl font-mono font-black uppercase text-white">
                Round 0{currentRound.roundNumber}: {currentRound.title}
              </h3>
              <div className="text-xs font-mono text-muted-foreground">
                Challenge Mode: {currentRound.templateType || "STANDARD"}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-[10px] font-mono uppercase text-muted-foreground">TIME REMAINING</div>
                <EventTimer round={currentRound} />
              </div>
            </div>
          </div>

          {/* Progressive Constraint Real-time HUD */}
          {isProgressive && (
            <div className="py-6 border-b border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="font-mono text-sm text-purple-300 font-bold uppercase tracking-widest">
                  STAGE 0{currentStageNum} / 05
                </div>
                {currentStageNum < 5 ? (
                  <div className="font-mono text-xs text-muted-foreground">
                    NEXT CONSTRAINT REVEALS AT <span className="text-[var(--color-apb-cyan)] font-bold">{String(nextStageMins).padStart(2, "0")}:{String(nextStageSecs).padStart(2, "0")}</span>
                  </div>
                ) : (
                  <div className="font-mono text-xs text-emerald-400 font-bold">FINAL STAGE ACTIVE</div>
                )}
              </div>

              {/* 5-Stage progress blocks */}
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((st) => {
                  const isActive = st === currentStageNum;
                  const isPast = st < currentStageNum;
                  const stageSubCount = submissions.filter(s => 
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
                        {stageSubCount} <span className="text-[10px] font-normal text-muted-foreground">Subs</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Telemetry Numbers row (Section 7) */}
          <div className="grid grid-cols-3 gap-4 pt-6 text-center font-mono">
            <div className="p-3 rounded-lg bg-black/40 border border-white/5">
              <div className="text-[10px] uppercase text-muted-foreground">TEAMS</div>
              <div className="text-2xl sm:text-3xl font-bold text-white">{teams.length}</div>
            </div>
            <div className="p-3 rounded-lg bg-black/40 border border-white/5">
              <div className="text-[10px] uppercase text-muted-foreground">CONNECTED</div>
              <div className="text-2xl sm:text-3xl font-bold text-[var(--color-apb-cyan)]">{connectedTeamsCount}</div>
            </div>
            <div className="p-3 rounded-lg bg-black/40 border border-white/5">
              <div className="text-[10px] uppercase text-muted-foreground">SUBMITTED</div>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-400">{submissions.length}</div>
            </div>
          </div>
        </APBCard>
      )}

      {/* Section 4: Round Control (Primary vs Secondary Separated) */}
      <APBCard className="p-6 bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground font-bold mb-4">
          ROUND CONTROL
        </div>

        {currentRound && (currentRound.status === "LIVE" || currentRound.status === "PAUSED") ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Primary Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {currentRound.status === "LIVE" ? (
                <APBButton 
                  variant="outline" 
                  onClick={handlePause} 
                  disabled={actionLoading}
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10 font-mono text-xs"
                >
                  <Pause className="w-4 h-4 mr-2" /> ⏸ PAUSE
                </APBButton>
              ) : (
                <APBButton 
                  glow 
                  onClick={handleResume} 
                  disabled={actionLoading}
                  className="font-mono text-xs"
                >
                  <Play className="w-4 h-4 mr-2" /> ▶ RESUME
                </APBButton>
              )}

              <APBButton 
                variant="outline" 
                onClick={() => handleExtend(120)} 
                disabled={actionLoading}
                className="font-mono text-xs border-cyan-500/30 text-[var(--color-apb-cyan)] hover:bg-cyan-500/10"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> +2 MIN
              </APBButton>

              <APBButton 
                variant="outline" 
                onClick={() => handleExtend(300)} 
                disabled={actionLoading}
                className="font-mono text-xs border-cyan-500/30 text-[var(--color-apb-cyan)] hover:bg-cyan-500/10"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> +5 MIN
              </APBButton>
            </div>

            {/* Dangerous Control (Clearly Separated) */}
            <div className="pt-2 sm:pt-0 sm:border-l sm:border-white/10 sm:pl-4">
              <APBButton 
                variant="destructive" 
                onClick={() => setEndConfirmOpen(true)} 
                disabled={actionLoading}
                className="font-mono text-xs"
              >
                <Square className="w-4 h-4 mr-2" /> END ROUND
              </APBButton>
            </div>
          </div>
        ) : (
          /* Round Not Active: Launch Control */
          <div className="space-y-4">
            <p className="text-xs font-mono text-muted-foreground">
              Select a round to launch with authoritative 5-second countdown across all screens.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <select 
                className="flex-1 h-11 rounded-md bg-black/60 border border-[var(--color-apb-surface-border)] px-3 text-xs font-mono text-white uppercase focus:outline-none focus:border-[var(--color-apb-cyan)]"
                value={selectedLaunchRoundId}
                onChange={(e) => {
                  setSelectedLaunchRoundId(e.target.value);
                  const found = rounds.find(r => r.id === e.target.value);
                  if (found?.durationSeconds) setCustomDuration(found.durationSeconds);
                }}
              >
                <option value="">{currentRound?.status === "READY" ? `Active: Round ${currentRound.roundNumber} (${currentRound.title})` : "Select a Round to Start..."}</option>
                {rounds.map((r) => (
                  <option key={r.id} value={r.id}>
                    Round {r.roundNumber}: {r.title} ({r.status}) — {Math.floor(r.durationSeconds / 60)} min
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  min={30} 
                  step={30}
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Number(e.target.value))}
                  placeholder="Seconds"
                  title="Duration in seconds"
                  className="w-28 h-11 rounded-md bg-black/60 border border-[var(--color-apb-surface-border)] px-3 text-xs font-mono text-center text-white focus:outline-none focus:border-[var(--color-apb-cyan)]"
                />

                <APBButton 
                  glow 
                  onClick={handleLaunchRound} 
                  disabled={actionLoading || isStarting || currentRound?.status === "LIVE"}
                  className="h-11 px-6 font-mono text-xs uppercase tracking-wider whitespace-nowrap"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isStarting ? "Starting..." : "START ROUND"}
                </APBButton>
              </div>
            </div>
          </div>
        )}
      </APBCard>

      {/* Real-time Submissions Monitor */}
      <SubmissionMonitor
        round={currentRound}
        teams={teams}
        teamRoundStates={teamRoundStates}
        submissions={submissions}
      />

      {/* End Round Confirmation Dialog */}
      <ConfirmationDialog
        open={endConfirmOpen}
        onOpenChange={setEndConfirmOpen}
        title="Official End of Round"
        description={`Are you sure you want to end Round ${currentRound?.roundNumber || ""}? All active drafts will be frozen and participant submissions will be immediately locked.`}
        confirmText="END ROUND"
        destructive
        onConfirm={handleEnd}
      />
    </div>
  );
}
