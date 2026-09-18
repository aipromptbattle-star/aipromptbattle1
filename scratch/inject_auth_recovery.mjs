
import fs from "fs";

let file = fs.readFileSync("src/app/organizer/teams/page.tsx", "utf8");

if (!file.includes("AuthRecoveryPanel")) {
  file = file.replace(
    "import { APBCard } from \"@/components/apb/APBCard\";",
    "import { APBCard } from \"@/components/apb/APBCard\";\nimport { AuthRecoveryPanel } from \"@/components/apb/AuthRecoveryPanel\";"
  );
  
  // Find where to inject it. Before the teams table or anywhere appropriate.
  // There is a <Tabs defaultValue="list"> in the page.
  // We can add a new Tab for Auth Recovery.
  
  file = file.replace(
    `<TabsList className="mb-6 bg-black/40 border border-[var(--color-apb-surface-border)]">
          <TabsTrigger value="list" className="font-mono text-xs tracking-widest">TEAM LIST</TabsTrigger>
          <TabsTrigger value="import" className="font-mono text-xs tracking-widest">IMPORT</TabsTrigger>
        </TabsList>`,
    `<TabsList className="mb-6 bg-black/40 border border-[var(--color-apb-surface-border)]">
          <TabsTrigger value="list" className="font-mono text-xs tracking-widest">TEAM LIST</TabsTrigger>
          <TabsTrigger value="import" className="font-mono text-xs tracking-widest">IMPORT</TabsTrigger>
          <TabsTrigger value="recovery" className="font-mono text-xs tracking-widest text-amber-500">AUTH RECOVERY</TabsTrigger>
        </TabsList>`
  );
  
  file = file.replace(
    `</TabsContent>\n\n      </Tabs>`,
    `</TabsContent>\n\n        <TabsContent value="recovery">\n          <AuthRecoveryPanel eventId={eventState?.id || "currentEvent"} />\n        </TabsContent>\n\n      </Tabs>`
  );

  fs.writeFileSync("src/app/organizer/teams/page.tsx", file);
  console.log("Injected AuthRecoveryPanel");
}

