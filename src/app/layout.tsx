import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { TeamSessionProvider } from "@/lib/auth/TeamSessionContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Prompt Battle",
  description: "Live AI Prompt Battle Platform",
};

import { GlobalSecurity } from "@/components/GlobalSecurity";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <GlobalSecurity />
        <AuthProvider>
          <TeamSessionProvider>
            <TooltipProvider>{children}</TooltipProvider>
          </TeamSessionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
