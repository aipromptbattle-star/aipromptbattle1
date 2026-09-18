
"use client";

import React, { useEffect, useState } from "react";
import { ParticipantScreenMode, ParticipantScreenState } from "@/lib/firebase/schema";
import { APBCard } from "./APBCard";
import { Lock, AlertTriangle, Clock, Info, CheckCircle2, ChevronRight, Gavel, CalendarClock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrentRound } from "@/lib/firebase/events";

interface ParticipantScreenOverlayProps {
  globalScreenMode?: ParticipantScreenMode;
  overrideScreenMode?: ParticipantScreenMode | null;
  boardState?: ParticipantScreenState;
  children: React.ReactNode;
}

export function ParticipantScreenOverlay({
  globalScreenMode = "AUTO",
  overrideScreenMode,
  boardState,
  children,
}: ParticipantScreenOverlayProps) {
  const finalMode = overrideScreenMode || globalScreenMode || "AUTO";
  const [showBroadcast, setShowBroadcast] = useState(false);
  const broadcastMessage = boardState?.broadcastMessage;
  const { currentRound } = useCurrentRound(boardState?.targetRoundId || null);

  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (broadcastMessage) {
      if (broadcastMessage.expiresAt && Date.now() > broadcastMessage.expiresAt) {
        setShowBroadcast(false);
      } else {
        setShowBroadcast(true);
      }
    } else {
      setShowBroadcast(false);
    }
  }, [broadcastMessage]);

  useEffect(() => {
    if (finalMode === "COUNTDOWN" && boardState?.countdownEndsAt) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((boardState.countdownEndsAt! - Date.now()) / 1000));
        setTimeRemaining(remaining);
        if (remaining === 0) {
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [finalMode, boardState?.countdownEndsAt]);

  const renderContent = () => {
    if (finalMode === "RULES") {
      return (
        <div className="space-y-6 max-w-2xl mx-auto">
          <Gavel className="w-16 h-16 text-[var(--color-apb-cyan)] mx-auto" />
          <div>
            <h2 className="text-3xl font-bold tracking-widest uppercase text-white font-mono mb-4">
              {boardState?.heading || "EVENT RULES"}
            </h2>
            {boardState?.subheading && (
              <h3 className="text-xl text-[var(--color-apb-cyan)] uppercase font-mono mb-6 tracking-wide">
                {boardState.subheading}
              </h3>
            )}
            {boardState?.body && (
              <div className="text-slate-300 leading-relaxed text-lg whitespace-pre-wrap text-left bg-black/40 p-6 rounded-lg border border-[var(--color-apb-surface-border)]">
                {boardState.body}
              </div>
            )}
            {boardState?.imageUrl && (
              <div className="mt-6">
                <img src={boardState.imageUrl} alt="Rules" className="max-w-full h-auto rounded-lg mx-auto" />
              </div>
            )}
          </div>
        </div>
      );
    }

    if (finalMode === "ROUND_INTRO") {
      return (
        <div className="space-y-6">
          <CalendarClock className="w-20 h-20 text-[var(--color-apb-cyan)] mx-auto" />
          <div>
            <h2 className="text-4xl font-bold tracking-widest uppercase text-white font-mono mb-3">
              {boardState?.heading || "GET READY"}
            </h2>
            {boardState?.subheading && (
              <h3 className="text-2xl text-[var(--color-apb-cyan)] uppercase font-mono mb-6 tracking-wide">
                {boardState.subheading}
              </h3>
            )}
            {boardState?.body && (
              <p className="text-xl text-slate-300 max-w-xl mx-auto">
                {boardState.body}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (finalMode === "COUNTDOWN") {
      return (
        <div className="space-y-6">
          <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-widest uppercase text-[var(--color-apb-cyan)] font-mono">
              {boardState?.heading || "STARTING IN"}
            </h2>
          </div>
          <div className="text-[120px] leading-none font-bold font-mono tracking-tighter text-white drop-shadow-[0_0_20px_rgba(0,240,255,0.5)]">
            {timeRemaining > 0 ? timeRemaining : "GO"}
          </div>
        </div>
      );
    }

    if (finalMode === "CONSTRAINT_REVEAL") {
      const stage = currentRound?.templateType === "PROGRESSIVE_CONSTRAINT" && boardState?.targetStage 
        ? currentRound.stages[boardState.targetStage - 1] 
        : null;

      return (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 font-mono text-sm tracking-widest uppercase mb-4">
            <AlertTriangle className="w-4 h-4" />
            NEW CONSTRAINT
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-widest uppercase text-white font-mono mb-4">
              {boardState?.heading || "CONSTRAINT REVEAL"}
            </h2>
            <div className="text-amber-300 leading-relaxed text-2xl whitespace-pre-wrap bg-black/60 p-8 rounded-lg border border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
              {boardState?.body || stage?.constraint || "Constraint information will appear here."}
            </div>
          </div>
        </div>
      );
    }

    if (finalMode === "ANNOUNCEMENT") {
      return (
        <div className="space-y-6">
          <Info className="w-16 h-16 text-[var(--color-apb-cyan)] mx-auto" />
          <div>
            <h2 className="text-3xl font-bold tracking-widest uppercase text-white font-mono mb-4">
              {boardState?.heading || broadcastMessage?.heading || "ANNOUNCEMENT"}
            </h2>
            {(boardState?.subheading) && (
              <h3 className="text-xl text-[var(--color-apb-cyan)] uppercase font-mono mb-4">
                {boardState.subheading}
              </h3>
            )}
            <p className="text-xl text-slate-300 max-w-xl mx-auto whitespace-pre-wrap">
              {boardState?.body || broadcastMessage?.message || "Please pay attention to the organizer."}
            </p>
          </div>
        </div>
      );
    }

    if (finalMode === "PAUSED" || finalMode === "EMERGENCY") {
      return (
        <div className="space-y-6">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto animate-pulse" />
          <div>
            <h2 className="text-3xl font-bold tracking-widest uppercase text-amber-500 font-mono mb-3">
              {boardState?.heading || "EVENT PAUSED"}
            </h2>
            <p className="text-xl text-slate-300">
              {boardState?.body || "Please remain on this screen. Further instructions will appear here."}
            </p>
          </div>
        </div>
      );
    }

    if (finalMode === "ROUND_COMPLETE") {
      return (
        <div className="space-y-6">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
          <div>
            <h2 className="text-3xl font-bold tracking-widest uppercase text-white font-mono mb-3">
              {boardState?.heading || "ROUND COMPLETE"}
            </h2>
            <p className="text-xl text-slate-400">
              {boardState?.body || "Please wait for further instructions."}
            </p>
          </div>
        </div>
      );
    }

    if (finalMode === "LOCKED") {
      return (
        <div className="space-y-6">
          <Lock className="w-16 h-16 text-destructive mx-auto" />
          <div>
            <h2 className="text-3xl font-bold tracking-widest uppercase text-destructive font-mono mb-3">
              {boardState?.heading || "WORKSPACE LOCKED"}
            </h2>
            <p className="text-xl text-slate-400">
              {boardState?.body || "Please wait for organizer instructions. Your work has been preserved."}
            </p>
          </div>
        </div>
      );
    }

    if (finalMode === "WAITING") {
      return (
        <div className="space-y-6">
          <Clock className="w-16 h-16 text-[var(--color-apb-cyan)] mx-auto animate-pulse" />
          <div>
            <h2 className="text-3xl font-bold tracking-widest uppercase text-white font-mono mb-3">
              Please Wait
            </h2>
            <p className="text-xl text-slate-400">
              The organizer is preparing the next stage.
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  const isOverlayMode = finalMode !== "AUTO" && finalMode !== "NORMAL";

  return (
    <div className="relative flex-1 flex flex-col w-full h-full">
      {/* Background layer always holds the children so state is never lost */}
      <div
        className={`flex-1 flex flex-col transition-all duration-500 ${
          isOverlayMode ? "pointer-events-none opacity-10 blur-sm select-none" : ""
        }`}
      >
        {children}
      </div>

      {/* Floating Broadcast Toast (if normal mode but broadcast exists) */}
      <AnimatePresence>
        {!isOverlayMode && showBroadcast && broadcastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-lg"
          >
            <APBCard className="p-4 border-[var(--color-apb-cyan)]/50 shadow-[0_0_20px_rgba(0,240,255,0.2)] bg-background/95 backdrop-blur-md">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-[var(--color-apb-cyan)] mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-bold tracking-widest text-white uppercase font-mono mb-1">
                    {broadcastMessage.heading}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {broadcastMessage.message}
                  </p>
                </div>
              </div>
            </APBCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Overlay Layer */}
      <AnimatePresence>
        {isOverlayMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-40 flex items-center justify-center p-4 md:p-8 overflow-y-auto bg-background/80 backdrop-blur-xl"
          >
            <div className="max-w-4xl w-full text-center py-12">
              {renderContent()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

