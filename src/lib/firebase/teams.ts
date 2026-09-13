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

