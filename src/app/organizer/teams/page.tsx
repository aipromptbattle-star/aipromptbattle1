"use client";

import { useState, useEffect } from "react";
import { APBCard } from "@/components/apb/APBCard";
import { APBButton } from "@/components/apb/APBButton";
import { StatusBadge } from "@/components/apb/StatusBadge";
import { Input } from "@/components/ui/input";
import { AddTeamDialog } from "@/components/apb/AddTeamDialog";
import { EditTeamDialog } from "@/components/apb/EditTeamDialog";
import { useTeams, useSessions, toggleTeamStatus, killTeamSessions, addTeam, seedTestTeamRange, clearTestTeams, deleteTeam } from "@/lib/firebase/teams";
import { useEventState, updateEventSettings } from "@/lib/firebase/events";
import { Team } from "@/lib/firebase/schema";
import { Loader2, Laptop, MoreVertical, Copy, Check, KeyRound, Sparkles, Sheet, Save, Trash2, Hash, ShieldAlert } from "lucide-react";
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
  const { eventState } = useEventState();
  const { teams, loading } = useTeams();
  const { sessions } = useSessions();
  const [search, setSearch] = useState("");
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [sessionsModalOpen, setSessionsModalOpen] = useState(false);
  const [copiedTeamId, setCopiedTeamId] = useState<string | null>(null);
  const [sheetUrl, setSheetUrl] = useState("");
  const [savingSheet, setSavingSheet] = useState(false);
  const [sheetSavedMsg, setSheetSavedMsg] = useState(false);

  // Sync sheetUrl from eventState
  useEffect(() => {
    if (eventState?.googleSheetsUrl) {
      setSheetUrl(eventState.googleSheetsUrl);
    }
  }, [eventState?.googleSheetsUrl]);

  const handleSaveSheetUrl = async () => {
    setSavingSheet(true);
    try {
      await updateEventSettings({ googleSheetsUrl: sheetUrl });
      setSheetSavedMsg(true);
      setTimeout(() => setSheetSavedMsg(false), 3000);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to save Sheet URL");
    } finally {
      setSavingSheet(false);
    }
  };

  // Test Team Range Generator State (§User Testing Request)
  const [rangePrefix, setRangePrefix] = useState("APB");
  const [rangeSeparator, setRangeSeparator] = useState("");
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(20);
  const [rangeAccessCode, setRangeAccessCode] = useState("TEST2026");
  const [rangeGenerating, setRangeGenerating] = useState(false);
  const [rangeClearing, setRangeClearing] = useState(false);
  const [rangeMsg, setRangeMsg] = useState<string | null>(null);

  const handleGenerateTestRange = async () => {
    if (!rangeAccessCode.trim()) {
      alert("Please specify a shared Access ID / Access Code for the test teams.");
      return;
    }
    if (rangeEnd < rangeStart) {
      alert("End range must be greater than or equal to Start range.");
      return;
    }
    setRangeGenerating(true);
    setRangeMsg(null);
    try {
      const count = await seedTestTeamRange({
        prefix: rangePrefix,
        separator: rangeSeparator,
        startNum: rangeStart,
        endNum: rangeEnd,
        padLength: 3,
        accessCode: rangeAccessCode,
      });
      setRangeMsg(`✓ Successfully generated ${count} test teams (${rangePrefix}${rangeSeparator}${String(rangeStart).padStart(3, "0")} to ${rangePrefix}${rangeSeparator}${String(rangeEnd).padStart(3, "0")}) with Access ID: ${rangeAccessCode.toUpperCase()}`);
      setTimeout(() => setRangeMsg(null), 6000);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to generate test teams.");
    } finally {
      setRangeGenerating(false);
    }
  };

  const handleClearTestTeams = async () => {
    if (!window.confirm("Delete ALL dummy test teams (source === 'TEST')? Real teams imported or manually created will NOT be touched.")) {
      return;
    }
    setRangeClearing(true);
    try {
      const count = await clearTestTeams();
      setRangeMsg(`Cleared ${count} dummy test team(s).`);
      setTimeout(() => setRangeMsg(null), 4000);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed to clear test teams.");
    } finally {
      setRangeClearing(false);
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
            onClick={() => setSessionsModalOpen(true)}
            className="font-mono text-xs text-amber-400 border-amber-500/40 hover:bg-amber-500/10"
          >
            <Laptop className="w-4 h-4 mr-2" />
            Active Sessions ({sessions.length})
          </APBButton>
          <AddTeamDialog />
        </div>
      </header>

      {/* User Requested: Range Test Teams Generator (Isolated from Actual Event) */}
      <APBCard className="p-6 space-y-4 border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-black/40 to-amber-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
          <div className="space-y-0.5">
            <div className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              TEST DRILL & LOAD TESTING TOOL (NOT FOR ACTUAL EVENT)
            </div>
            <h3 className="text-lg font-mono font-bold text-white">Batch Test Teams Generator</h3>
          </div>

          <div className="flex items-center gap-2">
            <APBButton
              variant="outline"
              size="sm"
              onClick={handleClearTestTeams}
              disabled={rangeClearing || rangeGenerating}
              className="font-mono text-xs text-rose-400 border-rose-500/40 hover:bg-rose-500/10"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              {rangeClearing ? "Clearing..." : "Delete Test Teams"}
            </APBButton>
          </div>
        </div>

        <p className="text-xs font-mono text-muted-foreground">
          Generates dummy test teams in any numerical range (e.g. <strong>{rangePrefix}{rangeSeparator}001</strong> to <strong>{rangePrefix}{rangeSeparator}{String(rangeEnd).padStart(3, "0")}</strong>) with a shared Access ID for testing login and load. Actual event teams are loaded via Google Sheets or manual entry with unique credentials.
        </p>

        {rangeMsg && (
          <div className="p-3 rounded-lg font-mono text-xs bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 animate-in fade-in duration-200">
            {rangeMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 font-mono pt-1">
          <div>
            <label className="text-[11px] uppercase text-muted-foreground block mb-1">Prefix</label>
            <input
              type="text"
              value={rangePrefix}
              onChange={(e) => setRangePrefix(e.target.value.toUpperCase())}
              placeholder="APB"
              className="w-full h-9 px-3 rounded bg-black/60 border border-white/10 text-xs text-white uppercase focus:outline-none focus:border-[var(--color-apb-cyan)]"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase text-muted-foreground block mb-1">Separator</label>
            <select
              value={rangeSeparator}
              onChange={(e) => setRangeSeparator(e.target.value)}
              className="w-full h-9 px-3 rounded bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--color-apb-cyan)]"
            >
              <option value="">None (APB001)</option>
              <option value="-">Hyphen (APB-001)</option>
              <option value="_">Underscore (APB_001)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] uppercase text-muted-foreground block mb-1">Start Number</label>
            <input
              type="number"
              min={1}
              value={rangeStart}
              onChange={(e) => setRangeStart(parseInt(e.target.value) || 1)}
              className="w-full h-9 px-3 rounded bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--color-apb-cyan)]"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase text-muted-foreground block mb-1">End Number</label>
            <input
              type="number"
              min={rangeStart}
              max={500}
              value={rangeEnd}
              onChange={(e) => setRangeEnd(parseInt(e.target.value) || rangeStart)}
              className="w-full h-9 px-3 rounded bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--color-apb-cyan)]"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase text-muted-foreground block mb-1 text-[var(--color-apb-cyan)] font-bold">
              Shared Access ID
            </label>
            <input
              type="text"
              value={rangeAccessCode}
              onChange={(e) => setRangeAccessCode(e.target.value.toUpperCase())}
              placeholder="e.g. TEST2026"
              className="w-full h-9 px-3 rounded bg-black/60 border border-[var(--color-apb-cyan)]/50 text-xs text-[var(--color-apb-cyan)] font-bold uppercase focus:outline-none focus:border-[var(--color-apb-cyan)]"
            />
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/10">
          <div className="text-xs font-mono text-muted-foreground">
            Preview Range: <span className="text-white font-bold">{rangePrefix}{rangeSeparator}{String(rangeStart).padStart(3, "0")}</span> through <span className="text-white font-bold">{rangePrefix}{rangeSeparator}{String(rangeEnd).padStart(3, "0")}</span> ({Math.max(0, rangeEnd - rangeStart + 1)} teams)
          </div>

          <APBButton
            glow
            size="sm"
            onClick={handleGenerateTestRange}
            disabled={rangeGenerating || rangeClearing}
            className="font-mono text-xs uppercase tracking-wider"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            {rangeGenerating ? "Generating..." : `Generate ${Math.max(0, rangeEnd - rangeStart + 1)} Test Teams`}
          </APBButton>
        </div>
      </APBCard>

      {/* Section 8: Google Sheets Registration Configuration */}
      <APBCard className="p-6 space-y-4 border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-apb-cyan)] font-bold mb-1">
              REGISTRATION DATA SOURCE
            </div>
            <h3 className="text-lg font-mono font-bold text-white">Google Sheets Registration Form</h3>
          </div>
          {eventState?.googleSheetsUrl ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
              <Check className="w-3.5 h-3.5" />
              ● CONFIGURED
            </span>
          ) : (
            <span className="text-xs font-mono text-muted-foreground">
              ○ NOT CONFIGURED
            </span>
          )}
        </div>

        <div className="space-y-2 font-mono">
          <label className="text-xs text-muted-foreground uppercase">Google Sheets Spreadsheet URL</label>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="url"
              placeholder="https://docs.google.com/spreadsheets/d/.../edit"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              className="flex-1 w-full h-10 px-3.5 rounded-md bg-black/60 border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--color-apb-cyan)]"
            />
            <APBButton
              glow
              size="sm"
              onClick={handleSaveSheetUrl}
              disabled={savingSheet}
              className="h-10 px-6 font-mono text-xs uppercase tracking-wider shrink-0"
            >
              <Save className="w-3.5 h-3.5 mr-2" />
              {savingSheet ? "Saving..." : sheetSavedMsg ? "Saved ✓" : "Save URL"}
            </APBButton>
          </div>
          <p className="text-[11px] text-muted-foreground pt-1">
            <strong>Note:</strong> Access IDs already exist in the registration Sheet. APB will not generate replacement Access IDs during sync. No live sync connector is faked.
          </p>
        </div>
      </APBCard>

      <APBCard className="p-6 space-y-6">
        <div className="flex gap-4 items-center justify-between">
          <h3 className="text-lg font-mono font-bold text-white">Registered Teams</h3>
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
                <th className="px-4 py-3 font-medium text-[var(--color-apb-cyan)] font-bold">Access ID</th>
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
