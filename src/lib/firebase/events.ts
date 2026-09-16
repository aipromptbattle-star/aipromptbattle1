import { useState, useEffect } from "react";
import { db } from "./config";
import { 
  doc, 
  onSnapshot, 
  runTransaction,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { Event, Round } from "./schema";
import { logAudit } from "./teams";

export const EVENT_ID = "currentEvent";

export function useEventState() {
  const [eventState, setEventState] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "events", EVENT_ID), (snapshot) => {
      if (snapshot.exists()) {
        setEventState(snapshot.data() as Event);
      } else {
        setEventState(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { eventState, loading };
}

export function useCurrentRound(roundId: string | null) {
  const [currentRound, setCurrentRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roundId) {
      queueMicrotask(() => {
        setCurrentRound(null);
        setLoading(false);
      });
      return;
    }
    
    const unsubscribe = onSnapshot(doc(db, "rounds", roundId), (snapshot) => {
      if (snapshot.exists()) {
        setCurrentRound({ ...snapshot.data(), id: snapshot.id } as Round);
      } else {
        setCurrentRound(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roundId]);

  return { currentRound, loading };
}

export async function startRound(roundId: string, durationSeconds: number) {
  const now = Date.now();
  const COUNTDOWN_MS = 5000;
  const countdownEndsAt = now + COUNTDOWN_MS;
  const roundEndsAt = countdownEndsAt + (durationSeconds * 1000);

  let alreadyStartingOrLive = false;

  await runTransaction(db, async (transaction) => {
    const eventRef = doc(db, "events", EVENT_ID);
    const roundRef = doc(db, "rounds", roundId);
    const roundSnap = await transaction.get(roundRef);
    if (!roundSnap.exists()) throw new Error("Round not found.");

    const roundData = roundSnap.data() as Round;
    // Idempotency: Section 14: DO NOT START THE ROUND TWICE
    if (roundData.status === "STARTING" || roundData.status === "LIVE") {
      alreadyStartingOrLive = true;
      return;
    }

    transaction.update(eventRef, {
      currentRoundId: roundId,
      status: "LIVE",
      updatedAt: now
    });

    transaction.update(roundRef, {
      status: "STARTING",
      countdownStartedAt: now,
      countdownEndsAt: countdownEndsAt,
      startedAt: countdownEndsAt,
      endsAt: roundEndsAt,
      pausedRemainingSeconds: null,
      updatedAt: now
    });
  });

  if (alreadyStartingOrLive) {
    console.warn("Round is already starting or live; ignoring duplicate start.");
    return;
  }

  await logAudit("ROUND_STARTING", "ORGANIZER", { roundId, metadata: { countdownEndsAt } });
}

export async function finalizeRoundStart(roundId: string) {
  let transitioned = false;
  try {
    await runTransaction(db, async (transaction) => {
      const roundRef = doc(db, "rounds", roundId);
      const roundSnap = await transaction.get(roundRef);
      if (!roundSnap.exists()) return;
      const roundData = roundSnap.data() as Round;
      if (roundData.status === "STARTING") {
        transaction.update(roundRef, {
          status: "LIVE",
          updatedAt: Date.now()
        });
        transitioned = true;
      }
    });
    if (transitioned) {
      await logAudit("ROUND_STARTED", "ORGANIZER", { roundId });
    }
  } catch (err) {
    console.error("finalizeRoundStart error:", err);
  }
}

export async function pauseRound(roundId: string) {
  const now = Date.now();
  
  await runTransaction(db, async (transaction) => {
    const roundRef = doc(db, "rounds", roundId);
    const roundDoc = await transaction.get(roundRef);
    if (!roundDoc.exists()) throw new Error("Round not found.");
    
    const roundData = roundDoc.data() as Round;
    if (roundData.status !== "LIVE" || !roundData.endsAt) {
      throw new Error("Round is not live.");
    }
    
    const remainingMs = Math.max(0, roundData.endsAt - now);
    const remainingSeconds = Math.floor(remainingMs / 1000);

    transaction.update(roundRef, {
      status: "PAUSED",
      endsAt: null,
      pausedRemainingSeconds: remainingSeconds,
      updatedAt: now
    });
  });

  await logAudit("ROUND_PAUSED", "ORGANIZER", { roundId });
}

export async function resumeRound(roundId: string) {
  const now = Date.now();

  await runTransaction(db, async (transaction) => {
    const roundRef = doc(db, "rounds", roundId);
    const roundDoc = await transaction.get(roundRef);
    if (!roundDoc.exists()) throw new Error("Round not found.");
    
    const roundData = roundDoc.data() as Round;
    if (roundData.status !== "PAUSED" || roundData.pausedRemainingSeconds == null) {
      throw new Error("Round is not paused.");
    }

    const endsAt = now + (roundData.pausedRemainingSeconds * 1000);

    transaction.update(roundRef, {
      status: "LIVE",
      endsAt: endsAt,
      pausedRemainingSeconds: null,
      updatedAt: now
    });
  });

  await logAudit("ROUND_RESUMED", "ORGANIZER", { roundId });
}

export async function extendTime(roundId: string, additionalSeconds: number) {
  const now = Date.now();

  await runTransaction(db, async (transaction) => {
    const roundRef = doc(db, "rounds", roundId);
    const roundDoc = await transaction.get(roundRef);
    if (!roundDoc.exists()) throw new Error("Round not found.");
    
    const roundData = roundDoc.data() as Round;

    if (roundData.status === "LIVE" && roundData.endsAt) {
      transaction.update(roundRef, {
        endsAt: roundData.endsAt + (additionalSeconds * 1000),
        updatedAt: now
      });
    } else if (roundData.status === "PAUSED" && roundData.pausedRemainingSeconds != null) {
      transaction.update(roundRef, {
        pausedRemainingSeconds: roundData.pausedRemainingSeconds + additionalSeconds,
        updatedAt: now
      });
    } else {
      throw new Error("Cannot extend time in current state.");
    }
  });

  await logAudit("ROUND_EXTENDED", "ORGANIZER", { roundId, metadata: { additionalSeconds } });
}

export async function endRound(roundId: string) {
  const now = Date.now();

  await runTransaction(db, async (transaction) => {
    const roundRef = doc(db, "rounds", roundId);
    transaction.update(roundRef, {
      status: "CLOSED",
      endsAt: null,
      pausedRemainingSeconds: null,
      updatedAt: now
    });
  });

  await logAudit("ROUND_ENDED", "ORGANIZER", { roundId });
}

export async function reopenRound(roundId: string, durationSeconds = 300) {
  const now = Date.now();
  const endsAt = now + (durationSeconds * 1000);

  await runTransaction(db, async (transaction) => {
    const eventRef = doc(db, "events", EVENT_ID);
    const roundRef = doc(db, "rounds", roundId);

    transaction.update(eventRef, {
      currentRoundId: roundId,
      status: "LIVE",
      updatedAt: now,
    });

    transaction.update(roundRef, {
      status: "LIVE",
      startedAt: now,
      endsAt: endsAt,
      pausedRemainingSeconds: null,
      updatedAt: now,
    });
  });

  await logAudit("ROUND_REOPENED", "ORGANIZER", { roundId, metadata: { durationSeconds } });
}

export async function resetRound(roundId: string) {
  const now = Date.now();

  await runTransaction(db, async (transaction) => {
    const roundRef = doc(db, "rounds", roundId);
    transaction.update(roundRef, {
      status: "READY",
      startedAt: null,
      endsAt: null,
      pausedRemainingSeconds: null,
      countdownStartedAt: null,
      countdownEndsAt: null,
      updatedAt: now,
    });
  });

  await logAudit("ROUND_RESET", "ORGANIZER", { roundId });
}

export async function updateEventSettings(updates: Partial<Event>) {
  const eventRef = doc(db, "events", EVENT_ID);
  await updateDoc(eventRef, {
    ...updates,
    updatedAt: Date.now(),
  });
  await logAudit("EVENT_SETTINGS_UPDATED", "ORGANIZER", {
    metadata: updates as Record<string, unknown>,
  });
}

export async function initEvent() {
  const eventRef = doc(db, "events", EVENT_ID);
  await setDoc(eventRef, {
    eventName: "AI Prompt Battle",
    status: "DRAFT",
    currentRoundId: null,
    totalRounds: 4,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }, { merge: true });
}
