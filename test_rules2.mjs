
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  try {
    const cred = await signInAnonymously(auth);
    console.log("Anonymous UID:", cred.user.uid);
    
    // Create session
    const sessionRef = doc(db, "sessions", cred.user.uid);
    await setDoc(sessionRef, {
      teamId: "APB-001",
      eventId: "currentEvent",
      connectedAt: Date.now(),
      lastActiveAt: Date.now()
    });
    console.log("Session created!");

    // Try listening to draft
    const draftId = "currentEvent_APB-001_1";
    const draftRef = doc(db, "drafts", draftId);
    
    return new Promise((resolve) => {
      const unsub = onSnapshot(draftRef, (snap) => {
        console.log("Draft onSnapshot success! Exists:", snap.exists());
        unsub();
        resolve();
      }, (err) => {
        console.error("Draft onSnapshot ERROR:", err.code, err.message);
        unsub();
        resolve();
      });
    });

  } catch (e) {
    console.error("Fatal Error:", e);
  } finally {
    process.exit(0);
  }
}
run();

