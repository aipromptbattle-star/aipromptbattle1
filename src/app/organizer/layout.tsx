
"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GlobalEventHeader } from "@/components/apb/GlobalEventHeader";
import { cn } from "@/lib/utils";
import {
  Terminal, Users, LayoutDashboard, Clock, ExternalLink, LogOut,
  Star, Trophy, Settings, Flame, Monitor, ShieldAlert, Maximize,
  FlaskConical
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("apb_organizer_authed");
        window.localStorage.removeItem("apb_test_organizer");
        window.sessionStorage.removeItem("apb_test_organizer");
      }
      await signOut(auth);
      router.push("/organizer-login");
    } catch (e) {
      console.error("Sign out error:", e);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const navItems = [
    { name: "Overview",          href: "/organizer",                    icon: LayoutDashboard },
    { name: "Live Control",      href: "/organizer/live",               icon: Flame },
    { name: "Rounds",            href: "/organizer/rounds",             icon: Clock },
    { name: "Teams",             href: "/organizer/teams",              icon: Users },
    { name: "Judging",           href: "/organizer/judging",            icon: Star },
    { name: "Participant Board", href: "/organizer/participant-board",  icon: Monitor },
    { name: "Display",           href: "/organizer/display",            icon: Monitor },
    { name: "Results",           href: "/organizer/results",            icon: Trophy },
    { name: "Sessions",          href: "/organizer/sessions",           icon: ShieldAlert },
    { name: "System",            href: "/organizer/system",             icon: Settings },
    { name: "Screen Lab",        href: "/organizer/screen-lab",         icon: FlaskConical },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-[100dvh] h-[100dvh] w-full bg-background text-foreground flex flex-col font-sans overflow-hidden">

        {/* ── TOP HEADER ── */}
        <header className="border-b border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)] px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 z-50">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-apb-cyan)]" />
            <h1 className="font-mono font-bold tracking-widest uppercase text-white text-sm sm:text-base">
              APB Control Room
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/display" target="_blank" rel="noopener noreferrer" title="Open Public Display Screen">
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider text-[var(--color-apb-cyan)] border border-[var(--color-apb-cyan)]/30 hover:bg-[var(--color-apb-cyan)]/10 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden lg:inline-block">Display</span>
              </div>
            </Link>

            <button
              onClick={toggleFullscreen}
              title="Toggle Fullscreen"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider text-slate-300 border border-slate-600/50 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Maximize className="w-3.5 h-3.5" />
              <span className="hidden lg:inline-block">Fullscreen</span>
            </button>

            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline-block">Sign Out</span>
            </button>
          </div>
        </header>

        {/* ── GLOBAL EVENT STATUS BAR ── */}
        <GlobalEventHeader />

        <div className="flex flex-1 min-h-0 w-full overflow-hidden">

          {/* ── SIDEBAR (desktop) ── */}
          <aside className="w-48 lg:w-56 xl:w-64 shrink-0 border-r border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)]/30 overflow-y-auto hidden md:flex flex-col">
            <nav className="p-3 space-y-0.5 flex-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/organizer" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="block">
                    <div
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs lg:text-sm font-mono uppercase tracking-wider transition-colors",
                        isActive
                          ? "bg-[var(--color-apb-cyan)]/15 text-[var(--color-apb-cyan)] border border-[var(--color-apb-cyan)]/30 font-bold"
                          : "text-muted-foreground hover:bg-[var(--color-apb-surface-border)] hover:text-white"
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* ── MAIN CONTENT ── */}
          <main className="flex-1 min-w-0 w-full h-full overflow-y-auto scrollbar-thin bg-background">

            {/* Mobile Nav (horizontal scroll) */}
            <nav className="flex items-center gap-1.5 overflow-x-auto py-2.5 px-3 md:hidden border-b border-[var(--color-apb-surface-border)] scrollbar-none">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/organizer" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="shrink-0">
                    <div
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-colors whitespace-nowrap",
                        isActive
                          ? "bg-[var(--color-apb-cyan)]/15 text-[var(--color-apb-cyan)] border border-[var(--color-apb-cyan)]/30 font-bold"
                          : "text-muted-foreground hover:bg-[var(--color-apb-surface-border)] hover:text-white border border-transparent"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.name}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>

            {/* Page content */}
            <div className="p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
