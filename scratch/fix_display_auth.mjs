
import fs from "fs";
let f = fs.readFileSync("src/app/display/page.tsx", "utf8");

f = f.replace(
  `  // Background anonymous auth ensuring public Firestore read access without requiring participant login
  useEffect(() => {
    if (!auth.currentUser) {
      signInAnonymously(auth).catch((err) => {
        console.warn("Public display anonymous auth notice:", err.message);
      });
    }
  }, []);`,
  `  // Background anonymous auth ensuring public Firestore read access without requiring participant login
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        signInAnonymously(auth).catch((err) => {
          console.warn("Public display anonymous auth notice:", err.message);
        });
      }
    });
    return () => unsubscribe();
  }, []);`
);

fs.writeFileSync("src/app/display/page.tsx", f);
console.log("Fixed display auth");

