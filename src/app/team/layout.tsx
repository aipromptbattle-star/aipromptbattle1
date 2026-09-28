
"use client";
import { AntiCheatScreen } from "@/components/apb/AntiCheatScreen";

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AntiCheatScreen />
      {children}
    </>
  );
}

