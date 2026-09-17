export type EventStatus = "DRAFT" | "LIVE" | "ENDED";
export type RoundStatus = "DRAFT" | "READY" | "STARTING" | "LIVE" | "PAUSED" | "CLOSED" | "JUDGING" | "RESULTS" | "ENDED";
export type ChallengeType = "TEXT" | "IMAGE" | "COMBINED";

export type DisplayMode = "AUTOMATIC" | "LEADERBOARD" | "LIVE_ROUND" | "EVENT_STATUS" | "WAITING" | "IMAGE" | "TEXT";

export interface Event {
  eventName: string;
  status: EventStatus;
  currentRoundId: string | null;
  totalRounds: number;
  resultsPublished?: boolean;
  activeDisplayLayout?: number; // 1 to 10
  displayOverride?: DisplayMode;
  displayImageUrl?: string;
  displayHeading?: string;
  displaySubheading?: string;
  displayBody?: string;
  googleSheetsUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Team {
  teamId: string; // The normalized ID, e.g., "APB-014"
  displayName: string;
  member1: string;
  member1Email?: string;
  member2: string;
  member2Email?: string;
  active: boolean;
  eligibleRounds: number[]; // e.g., [1, 2]
  registrationStatus?: "PENDING" | "CONFIRMED" | "CANCELLED";
  accessCode?: string; // Team access code / PIN for entry
  source?: "MANUAL" | "GOOGLE_SHEETS" | "TEST" | {
    type: "MANUAL" | "GOOGLE_SHEETS" | "TEST";
    sourceId?: string | null;
  };
  sourceId?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface ScoringCriterion {
  id: string; // e.g. "promptQuality", "creativity", "adherence"
  name: string;
  description: string;
  maxScore: number;
  weight: number;
}

export const DEFAULT_SCORING_CRITERIA: ScoringCriterion[] = [
  { id: "promptQuality", name: "Prompt Quality", description: "Clarity, specificity, and engineering of the prompt", maxScore: 100, weight: 1 },
  { id: "creativity", name: "Creativity", description: "Originality and novel perspective", maxScore: 100, weight: 1 },
  { id: "adherence", name: "Adherence", description: "Strict following of round instructions and constraints", maxScore: 100, weight: 1 },
];

export type RoundTemplateType = "STANDARD" | "QUIZ" | "PROGRESSIVE_CONSTRAINT";

export interface QuizQuestion {
  id: number;
  question: string;
  options: [string, string, string]; // exactly 3 options A, B, C
  correctAnswer?: "A" | "B" | "C"; // privileged: stored in round doc, omitted from participant view
  points: number;
}

export type EvaluationRuleType = 
  | "MIN_WORDS" 
  | "MAX_WORDS" 
  | "EXACT_WORDS" 
  | "REQUIRED_PHRASE" 
  | "FORBIDDEN_PHRASE" 
  | "ITEM_COUNT" 
  | "CHAR_COUNT";

export interface EvaluationRule {
  id: string;
  rule: EvaluationRuleType;
  expectedValue: string | number;
  points: number;
  description?: string;
}

export interface ProgressiveConstraintStage {
  stageNumber: number; // 1 to 5
  stageName: string; // e.g. "Initial Statement", "Constraint 01"
  unlockMinute: number; // 0, 4, 8, 12, 16
  statement: string;
  evaluationRules?: EvaluationRule[];
}

export interface Round {
  id: string; // Firestore document ID
  roundNumber: number;
  title: string;
  description: string;
  durationSeconds: number;
  status: RoundStatus;
  startedAt: number | null;
  endsAt: number | null;
  pausedRemainingSeconds: number | null;
  countdownStartedAt?: number | null;
  countdownEndsAt?: number | null;
  challengeType?: ChallengeType;
  challengeTitle?: string;
  challengeDescription?: string;
  challengeInstructions?: string;
  referenceMaterial?: string;
  constraints?: string[];
  assets?: string[];
  resultsPublished?: boolean;
  qualifiedTeams?: string[];
  scoringCriteria?: ScoringCriterion[];
  createdAt: number;
  updatedAt: number;
  // Template extensions:
  templateType?: RoundTemplateType;
  quizQuestions?: QuizQuestion[];
  initialStatement?: string;
  progressiveStages?: ProgressiveConstraintStage[];
}

export interface Session {
  id?: string;
  teamId: string;
  eventId: string;
  connectedAt: number;
  lastActiveAt: number;
}

export interface Draft {
  eventId: string;
  teamId: string;
  roundId: string;
  prompt?: string;
  member1Data?: {
    text?: string;
  };
  member2Data?: {
    text?: string;
    imageUrl?: string;
    fileName?: string;
  };
  updatedBy?: string;
  updatedAt: number;
  version: number;
  // Quiz Draft:
  quizAnswers?: Record<number, "A" | "B" | "C">;
  // Progressive Constraint Stage Drafts:
  currentStage?: number;
  stageDrafts?: Record<number, {
    prompt: string;
    outputText?: string;
    outputImageUrl?: string;
    updatedAt: number;
  }>;
}

export type TeamRoundStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "LOCKED";

export interface TeamRoundState {
  eventId: string;
  teamId: string;
  roundId: string;
  status: TeamRoundStatus;
  startedAt?: number;
  submittedAt?: number;
  lastSavedAt?: number;
  version: number;
  updatedAt: number;
}

export interface StageSubmissionRecord {
  stageNumber: number;
  prompt: string;
  outputText?: string;
  outputImageUrl?: string;
  submittedAt: number;
  isAutoSubmitted?: boolean;
  automaticScore?: number;
  ruleResults?: Array<{
    ruleId?: string;
    description?: string;
    feedback?: string;
    pass?: boolean;
    passed?: boolean;
    scoreAwarded?: number;
    pointsEarned?: number;
    maxPoints?: number;
  }>;
}

export interface Submission {
  id: string; // `${eventId}_${teamId}_${roundId}`
  eventId: string;
  teamId: string;
  roundId: string;
  prompt: string;
  member1Data?: {
    text?: string;
  };
  member2Data?: {
    text?: string;
    imageUrl?: string;
    fileName?: string;
  };
  submittedAt: number;
  submittedBy: string;
  status: "FINAL";
  version: number;
  // Quiz submission:
  quizAnswers?: Record<number, "A" | "B" | "C">;
  quizScore?: number;
  // Progressive stages submissions:
  stageSubmissions?: Record<number, StageSubmissionRecord>;
  progressiveStageSubmissions?: StageSubmissionRecord[];
  stageReached?: number;
  ruleResults?: Array<{
    ruleId?: string;
    description?: string;
    feedback?: string;
    pass?: boolean;
    passed?: boolean;
    scoreAwarded?: number;
    pointsEarned?: number;
    maxPoints?: number;
  }>;
  automaticScoreTotal?: number;
  automatedScore?: number;
  // Judging & Evaluation fields:
  score?: number;
  criteriaScores?: {
    promptQuality?: number;
    creativity?: number;
    adherence?: number;
    [key: string]: number | undefined;
  };
  judgeComments?: string;
  evaluatedBy?: string;
  evaluatedAt?: number;
  scoreHistory?: Array<{
    previousScore: number;
    newScore: number;
    reason?: string;
    modifiedBy: string;
    timestamp: number;
  }>;
}

export interface AuditLog {
  action: string;
  actor: "ORGANIZER" | "SYSTEM" | string;
  timestamp: number;
  eventId?: string;
  roundId?: string;
  teamId?: string;
  metadata?: Record<string, unknown>;
}

export interface Judge {
  uid: string;
  displayName: string;
  email: string;
  active: boolean;
  createdAt: number;
  assignedCount?: number;
  isOnline?: boolean;
  lastHeartbeat?: number;
}

export interface JudgeAssignment {
  id: string; // `${eventId}_${roundId}_${submissionId}_${judgeId}`
  eventId: string;
  roundId: string;
  submissionId: string;
  teamId: string;
  judgeId: string;
  judgeName: string;
  status: "PENDING" | "EVALUATED";
  createdAt: number;
  assignedBy: string;
}

export interface JudgeScore {
  id: string; // `${eventId}_${roundId}_${submissionId}_${judgeId}`
  eventId: string;
  roundId: string;
  submissionId: string;
  teamId: string;
  judgeId: string;
  judgeName: string;
  criteriaScores: Record<string, number>;
  finalScore: number; // calculated deterministically using criteria weights
  comments: string;
  status: "DRAFT" | "FINAL";
  createdAt: number;
  updatedAt: number;
  finalizedAt?: number;
  overrideScore?: number;
  overrideReason?: string;
  overrideBy?: string;
  overrideAt?: number;
}

export interface Qualification {
  id: string; // `${eventId}_${roundId}_${teamId}`
  eventId: string;
  roundId: string;
  teamId: string;
  qualified: boolean;
  rank: number;
  score: number;
  confirmedAt: number;
  confirmedBy: string;
}
