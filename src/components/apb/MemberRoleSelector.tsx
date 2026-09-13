"use client";

import React from "react";
import { APBCard } from "./APBCard";
import { APBButton } from "./APBButton";
import { MemberRole } from "@/lib/auth/TeamSessionContext";
import { Team, Round } from "@/lib/firebase/schema";
import { MessageSquare, Sparkles, User, ShieldCheck } from "lucide-react";

interface MemberRoleSelectorProps {
  team: Team | null;
  round: Round;
  onSelectRole: (role: MemberRole) => void;
}

export function MemberRoleSelector({
  team,
  round,
  onSelectRole,
}: MemberRoleSelectorProps) {
  const member1Name = team?.member1 || "Member 1";
  const member2Name = team?.member2 || "Member 2";

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <APBCard className="max-w-2xl w-full p-6 sm:p-8 space-y-6 border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)]/90 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-apb-cyan)]/30 bg-[var(--color-apb-cyan)]/10 text-[var(--color-apb-cyan)] text-xs font-mono uppercase tracking-widest mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Team Workstation Identity</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-mono font-bold uppercase text-white tracking-tight">
            Select Your Role
          </h2>
          <p className="text-sm text-muted-foreground">
            Team <strong className="text-white font-mono">{team?.teamId}</strong> • Round {round.roundNumber}: {round.title}
          </p>
          <p className="text-xs text-slate-400">
            Each team has two collaborative roles. Select which member you are operating as on this workstation. You can switch later if needed.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Member 1 Option */}
          <div
            onClick={() => onSelectRole("member1")}
            className="group relative p-6 rounded-xl border border-[var(--color-apb-surface-border)] bg-black/40 hover:border-[var(--color-apb-cyan)] hover:bg-[var(--color-apb-cyan)]/[0.03] transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-apb-cyan)]/10 border border-[var(--color-apb-cyan)]/30 flex items-center justify-center text-[var(--color-apb-cyan)] group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--color-apb-cyan)] block">
                  Role 01
                </span>
                <h3 className="text-lg font-mono font-bold text-white group-hover:text-[var(--color-apb-cyan)] transition-colors">
                  {member1Name}
                </h3>
                <span className="text-xs font-mono text-muted-foreground block mt-0.5">
                  Prompt & Text Architect
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Specialized in formulating, structuring, and optimizing the primary master prompt instruction.
              </p>
            </div>

            <APBButton glow className="w-full font-mono text-xs mt-2">
              <User className="w-3.5 h-3.5 mr-1.5" /> Continue as Member 1
            </APBButton>
          </div>

          {/* Member 2 Option */}
          <div
            onClick={() => onSelectRole("member2")}
            className="group relative p-6 rounded-xl border border-[var(--color-apb-surface-border)] bg-black/40 hover:border-purple-400 hover:bg-purple-500/[0.03] transition-all cursor-pointer flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-purple-400 block">
                  Role 02
                </span>
                <h3 className="text-lg font-mono font-bold text-white group-hover:text-purple-400 transition-colors">
                  {member2Name}
                </h3>
                <span className="text-xs font-mono text-muted-foreground block mt-0.5">
                  Creative & Asset Designer
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Specialized in generated visual assets, creative synthesis, and secondary parameters.
              </p>
            </div>

            <APBButton variant="secondary" className="w-full font-mono text-xs mt-2 bg-purple-600 hover:bg-purple-500 text-white">
              <User className="w-3.5 h-3.5 mr-1.5" /> Continue as Member 2
            </APBButton>
          </div>
        </div>
      </APBCard>
    </div>
  );
}
