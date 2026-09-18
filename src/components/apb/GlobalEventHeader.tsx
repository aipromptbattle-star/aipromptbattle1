
"use client";

import React, { useState, useEffect } from "react";
import { useEventState, useCurrentRound } from "@/lib/firebase/events";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { EventTimer } from "./EventTimer";
import { StatusBadge } from "./StatusBadge";

export function GlobalEventHeader() {
  const { eventState } = useEventState();
  const { currentRound } = useCurrentRound(eventState?.currentRoundId || null);

  const [onlineCount, setOnlineCount] = useState(0);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [workingCount, setWorkingCount] = useState(0);

  useEffect(() => {
    // Track sessions
    const unsubscribeSessions = onSnapshot(collection(db, "sessions"), (snap) => {
      setOnlineCount(snap.size);
    });

    // Track active teamRoundState if round is LIVE
    if (!eventState?.currentRoundId || !currentRound || currentRound.status === "COMPLETED") {
      setSubmittedCount(0);
      setWorkingCount(0);
      return () => unsubscribeSessions();
    }

    const trsQuery = query(
      collection(db, `events/currentEvent/teamsRoundState`),
      where("roundId", "==", eventState.currentRoundId)
    );

    const unsubscribeTrs = onSnapshot(trsQuery, (snap) => {
      let sub = 0;
      let work = 0;
      snap.docs.forEach(doc => {
        const status = doc.data().status;
        if (status === "SUBMITTED" || status === "LOCKED") sub++;
        else if (status === "IN_PROGRESS") work++;
      });
      setSubmittedCount(sub);
      setWorkingCount(work);
    });

    return () => {
      unsubscribeSessions();
      unsubscribeTrs();
    };
  }, [eventState?.currentRoundId, currentRound?.status]);

  if (!eventState) return null;

  return (
    <div className="bg-[var(--color-apb-surface)] border-b border-[var(--color-apb-surface-border)] px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2 font-mono text-xs uppercase tracking-widest">
      <div className="flex flex-wrap items-center gap-4">
        <span className="font-bold text-white tracking-widest hidden lg:block">VIGYANTRA × AI</span>
        
        <StatusBadge 
          status={eventState.status} 
          variant={eventState.status === "LIVE" ? "live" : "neutral"}
          className="animate-none"
        />

        {currentRound && (
          <div className="flex items-center gap-3">
            <span className="text-[var(--color-apb-cyan)] font-bold">
              ROUND {currentRound.roundNumber.toString().padStart(2, "0")}
            </span>
            {currentRound.status === "LIVE" && currentRound.templateType === "PROGRESSIVE_CONSTRAINT" && (
              <span className="text-amber-400">STAGE ACTIVE</span>
            )}
            
            {(currentRound.status === "LIVE" || currentRound.status === "PAUSED") && (
              <EventTimer 
                round={currentRound} 
                className="text-[var(--color-apb-cyan)] font-bold"
              />
            )}
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap items-center gap-4 text-slate-400">
        <div className="flex items-center gap-1">
          <span className="text-white font-bold">{onlineCount}</span> ONLINE
        </div>
        {currentRound && (currentRound.status === "LIVE" || currentRound.status === "PAUSED") && (
          <>
            <div className="flex items-center gap-1">
              <span className="text-green-400 font-bold">{submittedCount}</span> SUBMITTED
            </div>
            <div className="flex items-center gap-1">
              <span className="text-amber-400 font-bold">{workingCount}</span> WORKING
            </div>
          </>
        )}
      </div>
    </div>
  );
}

