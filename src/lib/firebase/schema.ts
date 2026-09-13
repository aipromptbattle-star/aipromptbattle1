export type EventStatus = "DRAFT" | "LIVE" | "ENDED";
export type RoundStatus = "DRAFT" | "READY" | "LIVE" | "PAUSED" | "CLOSED" | "JUDGING" | "RESULTS";
export type ChallengeType = "TEXT" | "IMAGE" | "COMBINED";

export interface Event {
  eventName: string;
  status: EventStatus;
  currentRoundId: string | null;
  totalRounds: number;
  resultsPublished?: boolean;
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
  source?: "MANUAL" | "GOOGLE_SHEETS" | {
    type: "MANUAL" | "GOOGLE_SHEETS";
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
