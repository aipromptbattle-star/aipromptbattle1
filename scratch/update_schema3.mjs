
import fs from "fs";
let file = fs.readFileSync("src/lib/firebase/schema.ts", "utf8");

const replacement = `export interface PresentationTemplate {
  heading?: string;
  subheading?: string;
  body?: string;
  imageUrl?: string;
  durationSeconds?: number;
}

export interface ParticipantBoardState {
  globalScreenMode: ParticipantScreenMode;
  activeTemplate?: PresentationTemplate;
  templates?: Partial<Record<ParticipantScreenMode, PresentationTemplate>>;
  updatedAt: number;
}

export interface DisplayBoardState {
  mode: DisplayMode;
  activeTemplate?: PresentationTemplate;
  templates?: Partial<Record<DisplayMode, PresentationTemplate>>;
  updatedAt: number;
}

export interface GlobalCountdown {
  active: boolean;
  startedAt: number;
  endsAt: number;
  durationSeconds: number;
  targetRoundId?: string | null;
  targetStage?: number | null;
  heading?: string;
  subheading?: string;
  updatedAt: number;
}`;

file = file.replace(`export interface ParticipantScreenState {
  globalScreenMode: ParticipantScreenMode;
  heading?: string;
  subheading?: string;
  body?: string;
  imageUrl?: string;
  countdownEndsAt?: number | null;
  targetRoundId?: string | null;
  targetStage?: number | null;
  duration?: number | null;
  broadcastMessage?: {
    heading: string;
    message: string;
    expiresAt: number | null;
  } | null;
  updatedAt: number;
}`, replacement);

file = file.replace(/displayOverride\?: DisplayMode;\n\s*displayImageUrl\?: string;\n\s*displayHeading\?: string;\n\s*displaySubheading\?: string;\n\s*displayBody\?: string;\\n\s*participantScreenState\?: ParticipantScreenState;/, `displayOverride?: DisplayMode;
  displayImageUrl?: string;
  displayHeading?: string;
  displaySubheading?: string;
  displayBody?: string;
  participantScreenState?: ParticipantBoardState;
  displayBoardState?: DisplayBoardState;
  globalCountdown?: GlobalCountdown;`);

fs.writeFileSync("src/lib/firebase/schema.ts", file);
console.log("Updated schema.ts");

