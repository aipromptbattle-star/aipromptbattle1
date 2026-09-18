
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "dummy",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "dummy",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "dummy",
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

