
import fs from "fs";
let file = fs.readFileSync("src/lib/firebase/schema.ts", "utf8");

file = file.replace(
  `export type ParticipantScreenMode = \n  | "NORMAL" \n  | "WAITING" \n  | "ANNOUNCEMENT" \n  | "LOCKED" \n  | "EMERGENCY" \n  | "ROUND_COMPLETE";`,
  `export type ParticipantScreenMode = \n  | "AUTO"\n  | "RULES"\n  | "ROUND_INTRO"\n  | "COUNTDOWN"\n  | "ANNOUNCEMENT"\n  | "CONSTRAINT_REVEAL"\n  | "PAUSED"\n  | "ROUND_COMPLETE"\n  | "LOCKED"\n  | "NORMAL" \n  | "WAITING" \n  | "EMERGENCY";`
);

file = file.replace(
  `export interface ParticipantScreenState {\n  globalScreenMode: ParticipantScreenMode;\n  broadcastMessage: {\n    heading: string;\n    message: string;\n    expiresAt: number | null;\n  } | null;\n  updatedAt: number;\n}`,
  `export interface ParticipantScreenState {\n  globalScreenMode: ParticipantScreenMode;\n  heading?: string;\n  subheading?: string;\n  body?: string;\n  imageUrl?: string;\n  countdownEndsAt?: number | null;\n  targetRoundId?: string | null;\n  targetStage?: number | null;\n  duration?: number | null;\n  broadcastMessage?: {\n    heading: string;\n    message: string;\n    expiresAt: number | null;\n  } | null;\n  updatedAt: number;\n}`
);

file = file.replace(
  `export type DisplayMode = "AUTOMATIC" | "LEADERBOARD" | "LIVE_ROUND" | "EVENT_STATUS" | "WAITING" | "IMAGE" | "TEXT";`,
  `export type DisplayMode = "AUTOMATIC" | "LEADERBOARD" | "LIVE_ROUND" | "EVENT_STATUS" | "WAITING" | "IMAGE" | "TEXT" | "PARTICIPANT_SYNC";`
);

fs.writeFileSync("src/lib/firebase/schema.ts", file);
console.log("Schema updated");

