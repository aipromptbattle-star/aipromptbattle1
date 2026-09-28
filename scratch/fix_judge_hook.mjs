
import fs from "fs";

let jHook = fs.readFileSync("src/lib/firebase/judging.ts", "utf8");
jHook = jHook.replace(
  `export function useJudgeScores(roundId?: string | null, submissionId?: string | null) {`,
  `export function useJudgeScores(roundId?: string | null, submissionId?: string | null, judgeIdFilter?: string | null) {`
);
jHook = jHook.replace(
  `if (submissionId) {
      q = query(q, where("submissionId", "==", submissionId));
    }`,
  `if (submissionId) {
      q = query(q, where("submissionId", "==", submissionId));
    }
    if (judgeIdFilter) {
      q = query(q, where("judgeId", "==", judgeIdFilter));
    }`
);
jHook = jHook.replace(`}, [roundId, submissionId]);`, `}, [roundId, submissionId, judgeIdFilter]);`);
fs.writeFileSync("src/lib/firebase/judging.ts", jHook);

let jPage = fs.readFileSync("src/app/judge/page.tsx", "utf8");
jPage = jPage.replace(`useJudgeScores(activeRoundId, judgeProfile?.id)`, `useJudgeScores(activeRoundId, null, judgeProfile?.id)`);
fs.writeFileSync("src/app/judge/page.tsx", jPage);

console.log("Fixed Judge Hook");

