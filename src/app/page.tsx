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
    <div className="min-h-screen bg-[#07080b] flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,240,255,0.05)_0,_transparent_70%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="z-10 w-full max-w-2xl text-center space-y-8">
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold tracking-[0.3em] text-[var(--color-apb-cyan)] uppercase block">
            LIVE CONDUCTION PLATFORM
          </span>
          <h1 className="text-5xl md:text-7xl font-mono font-black tracking-tight uppercase text-white drop-shadow-[0_0_30px_rgba(0,240,255,0.25)]">
            AI PROMPT BATTLE
          </h1>
          <p className="text-sm font-mono text-slate-400 uppercase tracking-[0.25em] pt-1">
            THINK. PROMPT. CREATE.
          </p>
        </div>

        <div className="h-[1px] w-48 mx-auto bg-gradient-to-r from-transparent via-[var(--color-apb-cyan)]/50 to-transparent" />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link href="/login">
            <APBButton glow className="h-13 px-8 text-sm font-mono tracking-widest uppercase w-full sm:w-auto">
              [ ENTER THE BATTLE ]
            </APBButton>
          </Link>
        </div>

        <div className="pt-8 text-xs font-mono text-muted-foreground uppercase tracking-widest">
          SJBIT • 30 OCTOBER 2026 • BENGALURU
        </div>
      </div>
    </div>
  );
}
