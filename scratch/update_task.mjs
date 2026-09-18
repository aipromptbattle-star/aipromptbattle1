
import fs from "fs";
let file = fs.readFileSync("C:/Users/Asus/.gemini/antigravity/brain/919e80e2-727d-4a3b-a4cc-2d3458cf269e/task.md", "utf8");

file = file.replace(/- `\[/\]` Build `ParticipantScreenOverlay\.tsx`/g, "- `[x]` Build `ParticipantScreenOverlay.tsx`");
file = file.replace(/- `\[ \]` Wrap `src\/app\/team\/page\.tsx`/g, "- `[x]` Wrap `src/app/team/page.tsx`");
file = file.replace(/- `\[ \]` Build `ParticipantControlPanel\.tsx` in `\/organizer\/live`/g, "- `[x]` Build `ParticipantControlPanel.tsx` in `/organizer/live`");
file = file.replace(/- `\[ \]` Build `BroadcastMessageDialog\.tsx`/g, "- `[x]` Build `BroadcastMessageDialog.tsx`");
file = file.replace(/- `\[ \]` Upgrade `ParticipantPreviewModal\.tsx` to read-only live view/g, "- `[x]` Upgrade `ParticipantPreviewModal.tsx` to read-only live view");
file = file.replace(/- `\[ \]` Update `firestore\.rules` to protect `overrideScreenMode`/g, "- `[x]` Update `firestore.rules` to protect `overrideScreenMode`");
file = file.replace(/- `\[ \]` Build `AuthRecoveryPanel\.tsx` in `\/organizer\/teams`/g, "- `[x]` Build `AuthRecoveryPanel.tsx` in `/organizer/teams`");
file = file.replace(/- `\[ \]` Modify `\/login\/page\.tsx` logic to intercept recovery status/g, "- `[x]` Modify `/login/page.tsx` logic to intercept recovery status");
file = file.replace(/- `\[ \]` Add schema for `quizVisitedQuestions`/g, "- `[x]` Add schema for `quizVisitedQuestions`");
file = file.replace(/- `\[ \]` Overhaul `QuizWorkspace\.tsx`/g, "- `[x]` Overhaul `QuizWorkspace.tsx`");
file = file.replace(/- `\[ \]` Implement `AuditLogs` for state changes/g, "- `[x]` Implement `AuditLogs` for state changes");
file = file.replace(/- `\[ \]` Build `GlobalEventHeader\.tsx`/g, "- `[x]` Build `GlobalEventHeader.tsx`");

fs.writeFileSync("C:/Users/Asus/.gemini/antigravity/brain/919e80e2-727d-4a3b-a4cc-2d3458cf269e/task.md", file);
console.log("Updated task.md");

