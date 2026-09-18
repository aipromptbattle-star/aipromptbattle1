
"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { APBButton } from "./APBButton";
// RadioGroup removed - not available

interface BroadcastMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (message: { heading: string; message: string; expiresAt: number | null }) => void;
}

export function BroadcastMessageDialog({ open, onOpenChange, onSend }: BroadcastMessageDialogProps) {
  const [heading, setHeading] = useState("IMPORTANT ANNOUNCEMENT");
  const [message, setMessage] = useState("");
  const [duration, setDuration] = useState("30");

  const handleSend = () => {
    let expiresAt: number | null = null;
    if (duration !== "forever") {
      expiresAt = Date.now() + parseInt(duration) * 1000;
    }
    
    onSend({
      heading,
      message,
      expiresAt,
    });
    
    onOpenChange(false);
    setMessage(""); // Reset for next time
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-[var(--color-apb-cyan)]/30 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-[var(--color-apb-cyan)] tracking-widest uppercase">
            Broadcast Message
          </DialogTitle>
          <DialogDescription>
            Send a real-time message to all connected participants.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="heading" className="text-xs font-mono text-muted-foreground uppercase">
              Heading
            </Label>
            <Input
              id="heading"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              className="font-mono bg-background/50"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message" className="text-xs font-mono text-muted-foreground uppercase">
              Message
            </Label>
            <Input
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-background/50"
              placeholder="e.g. Stage 2 begins in 60 seconds."
            />
          </div>

          <div className="grid gap-3">
            <Label className="text-xs font-mono text-muted-foreground uppercase">Duration</Label>
            <div>
              <div className="flex items-center space-x-2">
                <input type="radio" />
                <Label htmlFor="r1">10 seconds</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="radio" />
                <Label htmlFor="r2">30 seconds</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="radio" />
                <Label htmlFor="r3">60 seconds</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="radio" />
                <Label htmlFor="r4">Until dismissed</Label>
              </div>
            </div>
          </div>
          
          <div className="rounded-md border border-[var(--color-apb-surface-border)] p-4 bg-black/40">
            <Label className="text-xs font-mono text-muted-foreground uppercase mb-2 block">Live Preview</Label>
            <div className="border border-[var(--color-apb-cyan)]/50 p-3 bg-background/50">
              <h3 className="text-xs font-bold tracking-widest text-white uppercase font-mono mb-1">
                {heading || "HEADING"}
              </h3>
              <p className="text-xs text-slate-300">
                {message || "Message preview will appear here..."}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <APBButton variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </APBButton>
          <APBButton glow onClick={handleSend} disabled={!message.trim() || !heading.trim()}>
            Send Broadcast
          </APBButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

