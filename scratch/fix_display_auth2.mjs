
import fs from "fs";
let f = fs.readFileSync("src/app/display/page.tsx", "utf8");

f = f.replace(
  `  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        signInAnonymously(auth).catch((err) => {
          console.warn("Public display anonymous auth notice:", err.message);
        });
      }
    });
    return () => unsubscribe();
  }, []);`,
  `  useEffect(() => {
    auth.authStateReady().then(() => {
      if (!auth.currentUser) {
        signInAnonymously(auth).catch((err) => {
          console.warn("Public display anonymous auth notice:", err.message);
        });
      }
    });
  }, []);`
);

fs.writeFileSync("src/app/display/page.tsx", f);
console.log("Fixed display auth with authStateReady");

