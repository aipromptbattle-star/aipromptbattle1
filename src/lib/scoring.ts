import { ScoringCriterion, DEFAULT_SCORING_CRITERIA, JudgeScore, Submission } from "./firebase/schema";

/**
 * Deterministic Scoring Formula:
 * Calculates the normalized weighted final score (0-100) based on criteria weights.
 * 
 * Formula:
 *   weightedScore = round( sum(score_i * weight_i) / sum(weight_i) )
 * 
 * If sum(weight_i) == 0, falls back to unweighted arithmetic mean.
 */
export function calculateDeterministicScore(
  scores: Record<string, number>,
  criteria: ScoringCriterion[] = DEFAULT_SCORING_CRITERIA
): number {
  if (!criteria || criteria.length === 0) return 0;

  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const criterion of criteria) {
    const rawScore = Number(scores[criterion.id] ?? 0);
    const clampedScore = Math.max(0, Math.min(criterion.maxScore || 100, rawScore));
    const weight = Number(criterion.weight > 0 ? criterion.weight : 1);

    // Normalize rawScore to a 100-point scale before applying weight
    const normalizedScore = (clampedScore / (criterion.maxScore || 100)) * 100;
    totalWeightedScore += normalizedScore * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 0;
  return Math.round(totalWeightedScore / totalWeight);
}

/**
 * Multi-Judge Aggregation:
 * Deterministic arithmetic mean of finalized judge overall scores (0-100).
 * If single judge scored, finalScore is that judge's score.
 */
export function aggregateJudgeScores(scores: JudgeScore[]): {
  finalScore: number;
  scoreCount: number;
  finalJudgeCount: number;
  aggregateScore: number;
  variance: number;
  judgeScoresList: { judgeId: string; judgeName: string; score: number }[];
  criteriaAverages: Record<string, number>;
} {
  const finalized = scores.filter((s) => s.status === "FINAL");
  if (finalized.length === 0) {
    return {
      finalScore: 0,
      scoreCount: 0,
      finalJudgeCount: 0,
      aggregateScore: 0,
      variance: 0,
      judgeScoresList: [],
      criteriaAverages: {},
    };
  }

  const values = finalized.map((s) => (s.overrideScore !== undefined ? s.overrideScore : (s.finalScore ?? (s as any).score ?? 0)));
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = Math.round(sum / values.length);

  // Variance: sum((x - mean)^2) / n
  let variance = 0;
  if (values.length > 1) {
    const squaredDiffs = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
    variance = Math.round((squaredDiffs / values.length) * 100) / 100;
  }

  return {
    finalScore: mean,
    scoreCount: finalized.length,
    finalJudgeCount: finalized.length,
    aggregateScore: mean,
    variance,
    judgeScoresList: finalized.map((s) => ({
      judgeId: s.judgeId,
      judgeName: s.judgeName,
      score: s.overrideScore !== undefined ? s.overrideScore : (s.finalScore ?? (s as any).score ?? 0),
    })),
    criteriaAverages: {},
  };
}

/**
 * Deterministic Tie-Breaker Comparator:
 * Sorts two submissions/teams strictly according to the final design:
 * 1. Final Score (DESC - higher score ranks higher)
 * 2. Earlier valid Final Submission Timestamp (ASC - earlier timestamp ranks higher)
 */
export function compareSubmissionsDeterministically(
  a: { score?: number; totalScore?: number; submittedAt: number },
  b: { score?: number; totalScore?: number; submittedAt: number }
): number {
  // 1. Overall / Final Score (DESC)
  const scoreA = a.score ?? a.totalScore ?? 0;
  const scoreB = b.score ?? b.totalScore ?? 0;
  if (scoreB !== scoreA) {
    return scoreB - scoreA;
  }

  // 2. Earlier Submission Timestamp (ASC - earlier wins)
  return (a.submittedAt || 0) - (b.submittedAt || 0);
}
