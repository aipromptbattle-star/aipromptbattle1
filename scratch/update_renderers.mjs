import fs from "fs";

let f = fs.readFileSync("src/components/apb/ParticipantScreenOverlay.tsx", "utf8");

// Import Typewriter
if (!f.includes("TypewriterText")) {
  f = f.replace(`import { Lock`, `import { TypewriterText } from "./TypewriterText";\nimport { Lock`);
}

const renderContentRegex = /const renderContent = \(\) => \{[\s\S]*?return \(\n      <div className="flex flex-col items-center justify-center space-y-8 max-w-5xl mx-auto w-full text-center px-4 animate-in fade-in duration-500">[\s\S]*?<\/div>\n    \);\n  \};/;

const newRenderContent = `const renderContent = () => {
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
      <div className={\`mt-10 w-full flex \${template.textAlign === 'left' ? 'justify-start' : template.textAlign === 'right' ? 'justify-end' : 'justify-center'}\`}>
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
          <div className={\`w-full bg-[var(--color-apb-surface)]/80 backdrop-blur-md border-2 border-[var(--color-apb-surface-border)] rounded-3xl p-8 md:p-14 shadow-2xl flex flex-col \${alignClass} relative overflow-hidden\`}>
            {bgImage && (
              <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: \`url(\${bgImage})\`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            )}
            <div className="relative z-10 w-full flex flex-col items-center">
              <div className={\`w-full flex flex-col \${alignClass}\`}>
                {template.imagePosition === "top" && ImageContent}
                {TextContent}
                {(template.imagePosition === "bottom" || !template.imagePosition) && ImageContent}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };`;

f = f.replace(renderContentRegex, newRenderContent);
fs.writeFileSync("src/components/apb/ParticipantScreenOverlay.tsx", f);
console.log("Updated ParticipantScreenOverlay");
