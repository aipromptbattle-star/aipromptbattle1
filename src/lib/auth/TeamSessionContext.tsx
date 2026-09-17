"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { Team } from "../firebase/schema";

export type MemberRole = "member1" | "member2";

interface TeamSessionContextType {
  teamId: string | null;
  eventId: string | null;
  teamData: Team | null;
  memberRole: MemberRole | null;
  sessionId: string | null;
  loading: boolean;
  setMemberRole: (role: MemberRole | null) => void;
  joinTeam: (teamId: string, eventId: string, accessCode?: string) => Promise<{ success: boolean; error?: string }>;
  leaveTeam: () => void;
}

const TeamSessionContext = createContext<TeamSessionContextType>({
  teamId: null,
  eventId: null,
  teamData: null,
  memberRole: null,
  sessionId: null,
  loading: true,
  setMemberRole: () => {},
  joinTeam: async () => ({ success: false }),
  leaveTeam: () => {},
});

export function TeamSessionProvider({ children }: { children: React.ReactNode }) {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [teamData, setTeamData] = useState<Team | null>(null);
  const [memberRole, setMemberRoleState] = useState<MemberRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [anonUser, setAnonUser] = useState<User | null>(null);

  useEffect(() => {
    // Restore session and member role from localStorage if it exists
    const storedTeamId = localStorage.getItem("apb_team_id");
    const storedEventId = localStorage.getItem("apb_event_id");
    const storedRole = localStorage.getItem("apb_member_role") as MemberRole | null;

    if (storedTeamId && storedEventId) {
      queueMicrotask(() => {
        setTeamId(storedTeamId);
        setEventId(storedEventId);
        if (storedRole === "member1" || storedRole === "member2") {
          setMemberRoleState(storedRole);
        }
      });
      
      // Fetch team data
      getDoc(doc(db, "teams", storedTeamId)).then((snap) => {
        if (snap.exists()) {
          setTeamData(snap.data() as Team);
        }
      }).catch(console.error);
    }

    // Ensure we have an anonymous Firebase auth session for read access
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAnonUser(user);
      } else {
        // Do NOT automatically sign in anonymously. Wait for joinTeam.
        setAnonUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listen for session revocation (e.g. killed by organizer)
  useEffect(() => {
    if (!anonUser || !teamId) return;

    const sessionRef = doc(db, "sessions", anonUser.uid);
    const unsub = onSnapshot(sessionRef, (snap) => {
      if (!snap.exists()) {
        leaveTeam();
      }
    });

    return () => unsub();
  }, [anonUser, teamId]);

  const setMemberRole = (role: MemberRole | null) => {
    setMemberRoleState(role);
    if (role) {
      localStorage.setItem("apb_member_role", role);
    } else {
      localStorage.removeItem("apb_member_role");
    }
  };

  const joinTeam = async (targetTeamId: string, targetEventId: string, accessCode?: string) => {
    let currentUser = anonUser;
    
    // Check if team exists and is active
    const normalizedTeamId = targetTeamId.trim().toUpperCase();
    try {
      if (!currentUser) {
        // Temporarily sign in to verify team against Firestore rules
        const cred = await signInAnonymously(auth);
        currentUser = cred.user;
        setAnonUser(currentUser);
      }

      const teamRef = doc(db, "teams", normalizedTeamId);
      const teamSnap = await getDoc(teamRef);
      
      if (!teamSnap.exists()) {
        await auth.signOut();
        setAnonUser(null);
        return { success: false, error: "TEAM NOT FOUND: Team ID not recognized." };
      }
      
      const tData = teamSnap.data() as Team;
      if (!tData.active) {
        await auth.signOut();
        setAnonUser(null);
        return { success: false, error: "TEAM INACTIVE" };
      }

      // Check Access Code if configured on the team
      if (tData.accessCode && tData.accessCode.trim()) {
        const expectedCode = tData.accessCode.trim().toUpperCase();
        const providedCode = (accessCode || "").trim().toUpperCase();
        if (!providedCode || providedCode !== expectedCode) {
          await auth.signOut();
          setAnonUser(null);
          return { 
            success: false, 
            error: "INVALID ACCESS ID: Incorrect access code for this team." 
          };
        }
      }

      // Check active sessions limit (Max 2 active sessions per team)
      const sessionsQuery = query(collection(db, "sessions"), where("teamId", "==", normalizedTeamId));
      const activeSessionsSnap = await getDocs(sessionsQuery);
      
      // Filter out the current user's existing session if re-joining
      const otherSessions = activeSessionsSnap.docs.filter(d => d.id !== currentUser!.uid);
      if (otherSessions.length >= 2) {
        await auth.signOut();
        setAnonUser(null);
        return { 
          success: false, 
          error: "SESSION LIMIT REACHED: Maximum 2 concurrent devices allowed for this team." 
        };
      }

      // Record session in Firestore
      const sessionRef = doc(db, "sessions", currentUser!.uid);
      await setDoc(sessionRef, {
        teamId: normalizedTeamId,
        eventId: targetEventId,
        connectedAt: Date.now(),
        lastActiveAt: Date.now()
      });

      setTeamId(normalizedTeamId);
      setEventId(targetEventId);
      setTeamData(tData);
      localStorage.setItem("apb_team_id", normalizedTeamId);
      localStorage.setItem("apb_event_id", targetEventId);
      
      return { success: true };
    } catch (e: unknown) {
      console.error(e);
      const message = e instanceof Error ? e.message : "An error occurred.";
      return { success: false, error: message };
    }
  };

  const leaveTeam = () => {
    if (anonUser) {
      deleteDoc(doc(db, "sessions", anonUser.uid)).catch(console.error);
    }
    setTeamId(null);
    setEventId(null);
    setTeamData(null);
    setMemberRole(null);
    localStorage.removeItem("apb_team_id");
    localStorage.removeItem("apb_event_id");
    localStorage.removeItem("apb_member_role");
  };

  return (
    <TeamSessionContext.Provider value={{ 
      teamId, 
      eventId, 
      teamData,
      memberRole, 
      sessionId: anonUser ? anonUser.uid : null,
      loading, 
      setMemberRole, 
      joinTeam, 
      leaveTeam 
    }}>
      {children}
    </TeamSessionContext.Provider>
  );
}

export function useTeamSession() {
  return useContext(TeamSessionContext);
}
