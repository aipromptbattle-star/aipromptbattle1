
import fs from "fs";

function injectSnapshotError(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  content = content.replace(
    `      });\n      return () => unsub();\n    }, [`,
    `      }, (err) => {\n        console.error("Walkie Sync Error:", err);\n        alert("Walkie Sync Error: " + err.message);\n      });\n      return () => unsub();\n    }, [`
  );
  fs.writeFileSync(filePath, content);
}

injectSnapshotError("src/components/organizer/CoordWalkiePanel.tsx");
injectSnapshotError("src/app/coord/page.tsx");
console.log("Injected snapshot error handling");

