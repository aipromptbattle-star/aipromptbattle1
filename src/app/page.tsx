import Link from "next/link";
import { APBButton } from "@/components/apb/APBButton";

export default function LandingPage() {
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
        
        <div className="pt-12">
          <Link href="/host" className="text-muted-foreground hover:text-white transition-colors text-sm uppercase tracking-widest font-mono">
            [ Open Host Display ]
          </Link>
        </div>
      </div>
    </div>
  );
}
