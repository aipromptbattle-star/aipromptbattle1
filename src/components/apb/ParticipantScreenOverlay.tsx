"use client";

import React, { useEffect, useState } from "react";
import { ParticipantScreenMode, ParticipantBoardState, GlobalCountdown } from "@/lib/firebase/schema";
import { APBCard } from "./APBCard";
import { TypewriterText } from "./TypewriterText";
import { Lock, AlertTriangle, Clock, Info, CheckCircle2, Gavel, CalendarClock } from "lucide-react";
// framer-motion replaced with CSS animations
import { useCurrentRound, useEventState } from "@/lib/firebase/events";

interface ParticipantScreenOverlayProps {
  globalScreenMode?: ParticipantScreenMode;
  overrideScreenMode?: ParticipantScreenMode | null;
  boardState?: ParticipantBoardState;
  mockGlobalCountdown?: GlobalCountdown;
  children: React.ReactNode;
}

export function ParticipantScreenOverlay({
  globalScreenMode = "AUTO",
  overrideScreenMode,
  boardState,
  mockGlobalCountdown,
  children,
}: ParticipantScreenOverlayProps) {
  const { eventState } = useEventState();
  const globalCountdown: GlobalCountdown | undefined = mockGlobalCountdown || eventState?.globalCountdown;

  // Real countdown logic
  const [countdownRemaining, setCountdownRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (globalCountdown?.active && globalCountdown.endsAt) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((globalCountdown.endsAt - Date.now()) / 1000));
        setCountdownRemaining(remaining);
      }, 250);
      return () => clearInterval(interval);
    } else {
      setCountdownRemaining(null);
    }
  }, [globalCountdown?.active, globalCountdown?.endsAt]);

  // Derived state
  const isCountdownActive = countdownRemaining !== null && countdownRemaining >= 0 && globalCountdown?.active;
  const isGo = countdownRemaining === 0 && globalCountdown?.active; // Briefly show GO
  
  // Base final mode
  let finalMode = overrideScreenMode || globalScreenMode || "AUTO";
  
  // COUNTDOWN has highest priority after LOCKED
  if (isCountdownActive || isGo) {
    finalMode = "COUNTDOWN";
  }

  const template = boardState?.activeTemplate || {};


  const renderContent = () => {
    const isCountdown = finalMode === "COUNTDOWN";
    const displayNum = isGo ? "GO" : (countdownRemaining !== null ? countdownRemaining : (template.durationSeconds || 5));

    const alignClass = template.textAlign === "left" ? "items-start text-left" : template.textAlign === "right" ? "items-end text-right" : "items-center text-center";
    const bgImage = template.imagePosition === "bg" && template.imageUrl ? template.imageUrl : null;

    const TextContent = (
      <>
        {template.heading && (
          <h2 className="text-4xl md:text-6xl font-black tracking-widest uppercase text-white font-mono mb-4 w-full">
            <TypewriterText text={template.heading} speed={40} />
          </h2>
        )}
        {template.subheading && (
          <h3 className="text-2xl md:text-3xl text-[var(--color-apb-cyan)] uppercase font-mono tracking-widest font-bold mb-8 w-full">
            <TypewriterText text={template.subheading} speed={30} />
          </h3>
        )}
        {template.body && (
          <div className="text-slate-300 leading-relaxed text-xl md:text-2xl whitespace-pre-wrap font-mono max-w-4xl w-full">
            <TypewriterText text={template.body} speed={15} />
          </div>
        )}
      </>
    );

    const ImageContent = template.imageUrl && template.imagePosition !== "bg" ? (
      <div className={`mt-10 w-full flex ${template.textAlign === 'left' ? 'justify-start' : template.textAlign === 'right' ? 'justify-end' : 'justify-center'}`}>
        <img src={template.imageUrl} alt="Visual" className="max-w-full md:max-w-3xl max-h-[50vh] object-contain rounded-xl shadow-2xl border border-white/10" crossOrigin="anonymous" />
      </div>
    ) : null;

    return (
      <div className="flex flex-col items-center justify-center space-y-8 max-w-5xl mx-auto w-full text-center px-4 animate-in fade-in duration-500 relative z-10">
        {isCountdown ? (
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-black tracking-widest uppercase text-[var(--color-apb-cyan)] font-mono flex items-center justify-center gap-4">
              <span className="w-4 h-4 rounded-full bg-[var(--color-apb-cyan)] animate-pulse" />
              {globalCountdown?.heading || template.heading || "STARTING IN"}
              <span className="w-4 h-4 rounded-full bg-[var(--color-apb-cyan)] animate-pulse" />
            </h2>
            {(globalCountdown?.subheading || template.subheading) && (
              <h3 className="text-xl md:text-2xl text-[var(--color-apb-cyan)]/70 uppercase font-mono mt-2">
                {globalCountdown?.subheading || template.subheading}
              </h3>
            )}
            <div className="text-[180px] md:text-[300px] leading-none font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 drop-shadow-[0_0_80px_rgba(255,255,255,0.4)] mt-4">
              {displayNum}
            </div>
          </div>
        ) : (
          <div className={`w-full bg-[var(--color-apb-surface)]/80 backdrop-blur-md border-2 border-[var(--color-apb-surface-border)] rounded-3xl p-8 md:p-14 shadow-2xl flex flex-col ${alignClass} relative overflow-hidden`}>
            {bgImage && (
              <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            )}
            <div className="relative z-10 w-full flex flex-col items-center">
              <div className={`w-full flex flex-col ${alignClass}`}>
                {template.imagePosition === "top" && ImageContent}
                {TextContent}
                {(template.imagePosition === "bottom" || !template.imagePosition) && ImageContent}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

    const overlayModes = ["RULES", "ROUND_INTRO", "EVENT_STATUS", "COUNTDOWN", "CONSTRAINT_REVEAL", "ANNOUNCEMENT", "PAUSED", "EMERGENCY", "ROUND_COMPLETE", "LOCKED", "WAITING", "PARTICIPANT_SYNC"];
  const isOverlayMode = overlayModes.includes(finalMode);

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

      {/* Fullscreen Overlay Layer */}
      {isOverlayMode && (
          <div className="absolute inset-0 z-40 flex items-center justify-center p-4 md:p-8 overflow-y-auto bg-background/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
            <div className="max-w-4xl w-full text-center py-12">
              {renderContent()}
            </div>
          </div>
        )}
    </div>
  );
}
