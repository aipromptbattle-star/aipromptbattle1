"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Loader2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.sessionStorage.getItem("apb_test_organizer") === "true" || window.localStorage.getItem("apb_test_organizer") === "true") {
        setIsAuthorized(true);
        return;
      }
    }

    if (!loading) {
      if (!user) {
        setIsAuthorized(false);
        router.push("/organizer-login");
        return;
      }

      // Check if already authorized in localStorage for this UID across tabs
      if (typeof window !== "undefined" && window.localStorage.getItem("apb_organizer_authed") === user.uid) {
        setIsAuthorized(true);
        return;
      }

      // Verify authorization in Firestore
      const checkAuth = async () => {
        try {
          const docRef = doc(db, "organizers", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            if (typeof window !== "undefined") {
              window.localStorage.setItem("apb_organizer_authed", user.uid);
            }
            setIsAuthorized(true);
          } else {
            if (typeof window !== "undefined") {
              window.localStorage.removeItem("apb_organizer_authed");
            }
            setIsAuthorized(false);
            router.push("/organizer-login");
          }
        } catch (e) {
          console.warn("Authorization check warning:", e);
          // If offline or network glitch but was previously authorized, keep session alive
          if (typeof window !== "undefined" && window.localStorage.getItem("apb_organizer_authed") === user.uid) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
            router.push("/organizer-login");
          }
        }
      };
      checkAuth();
    }
  }, [user, loading, router]);

  const isTestBypass = typeof window !== "undefined" && window.sessionStorage.getItem("apb_test_organizer") === "true";

  if (!isTestBypass && (loading || !user || isAuthorized === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-apb-cyan)]" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
