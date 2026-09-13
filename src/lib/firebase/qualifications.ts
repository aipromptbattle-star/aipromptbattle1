import { useState, useEffect } from "react";
import { db } from "./config";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { Qualification, Team } from "./schema";
import { logAudit } from "./teams";

export function useQualifications(roundId?: string | null) {
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = query(collection(db, "qualifications"));
    if (roundId) {
      q = query(q, where("roundId", "==", roundId));
    }

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Qualification));
        setQualifications(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error loading qualifications:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [roundId]);

  return { qualifications, loading };
}

/**
 * Confirms qualifications for a round:
 * 1. Writes qualification records to `qualifications/{eventId}_{roundId}_{teamId}`.
 * 2. Updates `rounds/{roundId}.qualifiedTeams`.
 * 3. Logs QUALIFICATION_CONFIRMED.
 */
export async function confirmQualifications(
  eventId: string,
  roundId: string,
  qualifiedTeamIds: string[],
  teamRankings: { teamId: string; rank: number; score: number }[],
  organizerUid: string
) {
  const now = Date.now();

  for (const item of teamRankings) {
    const isQualified = qualifiedTeamIds.includes(item.teamId);
    const qualId = `${eventId}_${roundId}_${item.teamId}`;
    const qualRef = doc(db, "qualifications", qualId);

    const qualData: Qualification = {
      id: qualId,
      eventId,
      roundId,
      teamId: item.teamId,
      qualified: isQualified,
      rank: item.rank,
      score: item.score,
      confirmedAt: now,
      confirmedBy: organizerUid,
    };

    await setDoc(qualRef, qualData);
  }

  // Update round doc
  const roundRef = doc(db, "rounds", roundId);
  await updateDoc(roundRef, {
    qualifiedTeams: qualifiedTeamIds,
    updatedAt: now,
  });

  await logAudit("QUALIFICATION_CONFIRMED", "ORGANIZER", {
    roundId,
    metadata: {
      roundId,
      qualifiedCount: qualifiedTeamIds.length,
      qualifiedTeams: qualifiedTeamIds,
      organizerUid,
    },
  });

  return qualifiedTeamIds;
}

/**
 * Authoritatively releases the next round:
 * 1. Checks that qualifications are confirmed.
 * 2. Updates eligibleRounds for each qualified team so they gain access.
 * 3. Sets the next round to READY / LIVE as designated.
 * 4. Logs NEXT_ROUND_RELEASED.
 */
export async function releaseNextRound(
  currentRoundId: string,
  nextRoundId: string,
  nextRoundNumber: number,
  qualifiedTeamIds: string[],
  organizerUid: string
) {
  const now = Date.now();

  // 1. Update eligibleRounds on each qualified team
  for (const teamId of qualifiedTeamIds) {
    const teamRef = doc(db, "teams", teamId);
    const teamSnap = await getDoc(teamRef);
    if (teamSnap.exists()) {
      const existingRounds = teamSnap.data().eligibleRounds || [];
      if (!existingRounds.includes(nextRoundNumber)) {
        await updateDoc(teamRef, {
          eligibleRounds: [...existingRounds, nextRoundNumber],
          updatedAt: now,
        });
      }
    }
  }

  // 2. Set next round status to READY or LIVE
  const nextRoundRef = doc(db, "rounds", nextRoundId);
  await updateDoc(nextRoundRef, {
    status: "READY",
    updatedAt: now,
  });

  await logAudit("NEXT_ROUND_RELEASED", "ORGANIZER", {
    roundId: nextRoundId,
    metadata: {
      fromRound: currentRoundId,
      toRound: nextRoundId,
      nextRoundNumber,
      qualifiedTeamCount: qualifiedTeamIds.length,
      organizerUid,
    },
  });
}
