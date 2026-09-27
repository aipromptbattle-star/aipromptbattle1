
import fs from "fs";
let f = fs.readFileSync("src/app/organizer/participant-board/page.tsx", "utf8");

// Remove the strict AUTO clearing in useEffect
f = f.replace(`      if (selectedMode === "AUTO") {
        setDraftHeading("");
        setDraftSubheading("");
        setDraftBody("");
        setDraftImageUrl("");
        return;
      }`, `// Allow editing in AUTO mode so they can draft for next state without losing it`);

f = f.replace(`            {selectedMode === "AUTO" && (
              <div className="py-8 text-center text-slate-400 font-mono text-sm">
                <p>Participants are following the authoritative event state automatically.</p>
                <p className="mt-2 text-xs">No manual template to edit.</p>
              </div>
            )}`, ``);

// Now update the Preview to be side-by-side Laptop and Mobile
const oldPreview = `            <div className="relative w-full aspect-video bg-black rounded-lg border border-[var(--color-apb-surface-border)] overflow-hidden shadow-2xl">
              <div className="absolute inset-0 pointer-events-none origin-top-left" style={{ transform: "scale(0.5)", width: "200%", height: "200%" }}>
                {/* Note: This simulates the view using ParticipantScreenOverlay. 
                    We pass a mocked boardState consisting of the draft so they can preview it before showing! */}
                <ParticipantScreenOverlay
                  globalScreenMode={selectedMode}
                  boardState={{
                    globalScreenMode: selectedMode,
                    activeTemplate: {
                      heading: draftHeading,
                      subheading: draftSubheading,
                      body: draftBody,
                      imageUrl: draftImageUrl,
                      durationSeconds: parseInt(draftDuration)
                    },
                    updatedAt: Date.now()
                  }}
                >
                  <div className="w-full h-full p-8 flex items-center justify-center opacity-30">
                    <div className="w-full h-full max-w-4xl border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center text-slate-600 font-mono text-4xl">
                      PARTICIPANT WORKSPACE
                    </div>
                  </div>
                </ParticipantScreenOverlay>
              </div>
            </div>`;

const newPreview = `            <div className="flex flex-col xl:flex-row gap-4 items-start w-full">
              {/* Laptop Preview */}
              <div className="flex-1 w-full flex flex-col gap-2">
                <div className="text-xs font-mono uppercase text-muted-foreground flex items-center gap-1.5 justify-center bg-black/40 py-1 rounded">
                  <Monitor className="w-3.5 h-3.5" /> Laptop Preview
                </div>
                <div className="relative w-full aspect-video bg-black rounded-lg border border-[var(--color-apb-surface-border)] overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 pointer-events-none origin-top-left" style={{ transform: "scale(0.35)", width: "285.7%", height: "285.7%" }}>
                    <ParticipantScreenOverlay
                      globalScreenMode={selectedMode}
                      boardState={{
                        globalScreenMode: selectedMode,
                        activeTemplate: {
                          heading: draftHeading,
                          subheading: draftSubheading,
                          body: draftBody,
                          imageUrl: draftImageUrl,
                          durationSeconds: parseInt(draftDuration)
                        },
                        updatedAt: Date.now()
                      }}
                    >
                      <div className="w-full h-full p-8 flex items-center justify-center opacity-30">
                        <div className="w-full h-full max-w-4xl border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center text-slate-600 font-mono text-5xl">
                          PARTICIPANT LAPTOP
                        </div>
                      </div>
                    </ParticipantScreenOverlay>
                  </div>
                </div>
              </div>

              {/* Mobile Preview */}
              <div className="w-full xl:w-[35%] flex flex-col gap-2 shrink-0">
                <div className="text-xs font-mono uppercase text-muted-foreground flex items-center gap-1.5 justify-center bg-black/40 py-1 rounded">
                  <Monitor className="w-3.5 h-3.5" /> Mobile Preview
                </div>
                <div className="relative w-[180px] sm:w-[220px] xl:w-full mx-auto aspect-[9/19] bg-black rounded-3xl border-4 border-slate-800 overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 pointer-events-none origin-top-left" style={{ transform: "scale(0.4)", width: "250%", height: "250%" }}>
                    <ParticipantScreenOverlay
                      globalScreenMode={selectedMode}
                      boardState={{
                        globalScreenMode: selectedMode,
                        activeTemplate: {
                          heading: draftHeading,
                          subheading: draftSubheading,
                          body: draftBody,
                          imageUrl: draftImageUrl,
                          durationSeconds: parseInt(draftDuration)
                        },
                        updatedAt: Date.now()
                      }}
                    >
                      <div className="w-full h-full p-8 flex items-center justify-center opacity-30">
                        <div className="w-full h-full border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center text-slate-600 font-mono text-3xl text-center">
                          MOBILE<br/>VIEW
                        </div>
                      </div>
                    </ParticipantScreenOverlay>
                  </div>
                </div>
              </div>
            </div>`;

f = f.replace(oldPreview, newPreview);
fs.writeFileSync("src/app/organizer/participant-board/page.tsx", f);
console.log("Fixed preview layouts");

