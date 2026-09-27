
import fs from "fs";

let f = fs.readFileSync("src/components/apb/ParticipantScreenOverlay.tsx", "utf8");

// We need to replace the entire renderContent function with heavily styled versions
const newRenderContent = `
  const renderContent = () => {
    if (finalMode === "RULES") {
      return (
        <div className="space-y-6 w-full max-w-3xl mx-auto bg-[#0a0f18] border border-[var(--color-apb-cyan)]/30 rounded-2xl p-10 shadow-[0_0_50px_rgba(0,240,255,0.1)]">
          <div className="flex flex-col items-center border-b border-[var(--color-apb-cyan)]/20 pb-6 mb-6">
            <LayoutTemplate className="w-12 h-12 text-[var(--color-apb-cyan)] mb-4" />
            <h2 className="text-4xl font-bold tracking-widest uppercase text-white font-mono">
              {template.heading || "COMPETITION RULES"}
            </h2>
            {template.subheading && (
              <h3 className="text-xl text-[var(--color-apb-cyan)] uppercase font-mono mt-2 tracking-wide">
                {template.subheading}
              </h3>
            )}
          </div>
          <div className="text-slate-300 leading-relaxed text-lg whitespace-pre-wrap text-left font-mono">
            {template.body || "Follow all organizer instructions."}
          </div>
          {template.imageUrl && (
            <div className="mt-8 pt-6 border-t border-[var(--color-apb-cyan)]/20">
              <img src={template.imageUrl} alt="Rules" className="max-w-full h-auto rounded-lg mx-auto shadow-xl" crossOrigin="anonymous" />
            </div>
          )}
        </div>
      );
    }

    if (finalMode === "ROUND_INTRO" || (finalMode as string) === "EVENT_STATUS") {
      return (
        <div className="flex flex-col items-center justify-center space-y-8 animate-in slide-in-from-bottom-10 duration-700">
          <div className="relative">
            <div className="absolute -inset-10 bg-[var(--color-apb-cyan)]/20 blur-3xl rounded-full" />
            <CalendarClock className="w-24 h-24 text-white relative z-10" />
          </div>
          <div className="text-center space-y-4">
            <h2 className="text-6xl md:text-7xl font-black tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50 font-mono">
              {template.heading || "GET READY"}
            </h2>
            {template.subheading && (
              <h3 className="text-3xl text-[var(--color-apb-cyan)] uppercase font-mono tracking-widest font-bold">
                {template.subheading}
              </h3>
            )}
            {template.body && (
              <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto whitespace-pre-wrap mt-6">
                {template.body}
              </p>
            )}
            {template.imageUrl && (
              <div className="mt-12">
                <img src={template.imageUrl} alt="Intro" className="max-w-3xl w-full h-auto rounded-2xl mx-auto shadow-2xl border border-white/10" crossOrigin="anonymous" />
              </div>
            )}
          </div>
        </div>
      );
    }

    if (finalMode === "COUNTDOWN") {
      const displayNum = isGo ? "GO" : (countdownRemaining !== null ? countdownRemaining : (template.durationSeconds || 5));
      
      return (
        <div className="flex flex-col items-center justify-center space-y-8 min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl md:text-4xl font-bold tracking-widest uppercase text-amber-500 font-mono flex items-center justify-center gap-3">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
              {globalCountdown?.heading || template.heading || "STARTING IN"}
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
            </h2>
            {(globalCountdown?.subheading || template.subheading) && (
              <h3 className="text-xl text-amber-200/70 uppercase font-mono mt-3">
                {globalCountdown?.subheading || template.subheading}
              </h3>
            )}
          </div>
          <div className="text-[150px] md:text-[250px] leading-none font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 drop-shadow-[0_0_60px_rgba(255,255,255,0.4)]">
            {displayNum}
          </div>
        </div>
      );
    }

    if (finalMode === "CONSTRAINT_REVEAL") {
      return (
        <div className="space-y-6 max-w-4xl mx-auto bg-amber-500/10 border-2 border-amber-500/50 rounded-3xl p-8 md:p-12 shadow-[0_0_100px_rgba(245,158,11,0.15)] animate-in zoom-in-95 duration-500">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-amber-500 text-black font-mono text-lg font-black tracking-widest uppercase mb-4 mx-auto">
            <AlertTriangle className="w-5 h-5" />
            NEW CONSTRAINT
          </div>
          <div>
            <h2 className="text-4xl md:text-5xl font-black tracking-widest uppercase text-amber-400 font-mono mb-6 drop-shadow-sm">
              {template.heading || "CONSTRAINT REVEAL"}
            </h2>
            <div className="text-amber-100 leading-relaxed text-2xl md:text-3xl whitespace-pre-wrap font-mono">
              {template.body || "Constraint information will appear here."}
            </div>
            {template.imageUrl && (
              <div className="mt-8">
                <img src={template.imageUrl} alt="Constraint" className="max-w-full h-auto rounded-xl mx-auto border-4 border-amber-500/30" crossOrigin="anonymous" />
              </div>
            )}
          </div>
        </div>
      );
    }

    if (finalMode === "ANNOUNCEMENT" || (finalMode as string) === "PARTICIPANT_SYNC") {
      return (
        <div className="w-full max-w-4xl mx-auto bg-gradient-to-b from-[#1a1f2e] to-black border border-indigo-500/30 rounded-3xl overflow-hidden shadow-2xl">
          <div className="bg-indigo-600/20 px-8 py-6 border-b border-indigo-500/30 flex items-center gap-4">
            <Info className="w-10 h-10 text-indigo-400" />
            <h2 className="text-3xl font-bold tracking-widest uppercase text-indigo-100 font-mono m-0 text-left">
              {template.heading || "ANNOUNCEMENT"}
            </h2>
          </div>
          <div className="p-8 md:p-12">
            {(template.subheading) && (
              <h3 className="text-2xl text-indigo-300 uppercase font-mono mb-6 font-bold text-left">
                {template.subheading}
              </h3>
            )}
            {template.body && (
              <p className="text-xl md:text-2xl text-slate-300 whitespace-pre-wrap text-left font-sans">
                {template.body}
              </p>
            )}
            {template.imageUrl && (
              <div className="mt-8 rounded-xl overflow-hidden border border-white/10">
                <img src={template.imageUrl} alt="Announcement" className="w-full h-auto" crossOrigin="anonymous" />
              </div>
            )}
          </div>
        </div>
      );
    }

    if (finalMode === "PAUSED" || finalMode === "EMERGENCY") {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <div className="relative flex items-center justify-center w-32 h-32 mb-8">
            <div className="absolute inset-0 border-4 border-amber-500 rounded-full animate-ping opacity-20" />
            <div className="absolute inset-2 border-4 border-amber-500 rounded-full animate-pulse opacity-40" />
            <AlertTriangle className="w-16 h-16 text-amber-500 relative z-10" />
          </div>
          <h2 className="text-5xl font-black tracking-widest uppercase text-amber-500 font-mono mb-4">
            {template.heading || "EVENT PAUSED"}
          </h2>
          <p className="text-2xl text-amber-200/70 whitespace-pre-wrap max-w-2xl text-center">
            {template.body || "Please remain on this screen. Further instructions will appear shortly."}
          </p>
        </div>
      );
    }

    if (finalMode === "ROUND_COMPLETE") {
      return (
        <div className="flex flex-col items-center justify-center bg-emerald-900/20 border border-emerald-500/30 rounded-full p-24 max-w-3xl mx-auto aspect-square">
          <CheckCircle2 className="w-32 h-32 text-emerald-500 mb-8" />
          <h2 className="text-4xl md:text-5xl font-black tracking-widest uppercase text-emerald-400 font-mono mb-4 text-center">
            {template.heading || "ROUND COMPLETE"}
          </h2>
          <p className="text-xl text-emerald-200/70 whitespace-pre-wrap text-center max-w-md">
            {template.body || "Please wait for further instructions."}
          </p>
        </div>
      );
    }

    if (finalMode === "LOCKED") {
      return (
        <div className="flex flex-col items-center justify-center p-12 bg-rose-950/40 border-y border-rose-900/50 w-full min-h-[40vh]">
          <Lock className="w-20 h-20 text-rose-500 mb-6" />
          <h2 className="text-4xl md:text-5xl font-black tracking-widest uppercase text-rose-500 font-mono mb-4">
            {template.heading || "WORKSPACE LOCKED"}
          </h2>
          <p className="text-xl text-rose-200/70 whitespace-pre-wrap max-w-2xl text-center">
            {template.body || "Please wait for organizer instructions. Your work has been preserved."}
          </p>
        </div>
      );
    }

    if (finalMode === "WAITING") {
      return (
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="flex gap-4">
            <div className="w-4 h-4 bg-[var(--color-apb-cyan)] rounded-full animate-bounce" style={{animationDelay: "0ms"}} />
            <div className="w-4 h-4 bg-[var(--color-apb-cyan)] rounded-full animate-bounce" style={{animationDelay: "150ms"}} />
            <div className="w-4 h-4 bg-[var(--color-apb-cyan)] rounded-full animate-bounce" style={{animationDelay: "300ms"}} />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-widest uppercase text-white font-mono">
            {template.heading || "Please Wait"}
          </h2>
          <p className="text-xl text-slate-400 whitespace-pre-wrap max-w-xl text-center">
            {template.body || "The organizer is preparing the next stage."}
          </p>
        </div>
      );
    }

    return null;
  };
`;

const oldStart = `  const renderContent = () => {`;
const oldEnd = `  const overlayModes = ["RULES"`;

f = f.substring(0, f.indexOf(oldStart)) + newRenderContent + "\n  " + f.substring(f.indexOf(oldEnd));

fs.writeFileSync("src/components/apb/ParticipantScreenOverlay.tsx", f);
console.log("Redesigned ParticipantScreenOverlay");

