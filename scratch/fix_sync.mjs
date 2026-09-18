
import fs from "fs";

let file = fs.readFileSync("src/app/organizer/participant-board/page.tsx", "utf8");

file = file.replace(
  `      await updateEventSettings({
        displayBoardState: {
          mode: "PARTICIPANT_SYNC" as any,`,
  `      await updateEventSettings({
        displayOverride: "PARTICIPANT_SYNC" as any,
        displayHeading: draftHeading || null,
        displaySubheading: draftSubheading || null,
        displayBody: draftBody || null,
        displayImageUrl: draftImageUrl || null,
        displayBoardState: {
          mode: "PARTICIPANT_SYNC" as any,`
);

fs.writeFileSync("src/app/organizer/participant-board/page.tsx", file);
console.log("Fixed syncToDisplay legacy fields");

