/**
 * APB Phase 4 Production & Event-Day Readiness Test Suite
 *
 * Verifies:
 *  1. Production Configuration & Environment Invariants (no secrets exposed, NEXT_PUBLIC safe)
 *  2. Team Data Model & Schema Invariants (source, registrationStatus future-proofing)
 *  3. Listener Architecture & 500-session scaling invariants
 *  4. Autosave Debounce Invariant (750ms with local immediate mirror)
 *  5. Safe Reset Invariants (pre-event reset guards and protections)
 *  6. Submission Safety & Idempotency
 *  7. System Health Check Engine (live evaluation)
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local into process.env
const envPath = resolve(__dirname, "../.env.local");
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^#=\s][^=]*)=["']?([^"'\n]*)["']?/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
}

// Now dynamically import system functions after env is loaded
const { runSystemHealthChecks } = await import("../src/lib/firebase/system.ts");

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

async function test(label, fn) {
  process.stdout.write(`  ${label} ... `);
  try {
    await fn();
    process.stdout.write(`${C.green}PASS${C.reset}\n`);
    passed++;
  } catch (err) {
    process.stdout.write(`${C.red}FAIL${C.reset}\n`);
    console.log(`    ${C.red}→ ${err.message}${C.reset}`);
    failed++;
  }
}

console.log(`\n${C.bold}╔═══════════════════════════════════════════════════╗${C.reset}`);
console.log(`${C.bold}║   PHASE 4 PRODUCTION & EVENT READINESS AUDIT      ║${C.reset}`);
console.log(`${C.bold}╚═══════════════════════════════════════════════════╝${C.reset}\n`);

async function runAudit() {
  // ── 1. ENVIRONMENT & SECRETS AUDIT ───────────────────────
  console.log(`${C.cyan}TEST 1 — Environment Variables & Secrets Audit${C.reset}`);

  await test("Verify .env.local contains only safe client Firebase keys", () => {
    const envPath = resolve(__dirname, "../.env.local");
    assert(existsSync(envPath), ".env.local must exist");
    const content = readFileSync(envPath, "utf-8");
    const lines = content.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));

    for (const line of lines) {
      const [key] = line.split("=");
      assert(
        key.startsWith("NEXT_PUBLIC_"),
        `Forbidden private secret in client env: ${key}. All variables must be safe NEXT_PUBLIC_ keys.`
      );
      assert(!key.includes("PRIVATE_KEY"), "Private key must never exist in frontend env");
      assert(!key.includes("SECRET"), "Secrets must never exist in frontend env");
    }
  });

  await test("Verify source code does not contain hardcoded localhost/127.0.0.1", () => {
    const srcFiles = ["src/lib/firebase/config.ts", "src/app/team/page.tsx", "src/app/organizer/page.tsx"];
    for (const file of srcFiles) {
      const p = resolve(__dirname, "..", file);
      if (existsSync(p)) {
        const text = readFileSync(p, "utf-8");
        assert(!text.includes("localhost:"), `Unexpected localhost URL found in ${file}`);
        assert(!text.includes("127.0.0.1"), `Unexpected 127.0.0.1 IP found in ${file}`);
      }
    }
  });

  // ── 2. TEAM MANAGEMENT & GOOGLE SHEETS READINESS ─────────
  console.log(`\n${C.cyan}TEST 2 — Team Schema & Import Extensibility${C.reset}`);

  await test("Verify Team schema has registrationStatus and flexible source field", () => {
    const schemaPath = resolve(__dirname, "../src/lib/firebase/schema.ts");
    const content = readFileSync(schemaPath, "utf-8");
    assert(content.includes("registrationStatus?:"), "Team schema must include registrationStatus");
    assert(content.includes("source?:"), "Team schema must include source field");
    assert(content.includes("MANUAL"), "source must support MANUAL");
    assert(content.includes("GOOGLE_SHEETS"), "source must support GOOGLE_SHEETS");
  });

  // ── 3. 500-CONCURRENT SESSION LISTENER ARCHITECTURE ──────
  console.log(`\n${C.cyan}TEST 3 — Concurrency & Listener Scoping Invariants${C.reset}`);

  await test("Participant workspace only subscribes to single-document listeners", () => {
    const teamPagePath = resolve(__dirname, "../src/app/team/page.tsx");
    const content = readFileSync(teamPagePath, "utf-8");
    // Subscribes via useTeamSession, useEventState, useCurrentRound, useDraft, useTeamRoundState, useSubmission
    assert(!content.includes("collection("), "Participant workspace must never use collection-wide queries");
  });

  await test("Draft autosave debounce is calibrated to 750ms with local backup", () => {
    const draftsPath = resolve(__dirname, "../src/lib/firebase/drafts.ts");
    const content = readFileSync(draftsPath, "utf-8");
    assert(content.includes("750"), "Draft autosave must debounce with 750ms");
    assert(content.includes("saveLocalDraft"), "Drafts must save locally immediately before debounce");
    assert(content.includes("localStorage"), "Drafts must utilize localStorage persistence");
  });

  // ── 4. SUBMISSION IMMUTABILITY & DOUBLE-CLICK LOCK ────────
  console.log(`\n${C.cyan}TEST 4 — Submission Safety & Idempotency Invariants${C.reset}`);

  await test("submitFinalResponse enforces atomic transaction with deadline & duplicate guard", () => {
    const subsPath = resolve(__dirname, "../src/lib/firebase/submissions.ts");
    const content = readFileSync(subsPath, "utf-8");
    assert(content.includes("runTransaction"), "Submission must use atomic Firestore runTransaction");
    assert(content.includes("roundData.status !== \"LIVE\""), "Submission must enforce round LIVE status");
    assert(content.includes("now > roundData.endsAt"), "Submission must enforce server deadline");
    assert(content.includes("subSnap.exists()"), "Submission must enforce write-once deduplication");
  });

  await test("SubmissionReviewDialog prevents in-flight double clicks and offline submissions", () => {
    const dialogPath = resolve(__dirname, "../src/components/apb/SubmissionReviewDialog.tsx");
    const content = readFileSync(dialogPath, "utf-8");
    assert(content.includes("if (submitting) return;"), "handleFinalSubmit must guard against duplicate clicks");
    assert(content.includes("!navigator.onLine"), "handleFinalSubmit must guard against offline submissions");
  });

  // ── 5. SAFE RESET & PRE-EVENT SAFEGUARDS ─────────────────
  console.log(`\n${C.cyan}TEST 5 — Safe Pre-Event Reset Safeguards${C.reset}`);

  await test("resetCurrentTestRound requires DRAFT or READY status to prevent accidental live resets", () => {
    const sysPath = resolve(__dirname, "../src/lib/firebase/system.ts");
    const content = readFileSync(sysPath, "utf-8");
    assert(content.includes("roundData.status !== \"DRAFT\" && roundData.status !== \"READY\""),
      "Reset must strictly forbid resetting LIVE or CLOSED rounds"
    );
  });

  await test("Global clearTemporarySessions is permanently disabled for production safety", () => {
    const sysPath = resolve(__dirname, "../src/lib/firebase/system.ts");
    const content = readFileSync(sysPath, "utf-8");
    assert(content.includes("@deprecated PERMANENTLY DISABLED FOR PRODUCTION SAFETY"), "Must be deprecated & disabled");
    assert(content.includes("OPERATION PERMANENTLY DISABLED"), "Must reject execution with error");

    const systemPage = resolve(__dirname, "../src/app/organizer/system/page.tsx");
    const sysPageContent = readFileSync(systemPage, "utf-8");
    assert(!sysPageContent.includes("clearTemporarySessions"), "System page must not call clearTemporarySessions");
    assert(sysPageContent.includes("Global session cleanup is disabled for production safety"), "System page must show informational warning");
  });

  // ── 6. LIVE SYSTEM HEALTH CHECK ENGINE ───────────────────
  console.log(`\n${C.cyan}TEST 6 — Live System Health Check Engine${C.reset}`);

  await test("runSystemHealthChecks evaluates live Firestore, environment, and configuration", async () => {
    const { auth } = await import("../src/lib/firebase/config.ts");
    const { signInAnonymously, signOut } = await import("firebase/auth");
    await signInAnonymously(auth);

    const checks = await runSystemHealthChecks();
    await signOut(auth);

    assert(Array.isArray(checks), "Checks must return an array");
    assert(checks.length >= 12, `Expected at least 12 health checks, got ${checks.length}`);

    const validStatuses = ["PASS", "WARNING", "ACTION_REQUIRED", "MANUAL_VERIFICATION"];
    for (const c of checks) {
      assert(validStatuses.includes(c.status), `Check ${c.id} has invalid status ${c.status}`);
      assert(Boolean(c.name && c.message), `Check ${c.id} missing name or message`);
    }

    const firebaseConn = checks.find((c) => c.id === "firebase-conn");
    assert(firebaseConn?.status === "PASS", "Firebase connection check must PASS");

    const secRules = checks.find((c) => c.id === "security-rules");
    assert(secRules?.status === "PASS", "Security rules check must PASS");

    const hostReady = checks.find((c) => c.id === "host-readiness");
    assert(hostReady?.status === "PASS", "Host readiness check must PASS");

    const passCount = checks.filter((c) => c.status === "PASS").length;
    assert(passCount >= 5, `Expected at least 5 PASS checks on live system, got ${passCount}`);
  });

  // ── SUMMARY ──────────────────────────────────────────────
  console.log(`\n${C.bold}╔═══════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}║   PHASE 4 AUDIT RESULTS                           ║${C.reset}`);
  console.log(`${C.bold}╚═══════════════════════════════════════════════════╝${C.reset}`);
  console.log(`  Passed : ${passed}`);
  console.log(`  Failed : ${failed}`);

  if (failed > 0) {
    console.log(`\n${C.red}PHASE 4 AUDIT FAILED${C.reset}\n`);
    process.exit(1);
  } else {
    console.log(`\n${C.green}PHASE 4 AUDIT PASSED ✓ (All ${passed} checks passed)${C.reset}\n`);
  }
}

runAudit().catch((err) => {
  console.error("Audit suite error:", err);
  process.exit(1);
});
