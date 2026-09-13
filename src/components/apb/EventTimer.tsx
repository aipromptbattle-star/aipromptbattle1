"use client";

import { useEffect, useState } from "react";
import { Round } from "@/lib/firebase/schema";

export function EventTimer({ round, className = "" }: { round: Round | null, className?: string }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setIsClient(true);
    });
  }, []);

  useEffect(() => {
    if (!round) {
      queueMicrotask(() => {
        setTimeLeft(0);
      });
      return;
    }

    if (round.status === "PAUSED" && round.pausedRemainingSeconds != null) {
      queueMicrotask(() => {
        setTimeLeft(round.pausedRemainingSeconds || 0);
      });
      return;
    }

    if (round.status === "LIVE" && round.endsAt) {
      // Tick every second
      const updateTimer = () => {
        const remainingMs = Math.max(0, round.endsAt! - Date.now());
        setTimeLeft(Math.floor(remainingMs / 1000));
      };

      updateTimer();
      const intervalId = setInterval(updateTimer, 1000);
      return () => clearInterval(intervalId);
    }

    if (round.status === "CLOSED" || round.status === "READY") {
      queueMicrotask(() => {
        setTimeLeft(round.status === "READY" ? round.durationSeconds : 0);
      });
    }
  }, [round]);

  if (!isClient || !round) return <div className={`font-mono text-white ${className}`}>00:00</div>;

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");
  
  let label = "";
  if (round.status === "PAUSED") label = "PAUSED";
  else if (round.status === "CLOSED") label = "CLOSED";
  else if (round.status === "READY") label = "READY";

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {label && <div className="text-xs font-bold text-[var(--color-apb-cyan)] uppercase tracking-widest mb-2">{label}</div>}
      <div className={`font-mono text-6xl md:text-8xl font-bold tracking-tighter ${timeLeft === 0 && round.status === "LIVE" ? "text-red-500" : "text-white"} drop-shadow-[0_0_15px_rgba(0,240,255,0.3)]`}>
        {minutes}:{seconds}
      </div>
    </div>
  );
}
