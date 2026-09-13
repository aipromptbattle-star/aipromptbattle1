"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Submission, Round, JudgeScore, ScoringCriterion, DEFAULT_SCORING_CRITERIA } from "@/lib/firebase/schema";
import { saveJudgeScore } from "@/lib/firebase/judging";
import { calculateDeterministicScore } from "@/lib/scoring";
import { APBCard } from "@/components/apb/APBCard";
import { APBButton } from "@/components/apb/APBButton";
import { ConfirmationDialog } from "@/components/apb/ConfirmationDialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Save,
  Send,
  Star,
  FileText,
  Image as ImageIcon,
  ShieldAlert,
  Info,
  ExternalLink,
} from "lucide-react";

export default function JudgeSubmissionWorkspace() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const submissionId = params.submissionId as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [judgeScore, setJudgeScore] = useState<JudgeScore | null>(null);
  const [loading, setLoading] = useState(true);

  // Evaluation Form State
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmFinalizeOpen, setConfirmFinalizeOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!submissionId || !user) return;
      try {
        // 1. Fetch submission
        const subRef = doc(db, "submissions", submissionId);
        const subSnap = await getDoc(subRef);
        if (!subSnap.exists()) {
          alert("Submission not found.");
          router.push("/judge");
          return;
        }
        const subData = { id: subSnap.id, ...subSnap.data() } as Submission;
        setSubmission(subData);

        // 2. Fetch round
        if (subData.roundId) {
          const roundRef = doc(db, "rounds", subData.roundId);
          const roundSnap = await getDoc(roundRef);
          if (roundSnap.exists()) {
            setRound({ id: roundSnap.id, ...roundSnap.data() } as Round);
          }
        }

        // 3. Fetch existing score for this judge
        const scoreId = `${subData.eventId}_${subData.roundId}_${subData.id}_${user.uid}`;
        const scoreRef = doc(db, "scores", scoreId);
        const scoreSnap = await getDoc(scoreRef);
        if (scoreSnap.exists()) {
          const s = scoreSnap.data() as JudgeScore;
          setJudgeScore(s);
          setScores(s.criteriaScores || {});
          setComments(s.comments || "");
        } else {
          // Initialize defaults for criteria
          setScores({
            promptQuality: 75,
            creativity: 75,
            adherence: 75,
          });
        }
      } catch (err) {
        console.error("Failed to load workspace data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [submissionId, user, router]);

  if (loading || !submission || !user) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-apb-cyan)]" />
      </div>
    );
  }

  const criteriaList: ScoringCriterion[] = round?.scoringCriteria && round.scoringCriteria.length > 0
    ? round.scoringCriteria
    : DEFAULT_SCORING_CRITERIA;

  const calculatedScore = calculateDeterministicScore(scores, criteriaList);
  const isFinalized = judgeScore?.status === "FINAL";

  const handleScoreChange = (id: string, val: number) => {
    if (isFinalized) return;
    setScores((prev) => ({ ...prev, [id]: val }));
  };

  const handleSave = async (status: "DRAFT" | "FINAL") => {
    setSaving(true);
    try {
      await saveJudgeScore({
        eventId: submission.eventId,
        roundId: submission.roundId,
        submissionId: submission.id,
        teamId: submission.teamId,
        judgeId: user.uid,
        judgeName: user.displayName || user.email || "Official Judge",
        criteriaScores: scores,
        comments,
        status,
        criteria: criteriaList,
      });

      // Reload local state
      setJudgeScore((prev) => ({
        ...(prev || ({} as JudgeScore)),
        status,
        finalScore: calculatedScore,
        criteriaScores: scores,
        comments,
      }));

      if (status === "FINAL") {
        setConfirmFinalizeOpen(false);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save score.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <Link href="/judge" className="inline-flex items-center text-sm font-mono text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Link>

        {isFinalized ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono">
            <Lock className="w-3.5 h-3.5" />
            <span>Score Finalized: {judgeScore?.overrideScore !== undefined ? judgeScore.overrideScore : judgeScore?.finalScore}/100</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono">
            <span>Evaluation In Progress (Draft)</span>
          </div>
        )}
      </div>

      <header className="border-b border-[var(--color-apb-surface-border)] pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="text-xs font-mono uppercase text-[var(--color-apb-cyan)] tracking-widest">
              Submission Evaluation
            </span>
            <h2 className="text-2xl font-mono font-bold text-white uppercase">
              Team Workstation: {submission.teamId}
            </h2>
          </div>

          <div className="text-right font-mono text-xs text-muted-foreground">
            <div>Submitted: {new Date(submission.submittedAt).toLocaleTimeString()}</div>
            <div>Status: <strong className="text-white">{submission.status}</strong></div>
          </div>
        </div>
      </header>

      {/* Main Grid: Work Showcase (Left 60%) + Scoring Panel (Right 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Submission Details */}
        <div className="lg:col-span-7 space-y-6">
          {/* Round Challenge Briefing */}
          {round && (
            <APBCard className="p-4 space-y-3 bg-[var(--color-apb-surface)]/50">
              <div className="flex items-center gap-2 text-xs font-mono uppercase text-[var(--color-apb-cyan)] font-bold">
                <Info className="w-4 h-4" /> Challenge Reference: Round {round.roundNumber} ({round.title})
              </div>
              {round.challengeInstructions && (
                <p className="text-xs text-white/90 font-mono whitespace-pre-wrap bg-black/40 p-3 rounded border border-[var(--color-apb-surface-border)]">
                  {round.challengeInstructions}
                </p>
              )}
              {round.constraints && round.constraints.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground">Required Constraints:</span>
                  <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                    {round.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </APBCard>
          )}

          {/* Final Prompt / Response */}
          <APBCard className="p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--color-apb-surface-border)] pb-2">
              <span className="text-xs font-mono uppercase font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[var(--color-apb-cyan)]" /> Final Prompt Response
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">Main Evaluation Target</span>
            </div>
            <div className="p-4 rounded-lg bg-black/60 border border-[var(--color-apb-surface-border)] text-sm text-white font-mono whitespace-pre-wrap leading-relaxed">
              {submission.prompt || "(Empty prompt)"}
            </div>
          </APBCard>

          {/* Member Work Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Member 1 Work */}
            <APBCard className="p-4 space-y-2">
              <span className="text-xs font-mono uppercase text-muted-foreground block">
                Member 01 Contribution (Text)
              </span>
              <div className="p-3 rounded bg-black/40 border border-[var(--color-apb-surface-border)] text-xs text-white/80 font-mono min-h-[80px] whitespace-pre-wrap">
                {submission.member1Data?.text || "(No Member 1 notes submitted)"}
              </div>
            </APBCard>

            {/* Member 2 Work */}
            <APBCard className="p-4 space-y-2">
              <span className="text-xs font-mono uppercase text-muted-foreground block">
                Member 02 Contribution (Creative / Image)
              </span>
              <div className="p-3 rounded bg-black/40 border border-[var(--color-apb-surface-border)] text-xs text-white/80 font-mono min-h-[80px] whitespace-pre-wrap">
                {submission.member2Data?.text || "(No Member 2 text submitted)"}
              </div>
            </APBCard>
          </div>

          {/* Creative / Image Asset Preview */}
          {submission.member2Data?.imageUrl && (
            <APBCard className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase font-bold text-white flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-purple-400" /> Uploaded Creative Asset
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {submission.member2Data.fileName || "Asset preview"}
                </span>
              </div>
              <div className="relative group rounded-lg overflow-hidden border border-[var(--color-apb-surface-border)] bg-black/40 flex items-center justify-center p-2">
                <img
                  src={submission.member2Data.imageUrl}
                  alt="Team Submission Artwork"
                  className="max-h-80 rounded object-contain cursor-pointer transition-transform group-hover:scale-[1.01]"
                  onClick={() => setImageModalOpen(true)}
                />
              </div>
              <div className="text-right">
                <APBButton size="sm" variant="ghost" onClick={() => setImageModalOpen(true)} className="text-xs">
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Full Image
                </APBButton>
              </div>
            </APBCard>
          )}
        </div>

        {/* Right Column: Scoring Controls */}
        <div className="lg:col-span-5 sticky top-20 space-y-6">
          <APBCard className="p-6 space-y-6 border-[var(--color-apb-surface-border)] bg-[var(--color-apb-surface)] shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--color-apb-surface-border)] pb-3">
              <div>
                <h3 className="text-lg font-mono font-bold uppercase text-white flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" /> Evaluation Sheet
                </h3>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Deterministic criteria scoring
                </span>
              </div>

              {/* Total Score Badge */}
              <div className="text-right">
                <div className="text-3xl font-mono font-bold text-[var(--color-apb-cyan)]">
                  {calculatedScore}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase">/ 100 PTS</div>
              </div>
            </div>

            {/* Criteria Inputs */}
            <div className="space-y-5">
              {criteriaList.map((criterion) => {
                const currentVal = scores[criterion.id] ?? 0;
                return (
                  <div key={criterion.id} className="space-y-2 p-3.5 rounded-lg bg-black/40 border border-[var(--color-apb-surface-border)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-xs font-mono font-bold uppercase text-white">
                          {criterion.name}
                        </Label>
                        <span className="text-[10px] font-mono text-muted-foreground block">
                          Weight: {criterion.weight}x • Max: {criterion.maxScore}
                        </span>
                      </div>
                      <div className="w-16">
                        <Input
                          type="number"
                          min={0}
                          max={criterion.maxScore}
                          value={currentVal}
                          disabled={isFinalized || saving}
                          onChange={(e) => handleScoreChange(criterion.id, parseInt(e.target.value) || 0)}
                          className="font-mono text-sm text-center h-8"
                        />
                      </div>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={criterion.maxScore}
                      step={1}
                      value={currentVal}
                      disabled={isFinalized || saving}
                      onChange={(e) => handleScoreChange(criterion.id, parseInt(e.target.value) || 0)}
                      className="w-full accent-[var(--color-apb-cyan)] bg-slate-800 rounded-lg cursor-pointer h-2 py-1"
                    />

                    {criterion.description && (
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {criterion.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Comments Field */}
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase text-muted-foreground">
                Judge Feedback / Observations
              </Label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                disabled={isFinalized || saving}
                placeholder="Enter specific notes on prompt structure, alignment with constraints, or creative execution..."
                rows={3}
                className="w-full bg-black/50 border border-[var(--color-apb-surface-border)] rounded-md px-3 py-2 text-xs text-white font-mono resize-none focus:outline-none focus:border-[var(--color-apb-cyan)]"
              />
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              {isFinalized ? (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono text-center flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Score has been finalized and locked.
                </div>
              ) : (
                <div className="flex gap-3">
                  <APBButton
                    type="button"
                    variant="outline"
                    className="flex-1 font-mono text-xs uppercase"
                    onClick={() => handleSave("DRAFT")}
                    disabled={saving}
                  >
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    {saving ? "Saving..." : "Save Draft"}
                  </APBButton>

                  <APBButton
                    type="button"
                    glow
                    className="flex-1 font-mono text-xs uppercase"
                    onClick={() => setConfirmFinalizeOpen(true)}
                    disabled={saving}
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    Finalize Score
                  </APBButton>
                </div>
              )}
            </div>

            {/* Organizer Override Note if present */}
            {judgeScore?.overrideScore !== undefined && (
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono space-y-1">
                <div className="font-bold uppercase flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                  Organizer Correction Applied
                </div>
                <div>Adjusted Score: <strong>{judgeScore.overrideScore}/100</strong></div>
                {judgeScore.overrideReason && (
                  <div className="text-[10px] text-muted-foreground">Reason: {judgeScore.overrideReason}</div>
                )}
              </div>
            )}
          </APBCard>
        </div>
      </div>

      {/* Finalize Confirmation Modal */}
      <ConfirmationDialog
        open={confirmFinalizeOpen}
        onOpenChange={setConfirmFinalizeOpen}
        title="Finalize Evaluation?"
        description={`You are about to commit a final score of ${calculatedScore}/100 for Team ${submission.teamId}. Once finalized, this evaluation cannot be edited by the judge.`}
        confirmText={saving ? "Finalizing..." : "Yes, Finalize Score"}
        cancelText="Keep Editing"
        onConfirm={() => handleSave("FINAL")}
      />

      {/* Image Modal Preview */}
      {imageModalOpen && submission.member2Data?.imageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setImageModalOpen(false)}
        >
          <div className="max-w-4xl max-h-[90vh] relative">
            <img
              src={submission.member2Data.imageUrl}
              alt="Expanded Preview"
              className="rounded-lg object-contain max-h-[85vh] w-auto border border-white/20"
            />
            <p className="text-center text-xs font-mono text-muted-foreground mt-2">
              Click anywhere to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
}