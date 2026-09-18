
import fs from "fs";

let file = fs.readFileSync("src/app/organizer/display/page.tsx", "utf8");

file = file.replace(
  `      await updateEventSettings({
        displayOverride: selectedMode,
        displayBoardState: {
          mode: selectedMode,`,
  `      await updateEventSettings({
        displayOverride: selectedMode,
        displayHeading: draftHeading || null,
        displaySubheading: draftSubheading || null,
        displayBody: draftBody || null,
        displayImageUrl: draftImageUrl || null,
        displayBoardState: {
          mode: selectedMode,`
);

fs.writeFileSync("src/app/organizer/display/page.tsx", file);
console.log("Fixed showOnDisplay legacy fields");

