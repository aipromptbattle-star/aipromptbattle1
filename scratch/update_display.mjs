import fs from "fs";

let f = fs.readFileSync("src/app/display/page.tsx", "utf8");

if (!f.includes("import { TypewriterText }")) {
  f = f.replace(`import { ImagePicker } from "@/components/apb/ImagePicker";`, `import { ImagePicker } from "@/components/apb/ImagePicker";\nimport { TypewriterText } from "@/components/apb/TypewriterText";`);
}

// 1. Update the actual showCustom layout
const showCustomOld = `          {/* 7. CUSTOM MANUAL STATE OVERRIDE */}`;
const showCustomNew = `          {/* 7. CUSTOM MANUAL STATE OVERRIDE */}
          {!showLeaderboard && showCustom && !showParticipantSync && (() => {
            const template = displayOverrideState?.activeTemplate || {};
            const alignClass = template.textAlign === "left" ? "items-start text-left" : template.textAlign === "right" ? "items-end text-right" : "items-center text-center";
            const bgImage = template.imagePosition === "bg" && template.imageUrl ? template.imageUrl : null;
            
            const TextContent = (
              <>
                {template.heading && (
                  <h2 className="text-5xl md:text-7xl font-black tracking-widest uppercase text-white font-mono mb-6 w-full">
                    <TypewriterText text={template.heading} speed={40} />
                  </h2>
                )}
                {template.subheading && (
                  <h3 className="text-3xl md:text-4xl text-[var(--color-apb-cyan)] uppercase font-mono tracking-widest font-bold mb-8 w-full">
                    <TypewriterText text={template.subheading} speed={30} />
                  </h3>
                )}
                {template.body && (
                  <div className="text-slate-300 leading-relaxed text-2xl md:text-4xl whitespace-pre-wrap font-mono max-w-5xl w-full">
                    <TypewriterText text={template.body} speed={15} />
                  </div>
                )}
              </>
            );

            const ImageContent = template.imageUrl && template.imagePosition !== "bg" ? (
              <div className={\`mt-12 w-full flex \${template.textAlign === 'left' ? 'justify-start' : template.textAlign === 'right' ? 'justify-end' : 'justify-center'}\`}>
                <img src={template.imageUrl} alt="Visual" className="max-w-full md:max-w-5xl max-h-[60vh] object-contain rounded-2xl shadow-2xl border border-white/10" crossOrigin="anonymous" />
              </div>
            ) : null;

            return (
              <div className={\`w-full h-full bg-[var(--color-apb-surface)]/80 backdrop-blur-md rounded-3xl p-16 shadow-2xl flex flex-col \${alignClass} relative overflow-hidden\`}>
                {bgImage && (
                  <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: \`url(\${bgImage})\`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                )}
                <div className="relative z-10 w-full flex flex-col items-center justify-center h-full">
                  <div className={\`w-full flex flex-col \${alignClass}\`}>
                    {template.imagePosition === "top" && ImageContent}
                    {TextContent}
                    {(template.imagePosition === "bottom" || !template.imagePosition) && ImageContent}
                  </div>
                </div>
              </div>
            );
          })()}`;

const showCustomRegex = /\{\/\* 7\. CUSTOM MANUAL STATE OVERRIDE \*\/\}\n\s*\{\!showLeaderboard && showCustom && \!showParticipantSync && \(\n[\s\S]*?\}\)/;
if (f.match(showCustomRegex)) {
  f = f.replace(showCustomRegex, showCustomNew);
}

// 2. Update the Inline Preview renderer in OrganizerDisplayControl
const inlinePreviewRegex = /\{\/\* Live React rendering for instant typing feedback instead of a delayed iframe \*\/\}\n[\s\S]*?\{\/\* END LIVE PREVIEW \*\/\}/;
// Since I didn't put a marker in the previous turn, I will just regex the whole block manually
const inlineStart = `{/* Live React rendering for instant typing feedback instead of a delayed iframe */}`;
const inlineEnd = `Enter text or image URL to preview display\n                  </div>\n                )}\n                {selectedMode === "AUTOMATIC" && (\n                  <div className="text-slate-500 font-mono text-sm">\n                    Live Display Screen is currently showing event-driven automatic content.\n                  </div>\n                )}\n              </div>\n            </div>`;

const inlineStartIdx = f.indexOf(inlineStart);
const inlineEndIdx = f.indexOf(inlineEnd);

if (inlineStartIdx !== -1 && inlineEndIdx !== -1) {
  const newInline = `{/* Live React rendering for instant typing feedback instead of a delayed iframe */}
            <div className="w-full h-full flex flex-col items-center justify-center space-y-8 bg-black text-center p-8 animate-in fade-in duration-500 relative">
              <div className={\`w-full h-full flex flex-col items-center justify-center p-6 border-2 border-[var(--color-apb-surface-border)] rounded-3xl bg-[var(--color-apb-surface)]/80 backdrop-blur-md shadow-2xl relative overflow-hidden \${draftTextAlign === "left" ? "text-left items-start" : draftTextAlign === "right" ? "text-right items-end" : "text-center items-center"}\`}>
                {draftImagePos === "bg" && draftImageUrl && (
                  <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: \`url(\${draftImageUrl})\`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                )}
                <div className={\`relative z-10 w-full flex flex-col \${draftTextAlign === "left" ? "items-start text-left" : draftTextAlign === "right" ? "items-end text-right" : "items-center text-center"}\`}>
                  {draftImagePos === "top" && draftImageUrl && (
                    <div className={\`mb-8 flex w-full \${draftTextAlign === "left" ? "justify-start" : draftTextAlign === "right" ? "justify-end" : "justify-center"}\`}>
                      <img src={draftImageUrl} className="max-w-full md:max-w-3xl max-h-[40vh] object-contain rounded-xl shadow-2xl border border-white/10" crossOrigin="anonymous" />
                    </div>
                  )}
                  {draftHeading && (
                    <h2 className="text-4xl md:text-6xl font-black tracking-widest uppercase text-white font-mono mb-4 w-full">
                      <TypewriterText text={draftHeading} speed={20} />
                    </h2>
                  )}
                  {draftSubheading && (
                    <h3 className="text-2xl md:text-3xl text-[var(--color-apb-cyan)] uppercase font-mono tracking-widest font-bold mb-8 w-full">
                      <TypewriterText text={draftSubheading} speed={20} />
                    </h3>
                  )}
                  {draftBody && (
                    <div className="text-slate-300 leading-relaxed text-xl md:text-2xl whitespace-pre-wrap font-mono max-w-4xl w-full">
                      <TypewriterText text={draftBody} speed={10} />
                    </div>
                  )}
                  {(draftImagePos === "bottom" || !draftImagePos) && draftImageUrl && (
                    <div className={\`mt-8 flex w-full \${draftTextAlign === "left" ? "justify-start" : draftTextAlign === "right" ? "justify-end" : "justify-center"}\`}>
                      <img src={draftImageUrl} className="max-w-full md:max-w-3xl max-h-[40vh] object-contain rounded-xl shadow-2xl border border-white/10" crossOrigin="anonymous" />
                    </div>
                  )}
                </div>
                {!draftHeading && !draftSubheading && !draftBody && !draftImageUrl && selectedMode !== "AUTOMATIC" && (
                  <div className="text-slate-500 font-mono text-sm relative z-10">
                    Enter text or image URL to preview display
                  </div>
                )}
                {selectedMode === "AUTOMATIC" && (
                  <div className="text-slate-500 font-mono text-sm relative z-10">
                    Live Display Screen is currently showing event-driven automatic content.
                  </div>
                )}
              </div>
            </div>`;
  f = f.substring(0, inlineStartIdx) + newInline + f.substring(inlineEndIdx + inlineEnd.length);
}

fs.writeFileSync("src/app/display/page.tsx", f);
console.log("Updated Display with Typewriter and Layouts");
