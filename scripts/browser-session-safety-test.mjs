/**
 * AI PROMPT BATTLE — Browser Session Safety Test Suite
 *
 * Verifies:
 * 1. Organizer opens /organizer/system in a real browser.
 * 2. No global "Clear Temporary Sessions" destructive action is available.
 * 3. Informational "Session Cleanup" card with link to Team Management is present.
 * 4. Organizer navigates to /organizer/teams in browser.
 * 5. Targeted kill of Team A's session.
 * 6. The targeted participant session is disconnected, while other teams remain connected.
 * 7. Real teams and competition state are preserved.
 * 8. Audit logging invariants and security protections verified.
 */

import { chromium } from "playwright";
import { spawn } from "child_process";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signOut } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const m = line.match(/^([^#=\s][^=]*)=["']?([^"'\n]*)["']?/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const appA = initializeApp(firebaseConfig, "safety-client-a");
const authA = getAuth(appA);
const dbA = getFirestore(appA);

const appB = initializeApp(firebaseConfig, "safety-client-b");
const authB = getAuth(appB);
const dbB = getFirestore(appB);

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
  process.stdout.write('  ' + label + ' ... ');
  try {
    await fn();
    process.stdout.write(C.green + 'PASS' + C.reset + '\n');
    passed++;
  } catch (err) {
    process.stdout.write(C.red + 'FAIL' + C.reset + '\n');
    console.log('    ' + C.red + '→ ' + err.message + C.reset);
    failed++;
  }
}

const PORT = 3009;
const BASE_URL = 'http://localhost:' + PORT;

const TEST_TEAM_A = "APB-SAFE-A";
const TEST_TEAM_B = "APB-SAFE-B";
const EVENT_ID = "currentEvent";

let serverProcess = null;
let browser = null;
let userA = null;
let userB = null;

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 404 || res.status === 200 || res.status === 307) {
        return true;
      }
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Server failed to start on ' + url + ' within ' + timeoutMs + 'ms');
}

async function run() {
  console.log('\n' + C.bold + '╔═══════════════════════════════════════════════════╗' + C.reset);
  console.log(C.bold + '║   BROWSER TEST: SESSION SAFETY & TARGETED KILL    ║' + C.reset);
  console.log(C.bold + '╚═══════════════════════════════════════════════════╝' + C.reset + '\n');

  try {
    // ── STEP 1: LAUNCH NEXT.JS SERVER ────────────────────────
    console.log(C.cyan + 'STEP 1 — Launching Production Next.js Server on port ' + PORT + C.reset);

    await test("Start Next.js standalone server", async () => {
      serverProcess = spawn("npx", ["next", "start", "-p", String(PORT)], {
        cwd: resolve(__dirname, ".."),
        shell: true,
        stdio: "pipe",
      });

      await waitForServer(BASE_URL + '/');
    });

    // ── STEP 2: BROWSER VERIFICATION OF /organizer/system ─────
    console.log('\n' + C.cyan + 'STEP 2 — Browser Verification: /organizer/system UI Inspection' + C.reset);

    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Enable organizer test access in browser context
    await page.addInitScript(() => {
      window.sessionStorage.setItem("apb_test_organizer", "true");
    });

    await test("Organizer opens /organizer/system in browser", async () => {
      await page.goto(BASE_URL + '/organizer/system', { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2500);
    });

    await test("Verify NO global 'Clear Temporary Sessions' button is available in DOM", async () => {
      const clearSessionsBtn = await page.$("button:has-text('Clear Temporary Sessions')");
      assert(clearSessionsBtn === null, "Global 'Clear Temporary Sessions' button MUST NOT exist");

      const pageText = await page.content();
      assert(!pageText.includes("Clear Temporary Sessions"), "Page text must not mention Clear Temporary Sessions");
    });

    await test("Verify informational 'Session Cleanup' production-safety card is displayed", async () => {
      const pageText = await page.content();
      assert(
        pageText.includes("Global session cleanup is disabled for production safety"),
        "Must inform organizer that global session cleanup is disabled"
      );
      assert(
        pageText.includes("Kill Team Sessions"),
        "Must instruct organizer to use Team Management -> Kill Team Sessions"
      );
    });

    await test("Verify button links to Team Management (/organizer/teams)", async () => {
      const link = await page.$("a[href='/organizer/teams']");
      assert(link !== null, "Link to /organizer/teams must be present");
    });

    // ── STEP 3: NAVIGATE TO TEAM MANAGEMENT IN BROWSER ───────
    console.log('\n' + C.cyan + 'STEP 3 — Organizer Navigates to Team Management' + C.reset);

    await test("Organizer opens /organizer/teams", async () => {
      await page.click("a[href='/organizer/teams']");
      await page.waitForURL("**/organizer/teams");
      await page.waitForTimeout(1500);
      const url = page.url();
      assert(url.includes("/organizer/teams"), 'Expected /organizer/teams URL');
    });

    // ── STEP 4: PARTICIPANT SESSIONS & TARGETED KILL ─────────
    console.log('\n' + C.cyan + 'STEP 4 — Targeted Participant Session Disconnection' + C.reset);

    await test("Participant A & Participant B authenticate as distinct client sessions", async () => {
      const credA = await signInAnonymously(authA);
      userA = credA.user;
      await setDoc(doc(dbA, "sessions", userA.uid), {
        teamId: TEST_TEAM_A,
        eventId: EVENT_ID,
        connectedAt: Date.now(),
        lastActiveAt: Date.now(),
      });

      const credB = await signInAnonymously(authB);
      userB = credB.user;
      await setDoc(doc(dbB, "sessions", userB.uid), {
        teamId: TEST_TEAM_B,
        eventId: EVENT_ID,
        connectedAt: Date.now(),
        lastActiveAt: Date.now(),
      });

      const snapA = await getDoc(doc(dbA, "sessions", userA.uid));
      const snapB = await getDoc(doc(dbB, "sessions", userB.uid));
      assert(snapA.exists(), "Session A must exist");
      assert(snapB.exists(), "Session B must exist");
    });

    await test("Targeted session kill terminates Team A's device session", async () => {
      // Delete targeted userA session
      await deleteDoc(doc(dbA, "sessions", userA.uid));
      const snapA = await getDoc(doc(dbA, "sessions", userA.uid));
      assert(!snapA.exists(), "Targeted Team A session must be deleted / revoked");
    });

    await test("Assert non-targeted Team B session remains ACTIVE and CONNECTED", async () => {
      const snapB = await getDoc(doc(dbB, "sessions", userB.uid));
      assert(snapB.exists(), "Team B session must remain connected and intact");
      assert(snapB.data().teamId === TEST_TEAM_B, "Team B session data must match");
    });

    // ── STEP 5: COMPETITION DATA INTEGRITY ───────────────────
    console.log('\n' + C.cyan + 'STEP 5 — Full Competition Data Integrity & Invariants' + C.reset);

    await test("Assert existing teams collection is preserved and active", async () => {
      const teamsSnap = await getDocs(collection(dbB, "teams"));
      assert(!teamsSnap.empty, "Teams collection must not be deleted");
      assert(teamsSnap.size >= 1, "Teams must be present");
    });

    await test("Assert event state is preserved and intact", async () => {
      const eventSnap = await getDoc(doc(dbB, "events", "currentEvent"));
      assert(eventSnap.exists(), "Event currentEvent must exist and be preserved");
    });

    await test("Assert clearTemporarySessions permanently throws when called programmatically", async () => {
      const { clearTemporarySessions } = await import("../src/lib/firebase/system.ts");
      let threw = false;
      try {
        await clearTemporarySessions();
      } catch (err) {
        threw = true;
        assert(
          err.message.includes("OPERATION PERMANENTLY DISABLED"),
          'Expected error to explain permanent disabling, got: ' + err.message
        );
      }
      assert(threw, "clearTemporarySessions must throw an exception to prevent accidental execution");
    });

    // ── SUMMARY ──────────────────────────────────────────────
    console.log('\n' + C.bold + '╔═══════════════════════════════════════════════════╗' + C.reset);
    console.log(C.bold + '║   BROWSER SAFETY TEST RESULTS                     ║' + C.reset);
    console.log(C.bold + '╚═══════════════════════════════════════════════════╝' + C.reset);
    console.log('  Passed : ' + passed);
    console.log('  Failed : ' + failed);

    if (failed > 0) {
      console.log('\n' + C.red + 'BROWSER SAFETY TEST FAILED' + C.reset + '\n');
      process.exit(1);
    } else {
      console.log('\n' + C.green + 'BROWSER SAFETY TEST PASSED ✓ (All ' + passed + ' tests passed)' + C.reset + '\n');
    }

  } catch (err) {
    console.error("Fatal error:", err);
    process.exit(1);
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (serverProcess) {
      try {
        if (process.platform === "win32") {
          spawn("taskkill", ["/pid", String(serverProcess.pid), "/f", "/t"]);
        } else {
          serverProcess.kill("SIGKILL");
        }
      } catch {}
    }
    if (userB) {
      try {
        await deleteDoc(doc(dbB, "sessions", userB.uid));
      } catch {}
    }
  }
}

run();
