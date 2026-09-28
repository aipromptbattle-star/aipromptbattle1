
"use client";

import { useAllSubmissions } from "@/lib/firebase/submissions";
import { useTeams } from "@/lib/firebase/teams";
import { useEventState, useCurrentRound } from "@/lib/firebase/events";
import { Download } from "lucide-react";
import { APBButton } from "@/components/apb/APBButton";

export default function BackupPage() {
  const { eventState } = useEventState();
  const { currentRound } = useCurrentRound(eventState?.currentRoundId || null);
  const { submissions } = useAllSubmissions("currentEvent", null);
  const { teams } = useTeams();

  const handleDownloadCSV = () => {
    let csv = "Timestamp,Team ID,Team Name,Round ID,Score,Text Length,Draft Status,Auto Captured,Final Score Status\n";
    
    submissions.forEach(sub => {
      const team = teams.find(t => t.teamId === sub.teamId);
      const teamName = team ? team.displayName : sub.teamId;
      const date = new Date(sub.updatedAt || 0).toISOString();
      const txt = (sub.content?.text || "").replace(/"/g, "\"\"");
      csv += `"${date}","${sub.teamId}","${teamName}","${sub.roundId}","${sub.score || ""}","${txt.length}","${sub.status}","${sub.autoCaptured || false}","${sub.scoreDocRef ? "SCORED" : "PENDING"}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `apb_backup_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-mono text-white">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--color-apb-cyan)]/30">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-[var(--color-apb-cyan)]">Live Ledger Backup</h1>
          <p className="text-sm text-slate-400 mt-2">Real-time immutable ledger of all submissions across all rounds.</p>
        </div>
        <APBButton glow onClick={handleDownloadCSV} className="flex gap-2">
          <Download className="w-4 h-4" />
          DOWNLOAD CSV
        </APBButton>
      </div>

      <div className="bg-black/50 border border-slate-700 rounded-lg overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900 border-b border-slate-700 text-slate-400">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Team</th>
              <th className="px-4 py-3">Round</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Auto?</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Length</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {submissions.sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0)).map(s => {
              const t = teams.find(x => x.teamId === s.teamId);
              return (
                <tr key={s.id} className="hover:bg-white/5">
                  <td className="px-4 py-2 text-xs text-slate-500">{new Date(s.updatedAt || 0).toLocaleTimeString()}</td>
                  <td className="px-4 py-2 text-[var(--color-apb-cyan)] font-bold">{t?.displayName || s.teamId}</td>
                  <td className="px-4 py-2">{s.roundId}</td>
                  <td className="px-4 py-2">{s.status}</td>
                  <td className="px-4 py-2">{s.autoCaptured ? "YES" : "-"}</td>
                  <td className="px-4 py-2 text-yellow-400">{s.score !== undefined ? s.score : "-"}</td>
                  <td className="px-4 py-2">{s.content?.text?.length || 0}c</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

