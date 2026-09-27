
import fs from "fs";

// Replace window.alert toast with a real inline toast in participant-board
let pb = fs.readFileSync("src/app/organizer/participant-board/page.tsx", "utf8");
pb = pb.replace(
  `// toast fallback (no sonner)\nconst toast = { success: (m: string) => window.alert(m), error: (m: string) => window.alert("Error: " + m) };`,
  `// Simple toast helper - uses browser notification
function showToast(msg: string, type: "success" | "error" = "success") {
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.cssText = \`position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 20px;border-radius:8px;font-family:monospace;font-size:13px;color:#fff;background:\${type === "success" ? "#059669" : "#dc2626"};border:1px solid \${type === "success" ? "#10b981" : "#ef4444"};box-shadow:0 4px 20px #0004;transition:opacity .3s\`;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; setTimeout(() => el.remove(), 300); }, 3000);
}
const toast = { success: (m: string) => showToast(m, "success"), error: (m: string) => showToast(m, "error") };`
);
fs.writeFileSync("src/app/organizer/participant-board/page.tsx", pb);

// Same for display page
let dp = fs.readFileSync("src/app/organizer/display/page.tsx", "utf8");
dp = dp.replace(
  `// toast fallback (no sonner)\nconst toast = { success: (m: string) => window.alert(m), error: (m: string) => window.alert("Error: " + m) };`,
  `// Simple toast helper
function showToast(msg: string, type: "success" | "error" = "success") {
  const el = document.createElement("div");
  el.textContent = msg;
  el.style.cssText = \`position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 20px;border-radius:8px;font-family:monospace;font-size:13px;color:#fff;background:\${type === "success" ? "#059669" : "#dc2626"};border:1px solid \${type === "success" ? "#10b981" : "#ef4444"};box-shadow:0 4px 20px #0004;transition:opacity .3s\`;
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; setTimeout(() => el.remove(), 300); }, 3000);
}
const toast = { success: (m: string) => showToast(m, "success"), error: (m: string) => showToast(m, "error") };`
);
fs.writeFileSync("src/app/organizer/display/page.tsx", dp);

console.log("Fixed toast in both pages");

