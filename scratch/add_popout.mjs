
import fs from "fs";

let f = fs.readFileSync("src/app/organizer/layout.tsx", "utf8");

// Add function
const funcStr = `  const popOutApp = () => {
    window.open(window.location.href, "_blank", "popup=yes,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=1200,height=800");
  };`;

f = f.replace(`const toggleFullscreen`, `${funcStr}\n\n  const toggleFullscreen`);

// Add button
const btnStr = `<button
            onClick={popOutApp}
            title="Pop out into clean window (No tabs/URL bar)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-mono uppercase tracking-wider text-indigo-300 border border-indigo-500/50 hover:bg-indigo-500/20 transition-colors cursor-pointer hidden sm:flex"
          >
            <AppWindow className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleFullscreen}`;

f = f.replace(`<button\n              onClick={toggleFullscreen}`, btnStr);

// Add AppWindow import
if (!f.includes("AppWindow,")) {
  f = f.replace(`import {\n  Terminal,`, `import {\n  AppWindow,\n  Terminal,`);
}

fs.writeFileSync("src/app/organizer/layout.tsx", f);
console.log("Added pop-out button");

