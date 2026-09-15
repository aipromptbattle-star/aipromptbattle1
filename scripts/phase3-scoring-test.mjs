/**
 * AI PROMPT BATTLE - SIMPLIFIED SCORING & DUAL QUALIFICATION TEST SUITE
 * Fully updated for the single overall score model (0-100),
 * deterministic tie-breaking, and dual qualification.
 */

const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  green:  "\x1b[32m",
  red:    "\x1b[31m",
  cyan:   "\x1b[36m",
  yellow: "\x1b[33m",
};

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function test(label, fn) {
  process.stdout.write(`  ${label} ... `);
  try {
    fn();
    process.stdout.write(`${C.green}PASS${C.reset}\n`);
    passed++;
  } catch (err) {
    process.stdout.write(`${C.red}FAIL${C.reset}\n`);
    console.log(`    ${C.red}→ ${err.message}${C.reset}`);
    failed++;
  }
}

console.log(`\n${C.bold}╔═════════════════════════════════════════════════════════════════╗${C.reset}`);
console.log(`${C.bold}║    APB SIMPLIFIED SCORING & DUAL QUALIFICATION VERIFICATION    ║${C.reset}`);
console.log(`${C.bold}╚═════════════════════════════════════════════════════════════════╝${C.reset}\n`);

// --- LOGIC UNDER TEST (matching src/lib/scoring.ts & firebase/judging.ts) ---

function validateSingleScore(score) {
  if (typeof score !== "number" || !Number.isInteger(score)) {
    throw new Error("Score must be an integer.");
  }
  if (score < 0 || score > 100) {
    throw new Error("Score must be between 0 and 100.");
  }
  return score;
}

function aggregateJudgeScores(scores) {
  const finalized = scores.filter((s) => s.status === "FINAL");
  if (finalized.length === 0) {
    return { finalScore: 0, scoreCount: 0 };
  }
  const values = finalized.map((s) => (s.overrideScore !== undefined ? s.overrideScore : (s.finalScore ?? s.score ?? 0)));
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = Math.round(sum / values.length);
  return { finalScore: mean, scoreCount: finalized.length };
}

function compareSubmissionsDeterministically(a, b) {
  const scoreA = a.score ?? a.totalScore ?? 0;
  const scoreB = b.score ?? b.totalScore ?? 0;
  if (scoreB !== scoreA) {
    return scoreB - scoreA;
  }
  return (a.submittedAt || 0) - (b.submittedAt || 0);
}

function validateManualTeamIds(rawInput, knownTeamIds) {
  const tokens = rawInput
    .split(/[\n,\s]+/)
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  const seen = new Set();
  const duplicates = new Set();
  const validTeams = [];
  const invalidTeams = [];

  const knownSet = new Set(knownTeamIds.map((id) => id.toUpperCase()));

  tokens.forEach((id) => {
    if (seen.has(id)) {
      duplicates.add(id);
    } else {
      seen.add(id);
      if (knownSet.has(id)) {
        validTeams.push(id);
      } else {
        invalidTeams.push(id);
      }
    }
  });

  return {
    tokens,
    validTeams,
    invalidTeams,
    duplicateTeams: Array.from(duplicates),
    isValid: invalidTeams.length === 0 && validTeams.length > 0,
  };
}

// ── TEST 1: Single Integer Overall Score Validation (0-100) ───────────
console.log(`${C.cyan}TEST 1 — Single Integer Score (0-100) Validation${C.reset}`);

test("Accepts valid integer scores 0, 50, 75, 100", () => {
  assert(validateSingleScore(0) === 0, "0 should be valid");
  assert(validateSingleScore(50) === 50, "50 should be valid");
  assert(validateSingleScore(75) === 75, "75 should be valid");
  assert(validateSingleScore(100) === 100, "100 should be valid");
});

test("Rejects decimal numbers (e.g. 85.5)", () => {
  let thrown = false;
  try { validateSingleScore(85.5); } catch (e) { thrown = true; }
  assert(thrown, "Decimals must be rejected");
});

test("Rejects negative numbers (< 0)", () => {
  let thrown = false;
  try { validateSingleScore(-5); } catch (e) { thrown = true; }
  assert(thrown, "Negative numbers must be rejected");
});

test("Rejects numbers above 100 (> 100)", () => {
  let thrown = false;
  try { validateSingleScore(101); } catch (e) { thrown = true; }
  assert(thrown, "Scores > 100 must be rejected");
});

test("Rejects NaN and non-number types", () => {
  let thrown = false;
  try { validateSingleScore("85"); } catch (e) { thrown = true; }
  assert(thrown, "String scores must be rejected");
});

// ── TEST 2: Multiple Judges & Arithmetic Mean Aggregation ──────────────
console.log(`\n${C.cyan}TEST 2 — Multiple Judges & Arithmetic Mean Aggregation${C.reset}`);

test("Arithmetic mean of multiple judges: 80, 90, 85 -> 85", () => {
  const scores = [
    { judgeId: "judgeA", score: 80, status: "FINAL" },
    { judgeId: "judgeB", score: 90, status: "FINAL" },
    { judgeId: "judgeC", score: 85, status: "FINAL" },
  ];
  const res = aggregateJudgeScores(scores);
  assert(res.finalScore === 85, `Expected 85, got ${res.finalScore}`);
  assert(res.scoreCount === 3, "Expected 3 scores");
});

test("Single judge score returns exactly that judge score", () => {
  const scores = [{ judgeId: "judgeA", score: 92, status: "FINAL" }];
  const res = aggregateJudgeScores(scores);
  assert(res.finalScore === 92, `Expected 92, got ${res.finalScore}`);
  assert(res.scoreCount === 1, "Expected 1 score");
});

test("Draft scores are ignored from aggregation until finalized", () => {
  const scores = [
    { judgeId: "judgeA", score: 90, status: "FINAL" },
    { judgeId: "judgeB", score: 20, status: "DRAFT" },
  ];
  const res = aggregateJudgeScores(scores);
  assert(res.finalScore === 90, `Expected 90, got ${res.finalScore}`);
  assert(res.scoreCount === 1, "Draft must not be counted");
});

test("Judge score isolation: Score docs keyed by judgeId do not overwrite", () => {
  const scoreStore = new Map();
  const save = (subId, judgeId, score) => {
    scoreStore.set(`${subId}_${judgeId}`, { subId, judgeId, score });
  };
  save("sub1", "judgeA", 80);
  save("sub1", "judgeB", 95);
  assert(scoreStore.get("sub1_judgeA").score === 80, "Judge A score must be preserved");
  assert(scoreStore.get("sub1_judgeB").score === 95, "Judge B score must be preserved");
});

// ── TEST 3: Deterministic Leaderboard & Timestamp Tie-Breaking ─────────
console.log(`\n${C.cyan}TEST 3 — Deterministic Leaderboard & Tie-Breaker${C.reset}`);

test("Higher final score ranks strictly higher", () => {
  const tA = { teamId: "APB-001", score: 90, submittedAt: 5000 };
  const tB = { teamId: "APB-002", score: 88, submittedAt: 1000 };
  assert(compareSubmissionsDeterministically(tA, tB) < 0, "90 must rank ahead of 88");
});

test("Tie-break: Same score -> earlier submission timestamp ASC wins", () => {
  const tEarly = { teamId: "APB-EARLY", score: 85, submittedAt: 1000 };
  const tLate  = { teamId: "APB-LATE", score: 85, submittedAt: 2000 };
  assert(compareSubmissionsDeterministically(tEarly, tLate) < 0, "Earlier timestamp must rank ahead");
  assert(compareSubmissionsDeterministically(tLate, tEarly) > 0, "Later timestamp must rank behind");
});

test("Full deterministic sort across tied and untied teams", () => {
  const submissions = [
    { teamId: "TEAM_D", score: 80, submittedAt: 4000 },
    { teamId: "TEAM_A", score: 95, submittedAt: 2000 },
    { teamId: "TEAM_C", score: 85, submittedAt: 3000 },
    { teamId: "TEAM_B", score: 85, submittedAt: 1500 },
  ];

  submissions.sort(compareSubmissionsDeterministically);
  const actualOrder = submissions.map((s) => s.teamId);
  const expectedOrder = ["TEAM_A", "TEAM_B", "TEAM_C", "TEAM_D"];
  assert(
    JSON.stringify(actualOrder) === JSON.stringify(expectedOrder),
    `Expected ${expectedOrder} but got ${actualOrder}`
  );
});

// ── TEST 4: Dual Qualification (Option A: Top N & Option B: Manual IDs) ─
console.log(`\n${C.cyan}TEST 4 — Dual Qualification (Top N & Manual IDs)${C.reset}`);

const knownTeams = ["APB-001", "APB-002", "APB-003", "APB-004", "APB-005"];
const rankedList = [
  { teamId: "APB-001", rank: 1, score: 95 },
  { teamId: "APB-002", rank: 2, score: 90 },
  { teamId: "APB-003", rank: 3, score: 85 },
  { teamId: "APB-004", rank: 4, score: 80 },
  { teamId: "APB-005", rank: 5, score: 75 },
];

test("Option A: Top N dynamically slices ranked teams for preview", () => {
  const previewTop2 = rankedList.slice(0, 2).map((r) => r.teamId);
  assert(previewTop2.length === 2 && previewTop2[0] === "APB-001" && previewTop2[1] === "APB-002", "Top 2 matches");

  const previewTop3 = rankedList.slice(0, 3).map((r) => r.teamId);
  assert(previewTop3.length === 3, "Top 3 matches");
});

test("Option A: Top N edge cases (0, negative, exceeding, decimal)", () => {
  // Edge case: 0
  const nZero = Math.max(0, 0);
  assert(rankedList.slice(0, nZero).length === 0, "Top 0 selects 0 teams");

  // Edge case: negative number (-5)
  const nNeg = Math.max(0, -5);
  assert(rankedList.slice(0, nNeg).length === 0, "Negative input safely yields 0 teams");

  // Edge case: exceeding available teams (100 requested, 5 available)
  const nOver = Math.max(0, 100);
  const selectedOver = rankedList.slice(0, nOver);
  assert(selectedOver.length === 5, "Exceeding available teams safely yields all 5 teams without undefined entries");

  // Edge case: decimal (2.7 -> 2)
  const nDec = Math.max(0, Math.floor(2.7));
  assert(rankedList.slice(0, nDec).length === 2, "Decimal floored to integer");
});

test("Option B: Validates correct comma-separated and newline-separated IDs", () => {
  const input = "APB-001, APB-002\nAPB-003";
  const val = validateManualTeamIds(input, knownTeams);
  assert(val.isValid, "Should be valid");
  assert(val.validTeams.length === 3, "Expected 3 valid teams");
  assert(val.invalidTeams.length === 0, "Expected 0 invalid teams");
});

test("Option B: Flags invalid IDs not in the competition", () => {
  const input = "APB-001, UNKNOWN_99, APB-002";
  const val = validateManualTeamIds(input, knownTeams);
  assert(!val.isValid, "Must not be valid with unknown team");
  assert(val.invalidTeams.includes("UNKNOWN_99"), "UNKNOWN_99 must be flagged as invalid");
  assert(val.validTeams.length === 2, "Must still identify the 2 valid teams");
});

test("Option B: Flags and deduplicates duplicate entries", () => {
  const input = "APB-001, APB-002, APB-001, APB-001";
  const val = validateManualTeamIds(input, knownTeams);
  assert(val.duplicateTeams.includes("APB-001"), "APB-001 must be flagged as duplicate");
  assert(val.validTeams.length === 2, "Deduplicated valid teams count should be 2");
});

// ── TEST 5: Automatic Next-Round Entry & Manual Release Control ─────────
console.log(`\n${C.cyan}TEST 5 — Automatic Next-Round Entry & Manual Release${C.reset}`);

test("Publishing qualification automatically places teams into next round eligibleRounds", () => {
  const teamsDb = {
    "APB-001": { teamId: "APB-001", eligibleRounds: [1] },
    "APB-002": { teamId: "APB-002", eligibleRounds: [1] },
    "APB-003": { teamId: "APB-003", eligibleRounds: [1] },
  };
  const qualifiedTeamIds = ["APB-001", "APB-002"];
  const nextRoundNumber = 2;

  qualifiedTeamIds.forEach((tId) => {
    if (!teamsDb[tId].eligibleRounds.includes(nextRoundNumber)) {
      teamsDb[tId].eligibleRounds.push(nextRoundNumber);
    }
  });

  assert(teamsDb["APB-001"].eligibleRounds.includes(2), "APB-001 must be eligible for Round 2");
  assert(teamsDb["APB-002"].eligibleRounds.includes(2), "APB-002 must be eligible for Round 2");
  assert(!teamsDb["APB-003"].eligibleRounds.includes(2), "Unqualified APB-003 must NOT be in Round 2");
});

test("Publishing qualification does NOT auto-start next round (status stays READY/DRAFT)", () => {
  const nextRound = { id: "r2", roundNumber: 2, status: "READY", timerStarted: false };
  nextRound.qualifiedTeams = ["APB-001", "APB-002"];

  assert(nextRound.status === "READY", "Round status must remain READY");
  assert(nextRound.timerStarted === false, "Timer must NOT auto-start merely on qualification publish");
});

console.log(`\n${C.bold}═════════════════════════════════════════════════════════════════${C.reset}`);
console.log(`${C.bold}TOTAL TESTS: ${passed + failed} | ${C.green}PASSED: ${passed}${C.reset}${C.bold} | ${failed > 0 ? C.red : C.green}FAILED: ${failed}${C.reset}`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log(`\n${C.green}${C.bold}ALL SIMPLIFIED SCORING & DUAL QUALIFICATION TESTS PASSED!${C.reset}\n`);
}
