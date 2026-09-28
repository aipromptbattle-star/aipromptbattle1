
import fs from "fs";
let f = fs.readFileSync("src/app/display/page.tsx", "utf8");

if (!f.includes("flashAlert")) {
  const effect = `
  const [flashAlert, setFlashAlert] = useState<{text: string; visible: boolean} | null>(null);

  useEffect(() => {
    if (eventState?.transientAlert) {
      const { text, timestamp, durationSeconds } = eventState.transientAlert;
      const elapsed = Date.now() - timestamp;
      if (elapsed < durationSeconds * 1000) {
        setFlashAlert({ text, visible: true });
        const timer = setTimeout(() => {
          setFlashAlert(prev => prev ? { ...prev, visible: false } : null);
        }, (durationSeconds * 1000) - elapsed);
        
        // Try to play sound
        try { playTick(); setTimeout(playTick, 200); setTimeout(playTick, 400); } catch(e){}

        return () => clearTimeout(timer);
      }
    }
  }, [eventState?.transientAlert]);
`;
  
  f = f.replace(`const [isFullscreen, setIsFullscreen] = useState(false);`, `const [isFullscreen, setIsFullscreen] = useState(false);\n${effect}`);

  const overlay = `
      {/* FLASH ALERT OVERLAY */}
      <div 
        className={\`fixed inset-0 z-[150] flex items-center justify-center pointer-events-none transition-all duration-700 \${flashAlert?.visible ? "opacity-100 backdrop-blur-xl bg-indigo-950/80" : "opacity-0 backdrop-blur-none bg-transparent"}\`}
      >
        <div className={\`max-w-7xl px-8 text-center transition-all duration-700 transform \${flashAlert?.visible ? "scale-100 translate-y-0" : "scale-50 translate-y-32"}\`}>
          <div className="text-[12vw] leading-none font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-indigo-300 drop-shadow-[0_0_80px_rgba(99,102,241,0.6)] uppercase">
            {flashAlert?.text}
          </div>
        </div>
      </div>
`;
  
  f = f.replace(`{/* Audio Initialization Overlay */}`, overlay + `\n      {/* Audio Initialization Overlay */}`);
  
  fs.writeFileSync("src/app/display/page.tsx", f);
  console.log("Added Flash Alert Display Receiver");
}

