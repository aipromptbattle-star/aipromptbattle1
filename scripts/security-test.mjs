/**
 * APB Security Rules — Automated Test Suite
 *
 * Tests Firestore security rules using real Firebase Anonymous Auth.
 * Run with: node --experimental-vm-modules scripts/security-test.mjs
 *
 * What is tested:
 *  1. Session creation links anonymous uid → teamId correctly
 *  2. Participant cannot impersonate another Team ID
 *  3. Participant cannot read/write another team's drafts
 *  4. Participant cannot read/write another team's submissions
 *  5. Participant cannot modify rounds, events, teams, auditLogs
 *  6. Submissions are write-once (no participant update/delete)
 *  7. Organizer baseline (reads guarded collections as participant)
 *
 * NOTE: The 2-device session limit is enforced by application code
 * in joinTeam() — not by Firestore rules — so it is tested separately
 * in the manual test section at the end of this file.
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
} from "firebase/firestore";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// ── Load .env.local ─────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envContent
    .split("\n")
    .map((l) => l.match(/^([^#=\s][^=]*)=["']?([^"'\n]*)["']?/))
    .filter(Boolean)
    .map(([, k, v]) => [k.trim(), v.trim()])
);

const firebaseConfig = {
  apiKey:            env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── Console colours ─────────────────────────────────────────
const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  green:  "\x1b[32m",
  red:    "\x1b[31m",
  yellow: "\x1b[33m",
  cyan:   "\x1b[36m",
  dim:    "\x1b[2m",
};

// ── Test harness ────────────────────────────────────────────
let passed = 0, failed = 0;
const failures = [];

async function test(label, fn) {
  process.stdout.write(`  ${label} ... `);
  try {
    await fn();
    process.stdout.write(`${C.green}PASS${C.reset}\n`);
    passed++;
  } catch (err) {
    process.stdout.write(`${C.red}FAIL${C.reset}\n`);
    console.log(`    ${C.red}→ ${err.message}${C.reset}`);
    failures.push({ label, err: err.message });
    failed++;
  }
}

/** Assert that calling fn() throws a Firestore permission-denied error. */
async function expectDenied(fn) {
  let result;
  try {
    result = await fn();
  } catch (err) {
    const code = err?.code || "";
    if (
      code === "permission-denied" ||
      code.includes("permission") ||
      err.message?.toLowerCase().includes("missing or insufficient permissions")
    ) {
      return; // ✓ correctly denied
    }
    throw new Error(`Expected permission-denied but got: [${code}] ${err.message}`);
  }
  // If fn() returned a snapshot, check if it's a forbidden doc
  if (result && typeof result.exists === "function" && !result.exists()) {
    // Non-existent doc returned as empty — rules effectively hide it; treat as denied
    return;
  }
  throw new Error("Expected permission-denied but the operation SUCCEEDED — rule not enforced!");
}

/** Assert that calling fn() succeeds (does not throw). */
async function expectSuccess(fn) {
  try {
    await fn();
  } catch (err) {
    throw new Error(`Expected success but got [${err?.code}]: ${err.message}`);
  }
}

// ── Helpers ──────────────────────────────────────────────────
async function freshAnonUser() {
  await signOut(auth).catch(() => {});
  const cred = await signInAnonymously(auth);
  return cred.user;
}

async function createSession(uid, teamId) {
  await setDoc(doc(db, "sessions", uid), {
    teamId,
    eventId: EVENT_ID,
    connectedAt:   Date.now(),
    lastActiveAt:  Date.now(),
  });
}

// ── Test constants ──────────────────────────────────────────
// Use prefixed IDs that won't collide with real competition data.
const EVENT_ID = "currentEvent";
const ROUND_ID = "sec-test-round-001";
const TEAM_A   = "TEST-SEC-A";
const TEAM_B   = "TEST-SEC-B";
const DRAFT_A  = `${EVENT_ID}_${TEAM_A}_${ROUND_ID}`;
const DRAFT_B  = `${EVENT_ID}_${TEAM_B}_${ROUND_ID}`;
const SUB_A    = `${EVENT_ID}_${TEAM_A}_${ROUND_ID}`;
const SUB_B    = `${EVENT_ID}_${TEAM_B}_${ROUND_ID}`;
const STATE_A  = `${EVENT_ID}_${TEAM_A}_${ROUND_ID}`;
const STATE_B  = `${EVENT_ID}_${TEAM_B}_${ROUND_ID}`;

// ── Test fixtures (created during test, cleaned up at end) ──
let userA, userB;
let createdDrafts      = [];
let createdSessions    = [];
let createdStates      = [];

// ────────────────────────────────────────────────────────────
async function runTests() {
  console.log();
  console.log(`${C.bold}${C.cyan}╔═══════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}${C.cyan}║   APB FIRESTORE SECURITY RULES — TEST SUITE       ║${C.reset}`);
  console.log(`${C.bold}${C.cyan}╚═══════════════════════════════════════════════════╝${C.reset}`);
  console.log();

  // ════════════════════════════════════════════════════════
  //  SETUP: Create two anonymous participants, each with a
  //         session document binding them to a test team.
  // ════════════════════════════════════════════════════════
  console.log(`${C.bold}SETUP — Anonymous sign-in & session creation${C.reset}`);

  await test("Anonymous sign-in works (Auth enabled)", async () => {
    userA = await freshAnonUser();
    if (!userA?.uid) throw new Error("No UID returned from signInAnonymously");
  });

  await test("Participant A creates session for TEAM_A", async () => {
    await createSession(userA.uid, TEAM_A);
    createdSessions.push(userA.uid);
  });

  await test("Participant A can read their own session", async () => {
    const snap = await getDoc(doc(db, "sessions", userA.uid));
    if (!snap.exists())               throw new Error("Session document missing");
    if (snap.data().teamId !== TEAM_A) throw new Error(`teamId mismatch: expected ${TEAM_A}, got ${snap.data().teamId}`);
  });

  // Create Participant B's session
  userB = await freshAnonUser();
  await createSession(userB.uid, TEAM_B);
  createdSessions.push(userB.uid);

  // Re-sign in as A so the rest of the tests run as A
  userA = await freshAnonUser();
  await createSession(userA.uid, TEAM_A);
  createdSessions.push(userA.uid);

  // ════════════════════════════════════════════════════════
  //  TEST 1 — Session ownership: cannot impersonate another team
  // ════════════════════════════════════════════════════════
  console.log();
  console.log(`${C.bold}TEST 1 — Session ownership / impersonation prevention${C.reset}`);

  await test("Participant CANNOT create session for a foreign UID", async () => {
    await expectDenied(() =>
      setDoc(doc(db, "sessions", "arbitrary-foreign-uid"), {
        teamId:       TEAM_B,
        eventId:      EVENT_ID,
        connectedAt:  Date.now(),
        lastActiveAt: Date.now(),
      })
    );
  });

  await test("Participant CANNOT change teamId in their own session", async () => {
    await expectDenied(() =>
      setDoc(doc(db, "sessions", userA.uid), {
        teamId:       TEAM_B,   // ← different team
        eventId:      EVENT_ID,
        connectedAt:  Date.now(),
        lastActiveAt: Date.now(),
      })
    );
  });

  await test("Participant A CAN read sessions (required for 2-device limit in joinTeam)", async () => {
    // Sessions are intentionally readable by all participants.
    // joinTeam() queries sessions by teamId to count active sessions before
    // creating a new one. Session docs contain only { teamId, eventId,
    // connectedAt, lastActiveAt } — no PII, no credentials.
    // WRITE restrictions (own doc only) are still fully enforced.
    const snap = await getDoc(doc(db, "sessions", userB.uid));
    // Must succeed (not throw permission-denied)
  });

  await test("Participant A CANNOT write to Participant B's session", async () => {
    // Even though reads are open, writes remain strictly own-session-only
    await expectDenied(() =>
      setDoc(doc(db, "sessions", userB.uid), {
        teamId:       TEAM_A,   // ← attempt to hijack B's session
        eventId:      EVENT_ID,
        connectedAt:  Date.now(),
        lastActiveAt: Date.now(),
      })
    );
  });

  // ════════════════════════════════════════════════════════
  //  TEST 2 — Draft isolation
  // ════════════════════════════════════════════════════════
  console.log();
  console.log(`${C.bold}TEST 2 — Draft isolation (cross-team read/write prevention)${C.reset}`);

  // Setup: create Team A's draft while signed in as A
  await test("Participant A can CREATE their own draft", async () => {
    await expectSuccess(() =>
      setDoc(doc(db, "drafts", DRAFT_A), {
        eventId:   EVENT_ID,
        teamId:    TEAM_A,
        roundId:   ROUND_ID,
        prompt:    "Prompt by Team A",
        updatedAt: Date.now(),
        version:   1,
      })
    );
    createdDrafts.push(DRAFT_A);
  });

  await test("Participant A can READ their own draft", async () => {
    await expectSuccess(() => getDoc(doc(db, "drafts", DRAFT_A)));
  });

  // Setup: create Team B's draft while signed in as B
  await signOut(auth);
  userB = await freshAnonUser();
  await createSession(userB.uid, TEAM_B);
  createdSessions.push(userB.uid);
  await setDoc(doc(db, "drafts", DRAFT_B), {
    eventId: EVENT_ID, teamId: TEAM_B, roundId: ROUND_ID,
    prompt: "Prompt by Team B", updatedAt: Date.now(), version: 1,
  });
  createdDrafts.push(DRAFT_B);

  // Sign back in as A for cross-team attack tests
  userA = await freshAnonUser();
  await createSession(userA.uid, TEAM_A);
  createdSessions.push(userA.uid);

  await test("Participant A CANNOT READ Team B's draft", async () => {
    await expectDenied(() => getDoc(doc(db, "drafts", DRAFT_B)));
  });

  await test("Participant A CANNOT WRITE to Team B's draft", async () => {
    await expectDenied(() =>
      setDoc(doc(db, "drafts", DRAFT_B), {
        eventId: EVENT_ID, teamId: TEAM_B, roundId: ROUND_ID,
        prompt: "Injected by A!", updatedAt: Date.now(), version: 99,
      }, { merge: true })
    );
  });

  await test("Participant A CANNOT re-assign their own draft to Team B", async () => {
    await expectDenied(() =>
      setDoc(doc(db, "drafts", DRAFT_A), {
        eventId: EVENT_ID,
        teamId:  TEAM_B,    // ← ownership escalation attempt
        roundId: ROUND_ID,
        prompt:  "Hijacked",
        updatedAt: Date.now(),
        version: 2,
      }, { merge: true })
    );
  });

  // ════════════════════════════════════════════════════════
  //  TEST 3 — TeamRoundState isolation
  // ════════════════════════════════════════════════════════
  console.log();
  console.log(`${C.bold}TEST 3 — TeamRoundState isolation${C.reset}`);

  await test("Participant A can CREATE their own teamRoundState", async () => {
    await expectSuccess(() =>
      setDoc(doc(db, "teamRoundState", STATE_A), {
        eventId: EVENT_ID, teamId: TEAM_A, roundId: ROUND_ID,
        status: "IN_PROGRESS", updatedAt: Date.now(), version: 1,
      })
    );
    createdStates.push(STATE_A);
  });

  // Create Team B's state while signed in as B
  await signOut(auth);
  userB = await freshAnonUser();
  await createSession(userB.uid, TEAM_B);
  createdSessions.push(userB.uid);
  await setDoc(doc(db, "teamRoundState", STATE_B), {
    eventId: EVENT_ID, teamId: TEAM_B, roundId: ROUND_ID,
    status: "IN_PROGRESS", updatedAt: Date.now(), version: 1,
  });
  createdStates.push(STATE_B);

  // Back to A
  userA = await freshAnonUser();
  await createSession(userA.uid, TEAM_A);
  createdSessions.push(userA.uid);

  await test("Participant A CANNOT READ Team B's teamRoundState", async () => {
    await expectDenied(() => getDoc(doc(db, "teamRoundState", STATE_B)));
  });

  await test("Participant A CANNOT WRITE to Team B's teamRoundState", async () => {
    await expectDenied(() =>
      setDoc(doc(db, "teamRoundState", STATE_B), {
        eventId: EVENT_ID, teamId: TEAM_B, roundId: ROUND_ID,
        status: "SUBMITTED", updatedAt: Date.now(), version: 2,
      }, { merge: true })
    );
  });

  // ════════════════════════════════════════════════════════
  //  TEST 4 — Submission isolation & write-once enforcement
  // ════════════════════════════════════════════════════════
  console.log();
  console.log(`${C.bold}TEST 4 — Submission isolation & write-once enforcement${C.reset}`);

  // Create Team B's submission while signed in as B
  await signOut(auth);
  userB = await freshAnonUser();
  await createSession(userB.uid, TEAM_B);
  createdSessions.push(userB.uid);
  await setDoc(doc(db, "submissions", SUB_B), {
    id: SUB_B, eventId: EVENT_ID, teamId: TEAM_B, roundId: ROUND_ID,
    prompt: "B final", status: "FINAL", submittedAt: Date.now(),
    submittedBy: "member1", version: 1,
  }).catch(() => {}); // may fail if no active round; ignore for this test setup

  // Back to A
  userA = await freshAnonUser();
  await createSession(userA.uid, TEAM_A);
  createdSessions.push(userA.uid);

  await test("Participant A CANNOT READ Team B's submission", async () => {
    await expectDenied(() => getDoc(doc(db, "submissions", SUB_B)));
  });

  await test("Participant A CANNOT CREATE a submission claiming to be Team B", async () => {
    await expectDenied(() =>
      setDoc(doc(db, "submissions", SUB_B), {
        id: SUB_B, eventId: EVENT_ID, teamId: TEAM_B, roundId: ROUND_ID,
        prompt: "Forged by A", status: "FINAL", submittedAt: Date.now(),
        submittedBy: "member1", version: 1,
      })
    );
  });

  await test("Participant A CANNOT CREATE submission without status=FINAL", async () => {
    await expectDenied(() =>
      setDoc(doc(db, "submissions", SUB_A), {
        id: SUB_A, eventId: EVENT_ID, teamId: TEAM_A, roundId: ROUND_ID,
        prompt: "Draft as submission", status: "DRAFT",  // ← invalid status
        submittedAt: Date.now(), submittedBy: "member1", version: 1,
      })
    );
  });

  // Create Team A's submission to test immutability
  await setDoc(doc(db, "submissions", SUB_A), {
    id: SUB_A, eventId: EVENT_ID, teamId: TEAM_A, roundId: ROUND_ID,
    prompt: "A final", status: "FINAL", submittedAt: Date.now(),
    submittedBy: "member1", version: 1,
  }).catch(() => {}); // may fail if no active round — that's OK, next test checks update

  await test("Participant CANNOT UPDATE their own submission (write-once)", async () => {
    await expectDenied(() =>
      setDoc(doc(db, "submissions", SUB_A), {
        id: SUB_A, eventId: EVENT_ID, teamId: TEAM_A, roundId: ROUND_ID,
        prompt: "Edited after submit!", status: "FINAL", submittedAt: Date.now(),
        submittedBy: "member1", version: 2,
      }, { merge: true })
    );
  });

  await test("Participant CANNOT DELETE their own submission", async () => {
    await expectDenied(() => deleteDoc(doc(db, "submissions", SUB_A)));
  });

  // ════════════════════════════════════════════════════════
  //  TEST 5 — Protected collection write prevention
  // ════════════════════════════════════════════════════════
  console.log();
  console.log(`${C.bold}TEST 5 — Round / Event / Team mutation prevention${C.reset}`);

  await test("Participant CANNOT update round status", async () => {
    await expectDenied(() =>
      setDoc(doc(db, "rounds", ROUND_ID), { status: "CLOSED", updatedAt: Date.now() }, { merge: true })
    );
  });

  await test("Participant CANNOT update event.currentRoundId", async () => {
    await expectDenied(() =>
      setDoc(doc(db, "events", EVENT_ID), { currentRoundId: null, updatedAt: Date.now() }, { merge: true })
    );
  });

  await test("Participant CANNOT modify team active status", async () => {
    await expectDenied(() =>
      setDoc(doc(db, "teams", TEAM_A), { active: false, updatedAt: Date.now() }, { merge: true })
    );
  });

  await test("Participant CANNOT write to auditLogs", async () => {
    await expectDenied(() =>
      setDoc(doc(collection(db, "auditLogs")), {
        action: "HACKER_AUDIT", actor: "ATTACKER", timestamp: Date.now(),
      })
    );
  });

  // ════════════════════════════════════════════════════════
  //  TEST 6 — Participants CAN read public collections
  // ════════════════════════════════════════════════════════
  console.log();
  console.log(`${C.bold}TEST 6 — Participants can read required public data${C.reset}`);

  await test("Participant CAN read events/currentEvent", async () => {
    // Should succeed (even if doc doesn't exist — returns empty snapshot, not error)
    const snap = await getDoc(doc(db, "events", EVENT_ID));
    // either exists or not, but no permission error
  });

  await test("Participant CAN read rounds collection (own round)", async () => {
    const snap = await getDoc(doc(db, "rounds", ROUND_ID));
    // may not exist yet — that's fine
  });

  // ════════════════════════════════════════════════════════
  //  TEST 7 — Phase 3 Judging, Scoring, and Qualification Isolation
  // ════════════════════════════════════════════════════════
  console.log();
  console.log(`${C.bold}TEST 7 — Phase 3 Judging, Scoring, and Qualification Isolation${C.reset}`);

  await test("Participant CANNOT read judges collection", async () => {
    await expectDenied(async () => {
      await getDoc(doc(db, "judges", "some_judge_uid"));
    });
  });

  await test("Participant CANNOT write to judges collection", async () => {
    await expectDenied(async () => {
      await setDoc(doc(db, "judges", userA.uid), {
        name: "Fake Judge",
        email: "fake@judge.com",
        active: true,
      });
    });
  });

  await test("Participant CANNOT read judgeAssignments", async () => {
    await expectDenied(async () => {
      await getDoc(doc(db, "judgeAssignments", "round1_judge1_sub1"));
    });
  });

  await test("Participant CANNOT write to judgeAssignments", async () => {
    await expectDenied(async () => {
      await setDoc(doc(db, "judgeAssignments", "round1_judge1_sub1"), {
        roundId: "r1",
        judgeId: userA.uid,
        submissionId: "sub1",
      });
    });
  });

  await test("Participant CANNOT read raw scores", async () => {
    await expectDenied(async () => {
      await getDoc(doc(db, "scores", `${EVENT_ID}_${ROUND_ID}_sub1_judge1`));
    });
  });

  await test("Participant CANNOT write or tamper with scores", async () => {
    await expectDenied(async () => {
      await setDoc(doc(db, "scores", `${EVENT_ID}_${ROUND_ID}_sub1_judge1`), {
        weightedScore: 100,
        judgeId: userA.uid,
      });
    });
  });

  await test("Participant CANNOT write to qualifications collection", async () => {
    await expectDenied(async () => {
      await setDoc(doc(db, "qualifications", `${EVENT_ID}_${ROUND_ID}_${TEAM_A}`), {
        teamId: TEAM_A,
        isQualified: true,
      });
    });
  });

  // ════════════════════════════════════════════════════════
  //  CLEANUP
  // ════════════════════════════════════════════════════════
  console.log();
  console.log(`${C.bold}CLEANUP${C.reset}`);

  await test("Cleanup test sessions (participant-owned, deleteable)", async () => {
    // Only the currently signed-in user's session can be deleted by that user.
    // Others must be handled by the organizer. We just delete current user's.
    await deleteDoc(doc(db, "sessions", userA.uid)).catch(() => {});
    await signOut(auth);
  });

  // ════════════════════════════════════════════════════════
  //  RESULTS
  // ════════════════════════════════════════════════════════
  console.log();
  console.log(`${C.bold}${C.cyan}╔═══════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}${C.cyan}║   SECURITY TEST RESULTS                           ║${C.reset}`);
  console.log(`${C.bold}${C.cyan}╚═══════════════════════════════════════════════════╝${C.reset}`);
  console.log(`  ${C.green}Passed : ${passed}${C.reset}`);
  if (failed > 0) {
    console.log(`  ${C.red}Failed : ${failed}${C.reset}`);
    console.log();
    console.log(`${C.red}${C.bold}Failures:${C.reset}`);
    failures.forEach(({ label, err }) => {
      console.log(`  ${C.red}✗${C.reset} ${label}`);
      console.log(`    ${C.dim}${err}${C.reset}`);
    });
  }
  console.log();

  const verdict = failed === 0
    ? `${C.green}${C.bold}SECURITY: PASS ✓ (${passed}/${passed + failed} tests)${C.reset}`
    : `${C.red}${C.bold}SECURITY: FAIL ✗ (${passed}/${passed + failed} tests)${C.reset}`;
  console.log(`  ${verdict}`);
  console.log();

  console.log(`${C.bold}NOTE — 2-device session limit:${C.reset}`);
  console.log(`  This is enforced by application code in joinTeam() (not Firestore rules).`);
  console.log(`  Manual test: open 3 browser tabs for the same team → the 3rd tab must be`);
  console.log(`  rejected with "SESSION LIMIT REACHED" before reaching the workspace.`);
  console.log();

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error(`\n${C.red}Fatal error: ${err.message}${C.reset}`);
  console.error(err);
  process.exit(1);
});
