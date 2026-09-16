"use client";

import { useState } from "react";
import { APBCard } from "@/components/apb/APBCard";
import { APBButton } from "@/components/apb/APBButton";
import { StatusBadge } from "@/components/apb/StatusBadge";
import { Input } from "@/components/ui/input";
import { AddTeamDialog } from "@/components/apb/AddTeamDialog";
import { EditTeamDialog } from "@/components/apb/EditTeamDialog";
import { useTeams, useSessions, toggleTeamStatus, killTeamSessions, addTeam } from "@/lib/firebase/teams";
import { Team } from "@/lib/firebase/schema";
import { Loader2, Laptop, MoreVertical, Copy, Check, KeyRound, Sparkles } from "lucide-react";
import { ActiveSessionsModal } from "@/components/apb/ActiveSessionsModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function OrganizerTeams() {
  const { teams, loading } = useTeams();
  const { sessions } = useSessions();
  const [search, setSearch] = useState("");
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [sessionsModalOpen, setSessionsModalOpen] = useState(false);
  const [copiedTeamId, setCopiedTeamId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const handleSeed4Teams = async () => {
    setSeeding(true);
    const testTeams = [
      {
        teamId: "APB-101",
        displayName: "Neural Sparks",
        accessCode: "ALPHA1",
        member1: "Alex Chen",
        member1Email: "alex@example.com",
        member2: "Sam Rivera",
        member2Email: "sam@example.com",
        source: "MANUAL" as const,
      },
      {
        teamId: "APB-102",
        displayName: "Prompt Crafters",
        accessCode: "BETA22",
        member1: "Maya Patel",
        member1Email: "maya@example.com",
        member2: "Jordan Lee",
        member2Email: "jordan@example.com",
        source: "MANUAL" as const,
      },
      {
        teamId: "APB-103",
        displayName: "Cyber Synapse",
        accessCode: "GAMMA3",
        member1: "Liam Davis",
        member1Email: "liam@example.com",
        member2: "Zoe Taylor",
        member2Email: "zoe@example.com",
        source: "MANUAL" as const,
      },
      {
        teamId: "APB-104",
        displayName: "Quantum Logic",
        accessCode: "DELTA4",
        member1: "Noah Wilson",
        member1Email: "noah@example.com",
        member2: "Emma Brown",
        member2Email: "emma@example.com",
        source: "MANUAL" as const,
      },
    ];

    try {
      let added = 0;
      for (const t of testTeams) {
        if (!teams.some(existing => existing.teamId === t.teamId)) {
          await addTeam(t);
          added++;
        }
      }
      alert(`Successfully added ${added} test team(s) with access codes!`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to seed teams.";
      alert("Seeding error: " + msg);
    } finally {
      setSeeding(false);
    }
  };

  const filteredTeams = teams.filter((team) => 
    team.teamId.toLowerCase().includes(search.toLowerCase()) || 
    team.displayName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-mono font-bold uppercase tracking-wider text-white">Team Management</h2>
          <p className="text-muted-foreground">Manage participants and session limits.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <APBButton
            variant="outline"
            onClick={handleSeed4Teams}
            disabled={seeding}
            className="font-mono text-xs text-[var(--color-apb-cyan)] border-[var(--color-apb-cyan)]/40 hover:bg-[var(--color-apb-cyan)]/10 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {seeding ? "Creating Teams..." : "Seed 4 Test Teams"}
          </APBButton>

          <APBButton
            variant="outline"
            onClick={() => setSessionsModalOpen(true)}
            className="font-mono text-xs text-amber-400 border-amber-500/40 hover:bg-amber-500/10"
          >
            <Laptop className="w-4 h-4 mr-2" />
            Active Sessions ({sessions.length})
          </APBButton>
          <AddTeamDialog />
        </div>
      </header>

      <APBCard className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-mono font-bold text-white mb-4">Team Source</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 p-4 rounded-md border border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)]">
              <div className="font-medium text-white mb-1">Manual Teams</div>
              <p className="text-sm text-muted-foreground mb-4">Teams created manually via the Add Team button.</p>
              <div className="text-xs font-mono text-[var(--color-apb-cyan)] uppercase tracking-wider">Active</div>
            </div>
            <div className="flex-1 p-4 rounded-md border border-[var(--color-apb-surface-border)] border-dashed bg-transparent opacity-60">
              <div className="font-medium text-white mb-1">Google Sheets</div>
              <p className="text-sm text-muted-foreground mb-4">Import teams automatically from a registration sheet.</p>
              <APBButton variant="outline" size="sm" disabled className="w-full">
                Connect Google Sheet
              </APBButton>
            </div>
          </div>
        </div>
      </APBCard>

      <APBCard className="p-6 space-y-6">
        <div className="flex gap-4 items-center justify-between">
          <h3 className="text-lg font-mono font-bold text-white">Existing Teams</h3>
          <Input 
            placeholder="Search Team ID or Name..." 
            className="max-w-xs font-mono" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="rounded-md border border-[var(--color-apb-surface-border)] overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm text-left">
            <thead className="bg-[var(--color-apb-surface-border)]/50 text-muted-foreground uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3 font-medium">Team ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Access Code</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Members</th>
                <th className="px-4 py-3 font-medium">Sessions</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-apb-surface-border)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--color-apb-cyan)] mx-auto" />
                  </td>
                </tr>
              ) : filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No teams found.
                  </td>
                </tr>
              ) : (
                filteredTeams.map((team) => {
                  const teamSessions = sessions.filter(s => s.teamId === team.teamId).length;
                  return (
                    <tr key={team.teamId} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[var(--color-apb-cyan)]">{team.teamId}</td>
                      <td className="px-4 py-3 text-white">{team.displayName}</td>
                      <td className="px-4 py-3 font-mono">
                        {team.accessCode ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-black/60 border border-[var(--color-apb-surface-border)] text-[var(--color-apb-cyan)] font-bold tracking-widest text-xs">
                              {team.accessCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(team.accessCode || "");
                                setCopiedTeamId(team.teamId);
                                setTimeout(() => setCopiedTeamId(null), 2000);
                              }}
                              title="Copy Access Code"
                              className="p-1 rounded text-muted-foreground hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            >
                              {copiedTeamId === team.teamId ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">Default</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {team.member1} {team.member2 && `& ${team.member2}`}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono">
                        {teamSessions} / 2
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={team.active ? "ACTIVE" : "INACTIVE"} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <APBButton
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingTeam(team);
                              setEditDialogOpen(true);
                            }}
                            className="h-8 px-2.5 text-xs font-mono"
                          >
                            Edit
                          </APBButton>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-apb-surface-border)] hover:bg-muted text-muted-foreground hover:text-white transition-colors outline-none focus:ring-2 focus:ring-ring">
                              <span className="sr-only">More options</span>
                              <MoreVertical className="h-4 w-4" />
                            </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => {
                                setEditingTeam(team);
                                setEditDialogOpen(true);
                              }}>
                                Edit Team Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                if (team.active && !window.confirm(`Are you sure you want to deactivate ${team.displayName} (${team.teamId})? They will be locked out of the competition.`)) {
                                  return;
                                }
                                toggleTeamStatus(team.teamId, !team.active);
                              }}>
                                {team.active ? "Disable Team" : "Enable Team"}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                disabled={teamSessions === 0}
                                onClick={async () => {
                                  if (window.confirm(`Kill all active device sessions for ${team.teamId}?`)) {
                                    await killTeamSessions(team.teamId);
                                  }
                                }}
                                className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                              >
                                Kill Team Sessions ({teamSessions})
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </APBCard>

      {/* Edit Team Dialog */}
      <EditTeamDialog 
        team={editingTeam}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* Upgraded Active Sessions Modal */}
      <ActiveSessionsModal
        open={sessionsModalOpen}
        onOpenChange={setSessionsModalOpen}
        sessions={sessions}
        teams={teams}
      />
    </div>
  );
}
