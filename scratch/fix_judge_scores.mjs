
import fs from "fs";
let f = fs.readFileSync("src/lib/firebase/judging.ts", "utf8");

const oldScoreHook = /export function useJudgeScores\\(roundId\\?: string \\| null, submissionId\\?: string \\| null\\) \\{[\\s\\S]*?return \\{ scores, loading \\};\n\\}/;

const newScoreHook = `export function useJudgeScores(roundId?: string | null, submissionId?: string | null, judgeId?: string | null) {
  const [scores, setScores] = useState<JudgeScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = query(collection(db, "scores"));

    if (roundId) {
      q = query(q, where("roundId", "==", roundId));
    }
    if (submissionId) {
      q = query(q, where("submissionId", "==", submissionId));
    }
    if (judgeId) {
      q = query(q, where("judgeId", "==", judgeId));
    }

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as JudgeScore));
        setScores(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching scores:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [roundId, submissionId, judgeId]);

  return { scores, loading };
}`;

f = f.replace(oldScoreHook, newScoreHook);

// Also add error handlers to assignments
const oldAssignmentHook = /export function useJudgeAssignments\\(judgeId\\?: string \\| null, roundId\\?: string \\| null\\) \\{[\\s\\S]*?return \\{ assignments, loading \\};\n\\}/;
const newAssignmentHook = `export function useJudgeAssignments(judgeId?: string | null, roundId?: string | null) {
  const [assignments, setAssignments] = useState<JudgeAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let q = query(collection(db, "judgeAssignments"));

    if (judgeId) {
      q = query(q, where("judgeId", "==", judgeId));
    }
    if (roundId) {
      q = query(q, where("roundId", "==", roundId));
    }

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as JudgeAssignment));
        setAssignments(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching judge assignments:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [judgeId, roundId]);

  return { assignments, loading };
}`;
f = f.replace(oldAssignmentHook, newAssignmentHook);

fs.writeFileSync("src/lib/firebase/judging.ts", f);

let f2 = fs.readFileSync("src/app/judge/page.tsx", "utf8");
f2 = f2.replace(`const { scores, loading: scoresLoading } = useJudgeScores(null, null);`, `const { scores, loading: scoresLoading } = useJudgeScores(null, null, user?.uid);`);
fs.writeFileSync("src/app/judge/page.tsx", f2);
console.log("Fixed judge scores hook and page");

