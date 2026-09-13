"use client";

import { useState } from "react";
import { APBCard } from "@/components/apb/APBCard";
import { APBButton } from "@/components/apb/APBButton";
import { StatusBadge } from "@/components/apb/StatusBadge";
import { Input } from "@/components/ui/input";
import { AddTeamDialog } from "@/components/apb/AddTeamDialog";
import { EditTeamDialog } from "@/components/apb/EditTeamDialog";
import { useTeams, useSessions, toggleTeamStatus, killTeamSessions } from "@/lib/firebase/teams";
import { Team } from "@/lib/firebase/schema";
import { Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

export default function OrganizerTeams() {
  const { teams, loading } = useTeams();
  const { sessions } = useSessions();
  const [search, setSearch] = useState("");
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

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
        <AddTeamDialog />
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
        
        <div className="rounded-md border border-[var(--color-apb-surface-border)] overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-[var(--color-apb-surface-border)]/50 text-muted-foreground uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3 font-medium">Team ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Members</th>
                <th className="px-4 py-3 font-medium">Sessions</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-apb-surface-border)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--color-apb-cyan)] mx-auto" />
                  </td>
                </tr>
              ) : filteredTeams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
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
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors outline-none focus:ring-2 focus:ring-ring">
                            <span className="sr-only">Open menu</span>
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
    </div>
  );
}
