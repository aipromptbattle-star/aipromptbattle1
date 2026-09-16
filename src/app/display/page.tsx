"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useEventState, useCurrentRound, finalizeRoundStart } from "@/lib/firebase/events";
import { auth } from "@/lib/firebase/config";
import { signInAnonymously } from "firebase/auth";
import { useAllSubmissions } from "@/lib/firebase/submissions";
import { useTeams } from "@/lib/firebase/teams";
import { compareSubmissionsDeterministically } from "@/lib/scoring";
import { 
  Clock, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  AlertCircle,
  Trophy,
  CheckCircle2,
  Radio
} from "lucide-react";

export default function PublicHostDisplay() {
  const { eventState, loading: eventLoading } = useEventState();
  const { currentRound, loading: roundLoading } = useCurrentRound(eventState?.currentRoundId || null);
  const { submissions } = useAllSubmissions("currentEvent", currentRound?.id || null);
  const { teams } = useTeams();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [constraintRevealActive, setConstraintRevealActive] = useState<number | null>(null);
  const lastRevealedStageRef = useRef<number>(1);

  // Background anonymous auth ensuring public Firestore read access without requiring participant login
  useEffect(() => {
    if (!auth.currentUser) {
      signInAnonymously(auth).catch((err) => {
        console.warn("Public display anonymous auth notice:", err.message);
      });
    }
  }, []);

  // Real-time authoritative clock ticker
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);

  // Online / Connection health tracking
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fullscreen keyboard shortcut 'F' & change listener
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;
        e.preventDefault();
        toggleFullscreen();
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [toggleFullscreen]);

  // Handle Authoritative 5-second countdown state transition
  const countdownEndsAt = currentRound?.countdownEndsAt || 0;
  const isStarting = currentRound?.status === "STARTING";
  const countdownRemainingMs = Math.max(0, countdownEndsAt - now);
  const countdownRemainingSecs = Math.ceil(countdownRemainingMs / 1000);

  useEffect(() => {
    if (isStarting && currentRound && countdownRemainingMs === 0) {
      finalizeRoundStart(currentRound.id);
    }
  }, [isStarting, currentRound, countdownRemainingMs]);

  // Round 2 Progressive Constraint timing & reveal
  const isProgressive = currentRound?.templateType === "PROGRESSIVE_CONSTRAINT" || currentRound?.roundNumber === 2;
  const elapsedSeconds = currentRound?.startedAt && currentRound?.status === "LIVE"
    ? Math.max(0, Math.floor((now - currentRound.startedAt) / 1000))
    : (currentRound?.pausedRemainingSeconds ? Math.max(0, (currentRound.durationSeconds || 1200) - currentRound.pausedRemainingSeconds) : 0);

  const currentStageNum = Math.min(5, Math.floor(elapsedSeconds / 240) + 1);
  const secondsIntoStage = elapsedSeconds % 240;
  const secondsUntilNextStage = currentStageNum < 5 ? 240 - secondsIntoStage : 0;

  // Trigger non-blocking constraint reveal banner at 4-minute boundaries
  useEffect(() => {
    if (isProgressive && currentRound?.status === "LIVE" && currentStageNum > 1 && currentStageNum !== lastRevealedStageRef.current) {
      lastRevealedStageRef.current = currentStageNum;
      setConstraintRevealActive(currentStageNum);
      const timer = setTimeout(() => {
        setConstraintRevealActive(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isProgressive, currentRound?.status, currentStageNum]);

  // Calculate Round remaining time
  let roundTimeLeft = 0;
  if (currentRound) {
    if (currentRound.status === "PAUSED" && currentRound.pausedRemainingSeconds != null) {
      roundTimeLeft = currentRound.pausedRemainingSeconds;
    } else if ((currentRound.status === "LIVE" || isStarting) && currentRound.endsAt) {
      roundTimeLeft = Math.max(0, Math.ceil((currentRound.endsAt - now) / 1000));
    } else if (currentRound.status === "READY" || currentRound.status === "DRAFT") {
      roundTimeLeft = currentRound.durationSeconds || 1200;
    }
  }

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Determine stage constraint text safely (omits any participant/judge private data)
  const getStageConstraint = () => {
    if (!currentRound) return null;
    if (isProgressive && currentRound.progressiveStages && currentRound.progressiveStages.length > 0) {
      const activeStage = currentRound.progressiveStages.find((s) => s.stageNumber === currentStageNum);
      if (activeStage) {
        return {
          title: activeStage.stageName || `Stage 0${currentStageNum}`,
          statement: activeStage.statement,
        };
      }
    }
    return {
      title: currentRound.challengeTitle || currentRound.title,
      statement: currentRound.challengeDescription || currentRound.description || "Challenge active. Awaiting team submissions.",
    };
  };

  const activeConstraint = getStageConstraint();

  // Selected display layout (1 to 10)
  const activeLayout = eventState?.activeDisplayLayout || 1;
  const displayOverride = eventState?.displayOverride || "AUTOMATIC";

  // Check if Leaderboard is explicitly triggered by organizer or if results are published
  const showLeaderboard = displayOverride === "LEADERBOARD" || (displayOverride === "AUTOMATIC" && currentRound?.resultsPublished);

  // Leaderboard scored teams
  const scoredSubmissions = [...submissions]
    .filter((s) => s.score !== undefined)
    .sort((a, b) => compareSubmissionsDeterministically(a, b));

  const getTeamDisplayName = (tId: string) => {
    const t = teams.find((item) => item.teamId === tId);
    return t ? t.displayName : tId;
  };

  if (eventLoading || roundLoading) {
    return (
      <div className="min-h-screen bg-[#050608] text-white flex flex-col items-center justify-center p-8 font-mono">
        <div className="w-12 h-12 border-2 border-[var(--color-apb-cyan)] border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-xl tracking-widest uppercase text-white/80">Connecting to Battle Control...</div>
      </div>
    );
  }

  // Layout-specific styling accents (10 Layouts)
  const layoutClassNames = [
    "from-[#050608] via-[#080b12] to-[#050608]", // 01 Esports Arena
    "from-slate-950 via-zinc-950 to-black", // 02 Clean Podium
    "from-purple-950/20 via-black to-slate-950", // 03 Constraint Focus
    "from-cyan-950/20 via-black to-slate-950", // 04 Telemetry Grid
    "from-[#0a0518] via-black to-[#051118]", // 05 Cyber Neon
    "from-black via-[#060c18] to-black", // 06 Auditorium Wide
    "from-zinc-900 via-neutral-950 to-black", // 07 Classroom Projector
    "from-[#06070a] via-black to-[#06070a]", // 08 Compact Stage
    "from-[#040810] via-black to-[#080410]", // 09 Stream Broadcast
    "from-black via-black to-black", // 10 Midnight Monolith
  ];
  const bgGradient = layoutClassNames[(activeLayout - 1) % layoutClassNames.length];

  return (
    <div className={`min-h-screen bg-gradient-to-b ${bgGradient} text-white flex flex-col justify-between select-none relative overflow-hidden font-sans`}>
      {/* Background Ambience Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,240,255,0.08)_0%,_transparent_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(168,85,247,0.06)_0%,_transparent_70%)] pointer-events-none" />

      {/* TOP BAR */}
      <header className="relative z-10 w-full px-8 py-5 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-3 h-10 bg-[var(--color-apb-cyan)] rounded-sm shadow-[0_0_15px_rgba(0,240,255,0.8)]" />
          <div>
            <h1 className="text-2xl md:text-3xl font-mono font-black tracking-widest text-white uppercase flex items-center gap-3">
              <span>AI PROMPT BATTLE</span>
            </h1>
            <p className="text-xs md:text-sm font-mono tracking-widest text-[var(--color-apb-cyan)] uppercase opacity-90">
              THINK. PROMPT. CREATE.
            </p>
          </div>
        </div>

        {/* Telemetry & Fullscreen */}
        <div className="flex items-center gap-4 sm:gap-6 font-mono text-xs">
          {/* Active Layout Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/5 border border-white/10 text-white/60">
            <Radio className="w-3 h-3 text-[var(--color-apb-cyan)]" />
            <span>LAYOUT {String(activeLayout).padStart(2, "0")}</span>
          </div>

          {/* Connection Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            {isOnline ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-emerald-400 font-bold tracking-wider uppercase">LIVE CONNECTION</span>
              </>
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 animate-pulse" />
                </span>
                <span className="text-amber-400 font-bold tracking-wider uppercase">RECONNECTING...</span>
              </>
            )}
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline uppercase tracking-wider">{isFullscreen ? "EXIT FULLSCREEN" : "FULLSCREEN"}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60">F</span>
          </button>
        </div>
      </header>

      {/* MAIN PRESENTATION ARENA */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center max-w-7xl mx-auto w-full">

        {/* OVERRIDE: SHOW LEADERBOARD */}
        {showLeaderboard && (
          <div className="w-full max-w-5xl flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-2">
              <div className="px-5 py-2 rounded-full border border-yellow-500/40 bg-yellow-500/10 text-yellow-300 font-mono text-sm tracking-widest uppercase font-bold inline-flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                OFFICIAL COMPETITION STANDINGS
              </div>
              <h2 className="text-4xl sm:text-6xl font-mono font-black uppercase tracking-wider text-white">
                Round {currentRound?.roundNumber || 1} Leaderboard
              </h2>
            </div>

            {scoredSubmissions.length === 0 ? (
              <div className="p-12 rounded-3xl bg-black/40 border border-white/10 text-xl font-mono text-white/60 uppercase">
                Scores being finalized by the official judging panel...
              </div>
            ) : (
              <div className="w-full space-y-3">
                {scoredSubmissions.slice(0, 8).map((sub, i) => {
                  const medals = ["🥇", "🥈", "🥉"];
                  const medal = medals[i] ?? `#${i + 1}`;
                  const isQualified = currentRound?.qualifiedTeams?.includes(sub.teamId);

                  return (
                    <div
                      key={sub.id || sub.teamId}
                      className="flex items-center justify-between p-5 rounded-2xl bg-black/60 border border-white/10 hover:border-[var(--color-apb-cyan)]/40 transition-all font-mono"
                    >
                      <div className="flex items-center gap-4 sm:gap-6">
                        <span className="text-2xl sm:text-3xl w-10 text-center">{medal}</span>
                        <div className="text-left">
                          <div className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                            <span>{getTeamDisplayName(sub.teamId)}</span>
                            {isQualified && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs uppercase font-bold">
                                QUALIFIED
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground uppercase">{sub.teamId}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-3xl sm:text-4xl font-black text-[var(--color-apb-cyan)]">
                          {sub.score}
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase">FINAL SCORE / 100</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* NORMAL STATE 1: AUTHORITATIVE 5-SECOND COUNTDOWN */}
        {!showLeaderboard && isStarting && (
          <div className="flex flex-col items-center justify-center gap-6 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-2 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 font-mono text-sm tracking-widest uppercase font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              ROUND STARTING
            </div>

            <div className="font-mono text-[14rem] sm:text-[18rem] md:text-[22rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-500 drop-shadow-[0_0_60px_rgba(245,158,11,0.5)]">
              {countdownRemainingSecs > 0 ? countdownRemainingSecs : "GO!"}
            </div>

            <div className="text-2xl sm:text-3xl font-mono uppercase tracking-widest text-white/80">
              Round {currentRound?.roundNumber}: {currentRound?.title}
            </div>
          </div>
        )}

        {/* NORMAL STATE 2: WAITING / READY */}
        {!showLeaderboard && !isStarting && (displayOverride === "WAITING" || !currentRound || currentRound.status === "READY" || currentRound.status === "DRAFT") && (
          <div className="flex flex-col items-center justify-center gap-6 max-w-4xl">
            <div className="px-5 py-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 text-[var(--color-apb-cyan)] font-mono text-sm tracking-widest uppercase font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 animate-pulse" />
              NEXT ROUND
            </div>

            <h2 className="text-5xl sm:text-7xl md:text-8xl font-mono font-black uppercase tracking-wider text-white">
              {currentRound ? `ROUND 0${currentRound.roundNumber}` : "ROUND 01"}
            </h2>

            <div className="text-3xl sm:text-4xl font-mono uppercase tracking-widest text-[var(--color-apb-cyan)] font-bold">
              {currentRound?.title || "STANDBY FOR INSTRUCTIONS"}
            </div>

            <p className="text-xl sm:text-2xl text-white/60 font-mono max-w-2xl mt-4 uppercase tracking-wider">
              WAITING FOR ORGANIZER
            </p>

            <div className="mt-8 flex items-center gap-3 px-6 py-3 rounded-2xl bg-black/40 border border-white/10 font-mono text-base text-white/80">
              <span className="text-muted-foreground">Standard Round Duration:</span>
              <span className="font-bold text-white">
                {currentRound ? Math.floor(currentRound.durationSeconds / 60) : 20} MINUTES
              </span>
            </div>
          </div>
        )}

        {/* NORMAL STATE 3: PAUSED */}
        {!showLeaderboard && !isStarting && currentRound?.status === "PAUSED" && (
          <div className="flex flex-col items-center justify-center gap-6 max-w-4xl animate-pulse">
            <div className="px-6 py-2 rounded-full border border-amber-500/50 bg-amber-500/20 text-amber-300 font-mono text-base tracking-widest uppercase font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              ROUND PAUSED
            </div>

            <div className="text-4xl sm:text-6xl font-mono font-bold uppercase tracking-wider text-white">
              Round 0{currentRound.roundNumber}: {currentRound.title}
            </div>

            <div className="my-6">
              <div className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-2">TIME REMAINING</div>
              <div className="font-mono text-8xl sm:text-9xl md:text-[11rem] font-bold tracking-tight text-amber-400 drop-shadow-[0_0_40px_rgba(245,158,11,0.4)]">
                {formatTimer(roundTimeLeft)}
              </div>
            </div>

            <div className="text-2xl font-mono uppercase tracking-widest text-white/70">
              WAIT FOR ORGANIZER
            </div>
          </div>
        )}

        {/* NORMAL STATE 4: CLOSED / ENDED */}
        {!showLeaderboard && !isStarting && (currentRound?.status === "CLOSED" || currentRound?.status === "ENDED" || currentRound?.status === "JUDGING" || currentRound?.status === "RESULTS") && (
          <div className="flex flex-col items-center justify-center gap-6 max-w-4xl">
            <div className="px-6 py-2 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-300 font-mono text-sm tracking-widest uppercase font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
              ROUND COMPLETE
            </div>

            <h2 className="text-6xl sm:text-8xl font-mono font-black uppercase tracking-wider text-white">
              ROUND 0{currentRound.roundNumber}
            </h2>

            <div className="text-2xl sm:text-4xl font-mono uppercase tracking-widest text-[var(--color-apb-cyan)] font-bold">
              {currentRound.title}
            </div>

            <p className="text-2xl text-white/70 font-mono uppercase tracking-widest mt-4">
              WAITING FOR NEXT ROUND
            </p>
          </div>
        )}

        {/* NORMAL STATE 5: LIVE BATTLE SCREEN */}
        {!showLeaderboard && !isStarting && currentRound?.status === "LIVE" && (
          <div className="w-full flex flex-col items-center justify-center gap-6 max-w-6xl">
            
            {/* Round & Stage Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <span className="px-4 py-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-mono text-xs sm:text-sm tracking-widest uppercase font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>

              <span className="text-sm sm:text-base font-mono uppercase tracking-widest text-white/70 font-bold">
                ROUND 0{currentRound.roundNumber} • {currentRound.title}
              </span>

              {isProgressive && (
                <span className="px-4 py-1.5 rounded-full border border-[var(--color-apb-purple)]/40 bg-[var(--color-apb-purple)]/15 text-purple-300 font-mono text-xs sm:text-sm tracking-widest uppercase font-bold">
                  STAGE 0{currentStageNum} / 05
                </span>
              )}
            </div>

            {/* PROGRESSIVE CONSTRAINT REVEAL BANNER (Shows upon stage transition) */}
            {constraintRevealActive && (
              <div className="w-full max-w-4xl p-6 rounded-3xl bg-gradient-to-r from-purple-950/90 via-black/90 to-purple-950/90 border-2 border-purple-500/60 shadow-[0_0_50px_rgba(168,85,247,0.4)] animate-in zoom-in-95 duration-300">
                <div className="text-xs font-mono tracking-widest text-purple-300 uppercase font-black mb-1 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
                  NEW CONSTRAINT UNLOCKED
                </div>
                <div className="text-2xl sm:text-4xl font-mono font-bold text-white mt-1">
                  CONSTRAINT 0{currentStageNum - 1}
                </div>
                <div className="text-lg sm:text-2xl font-mono text-purple-200 mt-2 font-semibold">
                  {activeConstraint?.statement}
                </div>
              </div>
            )}

            {/* PUBLIC CONSTRAINT / STATEMENT CARD */}
            {activeConstraint && !constraintRevealActive && (
              <div className="w-full max-w-4xl p-8 sm:p-10 rounded-3xl bg-black/60 border border-white/15 backdrop-blur-md shadow-2xl space-y-4">
                <div className="text-xs sm:text-sm font-mono uppercase tracking-widest text-[var(--color-apb-cyan)] font-bold">
                  {isProgressive ? (currentStageNum === 1 ? "INITIAL STATEMENT" : `CONSTRAINT 0${currentStageNum - 1}`) : "MISSION OBJECTIVE"}
                </div>
                <div className="text-xl sm:text-3xl md:text-4xl font-mono font-bold text-white tracking-wide leading-relaxed">
                  {activeConstraint.statement}
                </div>
              </div>
            )}

            {/* MASSIVE AUTHORITATIVE TIMER */}
            <div className="mt-4">
              <div className="text-xs sm:text-sm font-mono uppercase tracking-widest text-muted-foreground mb-2">
                TIME REMAINING
              </div>
              <div className={`font-mono text-8xl sm:text-9xl md:text-[12rem] font-black tracking-tight leading-none ${
                roundTimeLeft <= 60 
                  ? "text-red-500 animate-pulse drop-shadow-[0_0_50px_rgba(239,68,68,0.6)]" 
                  : roundTimeLeft <= 180 
                  ? "text-amber-400 drop-shadow-[0_0_40px_rgba(245,158,11,0.4)]" 
                  : "text-white drop-shadow-[0_0_40px_rgba(0,240,255,0.3)]"
              }`}>
                {formatTimer(roundTimeLeft)}
              </div>
            </div>

            {/* PROGRESSIVE CONSTRAINT TIMELINE / SUB-TELEMETRY */}
            {isProgressive && (
              <div className="flex items-center gap-4 font-mono text-sm text-white/70 mt-2">
                {currentStageNum < 5 ? (
                  <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-muted-foreground uppercase text-xs mr-2">NEXT CONSTRAINT:</span>
                    <span className="text-[var(--color-apb-cyan)] font-bold">
                      IN {formatTimer(secondsUntilNextStage)}
                    </span>
                  </div>
                ) : (
                  <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold uppercase text-xs">
                    FINAL STAGE ACTIVE
                  </div>
                )}
              </div>
            )}

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="relative z-10 w-full px-8 py-5 border-t border-white/10 bg-black/40 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-apb-cyan)]" />
          <span className="text-white/80 font-bold uppercase tracking-widest">SJBIT • BENGALURU</span>
        </div>
        <div className="tracking-wider uppercase text-[11px] opacity-70">
          OFFICIAL LIVE CONDUCTION ARENA • PRESENTATION SCREEN
        </div>
      </footer>
    </div>
  );
}
