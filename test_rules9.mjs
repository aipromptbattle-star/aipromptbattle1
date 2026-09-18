
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  const cred = await signInAnonymously(auth);
  const sessionRef = doc(db, "sessions", cred.user.uid);
  await setDoc(sessionRef, { teamId: "APB-001", eventId: "currentEvent", connectedAt: Date.now(), lastActiveAt: Date.now() });

  try {
      const snap = await getDoc(doc(db, "drafts", "currentEvent_APB-001_100"));
      console.log("Success! Exists:", snap.exists());
  } catch(e) {
      console.error("ERROR:", e.code);
  }
  process.exit(0);
}
run();

