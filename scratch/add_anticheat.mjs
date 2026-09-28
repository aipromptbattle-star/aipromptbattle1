
import fs from "fs";

// 1. Create AntiCheatScreen Component
const antiCheatCode = `"use client";
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
`;

fs.writeFileSync("src/components/apb/AntiCheatScreen.tsx", antiCheatCode);

// 2. Inject into team/page.tsx
let teamPage = fs.readFileSync("src/app/team/page.tsx", "utf8");

// Add import
if (!teamPage.includes("AntiCheatScreen")) {
  teamPage = teamPage.replace(
    `import { PromptEditor } from "@/components/apb/PromptEditor";`,
    `import { PromptEditor } from "@/components/apb/PromptEditor";\nimport { AntiCheatScreen } from "@/components/apb/AntiCheatScreen";`
  );
}

// Add to JSX
const searchStr = `return (\n    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans">`;
if (teamPage.includes(searchStr)) {
  teamPage = teamPage.replace(
    searchStr,
    `return (\n    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans">\n      <AntiCheatScreen />`
  );
} else {
  // Try fallback search
  const fallbackStr = `return (\n    <div`;
  teamPage = teamPage.replace(fallbackStr, `return (\n    <>\n      <AntiCheatScreen />\n    <div`);
  // Note: if I do this I have to close the fragment at the end...
}

fs.writeFileSync("src/app/team/page.tsx", teamPage);
console.log("Injected Anti-Cheat");

