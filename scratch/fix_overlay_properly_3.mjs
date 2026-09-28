
import fs from "fs";
let f = fs.readFileSync("src/components/apb/ParticipantScreenOverlay.tsx", "utf8");

const startStr = `  const renderContent = () => {`;
const endStr = `  return (
    <div className="relative flex-1 flex flex-col w-full h-full">`;

const startIdx = f.indexOf(startStr);
const endIdx = f.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
  const newContent = `  const renderContent = () => {
    const isCountdown = finalMode === "COUNTDOWN";
    const displayNum = isGo ? "GO" : (countdownRemaining !== null ? countdownRemaining : (template.durationSeconds || 5));

    return (
      <div className="flex flex-col items-center justify-center space-y-8 max-w-5xl mx-auto w-full text-center px-4 animate-in fade-in duration-500">
        
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
          <div className="w-full bg-[var(--color-apb-surface)]/80 backdrop-blur-md border-2 border-[var(--color-apb-surface-border)] rounded-3xl p-8 md:p-14 shadow-2xl flex flex-col items-center">
            {template.heading && (
              <h2 className="text-4xl md:text-6xl font-black tracking-widest uppercase text-white font-mono mb-4 text-center">
                {template.heading}
              </h2>
            )}
            
            {template.subheading && (
              <h3 className="text-2xl md:text-3xl text-[var(--color-apb-cyan)] uppercase font-mono tracking-widest font-bold mb-8 text-center">
                {template.subheading}
              </h3>
            )}
            
            {template.body && (
              <div className="text-slate-300 leading-relaxed text-xl md:text-2xl whitespace-pre-wrap font-mono text-center max-w-4xl w-full">
                {template.body}
              </div>
            )}
            
            {template.imageUrl && (
              <div className="mt-10 w-full flex justify-center">
                <img src={template.imageUrl} alt="Visual content" className="max-w-full md:max-w-3xl max-h-[50vh] object-contain rounded-xl shadow-2xl border border-white/10" crossOrigin="anonymous" />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

`;

  f = f.substring(0, startIdx) + newContent + f.substring(endIdx);
  fs.writeFileSync("src/components/apb/ParticipantScreenOverlay.tsx", f);
  console.log("Successfully replaced renderContent");
} else {
  console.log("Failed to replace");
}

