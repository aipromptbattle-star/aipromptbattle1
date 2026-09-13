import { useState, useEffect, useRef, useCallback } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./config";
import { Draft, TeamRoundState } from "./schema";

export type SaveStatus = "SAVED" | "SAVING" | "OFFLINE" | "ERROR";

export function getDraftDocId(eventId: string, teamId: string, roundId: string): string {
  return `${eventId}_${teamId}_${roundId}`;
}

export function getLocalDraftKey(eventId: string, teamId: string, roundId: string): string {
  return `apb:${eventId}:${teamId}:${roundId}`;
}

export function saveLocalDraft(eventId: string, teamId: string, roundId: string, draft: Partial<Draft>): void {
  try {
    const key = getLocalDraftKey(eventId, teamId, roundId);
    localStorage.setItem(key, JSON.stringify(draft));
  } catch (err) {
    console.warn("Failed to save draft to localStorage:", err);
  }
}

export function getLocalDraft(eventId: string, teamId: string, roundId: string): Partial<Draft> | null {
  try {
    const key = getLocalDraftKey(eventId, teamId, roundId);
    const item = localStorage.getItem(key);
    if (!item) return null;
    return JSON.parse(item);
  } catch (err) {
    console.warn("Failed to read draft from localStorage:", err);
    return null;
  }
}

export function useDraft(eventId: string | null, teamId: string | null, roundId: string | null) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("SAVED");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isOnlineRef = useRef<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);

  // Monitor online status & auto-reconnect sync
  useEffect(() => {
    const handleOnline = async () => {
      isOnlineRef.current = true;
      if (eventId && teamId && roundId) {
        const local = getLocalDraft(eventId, teamId, roundId);
        if (local && Object.keys(local).length > 0) {
          try {
            setSaveStatus("SAVING");
            const docId = getDraftDocId(eventId, teamId, roundId);
            const draftRef = doc(db, "drafts", docId);
            const stateRef = doc(db, "teamRoundState", docId);

            await setDoc(draftRef, local, { merge: true });
            await setDoc(stateRef, {
              eventId,
              teamId,
              roundId,
              status: "IN_PROGRESS",
              lastSavedAt: local.updatedAt || Date.now(),
              version: local.version || 1,
              updatedAt: Date.now(),
            }, { merge: true });

            setSaveStatus("SAVED");
          } catch (err) {
            console.error("Reconnection sync error:", err);
            setSaveStatus("ERROR");
          }
        } else {
          setSaveStatus("SAVED");
        }
      }
    };
    const handleOffline = () => {
      isOnlineRef.current = false;
      setSaveStatus("OFFLINE");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [eventId, teamId, roundId]);

  // Listen for remote draft updates
  useEffect(() => {
    if (!eventId || !teamId || !roundId) {
      queueMicrotask(() => {
        setDraft(null);
        setLoading(false);
      });
      return;
    }

    const docId = getDraftDocId(eventId, teamId, roundId);
    const draftRef = doc(db, "drafts", docId);

    const unsubscribe = onSnapshot(draftRef, (snapshot) => {
      const local = getLocalDraft(eventId, teamId, roundId);

      if (snapshot.exists()) {
        const remoteData = snapshot.data() as Draft;

        // If local draft is strictly newer than remote by more than 1 second, reconcile
        if (local && local.updatedAt && local.updatedAt > (remoteData.updatedAt || 0) + 1000) {
          const merged: Draft = {
            ...remoteData,
            ...local,
            eventId,
            teamId,
            roundId,
            version: Math.max(remoteData.version || 1, local.version || 1),
          };
          setDraft(merged);
        } else {
          setDraft(remoteData);
          saveLocalDraft(eventId, teamId, roundId, remoteData);
        }
      } else {
        // Remote draft does not exist yet; check if local draft exists
        if (local) {
          const initialDraft: Draft = {
            eventId,
            teamId,
            roundId,
            prompt: local.prompt || "",
            member1Data: local.member1Data || { text: "" },
            member2Data: local.member2Data || { text: "", imageUrl: "", fileName: "" },
            updatedAt: local.updatedAt || Date.now(),
            version: local.version || 1,
          };
          setDraft(initialDraft);
        } else {
          const emptyDraft: Draft = {
            eventId,
            teamId,
            roundId,
            prompt: "",
            member1Data: { text: "" },
            member2Data: { text: "", imageUrl: "", fileName: "" },
            updatedAt: Date.now(),
            version: 1,
          };
          setDraft(emptyDraft);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to draft:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId, teamId, roundId]);

  // Debounced save function
  const updateDraft = useCallback((
    updater: (prev: Draft) => Draft,
    memberRole?: string
  ) => {
    if (!eventId || !teamId || !roundId) return;

    setDraft((prev) => {
      const base: Draft = prev || {
        eventId,
        teamId,
        roundId,
        prompt: "",
        member1Data: { text: "" },
        member2Data: { text: "", imageUrl: "", fileName: "" },
        updatedAt: Date.now(),
        version: 1,
      };

      const updated = updater(base);
      const nextDraft: Draft = {
        ...updated,
        updatedBy: memberRole || base.updatedBy,
        updatedAt: Date.now(),
        version: (base.version || 0) + 1,
      };

      // Always save locally immediately for zero data loss
      saveLocalDraft(eventId, teamId, roundId, nextDraft);

      // Check if offline
      if (!isOnlineRef.current) {
        setSaveStatus("OFFLINE");
        return nextDraft;
      }

      setSaveStatus("SAVING");

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        try {
          const docId = getDraftDocId(eventId, teamId, roundId);
          const draftRef = doc(db, "drafts", docId);
          const stateRef = doc(db, "teamRoundState", docId);

          // Write draft
          await setDoc(draftRef, nextDraft, { merge: true });

          // Update team round state
          const stateUpdate: Partial<TeamRoundState> = {
            eventId,
            teamId,
            roundId,
            status: "IN_PROGRESS",
            lastSavedAt: nextDraft.updatedAt,
            version: nextDraft.version,
            updatedAt: Date.now(),
          };
          await setDoc(stateRef, stateUpdate, { merge: true });

          setSaveStatus("SAVED");
        } catch (err) {
          console.error("Autosave failed:", err);
          setSaveStatus("ERROR");
        }
      }, 750); // 750ms debounce

      return nextDraft;
    });
  }, [eventId, teamId, roundId]);

  return {
    draft,
    loading,
    saveStatus,
    updateDraft,
  };
}
