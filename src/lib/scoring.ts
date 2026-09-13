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
 * Deterministic arithmetic mean of finalized judge final scores.
 * Also computes sample variance (or 0 if < 2 scores).
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

  const values = finalized.map((s) => (s.overrideScore !== undefined ? s.overrideScore : (s.finalScore ?? (s as any).weightedScore ?? 0)));
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = Math.round(sum / values.length);

  // Variance: sum((x - mean)^2) / n
  let variance = 0;
  if (values.length > 1) {
    const squaredDiffs = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
    variance = Math.round((squaredDiffs / values.length) * 100) / 100;
  }

  // Criteria averages
  const criteriaTotals: Record<string, number> = {};
  const criteriaCounts: Record<string, number> = {};
  for (const s of finalized) {
    if (s.criteriaScores) {
      for (const [key, val] of Object.entries(s.criteriaScores)) {
        if (typeof val === "number") {
          criteriaTotals[key] = (criteriaTotals[key] || 0) + val;
          criteriaCounts[key] = (criteriaCounts[key] || 0) + 1;
        }
      }
    }
  }

  const criteriaAverages: Record<string, number> = {};
  for (const [key, tot] of Object.entries(criteriaTotals)) {
    const count = criteriaCounts[key] || 1;
    criteriaAverages[key] = Math.round((tot / count) * 10) / 10;
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
      score: s.overrideScore !== undefined ? s.overrideScore : (s.finalScore ?? (s as any).weightedScore ?? 0),
    })),
    criteriaAverages,
  };
}

/**
 * Deterministic Tie-Breaker Comparator:
 * Sorts two submissions/teams with the following strict hierarchy:
 * 1. Overall / Aggregated Score (DESC)
 * 2. Primary Criterion Score: Prompt Quality (DESC)
 * 3. Secondary Criterion Score: Creativity (DESC)
 * 4. Earlier valid Final Submission Timestamp (ASC - earlier is better)
 */
export function compareSubmissionsDeterministically(
  a: { score?: number; totalScore?: number; promptQuality?: number; creativity?: number; criteriaScores?: Record<string, number | undefined>; submittedAt: number },
  b: { score?: number; totalScore?: number; promptQuality?: number; creativity?: number; criteriaScores?: Record<string, number | undefined>; submittedAt: number }
): number {
  // 1. Overall Score (DESC)
  const scoreA = a.score ?? a.totalScore ?? 0;
  const scoreB = b.score ?? b.totalScore ?? 0;
  if (scoreB !== scoreA) {
    return scoreB - scoreA;
  }

  // 2. Primary Criterion: Prompt Quality (DESC)
  const pqA = a.criteriaScores?.promptQuality ?? a.promptQuality ?? 0;
  const pqB = b.criteriaScores?.promptQuality ?? b.promptQuality ?? 0;
  if (pqB !== pqA) {
    return pqB - pqA;
  }

  // 3. Secondary Criterion: Creativity (DESC)
  const crA = a.criteriaScores?.creativity ?? a.creativity ?? 0;
  const crB = b.criteriaScores?.creativity ?? b.creativity ?? 0;
  if (crB !== crA) {
    return crB - crA;
  }

  // 4. Earlier Submission Timestamp (ASC - earlier wins)
  return (a.submittedAt || 0) - (b.submittedAt || 0);
}
