
import fs from "fs";

let btn = fs.readFileSync("src/components/apb/APBButton.tsx", "utf8");

// Add glow-pulse
btn = btn.replace(`glow && variant === "default" && "shadow-[0_0_15px_rgba(34,211,238,0.5)]`, `glow && variant === "default" && "glow-pulse shadow-[0_0_15px_rgba(34,211,238,0.5)]`);
btn = btn.replace(`glow && variant === "destructive" && "shadow-[0_0_15px_rgba(244,63,94,0.5)]`, `glow && variant === "destructive" && "glow-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]`);

// Fix transition line
btn = btn.replace(`"font-bold tracking-wide uppercase transition-all duration-300",`, `"font-bold tracking-wide uppercase transition-all duration-300 active:scale-95 hover:scale-[1.02]",`);
fs.writeFileSync("src/components/apb/APBButton.tsx", btn);
console.log("Updated btn with pulse");

