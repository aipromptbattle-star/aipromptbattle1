import { useState, useEffect } from "react";
import { db } from "./config";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc,
  updateDoc,
  query,
  orderBy,
  getDocs,
  where
} from "firebase/firestore";
import { Round } from "./schema";
import { logAudit } from "./teams"; // Reusing the audit log

export function useRounds() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "rounds"), orderBy("roundNumber", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Round));
      setRounds(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { rounds, loading };
}

export async function createRound(roundData: Omit<Round, "id" | "status" | "startedAt" | "endsAt" | "pausedRemainingSeconds" | "createdAt" | "updatedAt">) {
  // Prevent duplicate round numbers
  const q = query(collection(db, "rounds"), where("roundNumber", "==", roundData.roundNumber));
  const existing = await getDocs(q);
  if (!existing.empty) {
    throw new Error(`Round number ${roundData.roundNumber} already exists.`);
  }

  const newRoundRef = doc(collection(db, "rounds"));
  const newRound: Round = {
    id: newRoundRef.id,
    ...roundData,
    status: "READY", // New rounds are READY by default for phase 1 (could be DRAFT)
    startedAt: null,
    endsAt: null,
    pausedRemainingSeconds: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await setDoc(newRoundRef, newRound);
  await logAudit("ROUND_CREATED", "ORGANIZER", { roundId: newRound.id });
  
  return newRound.id;
}

export async function updateRound(roundId: string, updates: Partial<Omit<Round, "id" | "createdAt">>) {
  const roundRef = doc(db, "rounds", roundId);
  await updateDoc(roundRef, {
    ...updates,
    updatedAt: Date.now(),
  });
  await logAudit("ROUND_UPDATED", "ORGANIZER", {
    roundId,
    metadata: updates as Record<string, unknown>,
  });
}
