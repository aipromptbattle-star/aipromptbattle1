
import fs from "fs";

let file = fs.readFileSync("src/components/apb/QuizWorkspace.tsx", "utf8");

file = file.replace(
  `    setIsSubmitting(false);\n  };\n\n  // Auto-submit at deadline`,
  `    setIsSubmitting(false);\n  }, [isSubmitting, existingSubmission, eventId, teamId, round.id, answers]);\n\n  // Auto-submit at deadline`
);

fs.writeFileSync("src/components/apb/QuizWorkspace.tsx", file);
console.log("Updated QuizWorkspace.tsx with useCallback");

