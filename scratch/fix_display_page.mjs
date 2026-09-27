
import fs from "fs";

let file = fs.readFileSync("src/app/display/page.tsx", "utf8");

// Remove the bad ParticipantScreenOverlay injection (it was injected with a broken closing tag)
file = file
  .replace(
    `<ParticipantScreenOverlay
            globalScreenMode={displayOverride as any}
            boardState={eventState?.displayBoardState as any}
          >

        {/* CUSTOM IMAGE MODE */}`,
    `{/* CUSTOM IMAGE MODE */}`
  )
  .replace(
    `</main>

      </ParticipantScreenOverlay>`,
    `</main>`
  );

// Fix the corrupted newlines from the bad previous replacement
file = file.replace(/\}\}\\n\\n          <\/div>\n        \}\}\\n\\n      <\/main>/, `
            )}

          </div>
        )}

      </main>`);

// Also remove duplicate constraint section if any
const lines = file.split("\n");
const newLines = [];
let prevLine = null;
for (const line of lines) {
  if (prevLine !== null) newLines.push(prevLine);
  prevLine = line;
}
if (prevLine !== null) newLines.push(prevLine);

fs.writeFileSync("src/app/display/page.tsx", newLines.join("\n"));
console.log("Fixed display page, length:", file.length);

