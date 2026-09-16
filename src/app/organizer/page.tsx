"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { APBCard } from "@/components/apb/APBCard";
import { StatusBadge } from "@/components/apb/StatusBadge";
import { 
  useEventState, 
  initEvent, 
  useCurrentRound 
} from "@/lib/firebase/events";
import { useRounds } from "@/lib/firebase/rounds";
import { useTeams, useSessions } from "@/lib/firebase/teams";
import { useAllSubmissions } from "@/lib/firebase/submissions";
import { APBButton } from "@/components/apb/APBButton";
import { 
  Loader2, 
  Flame, 
  Clock, 
  Users, 
  Star, 
  Monitor, 
  ShieldAlert, 
  Settings, 
  CheckCircle2, 
  ArrowRight,
  Radio
} from "lucide-react";

export default function OrganizerOverview() {
  const { eventState, loading: eventLoading } = useEventState();
  const { currentRound } = useCurrentRound(eventState?.currentRoundId || null);
  const { rounds } = useRounds();
  const { teams } = useTeams();
  const { sessions } = useSessions();
  const { submissions } = useAllSubmissions("currentEvent", currentRound?.id || null);

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

  // Telemetry numbers
  const connectedTeamIds = new Set(sessions.map(s => s.teamId));
  const connectedTeamsCount = connectedTeamIds.size;
  const judgedSubmissionsCount = submissions.filter(s => s.score !== undefined).length;

  // Time remaining formatted
  let timeLeftSecs = 0;
  if (currentRound) {
    if (currentRound.status === "PAUSED" && currentRound.pausedRemainingSeconds != null) {
      timeLeftSecs = currentRound.pausedRemainingSeconds;
    } else if (currentRound.status === "LIVE" && currentRound.endsAt) {
      timeLeftSecs = Math.max(0, Math.ceil((currentRound.endsAt - now) / 1000));
    } else if (currentRound.status === "READY" || currentRound.status === "DRAFT") {
      timeLeftSecs = currentRound.durationSeconds || 1200;
    }
  }

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (eventLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-apb-cyan)]" />
      </div>
    );
  }

  if (!eventState) {
    return (
      <div className="space-y-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-3xl font-mono font-bold uppercase tracking-wider text-white">No Event Found</h2>
        <p className="text-muted-foreground max-w-md">The AI Prompt Battle event has not been initialized yet. Click below to initialize.</p>
        <APBButton glow onClick={() => initEvent()}>Initialize Event</APBButton>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Overview Top Command Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-apb-surface-border)] pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl sm:text-3xl font-mono font-bold uppercase tracking-wider text-white">
              AI PROMPT BATTLE — EVENT OVERVIEW
            </h2>
            <StatusBadge status={eventState.status} pulse={eventState.status === "LIVE"} />
          </div>
          <p className="text-muted-foreground text-sm font-mono">
            Command Center • Real-Time Competition Health & Status Summary
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/organizer/live">
            <APBButton glow className="font-mono text-xs uppercase tracking-wider">
              <Flame className="w-4 h-4 mr-2 text-[var(--color-apb-cyan)]" />
              Go to Live Control
            </APBButton>
          </Link>
          <Link href="/display" target="_blank" rel="noopener noreferrer">
            <APBButton variant="outline" className="font-mono text-xs uppercase tracking-wider text-[var(--color-apb-cyan)] border-[var(--color-apb-cyan)]/30 hover:bg-[var(--color-apb-cyan)]/10">
              <Monitor className="w-4 h-4 mr-2" />
              Open Display
            </APBButton>
          </Link>
        </div>
      </div>

      {/* Primary Status Card — Active Round Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <APBCard className="lg:col-span-2 p-6 bg-gradient-to-r from-[var(--color-apb-surface)] via-black/40 to-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-apb-cyan)] font-bold mb-1 flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-[var(--color-apb-cyan)] animate-pulse" />
                CURRENT COMPETITION ROUND
              </div>
              <div className="text-3xl sm:text-4xl font-mono font-black uppercase text-white">
                {currentRound ? `Round 0${currentRound.roundNumber}: ${currentRound.title}` : "NO ACTIVE ROUND"}
              </div>
              <div className="text-sm font-mono text-muted-foreground mt-1">
                Template: {currentRound?.templateType || "STANDARD"} • Duration: {currentRound ? Math.floor(currentRound.durationSeconds / 60) : 20} Minutes
              </div>
            </div>

            {currentRound && (
              <div className="text-right shrink-0">
                <StatusBadge status={currentRound.status} pulse={currentRound.status === "LIVE" || currentRound.status === "STARTING"} className="text-sm px-3 py-1" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 font-mono">
            {isProgressive ? (
              <div className="space-y-1">
                <div className="text-xs uppercase text-muted-foreground">STAGE</div>
                <div className="text-3xl font-black text-[var(--color-apb-purple)]">
                  0{currentStageNum} <span className="text-lg text-muted-foreground font-normal">/ 05</span>
                </div>
                <div className="text-xs text-purple-300/80">
                  {currentStageNum === 1 ? "Initial Statement" : `Constraint 0${currentStageNum - 1}`}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-xs uppercase text-muted-foreground">STRUCTURE</div>
                <div className="text-2xl font-bold text-white">
                  {currentRound?.templateType === "QUIZ" ? "20 Questions" : "Single Prompt"}
                </div>
                <div className="text-xs text-muted-foreground">Deterministic Evaluation</div>
              </div>
            )}

            <div className="space-y-1">
              <div className="text-xs uppercase text-muted-foreground">TIME REMAINING</div>
              <div className={`text-4xl font-black ${
                timeLeftSecs <= 60 && currentRound?.status === "LIVE" ? "text-red-500 animate-pulse" : "text-white"
              }`}>
                {formatTimer(timeLeftSecs)}
              </div>
              <div className="text-xs text-muted-foreground">Server authoritative</div>
            </div>

            <div className="space-y-1">
              <div className="text-xs uppercase text-muted-foreground">NEXT EVENT</div>
              {isProgressive && currentStageNum < 5 && currentRound?.status === "LIVE" ? (
                <div>
                  <div className="text-xl font-bold text-[var(--color-apb-cyan)]">
                    Constraint 0{currentStageNum}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    At {String(nextStageMins).padStart(2, "0")}:{String(nextStageSecs).padStart(2, "0")} remaining
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-xl font-bold text-white">
                    {currentRound?.status === "LIVE" ? "Round Conclusion" : "Standby for Launch"}
                  </div>
                  <div className="text-xs text-muted-foreground">Automatic stage lock</div>
                </div>
              )}
            </div>
          </div>
        </APBCard>

        {/* Display Health & System Telemetry */}
        <APBCard className="p-6 bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground font-bold mb-4 flex items-center justify-between">
              <span>EVENT INTEGRATIONS</span>
              <Monitor className="w-4 h-4 text-[var(--color-apb-cyan)]" />
            </div>

            <div className="space-y-4 font-mono text-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-muted-foreground">Public Display:</span>
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  CONNECTED
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-muted-foreground">Display Layout:</span>
                <span className="text-white font-bold">
                  Preset 0{eventState.activeDisplayLayout || 1}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-muted-foreground">Evaluation Status:</span>
                <span className="text-[var(--color-apb-cyan)] font-bold">
                  {judgedSubmissionsCount} / {submissions.length} Judged
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Configured Rounds:</span>
                <span className="text-white font-bold">{rounds.length} Rounds</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Link href="/organizer/display">
              <APBButton variant="outline" className="w-full font-mono text-xs uppercase tracking-wider text-[var(--color-apb-cyan)] border-[var(--color-apb-cyan)]/30 hover:bg-[var(--color-apb-cyan)]/10">
                Manage Display Screen →
              </APBButton>
            </Link>
          </div>
        </APBCard>
      </div>

      {/* Large Numbers Metrics Grid (Sections 3 & 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <APBCard className="p-6 bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
            TEAMS
          </div>
          <div className="text-5xl font-mono font-black text-white">{teams.length}</div>
          <div className="text-xs font-mono text-muted-foreground mt-2">Registered battle teams</div>
        </APBCard>

        <APBCard className="p-6 bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
            CONNECTED
          </div>
          <div className="text-5xl font-mono font-black text-[var(--color-apb-cyan)]">
            {connectedTeamsCount} <span className="text-2xl font-normal text-muted-foreground">/ {teams.length}</span>
          </div>
          <div className="text-xs font-mono text-muted-foreground mt-2">{sessions.length} active workstation devices</div>
        </APBCard>

        <APBCard className="p-6 bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
            SUBMITTED
          </div>
          <div className="text-5xl font-mono font-black text-emerald-400">
            {submissions.length} <span className="text-2xl font-normal text-muted-foreground">/ {teams.length}</span>
          </div>
          <div className="text-xs font-mono text-muted-foreground mt-2">
            {teams.length > 0 ? `${Math.round((submissions.length / teams.length) * 100)}% submission rate` : "0%"}
          </div>
        </APBCard>
      </div>

      {/* Specialized Tab Quick Nav Cards (Section 1) */}
      <div className="space-y-4">
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground font-bold">
          OPERATIONAL CONTROL TABS
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/organizer/live" className="block group">
            <APBCard className="p-5 bg-[var(--color-apb-surface)] hover:border-[var(--color-apb-cyan)]/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-white font-mono font-bold uppercase text-sm">
                  <Flame className="w-4 h-4 text-[var(--color-apb-cyan)]" />
                  <span>Live Control</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
              </div>
              <p className="text-xs font-mono text-muted-foreground">
                Authoritative start, 5s countdown, pause/resume, +2 min / +5 min extensions, live submission stream.
              </p>
            </APBCard>
          </Link>

          <Link href="/organizer/rounds" className="block group">
            <APBCard className="p-5 bg-[var(--color-apb-surface)] hover:border-[var(--color-apb-cyan)]/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-white font-mono font-bold uppercase text-sm">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Rounds</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
              </div>
              <p className="text-xs font-mono text-muted-foreground">
                Template builder (Quiz / Progressive Constraint / Standard), edit challenge specs, preview participant workspace, delete.
              </p>
            </APBCard>
          </Link>

          <Link href="/organizer/teams" className="block group">
            <APBCard className="p-5 bg-[var(--color-apb-surface)] hover:border-[var(--color-apb-cyan)]/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-white font-mono font-bold uppercase text-sm">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Teams</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
              </div>
              <p className="text-xs font-mono text-muted-foreground">
                Team registration, ACCESS IDs (PINs) with one-click copy, Google Sheets registration URL, 4 test teams seed.
              </p>
            </APBCard>
          </Link>

          <Link href="/organizer/judging" className="block group">
            <APBCard className="p-5 bg-[var(--color-apb-surface)] hover:border-[var(--color-apb-cyan)]/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-white font-mono font-bold uppercase text-sm">
                  <Star className="w-4 h-4 text-purple-400" />
                  <span>Judging</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
              </div>
              <p className="text-xs font-mono text-muted-foreground">
                Judging progress tracker ({judgedSubmissionsCount} / {submissions.length}), team scores table, inspect & judge submissions.
              </p>
            </APBCard>
          </Link>

          <Link href="/organizer/display" className="block group">
            <APBCard className="p-5 bg-[var(--color-apb-surface)] hover:border-[var(--color-apb-cyan)]/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-white font-mono font-bold uppercase text-sm">
                  <Monitor className="w-4 h-4 text-emerald-400" />
                  <span>Display Control</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
              </div>
              <p className="text-xs font-mono text-muted-foreground">
                Control public /display screen: trigger Leaderboard, Live Round, Waiting, or switch between 10 display layout presets.
              </p>
            </APBCard>
          </Link>

          <Link href="/organizer/sessions" className="block group">
            <APBCard className="p-5 bg-[var(--color-apb-surface)] hover:border-[var(--color-apb-cyan)]/40 transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-white font-mono font-bold uppercase text-sm">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>Sessions</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors" />
              </div>
              <p className="text-xs font-mono text-muted-foreground">
                Workstation device management: {sessions.length} active sessions, 2-device limit enforcement, kill device/team, emergency reset.
              </p>
            </APBCard>
          </Link>
        </div>
      </div>
    </div>
  );
}
