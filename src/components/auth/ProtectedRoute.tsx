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
    if (loading) return;

    if (!user) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("apb_organizer_authed");
        window.localStorage.removeItem("apb_test_organizer");
        window.sessionStorage.removeItem("apb_test_organizer");
      }
      setIsAuthorized(false);
      router.push("/organizer-login");
      return;
    }

    let isSubscribed = true;
    const checkAuth = async () => {
      try {
        const docRef = doc(db, "organizers", user.uid);
        const docSnap = await getDoc(docRef);
        if (!isSubscribed) return;

        if (docSnap.exists()) {
          if (typeof window !== "undefined") {
            window.localStorage.setItem("apb_organizer_authed", user.uid);
          }
          setIsAuthorized(true);
        } else {
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("apb_organizer_authed");
            window.localStorage.removeItem("apb_test_organizer");
            window.sessionStorage.removeItem("apb_test_organizer");
          }
          setIsAuthorized(false);
          router.push("/organizer-login");
        }
      } catch (e) {
        console.warn("Authorization check warning:", e);
        if (!isSubscribed) return;
        setIsAuthorized(false);
        router.push("/organizer-login");
      }
    };

    checkAuth();

    return () => {
      isSubscribed = false;
    };
  }, [user, loading, router]);

  if (loading || isAuthorized === null) {
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
