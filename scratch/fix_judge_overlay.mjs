
import fs from "fs";

let f = fs.readFileSync("src/app/judge/page.tsx", "utf8");
f = f.replace(`import { APBCard } from "@/components/apb/APBCard";`, `import { APBCard } from "@/components/apb/APBCard";\nimport { ParticipantScreenOverlay } from "@/components/apb/ParticipantScreenOverlay";`);

f = f.replace(`  return (
    <div className="space-y-8">`, `  return (
    <ParticipantScreenOverlay
      globalScreenMode={eventState?.judgeScreenState?.globalScreenMode}
      boardState={eventState?.judgeScreenState}
    >
      <div className="space-y-8">`);
      
f = f.replace(`      </div>
    </div>
  );
}`, `      </div>
    </div>
    </ParticipantScreenOverlay>
  );
}`);
fs.writeFileSync("src/app/judge/page.tsx", f);


let f2 = fs.readFileSync("src/app/judge/submissions/[submissionId]/page.tsx", "utf8");
f2 = f2.replace(`import { APBCard } from "@/components/apb/APBCard";`, `import { APBCard } from "@/components/apb/APBCard";\nimport { ParticipantScreenOverlay } from "@/components/apb/ParticipantScreenOverlay";`);

f2 = f2.replace(`  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">`, `  return (
    <ParticipantScreenOverlay
      globalScreenMode={eventState?.judgeScreenState?.globalScreenMode}
      boardState={eventState?.judgeScreenState}
    >
      <div className="space-y-6 max-w-7xl mx-auto pb-12">`);
      
f2 = f2.replace(`      </form>
    </div>
  );
}`, `      </form>
    </div>
    </ParticipantScreenOverlay>
  );
}`);
fs.writeFileSync("src/app/judge/submissions/[submissionId]/page.tsx", f2);
console.log("Added Judge Overlay");

