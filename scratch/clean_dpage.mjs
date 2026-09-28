
import fs from "fs";
let f = fs.readFileSync("src/app/display/page.tsx", "utf8");
f = f.replace(/\/\/ Synthesize a heavy gong\/chord for GO\nfunction playGong\(\) \{\n  try \{\n    const AudioContext = window.AudioContext[\s\S]*?\} catch \(e\) \{\}\n\}\n\n/, "");
fs.writeFileSync("src/app/display/page.tsx", f);

