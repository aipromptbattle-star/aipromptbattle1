
import fs from "fs";

let file = fs.readFileSync("src/components/apb/ParticipantScreenOverlay.tsx", "utf8");

const replacement = `    if (finalMode === "ANNOUNCEMENT" || finalMode === "PARTICIPANT_SYNC") {
      return (
        <div className="space-y-6 max-w-2xl mx-auto">
          <Info className="w-16 h-16 text-[var(--color-apb-cyan)] mx-auto" />
          <div>
            <h2 className="text-3xl font-bold tracking-widest uppercase text-white font-mono mb-4">
              {template.heading || (finalMode === "PARTICIPANT_SYNC" ? "ANNOUNCEMENT" : "ANNOUNCEMENT")}
            </h2>
            {(template.subheading) && (
              <h3 className="text-xl text-[var(--color-apb-cyan)] uppercase font-mono mb-4">
                {template.subheading}
              </h3>
            )}
            {template.body && (
              <p className="text-xl text-slate-300 mx-auto whitespace-pre-wrap text-left bg-black/40 p-6 rounded-lg border border-[var(--color-apb-surface-border)]">
                {template.body}
              </p>
            )}
            {template.imageUrl && (
              <div className="mt-6">
                <img src={template.imageUrl} alt="Announcement" className="max-w-full h-auto rounded-lg mx-auto" />
              </div>
            )}
          </div>
        </div>
      );
    }`;

file = file.replace(/if \(finalMode === "ANNOUNCEMENT"\) \{[\s\S]*?    \}/, replacement);

const modesReplacement = `  const overlayModes = ["RULES", "ROUND_INTRO", "COUNTDOWN", "CONSTRAINT_REVEAL", "ANNOUNCEMENT", "PAUSED", "EMERGENCY", "ROUND_COMPLETE", "LOCKED", "WAITING", "PARTICIPANT_SYNC"];`;
file = file.replace(`  const overlayModes = ["RULES", "ROUND_INTRO", "COUNTDOWN", "CONSTRAINT_REVEAL", "ANNOUNCEMENT", "PAUSED", "EMERGENCY", "ROUND_COMPLETE", "LOCKED", "WAITING"];`, modesReplacement);

fs.writeFileSync("src/components/apb/ParticipantScreenOverlay.tsx", file);
console.log("Fixed overlay sync");

