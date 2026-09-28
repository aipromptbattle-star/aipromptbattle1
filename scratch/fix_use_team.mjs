
import fs from "fs";
let f = fs.readFileSync("src/lib/firebase/teams.ts", "utf8");

if (!f.includes("useTeam(")) {
  const hook = `
export function useTeam(teamId: string | null) {
  const [teamData, setTeamData] = useState<Team | null>(null);
  
  useEffect(() => {
    if (!teamId) return;
    const unsub = onSnapshot(doc(db, "teams", teamId), (docSnap) => {
      if (docSnap.exists()) setTeamData(docSnap.data() as Team);
    });
    return () => unsub();
  }, [teamId]);

  return { teamData };
}
`;
  f += hook;
  fs.writeFileSync("src/lib/firebase/teams.ts", f);
  console.log("Added useTeam to teams.ts");
}

let f2 = fs.readFileSync("src/components/apb/TeamWorkspaceHeader.tsx", "utf8");
f2 = f2.replace("useTeamSession", "useTeam");
fs.writeFileSync("src/components/apb/TeamWorkspaceHeader.tsx", f2);
console.log("Updated TeamWorkspaceHeader to useTeam");

