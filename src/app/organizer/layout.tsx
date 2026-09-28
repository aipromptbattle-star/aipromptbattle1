"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { GlobalEventHeader } from "@/components/apb/GlobalEventHeader";
import { CoordWalkiePanel } from "@/components/organizer/CoordWalkiePanel";
import { cn } from "@/lib/utils";
import {
  AppWindow,
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

    const popOutApp = () => {
    window.open(window.location.href, "_blank", "popup=yes,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=1200,height=800");
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
      <div className="h-[100dvh] w-full bg-[#03050a] text-foreground flex flex-col font-sans overflow-hidden relative">

        {/* AMBIENT MESH BACKGROUND FOR GLASS EFFECT */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--color-apb-cyan)]/10 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: "8s" }} />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: "12s" }} />
        </div>


        {/* TOP HEADER */}
        <header className="border-b border-white/5 bg-[#0a0f18]/60 backdrop-blur-2xl px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 z-50 shadow-lg">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--color-apb-cyan)]" />
            <h1 className="font-mono font-bold tracking-widest uppercase text-white text-sm sm:text-base hidden sm:block">
              APB Control Room
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <CoordWalkiePanel />
            <Link href="/display" target="_blank" rel="noopener noreferrer" title="Open Public Display Screen">
              <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider text-[var(--color-apb-cyan)] border border-[var(--color-apb-cyan)]/30 hover:bg-[var(--color-apb-cyan)]/10 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden lg:inline-block">Display</span>
              </div>
            </Link>

            <button
            onClick={popOutApp}
            title="Pop out into clean window (No tabs/URL bar)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider text-indigo-300 border border-indigo-500/50 hover:bg-indigo-500/20 transition-colors cursor-pointer hidden sm:flex"
          >
            <AppWindow className="w-3.5 h-3.5" />
          </button>
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
              className="ml-2 text-white hover:text-[var(--color-apb-cyan)] transition-colors" 
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
          <div className="animate-in slide-in-from-left-5 absolute top-[65px] left-0 right-0 bottom-0 bg-[#0a0f18]/95 backdrop-blur-2xl z-40 p-4 overflow-y-auto flex flex-col gap-2 border-r border-white/5 sm:w-64 sm:right-auto sm:shadow-2xl">
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
          className="flex-1 min-w-0 w-full h-full overflow-y-auto scrollbar-none relative z-10"
        >
          

          {/* Page content */}
          <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-[calc(100vh-200px)]">
            {children}
          </div>
        </main>
              </div>
    </ProtectedRoute>
  );
}
