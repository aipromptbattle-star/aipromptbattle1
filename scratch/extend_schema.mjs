
import fs from "fs";
let file = fs.readFileSync("src/lib/firebase/schema.ts", "utf8");

const additionalTypes = `
// --- Advanced Event-Day Types ---

export type ParticipantScreenMode = 
  | "NORMAL" 
  | "WAITING" 
  | "ANNOUNCEMENT" 
  | "LOCKED" 
  | "EMERGENCY" 
  | "ROUND_COMPLETE";

export interface ParticipantScreenState {
  globalScreenMode: ParticipantScreenMode;
  broadcastMessage: {
    heading: string;
    message: string;
    expiresAt: number | null;
  } | null;
  updatedAt: number;
}

export type AuthRecoveryStatus = "AUTHORIZED" | "CONSUMED" | "EXPIRED";

export interface AuthRecoveryState {
  status: AuthRecoveryStatus;
  authorizedAt: number;
  expiresAt: number;
  consumedAt: number | null;
  authorizedBy: string;
}
`;

if (!file.includes("ParticipantScreenMode")) {
  const splitIndex = file.indexOf("export type ChallengeType");
  if (splitIndex !== -1) {
    file = file.slice(0, splitIndex) + additionalTypes + "\\n" + file.slice(splitIndex);
  } else {
    file = additionalTypes + "\\n" + file;
  }

  file = file.replace(
    "displayBody?: string;", 
    "displayBody?: string;\\n  participantScreenState?: ParticipantScreenState;"
  );

  file = file.replace(
    "accessCode?: string; // Team access code / PIN for entry", 
    "accessCode?: string; // Team access code / PIN for entry\\n  recoveryAuth?: AuthRecoveryState;"
  );

  file = file.replace(
    "status: TeamRoundStatus;", 
    "status: TeamRoundStatus;\\n  overrideScreenMode?: ParticipantScreenMode | null;"
  );

  fs.writeFileSync("src/lib/firebase/schema.ts", file);
  console.log("Schema extended successfully.");
} else {
  console.log("Schema already extended.");
}

