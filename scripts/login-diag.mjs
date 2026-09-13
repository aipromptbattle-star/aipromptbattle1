/**
 * APB Login Diagnostic — checks every step of the participant login flow
 * Run: node scripts/login-diag.mjs
 */

import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, signOut } from "firebase/auth";
import {
  getFirestore,
  doc, getDoc,
  collection, getDocs, query, orderBy, limit
} from "firebase/firestore";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(join(__dirname, "../.env.local"), "utf-8");
const env = Object.fromEntries(
  envContent.split("\n")
    .map(l => l.match(/^([^#=\s][^=]*)=["']?([^"'\n]*)["']?/))
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

const G = "\x1b[32m", R = "\x1b[31m", Y = "\x1b[33m", C = "\x1b[36m", B = "\x1b[1m", X = "\x1b[0m", D = "\x1b[2m";

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

function ok(msg)   { console.log(`  ${G}✓${X} ${msg}`); }
function fail(msg) { console.log(`  ${R}✗${X} ${msg}`); }
function info(msg) { console.log(`  ${C}→${X} ${msg}`); }
function warn(msg) { console.log(`  ${Y}!${X} ${msg}`); }

async function main() {
  console.log(`\n${B}${C}══ APB PARTICIPANT LOGIN DIAGNOSTIC ══${X}\n`);

  // ── STEP 1: Firebase project ──────────────────────────────
  console.log(`${B}[1] Firebase project${X}`);
  info(`Project ID  : ${firebaseConfig.projectId}`);
  info(`Auth domain : ${firebaseConfig.authDomain}`);
  if (firebaseConfig.projectId === "ai-prompt-battle-3026") {
    ok("Correct Firebase project");
  } else {
    fail("WRONG project — expected ai-prompt-battle-3026");
  }

  // ── STEP 2: Anonymous Auth ────────────────────────────────
  console.log(`\n${B}[2] Anonymous Authentication${X}`);
  let user;
  try {
    await signOut(auth).catch(() => {});
    const cred = await signInAnonymously(auth);
    user = cred.user;
    ok(`Anonymous sign-in succeeded — uid: ${D}${user.uid}${X}`);
    info(`Provider: ${user.providerData.length === 0 ? "anonymous" : user.providerData[0]?.providerId}`);
  } catch (e) {
    fail(`Anonymous sign-in FAILED: ${e.code} — ${e.message}`);
    console.log(`\n${R}  ► Fix: Enable Anonymous Auth in Firebase Console → Authentication → Providers${X}`);
    process.exit(1);
  }

  // ── STEP 3: Firestore rules — can participant read teams? ─
  console.log(`\n${B}[3] Firestore rules — participant READ on teams collection${X}`);
  let teamsSnap;
  try {
    const q = query(collection(db, "teams"), orderBy("createdAt", "desc"), limit(20));
    teamsSnap = await getDocs(q);
    ok(`Read teams collection — ${teamsSnap.size} team(s) found`);
  } catch (e) {
    fail(`Cannot read teams collection: ${e.code} — ${e.message}`);
    if (e.code === "permission-denied") {
      fail("Firestore rules are blocking participant read on /teams — rule needs fix");
    }
    process.exit(1);
  }

  // ── STEP 4: What teams exist? ─────────────────────────────
  console.log(`\n${B}[4] Teams in Firestore${X}`);
  if (teamsSnap.size === 0) {
    warn("NO TEAMS EXIST in Firestore teams collection");
    warn("This is why login fails with 'TEAM NOT FOUND'");
    warn("Root cause: no team has been created via the Organizer UI yet");
    console.log(`\n  ${Y}► Fix: Log in as organizer at /login?role=organizer${X}`);
    console.log(`  ${Y}       Go to /organizer/teams → Add Team${X}`);
    console.log(`  ${Y}       Create a team (e.g. APB-001) then try participant login${X}`);
  } else {
    ok(`Teams found:`);
    teamsSnap.docs.forEach(d => {
      const t = d.data();
      const activeStr = t.active ? `${G}active${X}` : `${R}inactive${X}`;
      console.log(`     ${B}${d.id}${X} — "${t.displayName}" — ${activeStr} — members: ${t.member1}, ${t.member2}`);
    });
  }

  // ── STEP 5: Normalisation check ────────────────────────────
  console.log(`\n${B}[5] Team ID normalisation logic${X}`);
  info('App calls: targetTeamId.trim().toUpperCase()');
  info('Then looks up: doc(db, "teams", normalizedId)');
  info('Document ID in Firestore MUST exactly match normalised input');
  
  if (teamsSnap.size > 0) {
    const sampleId = teamsSnap.docs[0].id;
    info(`Sample team doc ID in Firestore: "${sampleId}"`);
    info(`If user types "${sampleId.toLowerCase()}" → normalised to "${sampleId.toUpperCase()}" → ${sampleId.toUpperCase() === sampleId ? G+"match"+X : R+"NO match — doc ID casing issue"+X}`);
  }

  // ── STEP 6: Direct doc lookup (simulate joinTeam) ─────────
  console.log(`\n${B}[6] Simulate joinTeam() lookup for each team${X}`);
  if (teamsSnap.size > 0) {
    for (const d of teamsSnap.docs) {
      const teamId = d.id;
      try {
        const snap = await getDoc(doc(db, "teams", teamId));
        if (snap.exists()) {
          const t = snap.data();
          const activeOk = t.active === true;
          console.log(`  Team ${B}${teamId}${X}: exists=${G}yes${X}, active=${activeOk ? G+"yes" : R+"NO — login will return TEAM INACTIVE"+X}`);
        } else {
          fail(`Team ${teamId}: doc does not exist (collection query showed it but direct get failed?)`);
        }
      } catch (e) {
        fail(`Team ${teamId}: getDoc threw ${e.code} — ${e.message}`);
      }
    }
  }

  // ── STEP 7: sessions collection read check ────────────────
  console.log(`\n${B}[7] Sessions collection — check for stale/blocking sessions${X}`);
  try {
    // Participants can only read their own session; use a direct getDoc for own uid
    const mySession = await getDoc(doc(db, "sessions", user.uid));
    if (mySession.exists()) {
      const s = mySession.data();
      warn(`Leftover session exists for this anon uid — teamId: ${s.teamId}`);
    } else {
      ok("No leftover session for this uid (clean state)");
    }
  } catch (e) {
    fail(`sessions read: ${e.code} — ${e.message}`);
  }

  // ── STEP 8: Event document ────────────────────────────────
  console.log(`\n${B}[8] Event document (events/currentEvent)${X}`);
  try {
    const evSnap = await getDoc(doc(db, "events", "currentEvent"));
    if (evSnap.exists()) {
      const ev = evSnap.data();
      ok(`Event exists: "${ev.eventName}" — status: ${ev.status} — currentRoundId: ${ev.currentRoundId || "null"}`);
    } else {
      warn("events/currentEvent does not exist yet");
      warn("Organizer must initialise the event first (open /organizer)");
    }
  } catch (e) {
    fail(`events/currentEvent read: ${e.code} — ${e.message}`);
  }

  // ── SUMMARY ───────────────────────────────────────────────
  console.log(`\n${B}${C}══ DIAGNOSIS SUMMARY ══${X}`);
  
  const hasTeams  = teamsSnap.size > 0;
  const hasActive = hasTeams && teamsSnap.docs.some(d => d.data().active === true);

  if (!hasTeams) {
    console.log(`\n  ${R}${B}ROOT CAUSE: No teams exist in Firestore.${X}`);
    console.log(`  ${Y}The teams collection is empty.`);
    console.log(`  Participant login calls getDoc("teams", normalizedId) which returns does-not-exist.`);
    console.log(`  The app correctly returns "TEAM NOT FOUND".${X}`);
    console.log(`\n  ${B}FIX (3 steps):${X}`);
    console.log(`  1. Open ${C}http://localhost:3000/login?role=organizer${X}`);
    console.log(`  2. Sign in with your organizer email/password`);
    console.log(`  3. Go to ${C}Organizer → Teams → Add Team${X}`);
    console.log(`     Create a team with ID: ${B}APB-001${X}`);
    console.log(`  4. Come back to /login as Participant, enter APB-001`);
  } else if (!hasActive) {
    console.log(`\n  ${R}${B}ROOT CAUSE: All teams exist but are INACTIVE.${X}`);
    console.log(`  Fix: Go to /organizer/teams and enable at least one team.`);
  } else {
    console.log(`\n  ${G}${B}Teams exist and are active.${X}`);
    console.log(`  If login still fails, check the exact Team ID being typed.`);
    console.log(`  Valid team IDs in Firestore:`);
    teamsSnap.docs.filter(d => d.data().active).forEach(d => {
      console.log(`    ${G}${B}${d.id}${X}`);
    });
  }

  console.log();
  await signOut(auth).catch(() => {});
}

main().catch(e => {
  console.error(`\n${R}Fatal: ${e.message}${X}`);
  process.exit(1);
});
