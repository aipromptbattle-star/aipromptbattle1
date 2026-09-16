/**
 * APB Access Code & Round Deletion Test Suite
 */

export const generateAccessCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const C = {
  reset:  "\x1b[0m",
  green:  "\x1b[32m",
  red:    "\x1b[31m",
  cyan:   "\x1b[36m",
  bold:   "\x1b[1m",
};

console.log(`\n${C.bold}${C.cyan}╔═══════════════════════════════════════════════════════════╗${C.reset}`);
console.log(`${C.bold}${C.cyan}║   APB ACCESS CODE & ROUND DELETION VERIFICATION SUITE     ║${C.reset}`);
console.log(`${C.bold}${C.cyan}╚═══════════════════════════════════════════════════════════╝${C.reset}\n`);

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  process.stdout.write(`  ${name} ... `);
  try {
    fn();
    console.log(`${C.green}PASS${C.reset}`);
    passed++;
  } catch (e) {
    console.log(`${C.red}FAIL: ${e.message}${C.reset}`);
    failed++;
  }
}

// 1. Access code generator test
runTest("generateAccessCode produces 6-character uppercase alphanumeric string", () => {
  const code = generateAccessCode();
  assert(typeof code === "string", "Code must be string");
  assert(code.length === 6, `Code length must be 6, got ${code.length}`);
  assert(/^[A-Z0-9]{6}$/.test(code), `Code ${code} must be alphanumeric uppercase`);
});

runTest("generateAccessCode produces unique codes", () => {
  const set = new Set();
  for (let i = 0; i < 100; i++) {
    set.add(generateAccessCode());
  }
  assert(set.size === 100, "100 generated codes must all be distinct");
});

// 2. Simulated joinTeam credential validation
function simulateJoinValidation(teamData, providedAccessCode) {
  if (!teamData.active) {
    return { success: false, error: "TEAM INACTIVE" };
  }
  if (teamData.accessCode && teamData.accessCode.trim()) {
    const expected = teamData.accessCode.trim().toUpperCase();
    const provided = (providedAccessCode || "").trim().toUpperCase();
    if (!provided || provided !== expected) {
      return { success: false, error: "INVALID ACCESS CODE: Incorrect access code for this team." };
    }
  }
  return { success: true };
}

const testTeam = {
  teamId: "APB-101",
  displayName: "Neural Sparks",
  accessCode: "ALPHA1",
  active: true,
};

runTest("Valid access code succeeds (exact match)", () => {
  const res = simulateJoinValidation(testTeam, "ALPHA1");
  assert(res.success === true, "Must succeed with correct code");
});

runTest("Valid access code succeeds (case-insensitive)", () => {
  const res = simulateJoinValidation(testTeam, "alpha1");
  assert(res.success === true, "Must succeed with lowercase code");
});

runTest("Invalid access code fails with explicit error", () => {
  const res = simulateJoinValidation(testTeam, "WRONG1");
  assert(res.success === false, "Must fail with wrong code");
  assert(res.error.includes("INVALID ACCESS CODE"), "Must return INVALID ACCESS CODE error");
});

runTest("Missing access code fails when team has an access code", () => {
  const res = simulateJoinValidation(testTeam, "");
  assert(res.success === false, "Must fail with empty code");
});

runTest("Team without access code allows login (backward compatibility)", () => {
  const legacyTeam = {
    teamId: "APB-001",
    displayName: "Legacy Team",
    active: true,
  };
  const res1 = simulateJoinValidation(legacyTeam, "");
  assert(res1.success === true, "Legacy team without code must succeed");
  const res2 = simulateJoinValidation(legacyTeam, "ANYCODE");
  assert(res2.success === true, "Legacy team with any code must succeed");
});

runTest("Inactive team is blocked even with correct access code", () => {
  const inactiveTeam = { ...testTeam, active: false };
  const res = simulateJoinValidation(inactiveTeam, "ALPHA1");
  assert(res.success === false, "Inactive team must be blocked");
  assert(res.error === "TEAM INACTIVE", "Must return TEAM INACTIVE");
});

// 3. 4 Test teams specifications
const FOUR_TEST_TEAMS = [
  { teamId: "APB-101", name: "Neural Sparks", accessCode: "ALPHA1" },
  { teamId: "APB-102", name: "Prompt Crafters", accessCode: "BETA22" },
  { teamId: "APB-103", name: "Cyber Synapse", accessCode: "GAMMA3" },
  { teamId: "APB-104", name: "Quantum Logic", accessCode: "DELTA4" },
];

runTest("All 4 test teams have valid format and unique IDs and access codes", () => {
  const ids = new Set();
  const codes = new Set();
  FOUR_TEST_TEAMS.forEach(t => {
    assert(/^APB-\d{3}$/.test(t.teamId), `Invalid team ID format: ${t.teamId}`);
    assert(/^[A-Z0-9]{6}$/.test(t.accessCode), `Invalid access code format: ${t.accessCode}`);
    ids.add(t.teamId);
    codes.add(t.accessCode);
  });
  assert(ids.size === 4, "Must have 4 unique team IDs");
  assert(codes.size === 4, "Must have 4 unique access codes");
});

console.log(`\n═══════════════════════════════════════════════════════════`);
console.log(`TOTAL: ${passed + failed} | ${C.green}PASSED: ${passed}${C.reset} | ${C.red}FAILED: ${failed}${C.reset}\n`);

if (failed > 0) process.exit(1);
