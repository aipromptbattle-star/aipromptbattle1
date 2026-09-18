
import fs from "fs";
let file = fs.readFileSync("src/app/team/page.tsx", "utf8");

if (!file.includes("initialVisited")) {
  file = file.replace(
    `initialAnswers={draft?.quizAnswers || {}}`,
    `initialAnswers={draft?.quizAnswers || {}}\n            initialVisited={draft?.quizVisited || {}}`
  );
  fs.writeFileSync("src/app/team/page.tsx", file);
  console.log("Passed initialVisited");
}

