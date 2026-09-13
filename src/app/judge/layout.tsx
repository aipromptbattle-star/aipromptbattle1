"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { JudgeProtectedRoute } from "@/components/auth/JudgeProtectedRoute";
import { Scale, LogOut, Award } from "lucide-react";
import { APBButton } from "@/components/apb/APBButton";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { useAuth } from "@/lib/auth/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { Judge } from "@/lib/firebase/schema";

function JudgeHeader() {
  const router = useRouter();
  const { user } = useAuth();
  const [judge, setJudge] = useState<Judge | null>(null);

  useEffect(() => {
    if (user) {
      getDoc(doc(db, "judges", user.uid)).then((s) => {
        if (s.exists()) setJudge(s.data() as Judge);
      });
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/judge/login");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="border-b border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)]/80 backdrop-blur sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--color-apb-cyan)]/10 border border-[var(--color-apb-cyan)]/30 flex items-center justify-center text-[var(--color-apb-cyan)]">
          <Scale className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
            AI Prompt Battle
          </h1>
          <span className="text-[10px] font-mono text-[var(--color-apb-cyan)] uppercase tracking-widest flex items-center gap-1">
            <Award className="w-3 h-3" /> Judge Console
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-xs font-mono font-bold text-white">
            {judge?.displayName || user?.displayName || "Official Judge"}
          </div>
          <div className="text-[10px] font-mono text-muted-foreground">
            {judge?.email || user?.email || user?.uid}
          </div>
        </div>
        <APBButton size="sm" variant="outline" onClick={handleSignOut} className="h-8">
          <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign Out
        </APBButton>
      </div>
    </header>
  );
}

export default function JudgeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/judge/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <JudgeProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col font-sans">
        <JudgeHeader />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </JudgeProtectedRoute>
  );
}
