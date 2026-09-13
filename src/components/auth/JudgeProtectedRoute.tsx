"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Loader2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
import { Judge } from "@/lib/firebase/schema";

export function JudgeProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [judgeData, setJudgeData] = useState<Judge | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (pathname === "/judge/login") {
      return;
    }
    if (!loading) {
      if (!user) {
        router.push("/judge/login");
      } else {
        const verifyJudge = async () => {
          try {
            const judgeRef = doc(db, "judges", user.uid);
            const judgeSnap = await getDoc(judgeRef);
            if (judgeSnap.exists() && judgeSnap.data()?.active !== false) {
              setJudgeData(judgeSnap.data() as Judge);
              setIsAuthorized(true);
            } else {
              await signOut(auth);
              router.push("/judge/login?error=unauthorized");
            }
          } catch (e) {
            console.error("Judge authorization check failed:", e);
            await signOut(auth);
            router.push("/judge/login?error=failed");
          }
        };
        verifyJudge();
      }
    }
  }, [user, loading, router]);

  if (pathname === "/judge/login") {
    return <>{children}</>;
  }

  if (loading || !user || isAuthorized === null) {
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
