"use client";

import { useState } from "react";
import { APBCard } from "@/components/apb/APBCard";
import { APBButton } from "@/components/apb/APBButton";
import { Loader2, Download, Archive } from "lucide-react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

function downloadCSV(csvContent: string, fileName: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function convertToCSV(data: any[], headers: string[], keys: string[]) {
  const rows = [headers.join(",")];
  for (const row of data) {
    const values = keys.map(key => {
      let val = row[key];
      if (val === null || val === undefined) val = "";
      if (typeof val === 'object') val = JSON.stringify(val);
      const str = String(val).replace(/"/g, '""');
      if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str}"`;
      }
      return str;
    });
    rows.push(values.join(","));
  }
  return rows.join("\n");
}

export function EventDataExport() {
  const [exporting, setExporting] = useState(false);
  const [exportTarget, setExportTarget] = useState<string | null>(null);

  const exportCollection = async (target: string) => {
    setExporting(true);
    setExportTarget(target);
    try {
      if (target === "teams") {
        const snap = await getDocs(collection(db, "teams"));
        const data = snap.docs.map(d => d.data());
        const headers = ["Team ID", "Display Name", "Member 1", "Member 2", "Active", "Created At"];
        const keys = ["teamId", "displayName", "member1", "member2", "active", "createdAt"];
        downloadCSV(convertToCSV(data, headers, keys), "teams.csv");
      } 
      else if (target === "submissions") {
        const snap = await getDocs(collection(db, "submissions"));
        const data = snap.docs.map(d => d.data());
        const headers = ["Submission ID", "Team ID", "Round ID", "Status", "Submitted At", "Evaluated Score", "Automated Score"];
        const keys = ["id", "teamId", "roundId", "status", "submittedAt", "score", "automatedScore"];
        downloadCSV(convertToCSV(data, headers, keys), "submissions.csv");
      }
      else if (target === "scores") {
        const snap = await getDocs(collection(db, "scores"));
        const data = snap.docs.map(d => d.data());
        const headers = ["Score ID", "Team ID", "Round ID", "Judge ID", "Status", "Final Score", "Override Score", "Created At"];
        const keys = ["id", "teamId", "roundId", "judgeId", "status", "finalScore", "overrideScore", "createdAt"];
        downloadCSV(convertToCSV(data, headers, keys), "scores.csv");
      }
      else if (target === "assignments") {
        const snap = await getDocs(collection(db, "judgeAssignments"));
        const data = snap.docs.map(d => d.data());
        const headers = ["Assignment ID", "Team ID", "Round ID", "Judge ID", "Status", "Assigned By", "Created At"];
        const keys = ["id", "teamId", "roundId", "judgeId", "status", "assignedBy", "createdAt"];
        downloadCSV(convertToCSV(data, headers, keys), "judge_assignments.csv");
      }
      else if (target === "timeline") {
        const q = query(collection(db, "auditLogs"), orderBy("timestamp", "asc"));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => {
           const doc = d.data();
           return {
              ...doc,
              formattedTime: new Date(doc.timestamp).toISOString()
           };
        });
        const headers = ["Timestamp", "ISO Time", "Action", "Actor", "Event ID", "Round ID", "Team ID", "Metadata"];
        const keys = ["timestamp", "formattedTime", "action", "actor", "eventId", "roundId", "teamId", "metadata"];
        downloadCSV(convertToCSV(data, headers, keys), "event_timeline.csv");
      }
      else if (target === "ALL") {
        // Sequentially download all
        await exportCollection("teams");
        await new Promise(r => setTimeout(r, 500));
        await exportCollection("submissions");
        await new Promise(r => setTimeout(r, 500));
        await exportCollection("scores");
        await new Promise(r => setTimeout(r, 500));
        await exportCollection("assignments");
        await new Promise(r => setTimeout(r, 500));
        await exportCollection("timeline");
      }
    } catch (err) {
      alert("Export failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setExporting(false);
      setExportTarget(null);
    }
  };

  return (
    <APBCard className="p-6 space-y-4 border-[var(--color-apb-surface-border)] bg-black/40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-apb-cyan)] font-bold mb-1">
            OFFICIAL EVENT RECORDS
          </div>
          <h3 className="text-lg font-mono font-bold text-white">Export Event Data</h3>
          <p className="text-xs text-muted-foreground mt-1">Download authoritative Firestore data. Read-only action.</p>
        </div>
        <APBButton
          glow
          onClick={() => exportCollection("ALL")}
          disabled={exporting}
          className="font-mono text-xs uppercase"
        >
          {exporting && exportTarget === "ALL" ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Archive className="w-4 h-4 mr-2" />
          )}
          Export All Data
        </APBButton>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { id: "teams", name: "teams.csv" },
          { id: "submissions", name: "submissions.csv" },
          { id: "scores", name: "scores.csv" },
          { id: "assignments", name: "judge_assignments.csv" },
          { id: "timeline", name: "event_timeline.csv" },
        ].map((file) => (
          <div key={file.id} className="p-3 border border-white/10 rounded-lg flex items-center justify-between bg-black/20 hover:bg-white/5 transition-colors">
            <span className="font-mono text-xs text-white">{file.name}</span>
            <button
              onClick={() => exportCollection(file.id)}
              disabled={exporting}
              className="p-1.5 rounded text-[var(--color-apb-cyan)] hover:bg-[var(--color-apb-cyan)]/20 transition-colors disabled:opacity-50"
              title={`Download ${file.name}`}
            >
              {exporting && exportTarget === file.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        ))}
      </div>
    </APBCard>
  );
}
