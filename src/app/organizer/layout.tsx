"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GlobalEventHeader } from "@/components/apb/GlobalEventHeader";
import { CoordWalkiePanel } from "@/components/organizer/CoordWalkiePanel";
import { cn } from "@/lib/utils";
import {
  Terminal, Users, LayoutDashboard, Clock, ExternalLink, LogOut,
  Star, Trophy, Settings,
  Database, Flame, Monitor, ShieldAlert, Maximize,
  FlaskConical, Menu, X
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (mainRef.current) {
        setIsScrolled(mainRef.current.scrollTop > 20);
      }
    };
    const el = mainRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, []);

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
    { name: "Live",              href: "/organizer/live",               icon: Flame },
    { name: "Rounds",            href: "/organizer/rounds",             icon: Clock },
    { name: "Teams",             href: "/organizer/teams",              icon: Users },
    { name: "Judging",           href: "/organizer/judging",            icon: Star },
    { name: "Part. Board",       href: "/organizer/participant-board",  icon: Monitor },
    { name: "Display",           href: "/organizer/display",            icon: Monitor },
    { name: "Results",           href: "/organizer/results",            icon: Trophy },
    { name: "Sessions",          href: "/organizer/sessions",           icon: ShieldAlert },
    { name: "System",            href: "/organizer/system",             icon: Settings },
    { name: "Lab",               href: "/organizer/screen-lab",         icon: FlaskConical },
  ];

  return (
    <ProtectedRoute>
      <div className="h-[100dvh] w-full bg-background text-foreground flex flex-col font-sans overflow-hidden relative">

        {/* TOP HEADER */}
        <header className="border-b border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)] px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 z-50">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-apb-cyan)]" />
            <h1 className="font-mono font-bold tracking-widest uppercase text-white text-sm sm:text-base hidden sm:block">
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
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider text-slate-300 border border-slate-600/50 hover:bg-slate-800 transition-colors cursor-pointer hidden sm:flex"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleSignOut}
              title="Sign Out"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline-block">Sign Out</span>
            </button>
            
            <button 
              className="sm:hidden ml-2 text-white" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* GLOBAL EVENT STATUS BAR */}
        <GlobalEventHeader />
        
        {/* MOBILE NAV MENU */}
        {mobileMenuOpen && (
          <div className="absolute top-[100px] inset-x-0 bottom-0 bg-black/95 z-40 p-4 overflow-y-auto sm:hidden flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/organizer" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-mono uppercase tracking-wider transition-colors",
                      isActive
                        ? "bg-[var(--color-apb-cyan)]/20 text-[var(--color-apb-cyan)] border border-[var(--color-apb-cyan)]/30 font-bold"
                        : "text-muted-foreground border border-white/5"
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* MAIN SCROLL AREA */}
        <main 
          ref={mainRef}
          className="flex-1 min-w-0 w-full h-full overflow-y-auto scrollbar-none bg-background relative"
        >
          {/* FLOATING NAVBAR (Desktop/Tablet) */}
          <div className={cn(
            "hidden sm:flex sticky top-0 z-30 justify-center w-full transition-all duration-300 pointer-events-none",
            isScrolled ? "pt-4" : "pt-0 bg-[var(--color-apb-surface)]/50 backdrop-blur-md border-b border-white/5 pb-0"
          )}>
            <nav className={cn(
              "pointer-events-auto flex items-center justify-center gap-1 transition-all duration-300 mx-auto",
              isScrolled 
                ? "bg-black/80 backdrop-blur-md border border-white/10 rounded-full px-2 py-1.5 shadow-2xl scale-95" 
                : "w-full max-w-7xl px-4 py-3 scale-100 flex-wrap"
            )}>
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/organizer" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className="shrink-0">
                    <div
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 transition-all whitespace-nowrap",
                        isScrolled ? "rounded-full" : "rounded-md",
                        isActive
                          ? "bg-[var(--color-apb-cyan)]/15 text-[var(--color-apb-cyan)] font-bold shadow-sm"
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Icon className={cn("shrink-0", isScrolled ? "w-3.5 h-3.5" : "w-4 h-4")} />
                      <span className={cn(
                        "font-mono uppercase tracking-wider",
                        isScrolled ? "text-[10px]" : "text-[11px]"
                      )}>
                        {item.name}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Page content */}
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-[calc(100vh-200px)]">
            {children}
          </div>
        </main>
        <CoordWalkiePanel />
      </div>
    </ProtectedRoute>
  );
}
