"use client";

import React, { useEffect, useState } from "react";
import { Round } from "@/lib/firebase/schema";
import { Pause, Lock, Clock, AlertTriangle } from "lucide-react";

interface CircularTimerProps {
  round: Round | null;
  size?: number;
  strokeWidth?: number;
}

export function CircularTimer({
  round,
  size = 64,
  strokeWidth = 4,
}: CircularTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setIsClient(true);
    });
  }, []);

  useEffect(() => {
    if (!round) {
      queueMicrotask(() => setTimeLeft(0));
      return;
    }

    if (round.status === "PAUSED" && round.pausedRemainingSeconds != null) {
      queueMicrotask(() => setTimeLeft(round.pausedRemainingSeconds || 0));
      return;
    }

    if (round.status === "LIVE" && round.endsAt) {
      const updateTimer = () => {
        const remainingMs = Math.max(0, round.endsAt! - Date.now());
        setTimeLeft(Math.floor(remainingMs / 1000));
      };

      updateTimer();
      const intervalId = setInterval(updateTimer, 1000);
      return () => clearInterval(intervalId);
    }

    if (round.status === "CLOSED") {
      queueMicrotask(() => setTimeLeft(0));
      return;
    }

    if (round.status === "READY") {
      queueMicrotask(() => setTimeLeft(round.durationSeconds || 0));
      return;
    }
  }, [round]);

  if (!isClient || !round) {
    return (
      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-black/40 border border-[var(--color-apb-surface-border)] font-mono text-xs">
        <span className="text-muted-foreground">00:00</span>
      </div>
    );
  }

  const totalDuration = round.durationSeconds || 900;
  const progress = totalDuration > 0 ? Math.min(1, Math.max(0, timeLeft / totalDuration)) : 0;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progress * circumference;

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  const isLowTime = round.status === "LIVE" && timeLeft > 0 && timeLeft <= 120;
  const isCriticalTime = round.status === "LIVE" && timeLeft > 0 && timeLeft <= 60;
  const isZero = round.status === "LIVE" && timeLeft === 0;

  let ringColor = "var(--color-apb-cyan)";
  if (isCriticalTime || isZero) {
    ringColor = "#ef4444"; // red-500
  } else if (isLowTime) {
    ringColor = "#f59e0b"; // amber-500
  } else if (round.status === "PAUSED") {
    ringColor = "#eab308"; // yellow-500
  } else if (round.status === "CLOSED") {
    ringColor = "#64748b"; // slate-500
  }

  return (
    <div
      className={`relative flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-black/60 border transition-all select-none ${
        isCriticalTime || isZero
          ? "border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse"
          : isLowTime
          ? "border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
          : round.status === "PAUSED"
          ? "border-amber-500/40 bg-amber-950/20"
          : "border-[var(--color-apb-surface-border)] shadow-sm"
      }`}
      title={`Authoritative Event Timer - Status: ${round.status}`}
    >
      {/* Circular Progress Ring */}
      <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress fill */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        {/* Center state icon / time readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {round.status === "PAUSED" ? (
            <Pause className="w-4 h-4 text-amber-400 animate-pulse" />
          ) : round.status === "CLOSED" ? (
            <Lock className="w-3.5 h-3.5 text-slate-400" />
          ) : isCriticalTime ? (
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-bounce" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-[var(--color-apb-cyan)]" />
          )}
        </div>
      </div>

      {/* Numerical Time & State Label */}
      <div className="flex flex-col items-start pr-1">
        <span
          className={`font-mono text-base sm:text-lg font-bold tracking-wider leading-none ${
            isCriticalTime || isZero
              ? "text-red-400"
              : isLowTime
              ? "text-amber-400"
              : round.status === "PAUSED"
              ? "text-yellow-300"
              : "text-white"
          }`}
        >
          {minutes}:{seconds}
        </span>

        <span
          className={`text-[10px] font-mono uppercase font-bold tracking-widest mt-1 leading-none ${
            round.status === "LIVE"
              ? isCriticalTime || isZero
                ? "text-red-400 animate-pulse"
                : "text-[var(--color-apb-cyan)]"
              : round.status === "PAUSED"
              ? "text-amber-400"
              : "text-slate-400"
          }`}
        >
          {round.status === "LIVE"
            ? isZero
              ? "TIME UP"
              : isLowTime
              ? "FINAL MINS"
              : "LIVE"
            : round.status}
        </span>
      </div>
    </div>
  );
}
