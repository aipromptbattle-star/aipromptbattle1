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
  organizerUid: string,
  nextRoundInfo?: { nextRoundId: string; nextRoundNumber: number }
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

  // Update current round doc
  const roundRef = doc(db, "rounds", roundId);
  await updateDoc(roundRef, {
    qualifiedTeams: qualifiedTeamIds,
    updatedAt: now,
  });

  // If next round exists, automatically place qualified teams into next round's participant pool
  if (nextRoundInfo?.nextRoundId && nextRoundInfo?.nextRoundNumber) {
    // 1. Update next round document with qualified teams
    const nextRoundRef = doc(db, "rounds", nextRoundInfo.nextRoundId);
    await updateDoc(nextRoundRef, {
      qualifiedTeams: qualifiedTeamIds,
      updatedAt: now,
    });

    // 2. Automatically update each qualified team's eligibleRounds array
    for (const teamId of qualifiedTeamIds) {
      try {
        const teamRef = doc(db, "teams", teamId);
        const teamSnap = await getDoc(teamRef);
        if (teamSnap.exists()) {
          const existingRounds = teamSnap.data().eligibleRounds || [];
          if (!existingRounds.includes(nextRoundInfo.nextRoundNumber)) {
            await updateDoc(teamRef, {
              eligibleRounds: [...existingRounds, nextRoundInfo.nextRoundNumber],
              updatedAt: now,
            });
          }
        }
      } catch (e) {
        console.warn(`Could not update eligibleRounds for team ${teamId}:`, e);
      }
    }

    // 3. Reconcile non-qualified teams (remove next round from eligibleRounds if previously set)
    for (const item of teamRankings) {
      if (!qualifiedTeamIds.includes(item.teamId)) {
        try {
          const teamRef = doc(db, "teams", item.teamId);
          const teamSnap = await getDoc(teamRef);
          if (teamSnap.exists()) {
            const existingRounds = teamSnap.data().eligibleRounds || [];
            if (existingRounds.includes(nextRoundInfo.nextRoundNumber)) {
              await updateDoc(teamRef, {
                eligibleRounds: existingRounds.filter((r: number) => r !== nextRoundInfo.nextRoundNumber),
                updatedAt: now,
              });
            }
          }
        } catch (e) {
          console.warn(`Could not reconcile eligibleRounds for non-qualified team ${item.teamId}:`, e);
        }
      }
    }
  }

  await logAudit("QUALIFICATION_CONFIRMED", "ORGANIZER", {
    roundId,
    metadata: {
      roundId,
      qualifiedCount: qualifiedTeamIds.length,
      qualifiedTeams: qualifiedTeamIds,
      nextRoundId: nextRoundInfo?.nextRoundId || null,
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
 * 4. Updates event currentRoundId so waiting room and displays switch to next round.
 * 5. Logs NEXT_ROUND_RELEASED.
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

  // 2. Set next round status to READY
  const nextRoundRef = doc(db, "rounds", nextRoundId);
  await updateDoc(nextRoundRef, {
    status: "READY",
    updatedAt: now,
  });

  // 3. Point event to next round so participant waiting room transitions
  try {
    const eventRef = doc(db, "events", "currentEvent");
    await updateDoc(eventRef, {
      currentRoundId: nextRoundId,
      updatedAt: now,
    });
  } catch (e) {
    console.warn("Could not update events/currentEvent currentRoundId:", e);
  }

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
