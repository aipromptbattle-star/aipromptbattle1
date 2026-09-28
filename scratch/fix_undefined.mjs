
import fs from "fs";

let f = fs.readFileSync("src/lib/firebase/events.ts", "utf8");

const oldFn = `export async function updateEventSettings(updates: Partial<Event>) {
  const eventRef = doc(db, "events", EVENT_ID);
  await updateDoc(eventRef, {
    ...updates,
    updatedAt: Date.now(),
  });`;

const newFn = `export async function updateEventSettings(updates: Partial<Event>) {
  const eventRef = doc(db, "events", EVENT_ID);
  
  // Strip out undefined values to prevent Firestore crashes
  const cleanUpdates = Object.fromEntries(
    Object.entries(updates).filter(([_, v]) => v !== undefined)
  );

  await updateDoc(eventRef, {
    ...cleanUpdates,
    updatedAt: Date.now(),
  });`;

f = f.replace(oldFn, newFn);
fs.writeFileSync("src/lib/firebase/events.ts", f);

// Also fix in display/page.tsx just to be safe if it explicitly passes undefined
let dPage = fs.readFileSync("src/app/organizer/display/page.tsx", "utf8");
dPage = dPage.replace(/draftHeading \|\| undefined/g, "draftHeading || null");
dPage = dPage.replace(/draftSubheading \|\| undefined/g, "draftSubheading || null");
dPage = dPage.replace(/draftBody \|\| undefined/g, "draftBody || null");
dPage = dPage.replace(/draftImageUrl \|\| undefined/g, "draftImageUrl || null");
fs.writeFileSync("src/app/organizer/display/page.tsx", dPage);

console.log("Fixed undefined errors");

