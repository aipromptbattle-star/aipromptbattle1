
import fs from "fs";

let dFile = fs.readFileSync("src/lib/firebase/drafts.ts", "utf8");

const readOnlyHook = `
export function useDraftReadOnly(eventId: string | null, teamId: string | null, roundId: string | null) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId || !teamId || !roundId) {
      setDraft(null);
      setLoading(false);
      return;
    }

    const docId = getDraftDocId(eventId, teamId, roundId);
    const draftRef = doc(db, "drafts", docId);

    const unsubscribe = onSnapshot(draftRef, (snapshot) => {
      if (snapshot.exists()) {
        setDraft(snapshot.data() as Draft);
      } else {
        setDraft(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [eventId, teamId, roundId]);

  return { draft, loading };
}
`;

dFile = dFile.replace(`export function useDraft(`, `${readOnlyHook}\nexport function useDraft(`);
fs.writeFileSync("src/lib/firebase/drafts.ts", dFile);

let mFile = fs.readFileSync("src/components/apb/LiveParticipantViewModal.tsx", "utf8");
mFile = mFile.replace(`import { useDraft }`, `import { useDraftReadOnly }`);
mFile = mFile.replace(`const { draft } = useDraft(eventId,`, `const { draft } = useDraftReadOnly(eventId,`);
fs.writeFileSync("src/components/apb/LiveParticipantViewModal.tsx", mFile);

console.log("Fixed read only draft");

