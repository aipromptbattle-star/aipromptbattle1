import * as React from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { APBButton } from "./APBButton";
import { Terminal, Edit } from "lucide-react";
import { updateTeam } from "@/lib/firebase/teams";
import { Team } from "@/lib/firebase/schema";

interface EditTeamDialogProps {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTeamDialog({ team, open, onOpenChange }: EditTeamDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    displayName: "",
    member1: "",
    member1Email: "",
    member2: "",
    member2Email: "",
    eligibleRoundsStr: "1, 2",
  });

  useEffect(() => {
    if (team) {
      setFormData({
        displayName: team.displayName || "",
        member1: team.member1 || "",
        member1Email: team.member1Email || "",
        member2: team.member2 || "",
        member2Email: team.member2Email || "",
        eligibleRoundsStr: team.eligibleRounds?.join(", ") || "1, 2",
      });
      setError("");
    }
  }, [team]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;
    setError("");
    setLoading(true);

    if (!formData.displayName.trim()) {
      setError("Team Name is required.");
      setLoading(false);
      return;
    }

    try {
      const eligibleRounds = formData.eligibleRoundsStr
        .split(",")
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n));

      await updateTeam(team.teamId, {
        displayName: formData.displayName.trim(),
        member1: formData.member1.trim(),
        member1Email: formData.member1Email.trim(),
        member2: formData.member2.trim(),
        member2Email: formData.member2Email.trim(),
        eligibleRounds: eligibleRounds.length > 0 ? eligibleRounds : [1],
      });

      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update team.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!team) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-mono uppercase tracking-widest text-white flex items-center gap-2">
            <Edit className="w-5 h-5 text-[var(--color-apb-cyan)]" />
            Edit Team: {team.teamId}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label htmlFor="displayName" className="text-xs font-mono uppercase text-muted-foreground">Team Display Name</Label>
            <Input 
              id="displayName" 
              value={formData.displayName}
              onChange={handleChange}
              disabled={loading}
              className="font-mono text-sm"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="member1" className="text-xs font-mono uppercase text-muted-foreground">Member 1 Name</Label>
              <Input 
                id="member1" 
                value={formData.member1}
                onChange={handleChange}
                disabled={loading}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="member1Email" className="text-xs font-mono uppercase text-muted-foreground">Member 1 Email</Label>
              <Input 
                id="member1Email" 
                type="email"
                value={formData.member1Email}
                onChange={handleChange}
                disabled={loading}
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="member2" className="text-xs font-mono uppercase text-muted-foreground">Member 2 Name</Label>
              <Input 
                id="member2" 
                value={formData.member2}
                onChange={handleChange}
                disabled={loading}
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="member2Email" className="text-xs font-mono uppercase text-muted-foreground">Member 2 Email</Label>
              <Input 
                id="member2Email" 
                type="email"
                value={formData.member2Email}
                onChange={handleChange}
                disabled={loading}
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="eligibleRoundsStr" className="text-xs font-mono uppercase text-muted-foreground">Eligible Rounds (comma-separated)</Label>
            <Input 
              id="eligibleRoundsStr" 
              placeholder="e.g. 1, 2, 3"
              value={formData.eligibleRoundsStr}
              onChange={handleChange}
              disabled={loading}
              className="font-mono text-xs"
            />
            <p className="text-[10px] text-muted-foreground">Rounds this team is qualified to participate in.</p>
          </div>

          <div className="flex gap-2 pt-4">
            <APBButton type="button" variant="outline" className="w-full text-xs font-mono" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </APBButton>
            <APBButton type="submit" glow className="w-full text-xs font-mono" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </APBButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
