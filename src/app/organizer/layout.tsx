"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Terminal, Users, LayoutDashboard, Clock, ExternalLink, LogOut, Star, Trophy, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
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
    { name: "Dashboard", href: "/organizer", icon: LayoutDashboard },
    { name: "Teams", href: "/organizer/teams", icon: Users },
    { name: "Rounds", href: "/organizer/rounds", icon: Clock },
    { name: "Judging", href: "/organizer/judging", icon: Star },
    { name: "Results", href: "/organizer/results", icon: Trophy },
    { name: "System", href: "/organizer/system", icon: Settings },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
        {/* Organizer Topbar */}
        <header className="border-b border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)] px-6 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <Terminal className="w-6 h-6 text-[var(--color-apb-blue)]" />
            <h1 className="font-mono font-bold tracking-widest uppercase text-white hidden sm:block">
              APB Control Room
            </h1>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="flex items-center gap-1 sm:gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={cn(
                        "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-mono uppercase tracking-wider transition-colors",
                        isActive
                          ? "bg-[var(--color-apb-blue)]/10 text-[var(--color-apb-blue)] font-bold"
                          : "text-muted-foreground hover:bg-[var(--color-apb-surface-border)] hover:text-white"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline-block">{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="h-6 w-px bg-[var(--color-apb-surface-border)] hidden sm:block" />

            <div className="flex items-center gap-2">
              <Link 
                href="/host" 
                target="_blank" 
                rel="noopener noreferrer"
                title="Launch Host Display (Opens in new tab)"
              >
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-mono uppercase tracking-wider text-[var(--color-apb-cyan)] border border-[var(--color-apb-cyan)]/30 hover:bg-[var(--color-apb-cyan)]/10 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden md:inline-block">Host View</span>
                </div>
              </Link>

              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-mono uppercase tracking-wider text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden md:inline-block">Sign Out</span>
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
