
import fs from "fs";

let f = fs.readFileSync("src/app/organizer/display/page.tsx", "utf8");

const oldPreviewRegex = /<div className="absolute top-2 right-2 z-10 bg-black\\/60 px-2 py-1 rounded text-\\[10px\\] text-white\\/50 font-mono pointer-events-none">\n\\s*Previews update after saving\n\\s*<\\/div>\n\\s*<iframe\n\\s*src="\\/display\\?preview=true"\n\\s*className="w-\\[200%\\] h-\\[200%\\] origin-top-left"\n\\s*style=\\{\\{ transform: "scale\\(0\\.5\\)", pointerEvents: "none" \\}\\}\n\\s*\\/>/m;

const newPreview = `
            {/* Live React rendering for instant typing feedback instead of a delayed iframe */}
            <div className="w-full h-full flex flex-col items-center justify-center space-y-8 bg-black text-center p-8 animate-in fade-in duration-500 relative">
              <div className="w-full h-full flex flex-col items-center justify-center p-6 border-2 border-[var(--color-apb-surface-border)] rounded-3xl bg-[var(--color-apb-surface)]/80 backdrop-blur-md shadow-2xl relative overflow-hidden">
                {draftHeading && (
                  <h2 className="text-4xl md:text-6xl font-black tracking-widest uppercase text-white font-mono mb-4 text-center z-10">
                    {draftHeading}
                  </h2>
                )}
                {draftSubheading && (
                  <h3 className="text-2xl md:text-3xl text-[var(--color-apb-cyan)] uppercase font-mono tracking-widest font-bold mb-8 text-center z-10">
                    {draftSubheading}
                  </h3>
                )}
                {draftBody && (
                  <div className="text-slate-300 leading-relaxed text-xl md:text-2xl whitespace-pre-wrap font-mono text-center max-w-4xl z-10">
                    {draftBody}
                  </div>
                )}
                {draftImageUrl && (
                  <div className="mt-8 flex justify-center w-full z-10">
                    <img src={draftImageUrl} className="max-w-full md:max-w-3xl max-h-[40vh] object-contain rounded-xl shadow-2xl border border-white/10" crossOrigin="anonymous" />
                  </div>
                )}
                {!draftHeading && !draftSubheading && !draftBody && !draftImageUrl && selectedMode !== "AUTOMATIC" && (
                  <div className="text-slate-500 font-mono text-sm">
                    Enter text or image URL to preview display
                  </div>
                )}
                {selectedMode === "AUTOMATIC" && (
                  <div className="text-slate-500 font-mono text-sm">
                    Live Display Screen is currently showing event-driven automatic content.
                  </div>
                )}
              </div>
            </div>`;

if (f.match(oldPreviewRegex)) {
  f = f.replace(oldPreviewRegex, newPreview.trim());
  fs.writeFileSync("src/app/organizer/display/page.tsx", f);
  console.log("Replaced iframe with live preview in display board");
} else {
  console.log("Could not find the iframe regex");
}

