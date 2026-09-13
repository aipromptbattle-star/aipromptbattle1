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
import { Edit } from "lucide-react";
import { updateRound } from "@/lib/firebase/rounds";
import { Round } from "@/lib/firebase/schema";

interface EditRoundDialogProps {
  round: Round | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditRoundDialog({ round, open, onOpenChange }: EditRoundDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    durationSeconds: 900,
    challengeType: "COMBINED" as "TEXT" | "IMAGE" | "COMBINED",
    challengeInstructions: "",
    referenceMaterial: "",
    constraintsStr: "",
  });

  useEffect(() => {
    if (round) {
      setFormData({
        title: round.title || "",
        description: round.description || "",
        durationSeconds: round.durationSeconds || 900,
        challengeType: round.challengeType || "COMBINED",
        challengeInstructions: round.challengeInstructions || "",
        referenceMaterial: round.referenceMaterial || "",
        constraintsStr: round.constraints?.join("\n") || "",
      });
      setError("");
    }
  }, [round]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!round) return;
    setError("");
    setLoading(true);

    if (!formData.title.trim()) {
      setError("Title is required.");
      setLoading(false);
      return;
    }

    try {
      const constraints = formData.constraintsStr
        .split("\n")
        .map(s => s.trim())
        .filter(Boolean);

      await updateRound(round.id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        durationSeconds: formData.durationSeconds,
        challengeType: formData.challengeType,
        challengeTitle: formData.title.trim(),
        challengeDescription: formData.description.trim(),
        challengeInstructions: formData.challengeInstructions.trim(),
        referenceMaterial: formData.referenceMaterial.trim(),
        constraints,
      });

      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update round.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!round) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-mono uppercase tracking-widest text-white flex items-center gap-2">
            <Edit className="w-5 h-5 text-[var(--color-apb-cyan)]" />
            Edit Round {round.roundNumber}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-mono uppercase text-muted-foreground">Round Number</Label>
              <Input 
                value={round.roundNumber} 
                disabled 
                className="font-mono text-sm bg-black/40 text-muted-foreground"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-mono uppercase text-muted-foreground">Duration (seconds)</Label>
              <Input 
                type="number" 
                min={60} 
                value={formData.durationSeconds} 
                onChange={e => setFormData({ ...formData, durationSeconds: parseInt(e.target.value) || 60 })} 
                required 
                disabled={loading}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-mono uppercase text-muted-foreground">Title</Label>
            <Input 
              value={formData.title} 
              onChange={e => setFormData({ ...formData, title: e.target.value })} 
              required 
              disabled={loading}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-mono uppercase text-muted-foreground">Challenge Type</Label>
            <select
              value={formData.challengeType}
              onChange={e => setFormData({ ...formData, challengeType: e.target.value as "TEXT" | "IMAGE" | "COMBINED" })}
              disabled={loading}
              className="w-full bg-black/50 border border-[var(--color-apb-surface-border)] rounded-md px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[var(--color-apb-cyan)]"
            >
              <option value="COMBINED">COMBINED (Prompt + Creative Asset)</option>
              <option value="IMAGE">IMAGE (Visual Creative Only)</option>
              <option value="TEXT">TEXT (Prompt Only)</option>
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-mono uppercase text-muted-foreground">Description / Context</Label>
            <Input 
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
              disabled={loading}
              placeholder="Overview of the challenge"
              className="font-mono text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-mono uppercase text-muted-foreground">Challenge Instructions</Label>
            <textarea
              value={formData.challengeInstructions}
              onChange={e => setFormData({ ...formData, challengeInstructions: e.target.value })}
              disabled={loading}
              placeholder="e.g. Generate a photorealistic cyberpunk street scene"
              rows={2}
              className="w-full bg-black/50 border border-[var(--color-apb-surface-border)] rounded-md px-3 py-2 text-xs text-white font-mono resize-none focus:outline-none focus:border-[var(--color-apb-cyan)]"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-mono uppercase text-muted-foreground">Constraints (1 per line)</Label>
            <textarea
              value={formData.constraintsStr}
              onChange={e => setFormData({ ...formData, constraintsStr: e.target.value })}
              disabled={loading}
              placeholder="Must include neon rain&#10;No vehicles allowed"
              rows={2}
              className="w-full bg-black/50 border border-[var(--color-apb-surface-border)] rounded-md px-3 py-2 text-xs text-white font-mono resize-none focus:outline-none focus:border-[var(--color-apb-cyan)]"
            />
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
