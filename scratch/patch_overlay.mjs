
import fs from "fs";
let file = fs.readFileSync("src/components/apb/ParticipantScreenOverlay.tsx", "utf8");

file = file.replace(
  `interface ParticipantScreenOverlayProps {
  globalScreenMode?: ParticipantScreenMode;
  overrideScreenMode?: ParticipantScreenMode | null;
  boardState?: ParticipantBoardState;
  children: React.ReactNode;
}`,
  `interface ParticipantScreenOverlayProps {
  globalScreenMode?: ParticipantScreenMode;
  overrideScreenMode?: ParticipantScreenMode | null;
  boardState?: ParticipantBoardState;
  mockGlobalCountdown?: GlobalCountdown;
  children: React.ReactNode;
}`
);

file = file.replace(
  `  boardState,
  children,
}: ParticipantScreenOverlayProps) {
  const { eventState } = useEventState();
  const globalCountdown: GlobalCountdown | undefined = eventState?.globalCountdown;`,
  `  boardState,
  mockGlobalCountdown,
  children,
}: ParticipantScreenOverlayProps) {
  const { eventState } = useEventState();
  const globalCountdown: GlobalCountdown | undefined = mockGlobalCountdown || eventState?.globalCountdown;`
);

fs.writeFileSync("src/components/apb/ParticipantScreenOverlay.tsx", file);
console.log("Patched ParticipantScreenOverlay");

