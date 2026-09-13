/**
 * APB Organizer Setup
 * Run: node scripts/add-organizer.mjs <UID>
 * 
 * Adds a UID to the 'organizers' collection so they can log in.
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(join(__dirname, "../.env.local"), "utf-8");
const env = Object.fromEntries(
  envContent.split("\n")
    .map(l => l.match(/^([^#=\s][^=]*)=["']?([^"'\n]*)["']?/))
    .filter(Boolean)
    .map(([, k, v]) => [k.trim(), v.trim()])
);

const firebaseConfig = {
  apiKey:            env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);

const uid = process.argv[2];

if (!uid) {
  console.error("Please provide a UID: node scripts/add-organizer.mjs <UID>");
  process.exit(1);
}

async function run() {
  console.log(`Adding ${uid} as an organizer...`);
  // Note: we can't write from client SDK directly because rules say `allow write: if false`
  // Wait, if rules are `allow write: if false`, we cannot do this from a client SDK without admin privileges!
  console.error("This script uses the client SDK, which will be blocked by Firestore rules.");
  console.log("Please go to the Firebase Console -> Firestore Database -> Start collection 'organizers'.");
  console.log("Document ID: <Your Google UID>, fields can be anything (e.g. role: 'admin').");
}

run();
