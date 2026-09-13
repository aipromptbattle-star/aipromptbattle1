"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { signInWithPopup, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase/config";
import { APBCard } from "@/components/apb/APBCard";
import { APBButton } from "@/components/apb/APBButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Scale, Terminal, Lock, Mail } from "lucide-react";

function JudgeLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    queryError === "unauthorized"
      ? "Access Denied: Your account is not authorized as an active Judge."
      : ""
  );
  const [loading, setLoading] = useState(false);

  const verifyAndRedirect = async (uid: string) => {
    const judgeRef = doc(db, "judges", uid);
    const judgeSnap = await getDoc(judgeRef);

    if (!judgeSnap.exists() || judgeSnap.data()?.active === false) {
      await signOut(auth);
      setError(`Access Denied: Your account (UID: ${uid}) is not authorized as an active Judge. Please contact the event organizer.`);
      setLoading(false);
      return false;
    }

    router.push("/judge");
    return true;
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      setLoading(false);
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email.trim(), password);
      await verifyAndRedirect(result.user.uid);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed.";
      setError(msg.includes("auth/") ? "Invalid judge credentials." : msg);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      await verifyAndRedirect(result.user.uid);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Google authentication failed.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[var(--color-apb-surface)] via-background to-background" />

      <div className="z-10 w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-mono font-bold tracking-tighter uppercase text-[var(--color-apb-cyan)] mb-2 flex items-center justify-center gap-3">
            <Scale className="w-10 h-10" />
            Judge Console
          </h1>
          <p className="text-muted-foreground uppercase tracking-widest text-sm">
            Evaluation & Scoring Terminal
          </p>
        </div>

        <APBCard className="p-6 space-y-6">
          {error && (
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Authorization Failed</AlertTitle>
              <AlertDescription className="break-all">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase text-muted-foreground">Judge Email</Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="judge@apb.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 font-mono"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase text-muted-foreground">Password</Label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 font-mono"
                  disabled={loading}
                />
              </div>
            </div>

            <APBButton glow type="submit" className="w-full h-11 text-sm font-mono uppercase" disabled={loading}>
              {loading ? "Authenticating..." : "Judge Sign In"}
            </APBButton>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[var(--color-apb-surface-border)] w-full" />
            <span className="bg-[var(--color-apb-surface)] px-3 text-xs text-muted-foreground uppercase font-mono absolute">
              Or
            </span>
          </div>

          <APBButton
            type="button"
            variant="outline"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full h-11 flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </APBButton>
        </APBCard>
      </div>
    </div>
  );
}

export default function JudgeLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin text-[var(--color-apb-cyan)]">Loading...</div></div>}>
      <JudgeLoginContent />
    </Suspense>
  );
}
