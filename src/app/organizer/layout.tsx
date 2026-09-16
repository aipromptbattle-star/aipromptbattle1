"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { cn } from "@/lib/utils";
import { Terminal, Users, LayoutDashboard, Clock, ExternalLink, LogOut, Star, Trophy, Settings, Flame, Monitor, ShieldAlert } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (e) {
      console.error("Sign out error:", e);
    }
  };

  const navItems = [
    { name: "Overview", href: "/organizer", icon: LayoutDashboard },
    { name: "Live Control", href: "/organizer/live", icon: Flame },
    { name: "Rounds", href: "/organizer/rounds", icon: Clock },
    { name: "Teams", href: "/organizer/teams", icon: Users },
    { name: "Judging", href: "/organizer/judging", icon: Star },
    { name: "Display", href: "/organizer/display", icon: Monitor },
    { name: "Sessions", href: "/organizer/sessions", icon: ShieldAlert },
    { name: "System", href: "/organizer/system", icon: Settings },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        {/* Organizer Topbar */}
        <header className="border-b border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-50 gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <Terminal className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-apb-cyan)]" />
            <h1 className="font-mono font-bold tracking-widest uppercase text-white text-sm sm:text-base hidden sm:block">
              APB Control Room
            </h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto py-0.5 max-w-full">
            <nav className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider transition-colors shrink-0",
                        isActive
                          ? "bg-[var(--color-apb-cyan)]/15 text-[var(--color-apb-cyan)] border border-[var(--color-apb-cyan)]/30 font-bold"
                          : "text-muted-foreground hover:bg-[var(--color-apb-surface-border)] hover:text-white"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden md:inline-block">{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="h-5 w-px bg-[var(--color-apb-surface-border)] shrink-0 hidden sm:block" />

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <Link 
                href="/display" 
                target="_blank" 
                rel="noopener noreferrer"
                title="Launch Public Host Presentation Display (Opens in new tab)"
              >
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider text-[var(--color-apb-cyan)] border border-[var(--color-apb-cyan)]/30 hover:bg-[var(--color-apb-cyan)]/10 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline-block">Display Screen</span>
                </div>
              </Link>

              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden lg:inline-block">Sign Out</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
