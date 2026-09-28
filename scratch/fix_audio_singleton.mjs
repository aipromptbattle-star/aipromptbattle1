import fs from "fs";

let f = fs.readFileSync("src/app/display/page.tsx", "utf8");

// Remove the old audio functions
const oldAudioRegex = /\/\/ Synthesize a generic UI tick sound[\s\S]*?\} catch \(e\) \{\}\n\}\n/m;
f = f.replace(oldAudioRegex, "");

const newAudioFunctions = `
// Singleton Audio Context to prevent exceeding hardware limits
let audioCtx: any = null;
function getAudioCtx() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  return audioCtx;
}

// Synthesize a generic UI tick sound
function playTick() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
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
    const ctx = getAudioCtx();
    if (!ctx) return;
    
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

f = f.replace(`export default function PublicHostDisplay() {`, `${newAudioFunctions}\nexport default function PublicHostDisplay() {`);

// Also fix enableAudio to use singleton
f = f.replace(`const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      ctx.resume().then(() => {
        setAudioEnabled(true);
      });`, `const ctx = getAudioCtx();
      if (ctx) {
        ctx.resume().then(() => {
          setAudioEnabled(true);
        });
      } else {
        setAudioEnabled(true);
      }`);

fs.writeFileSync("src/app/display/page.tsx", f);
console.log("Fixed Audio Singleton");
