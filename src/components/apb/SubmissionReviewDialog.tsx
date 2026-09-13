"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { APBButton } from "./APBButton";
import { Round, Draft } from "@/lib/firebase/schema";
import { submitFinalResponse } from "@/lib/firebase/submissions";
import { Send, AlertTriangle, FileText, Image as ImageIcon, Loader2 } from "lucide-react";

interface SubmissionReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  round: Round;
  teamId: string;
  draft: Draft | null;
  submittedBy: string;
  onSuccess: () => void;
}

export function SubmissionReviewDialog({
  open,
  onOpenChange,
  round,
  teamId,
  draft,
  submittedBy,
  onSuccess,
}: SubmissionReviewDialogProps) {
  const [confirmStep, setConfirmStep] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const promptText = draft?.prompt || draft?.member1Data?.text || "";
  const imageUrl = draft?.member2Data?.imageUrl || "";
  const creativeText = draft?.member2Data?.text || "";

  const handleInitialConfirm = () => {
    setError("");
    setConfirmStep(true);
  };

  const handleFinalSubmit = async () => {
    if (submitting) return;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setError("Connection lost — cannot submit while offline. Your draft is preserved locally. Reconnect to submit.");
      return;
    }

    setSubmitting(true);
    setError("");

    const result = await submitFinalResponse({
      eventId: round.createdAt ? "currentEvent" : "currentEvent",
      teamId,
      roundId: round.id,
      prompt: promptText,
      member1Data: { text: promptText },
      member2Data: {
        text: creativeText,
        imageUrl,
        fileName: draft?.member2Data?.fileName || "",
      },
      submittedBy,
    });

    setSubmitting(false);

    if (result.success) {
      setConfirmStep(false);
      onOpenChange(false);
      onSuccess();
    } else {
      setError(result.error || "Submission failed.");
    }
  };

  return (
    <>
      {/* Primary Review Modal */}
      <Dialog
        open={open && !confirmStep}
        onOpenChange={(next) => {
          if (!submitting) onOpenChange(next);
        }}
      >
        <DialogContent className="max-w-2xl bg-[var(--color-apb-surface)] border-[var(--color-apb-surface-border)] text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[var(--color-apb-cyan)]">
              <Send className="w-4 h-4" />
              <span>Submission Review</span>
            </div>
            <DialogTitle className="text-2xl font-mono uppercase font-bold tracking-tight text-white">
              Round {round.roundNumber} Final Response
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-mono">
              Team: {teamId} • Please inspect your team&apos;s combined work carefully before finalizing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Primary Prompt Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--color-apb-cyan)]">
                <FileText className="w-3.5 h-3.5" />
                <span>Primary Prompt (Member 1)</span>
              </div>
              <div className="bg-black/50 border border-[var(--color-apb-surface-border)] rounded-md p-4 font-mono text-sm text-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {promptText || <span className="text-muted-foreground italic">No prompt entered.</span>}
              </div>
            </div>

            {/* Creative Asset Section */}
            {(round.challengeType === "IMAGE" || round.challengeType === "COMBINED") && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-purple-400">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Creative Asset (Member 2)</span>
                </div>
                {imageUrl ? (
                  <div className="rounded-lg overflow-hidden border border-[var(--color-apb-surface-border)] bg-black/60 max-h-60 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Submitted asset"
                      className="max-h-60 object-contain w-auto mx-auto"
                    />
                  </div>
                ) : (
                  <div className="p-4 rounded border border-dashed border-[var(--color-apb-surface-border)] text-xs text-muted-foreground font-mono text-center">
                    No image uploaded.
                  </div>
                )}
              </div>
            )}

            {/* Creative Text / Notes */}
            {creativeText && (
              <div className="space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Creative Notes / Secondary Response
                </div>
                <div className="bg-black/50 border border-[var(--color-apb-surface-border)] rounded-md p-3 font-mono text-xs text-slate-300 whitespace-pre-wrap">
                  {creativeText}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 border-t border-[var(--color-apb-surface-border)] pt-4">
            <APBButton
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto font-mono text-xs"
            >
              Back to Edit
            </APBButton>
            <APBButton
              glow
              onClick={handleInitialConfirm}
              className="w-full sm:w-auto font-mono text-xs"
            >
              Proceed to Confirm
            </APBButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Secondary Confirmation Dialog */}
      <Dialog open={confirmStep} onOpenChange={setConfirmStep}>
        <DialogContent className="max-w-md bg-[var(--color-apb-surface)] border-rose-500/40 text-white">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-mono uppercase font-bold text-white">
              Confirm Final Submission?
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-300 pt-2 leading-relaxed">
              After submitting, your team&apos;s workspace will be <strong className="text-white">permanently locked</strong> for this round. No further edits or image uploads will be allowed.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">
              {error}
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <APBButton
              variant="outline"
              onClick={() => setConfirmStep(false)}
              disabled={submitting}
              className="w-full sm:w-auto font-mono text-xs"
            >
              Cancel
            </APBButton>
            <APBButton
              variant="destructive"
              onClick={handleFinalSubmit}
              disabled={submitting}
              className="w-full sm:w-auto font-mono text-xs"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Submitting...
                </>
              ) : (
                "Submit Final"
              )}
            </APBButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
