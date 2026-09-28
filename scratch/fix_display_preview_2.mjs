
import fs from "fs";

let f = fs.readFileSync("src/app/organizer/display/page.tsx", "utf8");

const oldStr = `{/* Realtime Iframe preview to guarantee exact renderer matching */}`;
const endStr = `/>`;

let s = f.indexOf(oldStr);
if (s !== -1) {
  let e = f.indexOf(endStr, s);
  
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
            
  f = f.substring(0, s) + newPreview.trim() + f.substring(e + endStr.length);
  fs.writeFileSync("src/app/organizer/display/page.tsx", f);
  console.log("Replaced iframe with live preview");
} else {
  console.log("Could not find marker");
}

