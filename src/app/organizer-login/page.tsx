"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase/config";
import { APBCard } from "@/components/apb/APBCard";
import { APBButton } from "@/components/apb/APBButton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, Terminal } from "lucide-react";

export default function OrganizerLogin() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Verify in Firestore organizers collection
      const organizerRef = doc(db, "organizers", user.uid);
      const organizerDoc = await getDoc(organizerRef);

      if (!organizerDoc.exists()) {
        await signOut(auth);
        setError(`Access Denied: Your Google account (UID: ${user.uid}) is not authorized as an organizer. Please add this UID to the 'organizers' collection in Firestore.`);
        setLoading(false);
        return;
      }

      router.push("/organizer");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Authentication failed.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[var(--color-apb-surface)] via-background to-background" />
      
      <div className="z-10 w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-mono font-bold tracking-tighter uppercase text-[var(--color-apb-blue)] mb-2 flex items-center justify-center gap-3">
            <ShieldCheck className="w-10 h-10" />
            Organizer Access
          </h1>
          <p className="text-muted-foreground uppercase tracking-widest text-sm">
            Restricted Area
          </p>
        </div>

        <APBCard className="p-6 text-center space-y-6">
          {error && (
            <Alert variant="destructive" className="text-left">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Authorization Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <p className="text-muted-foreground text-sm">
            Please sign in with your authorized Google account to access the organizer dashboard.
          </p>

          <APBButton 
            onClick={handleGoogleLogin} 
            disabled={loading}
            className="w-full h-12 flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200"
          >
            {loading ? (
              "Authenticating..."
            ) : (
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
        </APBCard>
      </div>
    </div>
  );
}
