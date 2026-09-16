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
  const [teamDisplayName, setTeamDisplayName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Single Overall Evaluation State (0-100 integer)
  const [score, setScore] = useState<number>(75);
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

        // Fetch team display name
        if (subData.teamId) {
          try {
            const teamRef = doc(db, "teams", subData.teamId.toUpperCase());
            const teamSnap = await getDoc(teamRef);
            if (teamSnap.exists()) {
              setTeamDisplayName(teamSnap.data().displayName || "");
            }
          } catch (e) {
            console.warn("Could not fetch team name:", e);
          }
        }

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
          const loadedScore = s.overrideScore !== undefined
            ? s.overrideScore
            : s.finalScore !== undefined
            ? s.finalScore
            : 75;
          setScore(loadedScore);
          setComments(s.comments || "");
        } else {
          setScore(75);
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

  const isFinalized = judgeScore?.status === "FINAL";

  const handleScoreChange = (val: number) => {
    if (isFinalized) return;
    const clamped = Math.min(100, Math.max(0, Math.round(val)));
    setScore(clamped);
  };

  const handleSave = async (status: "DRAFT" | "FINAL") => {
    setSaving(true);
    const validScore = Math.min(100, Math.max(0, Math.round(score)));
    try {
      await saveJudgeScore({
        eventId: submission.eventId,
        roundId: submission.roundId,
        submissionId: submission.id,
        teamId: submission.teamId,
        judgeId: user.uid,
        judgeName: user.displayName || user.email || "Official Judge",
        score: validScore,
        comments,
        status,
      });

      // Reload local state
      setJudgeScore((prev) => ({
        ...(prev || ({} as JudgeScore)),
        status,
        finalScore: validScore,
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
            <h2 className="text-2xl font-mono font-bold text-white uppercase flex items-center gap-2">
              <span>Team {submission.teamId}</span>
              {teamDisplayName && (
                <span className="text-lg font-sans font-normal text-muted-foreground">
                  • {teamDisplayName}
                </span>
              )}
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

          {/* Quiz Score Card (if Round 1 Quiz submission) */}
          {submission.quizScore !== undefined && (
            <APBCard className="p-5 space-y-3 border-[var(--color-apb-cyan)]/30 bg-[var(--color-apb-cyan)]/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase font-bold text-[var(--color-apb-cyan)] flex items-center gap-2">
                  <Star className="w-4 h-4" /> Round 1 Quiz Performance
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--color-apb-cyan)]/20 text-[var(--color-apb-cyan)]">
                  {submission.quizScore} / 20 Points
                </span>
              </div>
              <p className="text-xs text-white/80 font-mono">
                Team completed automated 20-question prompt engineering quiz.
              </p>
            </APBCard>
          )}

          {/* Progressive Constraint Stage Breakdown (if Round 2 Progressive submission) */}
          {submission.progressiveStageSubmissions && submission.progressiveStageSubmissions.length > 0 && (
            <APBCard className="p-5 space-y-4 border-[var(--color-apb-purple)]/30 bg-[var(--color-apb-purple)]/5">
              <div className="flex items-center justify-between border-b border-[var(--color-apb-surface-border)] pb-2">
                <span className="text-xs font-mono uppercase font-bold text-[var(--color-apb-purple)] flex items-center gap-2">
                  <FileText className="w-4 h-4" /> 5-Stage Evolution Trail
                </span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  Stages Completed: {submission.progressiveStageSubmissions.length} / 5
                </span>
              </div>
              <div className="space-y-3">
                {submission.progressiveStageSubmissions.map((stage) => (
                  <div key={stage.stageNumber} className="p-3 rounded-lg bg-black/50 border border-[var(--color-apb-surface-border)] space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-[var(--color-apb-purple)]/20 text-[var(--color-apb-purple)] flex items-center justify-center text-[10px]">
                          {stage.stageNumber}
                        </span>
                        Stage {stage.stageNumber} Draft
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded ${
                        stage.isAutoSubmitted 
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30" 
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      }`}>
                        {stage.isAutoSubmitted ? "Auto-Frozen (Boundary)" : "Manual Submitted"}
                      </span>
                    </div>
                    <p className="text-xs text-white/90 font-mono whitespace-pre-wrap bg-black/40 p-2.5 rounded border border-white/5">
                      {stage.prompt || "(No text recorded for this stage)"}
                    </p>
                    {stage.ruleResults && stage.ruleResults.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {stage.ruleResults.map((r, i) => (
                          <span key={i} className={`text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 ${
                            r.passed 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}>
                            <span>{r.passed ? "✓" : "✗"}</span>
                            <span>{r.feedback}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </APBCard>
          )}

          {/* Automated Rule Check Results Summary */}
          {submission.ruleResults && submission.ruleResults.length > 0 && (
            <APBCard className="p-4 space-y-3 bg-[var(--color-apb-surface)]/60">
              <div className="flex items-center justify-between border-b border-[var(--color-apb-surface-border)] pb-2">
                <span className="text-xs font-mono uppercase font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Automated Rule Verification
                </span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {submission.ruleResults.filter(r => r.passed).length} / {submission.ruleResults.length} Checks Passed
                </span>
              </div>
              <div className="space-y-1.5">
                {submission.ruleResults.map((rule, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded bg-black/40 text-xs font-mono">
                    <span className="text-white/80">{rule.feedback}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      rule.passed ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                    }`}>
                      {rule.passed ? "PASSED" : "FAILED"}
                    </span>
                  </div>
                ))}
              </div>
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
                  Overall single score
                </span>
              </div>

              {/* Total Score Badge */}
              <div className="text-right">
                <div className="text-3xl font-mono font-bold text-[var(--color-apb-cyan)]">
                  {score}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase">/ 100 PTS</div>
              </div>
            </div>

            {/* Single Overall Score Control */}
            <div className="space-y-4 p-4 rounded-lg bg-black/40 border border-[var(--color-apb-surface-border)]">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-mono font-bold uppercase text-white">
                    Overall Evaluation Score
                  </Label>
                  <span className="text-xs font-mono text-muted-foreground block">
                    Direct Integer (0 – 100)
                  </span>
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={score}
                    disabled={isFinalized || saving}
                    onChange={(e) => handleScoreChange(parseInt(e.target.value) || 0)}
                    className="font-mono text-xl font-bold text-center h-11 border-[var(--color-apb-cyan)]/40 bg-black/60 text-[var(--color-apb-cyan)]"
                  />
                </div>
              </div>

              {/* Slider */}
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={score}
                disabled={isFinalized || saving}
                onChange={(e) => handleScoreChange(parseInt(e.target.value) || 0)}
                className="w-full accent-[var(--color-apb-cyan)] bg-slate-800 rounded-lg cursor-pointer h-2.5 py-1"
              />

              {/* Quick Score Presets */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">
                  Quick Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[50, 60, 70, 75, 80, 85, 90, 95, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={isFinalized || saving}
                      onClick={() => handleScoreChange(preset)}
                      className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                        score === preset
                          ? "bg-[var(--color-apb-cyan)] text-black font-bold"
                          : "bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
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
        description={`You are about to commit a final score of ${score}/100 for Team ${submission.teamId}. Once finalized, this evaluation cannot be edited by the judge.`}
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