import fs from "fs";

let f = fs.readFileSync("src/app/organizer/results/page.tsx", "utf8");

if (!f.includes("handleSpotlight")) {
  const spotlightFn = `
  const handleSpotlight = async (sub: Submission) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase/config");
      await updateDoc(doc(db, "events", "currentEvent"), {
        "displayBoardState.mode": "TEXT",
        "displayBoardState.activeTemplate": {
          heading: getTeamName(sub.teamId),
          subheading: "FINAL SCORE: " + sub.score,
          body: sub.content?.text || "",
          textAlign: "left"
        }
      });
    } catch(e) {}
  };
`;
  f = f.replace(`const handlePublish = async (publish: boolean) => {`, `${spotlightFn}\n  const handlePublish = async (publish: boolean) => {`);
  
  if (!f.includes("MonitorPlay")) {
    f = f.replace(`import {`, `import { MonitorPlay,`);
  }

  const actionsCellRegex = /<td className="py-3 px-4 text-right">[\s\S]*?<\/td>/;
  const newActionsCell = `<td className="py-3 px-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <APBButton variant="outline" size="sm" onClick={() => window.open(\`/judge/submissions/\${sub.id}\`, "_blank")} className="text-[10px] h-7 px-2">
                                    <Eye className="w-3 h-3 mr-1" /> View
                                  </APBButton>
                                  <APBButton variant="outline" size="sm" glow onClick={() => handleSpotlight(sub)} className="text-[10px] h-7 px-2 border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/20">
                                    <MonitorPlay className="w-3 h-3 mr-1" /> Spotlight
                                  </APBButton>
                                </div>
                              </td>`;
  f = f.replace(actionsCellRegex, newActionsCell);
  fs.writeFileSync("src/app/organizer/results/page.tsx", f);
  console.log("Added Spotlight Feature");
}
