
import fs from "fs";
let f = fs.readFileSync("src/app/display/page.tsx", "utf8");

const audioFunctions = `
// Synthesize a generic UI tick sound
function playTick() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {}
}

// Synthesize a heavy gong/chord for GO
function playGong() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    [200, 250, 300].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
      osc.start();
      osc.stop(ctx.currentTime + 2);
    });
  } catch (e) {}
}
`;

f = f.replace(`export default function PublicHostDisplay() {`, `${audioFunctions}\nexport default function PublicHostDisplay() {`);

const audioEffect = `
  const prevRemainingRef = useRef<number | null>(null);

  useEffect(() => {
    if (!eventState?.globalCountdown?.active) return;
    const remaining = Math.max(0, Math.ceil((eventState.globalCountdown.endsAt - now) / 1000));
    
    if (prevRemainingRef.current !== remaining) {
      if (remaining <= 10 && remaining > 0) {
        playTick();
      } else if (remaining === 0 && prevRemainingRef.current !== 0 && prevRemainingRef.current !== null) {
        playGong();
      }
      prevRemainingRef.current = remaining;
    }
  }, [now, eventState?.globalCountdown]);
`;

f = f.replace(`const lastRevealedStageRef = useRef<number>(1);`, `const lastRevealedStageRef = useRef<number>(1);\n${audioEffect}`);

fs.writeFileSync("src/app/display/page.tsx", f);
console.log("Added Audio Cues");

