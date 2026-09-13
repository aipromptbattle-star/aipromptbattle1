import {
  calculateDeterministicScore,
  aggregateJudgeScores,
  compareSubmissionsDeterministically,
} from "../src/lib/scoring.js";

const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  green:  "\x1b[32m",
  red:    "\x1b[31m",
  cyan:   "\x1b[36m",
  dim:    "\x1b[2m",
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

console.log(`\n${C.bold}╔═══════════════════════════════════════════════════╗${C.reset}`);
console.log(`${C.bold}║   PHASE 3 SCORING & LEADERBOARD VERIFICATION     ║${C.reset}`);
console.log(`${C.bold}╚═══════════════════════════════════════════════════╝${C.reset}\n`);

// ── TEST GROUP 1: Deterministic Scoring Formula ────────────
console.log(`${C.cyan}TEST 1 — Deterministic Scoring Formula${C.reset}`);

const criteria = [
  { id: "promptQuality", name: "Prompt Quality", description: "Clarity", maxScore: 100, weight: 2 },
  { id: "creativity", name: "Creativity", description: "Originality", maxScore: 100, weight: 1 },
  { id: "adherence", name: "Adherence", description: "Constraints", maxScore: 50, weight: 1 },
];

test("Weights & scale normalization calculate exact score", () => {
  // prompt: 90/100 (weight 2) => 90 * 2 = 180
  // creativity: 80/100 (weight 1) => 80 * 1 = 80
  // adherence: 50/50 = 100/100 (weight 1) => 100 * 1 = 100
  // Total weight = 4. Total weighted = 360. Score = 360 / 4 = 90
  const score = calculateDeterministicScore(
    { promptQuality: 90, creativity: 80, adherence: 50 },
    criteria
  );
  assert(score === 90, `Expected 90 but got ${score}`);
});

test("Out of bounds raw scores are clamped to [0, maxScore]", () => {
  const score = calculateDeterministicScore(
    { promptQuality: 150, creativity: -20, adherence: 25 },
    criteria
  );
  // prompt: 100 (clamped) * 2 = 200
  // creativity: 0 (clamped) * 1 = 0
  // adherence: 25/50 = 50 * 1 = 50
  // Total weight = 4. Total weighted = 250. Score = round(250 / 4) = 63
  assert(score === 63, `Expected 63 but got ${score}`);
});

test("Empty scores default gracefully to 0", () => {
  const score = calculateDeterministicScore({}, criteria);
  assert(score === 0, `Expected 0 but got ${score}`);
});

// ── TEST GROUP 2: Multi-Judge Aggregation ──────────────────
console.log(`\n${C.cyan}TEST 2 — Multi-Judge Aggregation & Variance${C.reset}`);

const judgeScores = [
  { judgeId: "j1", judgeName: "Judge 1", weightedScore: 80, status: "FINAL", criteriaScores: { promptQuality: 80, creativity: 80 } },
  { judgeId: "j2", judgeName: "Judge 2", weightedScore: 90, status: "FINAL", criteriaScores: { promptQuality: 90, creativity: 90 } },
  { judgeId: "j3", judgeName: "Judge 3", weightedScore: 85, status: "FINAL", criteriaScores: { promptQuality: 85, creativity: 85 } },
  { judgeId: "j4", judgeName: "Judge 4", weightedScore: 10, status: "DRAFT", criteriaScores: { promptQuality: 10, creativity: 10 } },
];

test("Aggregates only FINAL scores using arithmetic mean", () => {
  const agg = aggregateJudgeScores(judgeScores);
  assert(agg.finalJudgeCount === 3, `Expected 3 final judges but got ${agg.finalJudgeCount}`);
  // Mean = (80 + 90 + 85) / 3 = 255 / 3 = 85
  assert(agg.aggregateScore === 85, `Expected 85 aggregateScore but got ${agg.aggregateScore}`);
});

test("Calculates judge score variance accurately", () => {
  const agg = aggregateJudgeScores(judgeScores);
  // Deviations: 80-85 = -5 (25), 90-85 = 5 (25), 85-85 = 0 (0)
  // Variance = (25 + 25 + 0) / 3 = 50 / 3 = 16.67
  assert(agg.variance === 16.67, `Expected 16.67 variance but got ${agg.variance}`);
});

test("Aggregates per-criterion scores across judges", () => {
  const agg = aggregateJudgeScores(judgeScores);
  assert(agg.criteriaAverages.promptQuality === 85, "Expected 85 promptQuality average");
  assert(agg.criteriaAverages.creativity === 85, "Expected 85 creativity average");
});

// ── TEST GROUP 3: Deterministic Leaderboard Tie-Breaker ────
console.log(`\n${C.cyan}TEST 3 — Deterministic Leaderboard Tie-Breaker${C.reset}`);

test("Tier 1: Higher total score wins", () => {
  const a = { totalScore: 92, promptQuality: 80, creativity: 80, submittedAt: 1000 };
  const b = { totalScore: 90, promptQuality: 95, creativity: 95, submittedAt: 500 };
  assert(compareSubmissionsDeterministically(a, b) < 0, "Team A with 92 score should rank ahead of Team B with 90");
});

test("Tier 2: Equal score -> Higher Prompt Quality wins", () => {
  const a = { totalScore: 85, promptQuality: 90, creativity: 80, submittedAt: 1000 };
  const b = { totalScore: 85, promptQuality: 80, creativity: 90, submittedAt: 500 };
  assert(compareSubmissionsDeterministically(a, b) < 0, "Team A with higher promptQuality should win tie");
});

test("Tier 3: Equal score and prompt -> Higher Creativity wins", () => {
  const a = { totalScore: 85, promptQuality: 85, creativity: 90, submittedAt: 1000 };
  const b = { totalScore: 85, promptQuality: 85, creativity: 80, submittedAt: 500 };
  assert(compareSubmissionsDeterministically(a, b) < 0, "Team A with higher creativity should win tie");
});

test("Tier 4: All criteria equal -> Earlier submission timestamp wins", () => {
  const a = { totalScore: 85, promptQuality: 85, creativity: 85, submittedAt: 1000 };
  const b = { totalScore: 85, promptQuality: 85, creativity: 85, submittedAt: 2000 };
  assert(compareSubmissionsDeterministically(a, b) < 0, "Team A with earlier submission should win tie");
});

test("Full deterministic sort test across 5 tie scenarios", () => {
  const teams = [
    { id: "T_LATE", totalScore: 80, promptQuality: 80, creativity: 80, submittedAt: 5000 },
    { id: "T_HIGH_SCORE", totalScore: 95, promptQuality: 70, creativity: 70, submittedAt: 3000 },
    { id: "T_CREATIVE", totalScore: 80, promptQuality: 80, creativity: 90, submittedAt: 4000 },
    { id: "T_PROMPT", totalScore: 80, promptQuality: 85, creativity: 70, submittedAt: 2000 },
    { id: "T_EARLY", totalScore: 80, promptQuality: 80, creativity: 80, submittedAt: 1000 },
  ];

  teams.sort(compareSubmissionsDeterministically);

  const expectedOrder = ["T_HIGH_SCORE", "T_PROMPT", "T_CREATIVE", "T_EARLY", "T_LATE"];
  const actualOrder = teams.map((t) => t.id);

  assert(
    JSON.stringify(actualOrder) === JSON.stringify(expectedOrder),
    `Expected order ${expectedOrder.join(" > ")} but got ${actualOrder.join(" > ")}`
  );
});

// ── SUMMARY ────────────────────────────────────────────────
console.log(`\n${C.bold}╔═══════════════════════════════════════════════════╗${C.reset}`);
console.log(`${C.bold}║   PHASE 3 TEST RESULTS                            ║${C.reset}`);
console.log(`${C.bold}╚═══════════════════════════════════════════════════╝${C.reset}`);
console.log(`  Passed : ${passed}`);
console.log(`  Failed : ${failed}`);

if (failed > 0) {
  console.log(`\n${C.red}PHASE 3 VERIFICATION FAILED${C.reset}\n`);
  process.exit(1);
} else {
  console.log(`\n${C.green}PHASE 3 VERIFICATION PASSED ✓ (All ${passed} tests passed)${C.reset}\n`);
}
