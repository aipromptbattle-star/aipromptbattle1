"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTeamSession } from "@/lib/auth/TeamSessionContext";
import { APBCard } from "@/components/apb/APBCard";
import { APBButton } from "@/components/apb/APBButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase/config";

function LoginContent() {
  const [teamId, setTeamId] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Organizer Modal State
  const [showOrganizerModal, setShowOrganizerModal] = useState(false);
  const [organizerError, setOrganizerError] = useState("");
  const [organizerLoading, setOrganizerLoading] = useState(false);
  
  const router = useRouter();
  const { joinTeam } = useTeamSession();

  // Strict trigger: Requires all three modifiers: Ctrl + Shift + Alt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlShiftAlt = e.ctrlKey && e.shiftKey && e.altKey;
      if (!isCtrlShiftAlt) return;

      if (e.code === "KeyO" || e.key === "O" || e.key === "o") {
        e.preventDefault();
        setShowOrganizerModal(true);
      } else if (e.code === "KeyJ" || e.key === "J" || e.key === "j") {
        e.preventDefault();
        router.push("/judge/login");
      } else if (e.code === "KeyH" || e.key === "H" || e.key === "h") {
        e.preventDefault();
        router.push("/host");
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [router]);

  const handleParticipantLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    if (!teamId.trim()) {
      setError("Please enter your 3-digit Team Number.");
      setLoading(false);
      return;
    }

    const numericOnly = teamId.trim();
    if (!/^\d{1,3}$/.test(numericOnly)) {
      setError("Invalid format. Please enter up to 3 digits (e.g. 001, 012, 145).");
      setLoading(false);
      return;
    }

    const paddedTeamId = numericOnly.padStart(3, "0");
    const fullTeamId = `APB-${paddedTeamId}`;
    const EVENT_ID = "currentEvent";
    
    const result = await joinTeam(fullTeamId, EVENT_ID, accessCode);
    if (result.success) {
      router.push("/team");
    } else {
      setError(result.error || "Failed to join team.");
      setLoading(false);
    }
  };

  const handleOrganizerGoogleLogin = async () => {
    setOrganizerError("");
    setOrganizerLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Verify in Firestore organizers collection
      const organizerRef = doc(db, "organizers", user.uid);
      const organizerDoc = await getDoc(organizerRef);

      if (!organizerDoc.exists()) {
        await signOut(auth);
        setOrganizerError(`Access Denied: Your Google account (UID: ${user.uid}) is not authorized as an organizer.`);
        setOrganizerLoading(false);
        return;
      }

      router.push("/organizer");
    } catch (err: any) {
      console.error(err);
      setOrganizerError(err.message || "Authentication failed.");
      setOrganizerLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Subtle Gradient & Grid Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,240,255,0.04)_0,_transparent_70%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="z-10 w-full max-w-md space-y-6 text-center">
        {/* Header Branding */}
        <div className="space-y-1.5 cursor-default">
          <span className="text-xs font-mono font-bold tracking-[0.3em] text-[var(--color-apb-cyan)] uppercase block">
            AI
          </span>
          <h1
            className="text-4xl sm:text-5xl font-mono font-black tracking-tight uppercase text-white drop-shadow-[0_0_25px_rgba(0,240,255,0.25)]"
            onDoubleClick={() => setShowOrganizerModal(true)}
            title="AI Prompt Battle Access Terminal"
          >
            PROMPT BATTLE
          </h1>
          <p className="text-xs font-mono tracking-[0.25em] text-slate-400 uppercase pt-1">
            THINK. PROMPT. CREATE.
          </p>
        </div>

        {/* Thin Divider Line */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[var(--color-apb-surface-border)] to-transparent" />

        {/* Terminal Login Card */}
        <APBCard className="p-6 sm:p-8 space-y-6 bg-[var(--color-apb-surface)]/95 border-[var(--color-apb-surface-border)] shadow-2xl relative">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">
              ENTER THE BATTLE
            </span>
          </div>

          {error && (
            <Alert variant="destructive" className="text-left py-2.5">
              <Terminal className="h-4 w-4" />
              <AlertTitle className="text-xs font-mono">Access Denied</AlertTitle>
              <AlertDescription className="text-xs font-mono">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleParticipantLogin} className="space-y-4">
            <div className="space-y-1.5 text-left">
              <Label htmlFor="teamId" className="text-muted-foreground uppercase tracking-widest text-[10px] font-mono block text-center">
                TEAM ID
              </Label>
              <div className="flex items-center">
                <div className="flex items-center justify-center h-12 px-4 font-mono text-xl tracking-widest bg-black/80 border border-r-0 border-[var(--color-apb-surface-border)] text-muted-foreground rounded-l-md">
                  APB-
                </div>
                <Input
                  id="teamId"
                  placeholder="001"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value.replace(/\D/g, '').slice(0, 3))}
                  className="font-mono text-xl h-12 uppercase text-left tracking-widest bg-black/50 border-[var(--color-apb-surface-border)] text-[var(--color-apb-cyan)] placeholder:text-slate-600 focus:border-[var(--color-apb-cyan)] focus:ring-1 focus:ring-[var(--color-apb-cyan)] rounded-l-none"
                  disabled={loading}
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <Label htmlFor="accessCode" className="text-muted-foreground uppercase tracking-widest text-[10px] font-mono block text-center">
                ACCESS CODE
              </Label>
              <Input
                id="accessCode"
                placeholder="••••••"
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                className="font-mono text-lg h-12 uppercase text-center tracking-[0.25em] bg-black/50 border-[var(--color-apb-surface-border)] text-white placeholder:text-slate-600 focus:border-[var(--color-apb-cyan)] focus:ring-1 focus:ring-[var(--color-apb-cyan)]"
                disabled={loading}
              />
              <p className="text-[10px] font-mono text-muted-foreground/60 text-center">
                6-character access pass assigned to your team
              </p>
            </div>

            <APBButton glow type="submit" className="w-full h-12 text-sm font-mono tracking-widest uppercase mt-2" disabled={loading}>
              {loading ? "AUTHENTICATING..." : "[ ENTER EVENT ]"}
            </APBButton>
          </form>
        </APBCard>

        {/* Thin Divider Line */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[var(--color-apb-surface-border)] to-transparent" />

        {/* Event Location & System Ready Indicator */}
        <div className="space-y-1.5 font-mono text-xs text-muted-foreground">
          <div className="tracking-widest uppercase font-bold text-slate-300">
            30 OCTOBER 2026
          </div>
          <div className="tracking-wider uppercase text-[11px] text-slate-400">
            SJBIT • BENGALURU
          </div>
          <div className="pt-2 flex items-center justify-center gap-2 text-emerald-400 text-[11px] tracking-widest uppercase font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>EVENT SYSTEM READY</span>
          </div>
        </div>
      </div>

      {/* Hidden Organizer Modal */}
      <Dialog open={showOrganizerModal} onOpenChange={setShowOrganizerModal}>
        <DialogContent className="sm:max-w-[425px] bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)]">
          <DialogHeader>
            <DialogTitle className="text-xl font-mono uppercase tracking-widest text-[var(--color-apb-blue)] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Organizer Access
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {organizerError && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Authorization Failed</AlertTitle>
                <AlertDescription className="break-all">{organizerError}</AlertDescription>
              </Alert>
            )}
            
            <p className="text-muted-foreground text-sm text-center">
              Please sign in with your authorized Google account to access the organizer dashboard.
            </p>

            <APBButton 
              onClick={handleOrganizerGoogleLogin} 
              disabled={organizerLoading}
              className="w-full h-12 flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200"
            >
              {organizerLoading ? "Authenticating..." : (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </>
              )}
            </APBButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-spin text-[var(--color-apb-cyan)]">Loading...</div></div>}>
      <LoginContent />
    </Suspense>
  );
}
