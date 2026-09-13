import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { APBButton } from "./APBButton";
import { Terminal, Plus } from "lucide-react";
import { addTeam } from "@/lib/firebase/teams";

export function AddTeamDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    teamId: "",
    displayName: "",
    member1: "",
    member1Email: "",
    member2: "",
    member2Email: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.teamId.trim()) {
      setError("Team ID is required.");
      setLoading(false);
      return;
    }

    try {
      await addTeam({
        teamId: formData.teamId,
        displayName: formData.displayName,
        member1: formData.member1,
        member1Email: formData.member1Email,
        member2: formData.member2,
        member2Email: formData.member2Email,
        source: "MANUAL",
      });
      // Success: Reset form and close
      setFormData({ teamId: "", displayName: "", member1: "", member1Email: "", member2: "", member2Email: "" });
      setOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create team.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<APBButton />}>
        <Plus className="w-4 h-4 mr-2" />
        Add Team
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-mono uppercase tracking-widest text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-[var(--color-apb-cyan)]" />
            Add New Team
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="teamId">Team ID</Label>
            <Input 
              id="teamId" 
              placeholder="e.g. APB-001" 
              value={formData.teamId}
              onChange={handleChange}
              className="font-mono uppercase"
              disabled={loading}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Team Name</Label>
            <Input 
              id="displayName" 
              placeholder="e.g. Prompt Masters" 
              value={formData.displayName}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="member1">Member 1 Name</Label>
              <Input 
                id="member1" 
                placeholder="Alice" 
                value={formData.member1}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member1Email">Member 1 Email</Label>
              <Input 
                id="member1Email" 
                type="email"
                placeholder="alice@example.com" 
                value={formData.member1Email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="member2">Member 2 Name</Label>
              <Input 
                id="member2" 
                placeholder="Bob" 
                value={formData.member2}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member2Email">Member 2 Email</Label>
              <Input 
                id="member2Email" 
                type="email"
                placeholder="bob@example.com" 
                value={formData.member2Email}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <APBButton type="button" variant="outline" className="w-full" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </APBButton>
            <APBButton type="submit" glow className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Team"}
            </APBButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
