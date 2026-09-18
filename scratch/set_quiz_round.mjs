
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "vigyantra26",
  // Note: we can use the local emulator or actual project, but wait, the project config is in src/lib/firebase/config.ts!
};

