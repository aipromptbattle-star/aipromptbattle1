import { useState, useEffect } from "react";
import { db } from "./config";
import { 
  collection, 
  doc, 
  runTransaction, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  getDocs,
  query, 
  where,
  orderBy 
} from "firebase/firestore";
import { Team, Session, AuditLog } from "./schema";

// Normalizes Team ID
export const normalizeTeamId = (id: string) => id.trim().toUpperCase();

// Generates a clean 6-character access code for team login
export const generateAccessCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Helper to log audit events
export const logAudit = async (action: string, actor: string, details: Partial<AuditLog> = {}) => {
  const logRef = doc(collection(db, "auditLogs"));
  await setDoc(logRef, {
    action,
    actor,
    timestamp: Date.now(),
    ...details
  });
};

export async function addTeam(teamData: Omit<Team, "teamId" | "createdAt" | "updatedAt" | "active" | "eligibleRounds"> & { teamId: string }) {
  const normalizedId = normalizeTeamId(teamData.teamId);
  if (!normalizedId) throw new Error("Team ID cannot be empty.");

  const teamRef = doc(db, "teams", normalizedId);

  await runTransaction(db, async (transaction) => {
    const teamDoc = await transaction.get(teamRef);
    if (teamDoc.exists()) {
      throw new Error(`Team ID already exists: ${normalizedId}`);
    }

    const newTeam: Team = {
      teamId: normalizedId,
      displayName: teamData.displayName.trim(),
      member1: teamData.member1.trim(),
      member1Email: teamData.member1Email?.trim() || "",
      member2: teamData.member2.trim(),
      member2Email: teamData.member2Email?.trim() || "",
      active: true,
      eligibleRounds: [], // Start with no eligible rounds, update later
      accessCode: teamData.accessCode?.trim().toUpperCase() || generateAccessCode(),
      source: teamData.source || "MANUAL",
      sourceId: teamData.sourceId || null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    transaction.set(teamRef, newTeam);
  });

  await logAudit("TEAM_CREATED", "ORGANIZER", { teamId: normalizedId });
  return normalizedId;
}

export async function toggleTeamStatus(teamId: string, active: boolean) {
  const teamRef = doc(db, "teams", teamId);
  await updateDoc(teamRef, {
    active,
    updatedAt: Date.now(),
  });
  
  await logAudit(active ? "TEAM_ENABLED" : "TEAM_DISABLED", "ORGANIZER", { teamId });
}

export async function updateTeam(teamId: string, updates: Partial<Omit<Team, "teamId" | "createdAt">>) {
  const teamRef = doc(db, "teams", teamId);
  await updateDoc(teamRef, {
    ...updates,
    updatedAt: Date.now(),
  });
  await logAudit("TEAM_UPDATED", "ORGANIZER", {
    teamId,
    metadata: updates as Record<string, unknown>,
  });
}

// React Hooks for Realtime Data
export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "teams"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as Team);
      setTeams(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { teams, loading };
}

export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  
  useEffect(() => {
    const q = query(collection(db, "sessions"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      } as Session));
      setSessions(data);
    });

    return () => unsubscribe();
  }, []);

  return { sessions };
}

export async function killSession(sessionId: string) {
  const sessionRef = doc(db, "sessions", sessionId);
  await deleteDoc(sessionRef);
  await logAudit("SESSION_KILLED", "ORGANIZER", {
    metadata: { sessionId }
  });
}

export async function killTeamSessions(teamId: string) {
  const normalized = normalizeTeamId(teamId);
  const q = query(collection(db, "sessions"), where("teamId", "==", normalized));
  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletePromises);
  await logAudit("TEAM_SESSIONS_KILLED", "ORGANIZER", {
    metadata: { teamId: normalized, count: snapshot.size }
  });
  return snapshot.size;
}

/**
 * EMERGENCY ACTION ONLY:
 * Terminates all active participant device sessions in Firestore.
 * Requires organizer authorization. Preserves teams, submissions, and rounds.
 */
export async function clearAllSessions() {
  const q = query(collection(db, "sessions"));
  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletePromises);
  await logAudit("EMERGENCY_ALL_SESSIONS_KILLED", "ORGANIZER", {
    metadata: { count: snapshot.size, emergencyOperation: true }
  });
  return snapshot.size;
}

export async function deleteTeam(teamId: string) {
  const normalized = normalizeTeamId(teamId);
  await deleteDoc(doc(db, "teams", normalized));
  await killTeamSessions(normalized);
  await logAudit("TEAM_DELETED", "ORGANIZER", { teamId: normalized });
}

export async function seedTestTeamRange({
  prefix = "APB",
  separator = "",
  startNum = 1,
  endNum = 20,
  padLength = 3,
  accessCode = "TEST2026",
}: {
  prefix?: string;
  separator?: string;
  startNum: number;
  endNum: number;
  padLength?: number;
  accessCode: string;
}) {
  const normalizedCode = accessCode.trim().toUpperCase();
  if (!normalizedCode) throw new Error("Access ID / Access Code is required.");
  if (endNum < startNum) throw new Error("End number must be greater than or equal to start number.");
  if (endNum - startNum > 300) throw new Error("Maximum 300 test teams per batch.");

  let added = 0;
  const now = Date.now();

  for (let n = startNum; n <= endNum; n++) {
    const formattedNum = String(n).padStart(padLength, "0");
    const teamId = `${prefix.trim().toUpperCase()}${separator}${formattedNum}`;
    const teamRef = doc(db, "teams", teamId);

    const testTeam: Team = {
      teamId,
      displayName: `Test Team ${formattedNum}`,
      member1: `Pilot 1 (${formattedNum})`,
      member1Email: `pilot1_${formattedNum}@test.internal`,
      member2: `Pilot 2 (${formattedNum})`,
      member2Email: `pilot2_${formattedNum}@test.internal`,
      active: true,
      eligibleRounds: [],
      accessCode: normalizedCode,
      source: "TEST",
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(teamRef, testTeam, { merge: true });
    added++;
  }

  await logAudit("TEST_TEAMS_RANGE_SEEDED", "ORGANIZER", {
    metadata: {
      range: `${prefix}${separator}${String(startNum).padStart(padLength, "0")}..${prefix}${separator}${String(endNum).padStart(padLength, "0")}`,
      count: added,
      accessCode: normalizedCode,
    },
  });

  return added;
}

export async function clearTestTeams() {
  const q = query(collection(db, "teams"), where("source", "==", "TEST"));
  const snapshot = await getDocs(q);
  const deletePromises = snapshot.docs.map(async (d) => {
    await deleteDoc(d.ref);
    await killTeamSessions(d.id);
  });
  await Promise.all(deletePromises);

  await logAudit("TEST_TEAMS_CLEARED", "ORGANIZER", {
    metadata: { count: snapshot.size },
  });

  return snapshot.size;
}

