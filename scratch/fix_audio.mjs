import fs from "fs";

let f = fs.readFileSync("src/app/display/page.tsx", "utf8");

if (!f.includes("audioEnabled")) {
  // Add audioEnabled state
  f = f.replace(`const [isFullscreen, setIsFullscreen] = useState(false);`, `const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);`);

  // Add the click handler
  const enableAudioHandler = `
  const enableAudio = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();
      ctx.resume().then(() => {
        setAudioEnabled(true);
      });
    } catch(e) {
      setAudioEnabled(true);
    }
  };
`;
  f = f.replace(`const lastRevealedStageRef = useRef<number>(1);`, `const lastRevealedStageRef = useRef<number>(1);\n${enableAudioHandler}`);

  // Add the overlay
  const overlay = `
      {/* Audio Initialization Overlay */}
      {!audioEnabled && (
        <div 
          onClick={enableAudio}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer"
        >
          <div className="w-24 h-24 rounded-full border-4 border-dashed border-[var(--color-apb-cyan)] animate-spin-slow flex items-center justify-center mb-8">
            <Radio className="w-10 h-10 text-[var(--color-apb-cyan)] animate-pulse" />
          </div>
          <h2 className="text-3xl font-mono font-black uppercase tracking-widest text-white mb-4">
            DISPLAY READY
          </h2>
          <p className="text-slate-400 font-mono animate-pulse uppercase tracking-widest">
            Click anywhere to initialize audio engine
          </p>
        </div>
      )}
`;
  f = f.replace(`{/* Background layer always holds the children so state is never lost */}`, overlay + `\n      {/* Background layer always holds the children so state is never lost */}`);

  fs.writeFileSync("src/app/display/page.tsx", f);
  console.log("Fixed Audio Autoplay Policy");
} else {
  console.log("Already fixed audio");
}
