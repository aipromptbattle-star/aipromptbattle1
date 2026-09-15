"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { APBButton } from "@/components/apb/APBButton";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Require strictly Ctrl + Shift + Alt
      const isCtrlShiftAlt = e.ctrlKey && e.shiftKey && e.altKey;
      if (!isCtrlShiftAlt) return;

      if (e.code === "KeyO" || e.key === "O" || e.key === "o") {
        e.preventDefault();
        router.push("/organizer");
      } else if (e.code === "KeyJ" || e.key === "J" || e.key === "j") {
        e.preventDefault();
        router.push("/judge/login");
      } else if (e.code === "KeyH" || e.key === "H" || e.key === "h") {
        e.preventDefault();
        router.push("/host");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[var(--color-apb-surface)] via-background to-background" />

      <div className="z-10 w-full max-w-2xl text-center space-y-12">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-mono font-bold tracking-tighter uppercase text-white drop-shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            AI Prompt Battle
          </h1>
          <p className="text-xl text-muted-foreground uppercase tracking-widest">
            Event Management System
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link href="/login">
            <APBButton glow className="h-14 px-8 text-lg w-full sm:w-auto">
              Join as Participant
            </APBButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
