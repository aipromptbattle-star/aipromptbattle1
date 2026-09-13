import { useState, useEffect } from "react";
import { 
  doc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  runTransaction
} from "firebase/firestore";
import { db } from "./config";
import { Submission, TeamRoundState, Round } from "./schema";
import { logAudit } from "./teams";

export function getSubmissionDocId(eventId: string, teamId: string, roundId: string): string {
  return `${eventId}_${teamId}_${roundId}`;
}

export function useTeamRoundState(eventId: string | null, teamId: string | null, roundId: string | null) {
  const [teamRoundState, setTeamRoundState] = useState<TeamRoundState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId || !teamId || !roundId) {
      queueMicrotask(() => {
        setTeamRoundState(null);
        setLoading(false);
      });
      return;
    }

    const docId = getSubmissionDocId(eventId, teamId, roundId);
    const ref = doc(db, "teamRoundState", docId);

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      if (snapshot.exists()) {
        setTeamRoundState(snapshot.data() as TeamRoundState);
      } else {
        setTeamRoundState({
          eventId,
          teamId,
          roundId,
          status: "NOT_STARTED",
          version: 1,
          updatedAt: Date.now(),
        });
      }
      setLoading(false);
    }, (err) => {
      console.error("Error subscribing to teamRoundState:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId, teamId, roundId]);

  return { teamRoundState, loading };
}

export function useSubmission(eventId: string | null, teamId: string | null, roundId: string | null) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId || !teamId || !roundId) {
      queueMicrotask(() => {
        setSubmission(null);
        setLoading(false);
      });
      return;
    }

    const docId = getSubmissionDocId(eventId, teamId, roundId);
    const ref = doc(db, "submissions", docId);

    const unsubscribe = onSnapshot(ref, (snapshot) => {
      if (snapshot.exists()) {
        setSubmission(snapshot.data() as Submission);
      } else {
        setSubmission(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error subscribing to submission:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId, teamId, roundId]);

  return { submission, loading };
}

// Hook for Organizer to monitor all submissions for a round
export function useAllSubmissions(eventId: string | null, roundId: string | null) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId || !roundId) {
      queueMicrotask(() => {
        setSubmissions([]);
        setLoading(false);
      });
      return;
    }

    const q = query(
      collection(db, "submissions"),
      where("eventId", "==", eventId),
      where("roundId", "==", roundId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => d.data() as Submission);
      setSubmissions(data);
      setLoading(false);
    }, (err) => {
      console.error("Error subscribing to all submissions:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId, roundId]);

  return { submissions, loading };
}

// Hook for Organizer to monitor all team states for a round
export function useAllTeamRoundStates(eventId: string | null, roundId: string | null) {
  const [states, setStates] = useState<TeamRoundState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId || !roundId) {
      queueMicrotask(() => {
        setStates([]);
        setLoading(false);
      });
      return;
    }

    const q = query(
      collection(db, "teamRoundState"),
      where("eventId", "==", eventId),
      where("roundId", "==", roundId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => d.data() as TeamRoundState);
      setStates(data);
      setLoading(false);
    }, (err) => {
      console.error("Error subscribing to all teamRoundStates:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId, roundId]);

  return { states, loading };
}

export interface FinalSubmissionPayload {
  eventId: string;
  teamId: string;
  roundId: string;
  prompt: string;
  member1Data?: {
    text?: string;
  };
  member2Data?: {
    text?: string;
    imageUrl?: string;
    fileName?: string;
  };
  submittedBy: string;
}

export async function submitFinalResponse(payload: FinalSubmissionPayload): Promise<{ success: boolean; error?: string }> {
  const { eventId, teamId, roundId, prompt, member1Data, member2Data, submittedBy } = payload;
  const docId = getSubmissionDocId(eventId, teamId, roundId);
  const now = Date.now();

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Authoritative check on the round state
      const roundRef = doc(db, "rounds", roundId);
      const roundSnap = await transaction.get(roundRef);
      if (!roundSnap.exists()) {
        throw new Error("Round does not exist.");
      }

      const roundData = roundSnap.data() as Round;
      if (roundData.status !== "LIVE") {
        throw new Error(`Cannot submit: Round is ${roundData.status}. Submissions are locked.`);
      }

      // 2. Authoritative check on deadline
      if (roundData.endsAt && now > roundData.endsAt) {
        throw new Error("Deadline has passed. Submissions are no longer accepted.");
      }

      // 3. Prevent duplicate submissions
      const subRef = doc(db, "submissions", docId);
      const subSnap = await transaction.get(subRef);
      if (subSnap.exists()) {
        throw new Error("Final submission already recorded for this round. Multiple submissions are not allowed.");
      }

      // 4. Create authoritative final submission document
      const newSubmission: Submission = {
        id: docId,
        eventId,
        teamId,
        roundId,
        prompt: prompt.trim(),
        member1Data: member1Data || { text: "" },
        member2Data: member2Data || { text: "", imageUrl: "", fileName: "" },
        submittedAt: now,
        submittedBy,
        status: "FINAL",
        version: 1,
      };
      transaction.set(subRef, newSubmission);

      // 5. Update team round state atomically
      const stateRef = doc(db, "teamRoundState", docId);
      const updatedState: TeamRoundState = {
        eventId,
        teamId,
        roundId,
        status: "SUBMITTED",
        submittedAt: now,
        lastSavedAt: now,
        version: 1,
        updatedAt: now,
      };
      transaction.set(stateRef, updatedState, { merge: true });
    });

    // 6. Log audit event (best-effort — Firestore rules only allow organizers to
    //    write auditLogs; this call may be silently rejected for participants, which
    //    is acceptable because the submission itself is already committed above.)
    try {
      await logAudit("ROUND_SUBMITTED", "PARTICIPANT", {
        eventId,
        roundId,
        teamId,
        metadata: { submittedBy, submissionId: docId },
      });
    } catch {
      console.warn("Audit log for submission could not be written (rules: organizer-only). Submission was committed successfully.");
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("Submission failed:", err);
    const message = err instanceof Error ? err.message : "Final submission failed.";
    return { success: false, error: message };
  }
}
