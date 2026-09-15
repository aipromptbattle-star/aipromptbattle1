import { useState, useEffect } from "react";
import { db } from "./config";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { Judge, JudgeAssignment, JudgeScore, ScoringCriterion } from "./schema";
import { logAudit } from "./teams";
import { calculateDeterministicScore } from "../scoring";

// ─────────────────────────────────────────────────────────────
// 1. JUDGES MANAGEMENT (Organizer)
// ─────────────────────────────────────────────────────────────

export function useJudges() {
  const [judges, setJudges] = useState<Judge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "judges"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ uid: d.id, ...d.data() } as Judge));
        setJudges(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading judges:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return { judges, loading };
}

export async function addJudge(judgeData: { uid: string; displayName: string; email: string }) {
  const normalizedUid = judgeData.uid.trim();
  if (!normalizedUid) throw new Error("Judge UID cannot be empty.");

  const judgeRef = doc(db, "judges", normalizedUid);
  const newJudge: Judge = {
    uid: normalizedUid,
    displayName: judgeData.displayName.trim(),
    email: judgeData.email.trim(),
    active: true,
    createdAt: Date.now(),
  };

  await setDoc(judgeRef, newJudge);
  await logAudit("JUDGE_CREATED", "ORGANIZER", {
    metadata: { judgeId: normalizedUid, displayName: newJudge.displayName },
  });
  return normalizedUid;
}

export async function toggleJudgeStatus(uid: string, active: boolean) {
  const judgeRef = doc(db, "judges", uid);
  await updateDoc(judgeRef, { active });
  await logAudit(active ? "JUDGE_ENABLED" : "JUDGE_DISABLED", "ORGANIZER", {
    metadata: { judgeId: uid },
  });
}

export async function removeJudge(uid: string) {
  const judgeRef = doc(db, "judges", uid);
  await deleteDoc(judgeRef);
  await logAudit("JUDGE_REMOVED", "ORGANIZER", {
    metadata: { judgeId: uid },
  });
}

// ─────────────────────────────────────────────────────────────
// 2. JUDGE ASSIGNMENTS (Organizer controls)
// ─────────────────────────────────────────────────────────────

export function useJudgeAssignments(judgeId?: string | null, roundId?: string | null) {
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = query(collection(db, "judgeAssignments"));

    if (judgeId) {
      q = query(q, where("judgeId", "==", judgeId));
    }
    if (roundId) {
      q = query(q, where("roundId", "==", roundId));
    }

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as JudgeAssignment));
        setAssignments(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading assignments:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [judgeId, roundId]);

  return { assignments, loading };
}

export async function assignJudge(data: {
  eventId: string;
  roundId: string;
  submissionId: string;
  teamId: string;
  judgeId: string;
  judgeName: string;
  assignedBy: string;
}) {
  const assignmentId = `${data.eventId}_${data.roundId}_${data.submissionId}_${data.judgeId}`;
  const ref = doc(db, "judgeAssignments", assignmentId);

  const newAssignment: JudgeAssignment = {
    id: assignmentId,
    eventId: data.eventId,
    roundId: data.roundId,
    submissionId: data.submissionId,
    teamId: data.teamId,
    judgeId: data.judgeId,
    judgeName: data.judgeName,
    status: "PENDING",
    createdAt: Date.now(),
    assignedBy: data.assignedBy,
  };

  await setDoc(ref, newAssignment);
  await logAudit("JUDGE_ASSIGNED", "ORGANIZER", {
    metadata: {
      assignmentId,
      judgeId: data.judgeId,
      teamId: data.teamId,
      roundId: data.roundId,
    },
  });
  return assignmentId;
}

export async function unassignJudge(assignmentId: string) {
  const ref = doc(db, "judgeAssignments", assignmentId);
  await deleteDoc(ref);
  await logAudit("JUDGE_UNASSIGNED", "ORGANIZER", {
    metadata: { assignmentId },
  });
}

/**
 * Auto-distributes submissions evenly across active judges.
 * Supports N judges per submission.
 */
export async function autoDistributeAssignments(
  submissions: { id: string; teamId: string; roundId: string }[],
  judges: Judge[],
  judgesPerSubmission = 1,
  eventId = "currentEvent",
  assignedBy = "ORGANIZER"
) {
  const activeJudges = judges.filter((j) => j.active);
  if (activeJudges.length === 0) {
    throw new Error("No active judges available for assignment.");
  }
  if (submissions.length === 0) {
    return 0;
  }

  let assignedCount = 0;
  let judgeIndex = 0;

  for (const sub of submissions) {
    for (let i = 0; i < judgesPerSubmission; i++) {
      const judge = activeJudges[judgeIndex % activeJudges.length];
      judgeIndex++;

      const assignmentId = `${eventId}_${sub.roundId}_${sub.id}_${judge.uid}`;
      const ref = doc(db, "judgeAssignments", assignmentId);
      const assignment: JudgeAssignment = {
        id: assignmentId,
        eventId,
        roundId: sub.roundId,
        submissionId: sub.id,
        teamId: sub.teamId,
        judgeId: judge.uid,
        judgeName: judge.displayName,
        status: "PENDING",
        createdAt: Date.now(),
        assignedBy,
      };
      await setDoc(ref, assignment);
      assignedCount++;
    }
  }

  await logAudit("JUDGES_AUTO_ASSIGNED", "ORGANIZER", {
    metadata: {
      submissionsCount: submissions.length,
      assignedCount,
      judgesCount: activeJudges.length,
    },
  });

  return assignedCount;
}

// ─────────────────────────────────────────────────────────────
// 3. JUDGE SCORES
// ─────────────────────────────────────────────────────────────

export function useJudgeScores(roundId?: string | null, submissionId?: string | null) {
  const [scores, setScores] = useState<JudgeScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = query(collection(db, "scores"));

    if (roundId) {
      q = query(q, where("roundId", "==", roundId));
    }
    if (submissionId) {
      q = query(q, where("submissionId", "==", submissionId));
    }

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as JudgeScore));
        setScores(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading judge scores:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [roundId, submissionId]);

  return { scores, loading };
}

export async function saveJudgeScore(data: {
  eventId: string;
  roundId: string;
  submissionId: string;
  teamId: string;
  judgeId: string;
  judgeName: string;
  score?: number; // Single overall score (0-100 integer)
  criteriaScores?: Record<string, number>;
  comments?: string;
  status: "DRAFT" | "FINAL";
  criteria?: ScoringCriterion[];
}) {
  const scoreId = `${data.eventId}_${data.roundId}_${data.submissionId}_${data.judgeId}`;
  const scoreRef = doc(db, "scores", scoreId);
  const existingSnap = await getDoc(scoreRef);

  // If already finalized, a judge cannot edit
  if (existingSnap.exists() && existingSnap.data().status === "FINAL" && data.status === "DRAFT") {
    throw new Error("Score is finalized and cannot be converted back to DRAFT by a judge.");
  }

  let finalScore = 0;
  if (data.score !== undefined) {
    const raw = Number(data.score);
    if (!Number.isInteger(raw) || raw < 0 || raw > 100) {
      throw new Error("Overall score must be an integer between 0 and 100.");
    }
    finalScore = raw;
  } else if (data.criteriaScores) {
    finalScore = calculateDeterministicScore(data.criteriaScores, data.criteria);
  }

  const now = Date.now();

  const scorePayload: JudgeScore = {
    id: scoreId,
    eventId: data.eventId,
    roundId: data.roundId,
    submissionId: data.submissionId,
    teamId: data.teamId,
    judgeId: data.judgeId,
    judgeName: data.judgeName,
    criteriaScores: data.criteriaScores || {},
    finalScore,
    comments: (data.comments || "").trim(),
    status: data.status,
    createdAt: existingSnap.exists() ? existingSnap.data().createdAt : now,
    updatedAt: now,
    ...(data.status === "FINAL" ? { finalizedAt: now } : {}),
  };

  await setDoc(scoreRef, scorePayload);

  // Update assignment status if finalizing
  if (data.status === "FINAL") {
    const assignRef = doc(db, "judgeAssignments", scoreId);
    await updateDoc(assignRef, { status: "EVALUATED" }).catch(() => {});
  }

  await logAudit(
    data.status === "FINAL" ? "SCORE_FINALIZED" : "SCORE_DRAFT_SAVED",
    "JUDGE",
    {
      metadata: {
        scoreId,
        judgeId: data.judgeId,
        teamId: data.teamId,
        finalScore,
      },
    }
  );

  return finalScore;
}

export async function overrideJudgeScore(
  scoreId: string,
  newScore: number,
  reason: string,
  organizerUid: string
) {
  const scoreRef = doc(db, "scores", scoreId);
  const snap = await getDoc(scoreRef);
  if (!snap.exists()) throw new Error("Score document not found.");

  const beforeScore = snap.data().finalScore;
  const now = Date.now();

  await updateDoc(scoreRef, {
    overrideScore: newScore,
    overrideReason: reason.trim(),
    overrideBy: organizerUid,
    overrideAt: now,
    updatedAt: now,
  });

  await logAudit("SCORE_OVERRIDDEN", "ORGANIZER", {
    metadata: {
      scoreId,
      beforeScore,
      newScore,
      reason: reason.trim(),
      organizerUid,
    },
  });
}
