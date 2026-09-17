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

  const showLeaderboard = displayOverride === "LEADERBOARD" || (displayOverride === "AUTOMATIC" && currentRound?.resultsPublished);
  const showCustom = displayOverride === "IMAGE" || displayOverride === "TEXT";

  // Leaderboard scored teams
  const scoredSubmissions = [...submissions]
    .filter((s) => s.score !== undefined)
    .sort((a, b) => compareSubmissionsDeterministically(a, b));

  const getTeamDisplayName = (tId: string) => {
    const t = teams.find((item) => item.teamId === tId);
    return t ? t.displayName : tId;
  };

  // Touch swipe listener for subtle immersive interaction
  const touchStartYRef = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0]?.clientY || null;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current !== null) {
      const touchEndY = e.changedTouches[0]?.clientY || 0;
      const diff = touchEndY - touchStartYRef.current;
      // If pulled downward from top (> 80px), toggle fullscreen
      if (diff > 80 && window.scrollY <= 10) {
        toggleFullscreen();
      }
      touchStartYRef.current = null;
    }
  };

  if (eventLoading || roundLoading) {
    return (
      <div className="min-h-screen bg-[#05070B] text-white flex flex-col items-center justify-center p-8 font-mono">
        <div className="w-12 h-12 border-2 border-[var(--color-apb-cyan)] border-t-transparent rounded-full animate-spin mb-4" />
        <div className="text-xl tracking-widest uppercase text-white/80">Connecting to Battle Control...</div>
      </div>
    );
  }

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen bg-[#05070B] text-white flex flex-col justify-between select-none relative overflow-hidden font-sans"
    >
      {/* Background Ambience Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,240,255,0.06)_0%,_transparent_65%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(168,85,247,0.05)_0%,_transparent_65%)] pointer-events-none" />

      {/* TOP BAR — ONLY FULLSCREEN CONTROL */}
      <header className="relative z-20 w-full px-6 py-4 flex items-center justify-end">
        <button
          onClick={toggleFullscreen}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer font-mono text-xs uppercase tracking-wider shadow-lg backdrop-blur-sm"
          title="Toggle Fullscreen (or press F)"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          <span>{isFullscreen ? "EXIT FULLSCREEN" : "FULLSCREEN"}</span>
        </button>
      </header>

      {/* MAIN PRESENTATION ARENA */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-4 text-center max-w-6xl mx-auto w-full h-full">

        {/* CUSTOM IMAGE MODE */}
        {displayOverride === "IMAGE" && (
          <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
            {eventState?.displayImageUrl ? (
              <img 
                src={eventState.displayImageUrl} 
                alt="Display Custom" 
                className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-2xl" 
              />
            ) : (
              <div className="text-muted-foreground font-mono uppercase tracking-widest">NO IMAGE PROVIDED</div>
            )}
          </div>
        )}

        {/* CUSTOM TEXT / RULES MODE */}
        {displayOverride === "TEXT" && (
          <div className="w-full max-w-5xl flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 p-8 sm:p-12 rounded-3xl bg-black/60 border border-white/10 backdrop-blur-md shadow-2xl">
            {(eventState?.displayHeading || eventState?.displaySubheading || eventState?.displayBody) ? (
              <div className="w-full space-y-6 overflow-y-auto max-h-[75vh]">
                {eventState.displayHeading && (
                  <h1 className="text-5xl sm:text-7xl font-mono font-black uppercase text-white tracking-wider text-center drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                    {eventState.displayHeading}
                  </h1>
                )}
                {eventState.displaySubheading && (
                  <h2 className="text-2xl sm:text-3xl font-mono uppercase text-[var(--color-apb-cyan)] tracking-widest text-center font-bold">
                    {eventState.displaySubheading}
                  </h2>
                )}
                {eventState.displayBody && (
                  <div className="text-xl sm:text-2xl md:text-3xl font-mono text-white/90 tracking-wide leading-relaxed text-left whitespace-pre-wrap mt-8 pt-6 border-t border-white/10">
                    {eventState.displayBody}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground font-mono uppercase tracking-widest">NO TEXT PROVIDED</div>
            )}
          </div>
        )}

        {/* 1. OVERRIDE: SHOW LEADERBOARD */}
        {showLeaderboard && !showCustom && (
          <div className="w-full max-w-4xl flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="space-y-1">
              <div className="px-5 py-1.5 rounded-full border border-yellow-500/40 bg-yellow-500/10 text-yellow-300 font-mono text-xs tracking-widest uppercase font-bold inline-flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                LEADERBOARD
              </div>
              <h2 className="text-3xl sm:text-5xl font-mono font-black uppercase tracking-wider text-white">
                Round 0{currentRound?.roundNumber || 1} Standings
              </h2>
            </div>

            {scoredSubmissions.length === 0 ? (
              <div className="p-12 rounded-3xl bg-black/40 border border-white/10 text-lg font-mono text-white/60 uppercase">
                Scores being finalized by the judging panel...
              </div>
            ) : (
              <div className="w-full space-y-2.5">
                {scoredSubmissions.slice(0, 8).map((sub, i) => {
                  const medals = ["🥇", "🥈", "🥉"];
                  const medal = medals[i] ?? `#${i + 1}`;
                  const isQualified = currentRound?.qualifiedTeams?.includes(sub.teamId);

                  return (
                    <div
                      key={sub.id || sub.teamId}
                      className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-black/60 border border-white/10 hover:border-[var(--color-apb-cyan)]/40 transition-all font-mono"
                    >
                      <div className="flex items-center gap-4 sm:gap-6">
                        <span className="text-2xl sm:text-3xl w-10 text-center">{medal}</span>
                        <div className="text-left">
                          <div className="text-lg sm:text-2xl font-bold text-white flex items-center gap-3">
                            <span>{getTeamDisplayName(sub.teamId)}</span>
                            {isQualified && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] uppercase font-bold">
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
                        <div className="text-[10px] text-muted-foreground uppercase">SCORE / 100</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 2. AUTHORITATIVE COUNTDOWN */}
        {!showLeaderboard && !showCustom && isStarting && (
          <div className="flex flex-col items-center justify-center gap-4 animate-in zoom-in-95 duration-200">
            <div className="text-xl sm:text-2xl font-mono uppercase tracking-widest text-white/80 font-bold">
              ROUND 0{currentRound?.roundNumber}
            </div>

            <div className="px-6 py-2 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 font-mono text-sm tracking-widest uppercase font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              STARTING IN
            </div>

            <div className="font-mono text-[13rem] sm:text-[18rem] md:text-[22rem] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-500 drop-shadow-[0_0_60px_rgba(245,158,11,0.5)] my-2">
              {countdownRemainingSecs > 0 ? countdownRemainingSecs : "GO"}
            </div>

            <div className="text-lg sm:text-xl font-mono uppercase tracking-widest text-[var(--color-apb-cyan)]">
              {currentRound?.title}
            </div>
          </div>
        )}

        {/* 3. WAITING SCREEN */}
        {!showLeaderboard && !showCustom && !isStarting && (displayOverride === "WAITING" || !currentRound || currentRound.status === "READY" || currentRound.status === "DRAFT") && (
          <div className="flex flex-col items-center justify-center gap-6 max-w-3xl">
            <div className="px-6 py-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 text-[var(--color-apb-cyan)] font-mono text-sm tracking-widest uppercase font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 animate-pulse" />
              READY
            </div>

            <div className="text-3xl sm:text-5xl font-mono uppercase tracking-widest text-white/90 font-black">
              WAITING FOR START
            </div>

            <div className="pt-2">
              <div className="text-4xl sm:text-6xl font-mono font-black uppercase tracking-wider text-white">
                {currentRound ? `ROUND 0${currentRound.roundNumber}` : "ROUND 01"}
              </div>
              <div className="text-2xl sm:text-3xl font-mono uppercase tracking-widest text-[var(--color-apb-cyan)] font-bold mt-2">
                {currentRound?.title || "QUIZ"}
              </div>
            </div>
          </div>
        )}

        {/* 4. PAUSED */}
        {!showLeaderboard && !showCustom && !isStarting && currentRound?.status === "PAUSED" && (
          <div className="flex flex-col items-center justify-center gap-5 max-w-4xl animate-pulse">
            <div className="px-6 py-2 rounded-full border border-amber-500/50 bg-amber-500/20 text-amber-300 font-mono text-base tracking-widest uppercase font-bold flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              ROUND PAUSED
            </div>

            <div className="my-2">
              <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">TIME REMAINING</div>
              <div className="font-mono text-8xl sm:text-9xl md:text-[11rem] font-bold tracking-tight text-amber-400 drop-shadow-[0_0_40px_rgba(245,158,11,0.4)] leading-none">
                {formatTimer(roundTimeLeft)}
              </div>
            </div>

            <div className="pt-2">
              <div className="text-3xl sm:text-4xl font-mono font-bold uppercase tracking-wider text-white">
                ROUND 0{currentRound.roundNumber}
              </div>
              <div className="text-xl sm:text-2xl font-mono uppercase tracking-widest text-white/70 mt-1">
                {currentRound.title}
              </div>
            </div>
          </div>
        )}

        {/* 5. ROUND COMPLETE */}
        {!showLeaderboard && !showCustom && !isStarting && (currentRound?.status === "CLOSED" || currentRound?.status === "ENDED" || currentRound?.status === "JUDGING" || currentRound?.status === "RESULTS") && (
          <div className="flex flex-col items-center justify-center gap-5 max-w-3xl">
            <div className="px-6 py-2 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-300 font-mono text-sm tracking-widest uppercase font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
              ROUND COMPLETE
            </div>

            <h2 className="text-5xl sm:text-7xl font-mono font-black uppercase tracking-wider text-white">
              ROUND 0{currentRound.roundNumber}
            </h2>

            <p className="text-xl sm:text-2xl text-white/70 font-mono uppercase tracking-widest mt-2">
              WAITING FOR NEXT ROUND
            </p>
          </div>
        )}

        {/* 6. LIVE ROUND (TIMER IS DOMINANT) */}
        {!showLeaderboard && !showCustom && !isStarting && currentRound?.status === "LIVE" && (
          <div className="w-full flex flex-col items-center justify-center gap-6 max-w-5xl">
            
            {/* DOMINANT HERO TIMER */}
            <div className="flex flex-col items-center">
              <div className="text-xs sm:text-sm font-mono uppercase tracking-widest text-white/60 mb-2 font-bold">
                TIME REMAINING
              </div>
              <div className={`font-mono text-8xl sm:text-9xl md:text-[13rem] font-black tracking-tight leading-none ${
                roundTimeLeft <= 60 
                  ? "text-red-500 animate-pulse drop-shadow-[0_0_50px_rgba(239,68,68,0.7)]" 
                  : roundTimeLeft <= 180 
                  ? "text-amber-400 drop-shadow-[0_0_40px_rgba(245,158,11,0.5)]" 
                  : "text-white drop-shadow-[0_0_50px_rgba(0,240,255,0.4)]"
              }`}>
                {formatTimer(roundTimeLeft)}
              </div>
            </div>

            {/* ROUND NAME & STAGE (Positioned below dominant timer) */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-2xl sm:text-3xl md:text-4xl font-mono font-black uppercase tracking-wider text-white">
                ROUND 0{currentRound.roundNumber}
              </div>
              <div className="text-lg sm:text-xl font-mono uppercase tracking-widest text-[var(--color-apb-cyan)] font-bold">
                {currentRound.title}
              </div>

              {isProgressive && (
                <div className="mt-1 px-4 py-1.5 rounded-full border border-purple-500/40 bg-purple-500/15 text-purple-300 font-mono text-xs sm:text-sm tracking-widest uppercase font-bold">
                  STAGE 0{currentStageNum} / 05
                </div>
              )}
            </div>

            {/* PROGRESSIVE CONSTRAINT REVEAL BANNER (Shows upon stage transition) */}
            {constraintRevealActive && (
              <div className="w-full max-w-3xl p-6 rounded-2xl bg-gradient-to-r from-purple-950/90 via-black/95 to-purple-950/90 border-2 border-purple-500/60 shadow-[0_0_50px_rgba(168,85,247,0.4)] animate-in zoom-in-95 duration-300">
                <div className="text-xs font-mono tracking-widest text-purple-300 uppercase font-black mb-1 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
                  NEW CONSTRAINT UNLOCKED
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-bold text-white mt-1">
                  CONSTRAINT 0{currentStageNum - 1}
                </div>
                <div className="text-base sm:text-xl font-mono text-purple-200 mt-2 font-semibold">
                  {activeConstraint?.statement}
                </div>
              </div>
            )}

            {/* PROGRESSIVE CONSTRAINT STATEMENT (Only for progressive rounds) */}
            {isProgressive && activeConstraint && !constraintRevealActive && activeConstraint.statement && (
              <div className="w-full max-w-3xl p-6 sm:p-8 rounded-2xl bg-black/60 border border-white/15 backdrop-blur-md shadow-2xl space-y-2">
                <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-apb-cyan)] font-bold">
                  {currentStageNum === 1 ? "INITIAL STATEMENT" : `CONSTRAINT 0${currentStageNum - 1}`}
                </div>
                <div className="text-lg sm:text-2xl font-mono font-bold text-white tracking-wide leading-relaxed">
                  {activeConstraint.statement}
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Subtle bottom buffer */}
      <div className="h-6" />
    </div>
  );
}
