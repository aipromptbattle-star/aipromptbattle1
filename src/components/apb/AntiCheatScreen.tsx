"use client";
import { useEffect, useState } from "react";

export function AntiCheatScreen() {
  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);
    const handleVisibility = () => {
      if (document.hidden) setIsBlurred(true);
      else setIsBlurred(false);
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    // Also detect contextmenu (right click) to prevent inspection cheating easily
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  if (!isBlurred) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center pointer-events-none">
      <div className="text-red-500 font-mono text-xl animate-pulse font-bold tracking-widest text-center px-4">
        [ SECURITY LOCK ]<br/><br/>
        <span className="text-sm text-slate-400">SCREEN CAPTURE / OVERLAYS BLOCKED</span>
      </div>
    </div>
  );
}
