
import fs from "fs";

let file = fs.readFileSync("src/components/apb/QuizWorkspace.tsx", "utf8");

file = file.replace(
  `await submitFinalResponse(eventId, teamId, round.id, {
        prompt: "QUIZ_SUBMISSION", // Required by schema but irrelevant here
        quizAnswers: answers,
        version: Date.now(),
        isAutoSubmitted: isAutoSubmit
      }, "QUIZ");`,
  `await submitFinalResponse({
        eventId,
        teamId,
        roundId: round.id,
        prompt: "QUIZ_SUBMISSION",
        quizAnswers: answers,
        isAutoSubmitted: isAutoSubmit,
        submittedBy: teamId
      });`
);

// Fix the UI when it is auto submitted
const successReplacement = `if (existingSubmission) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldCheck className="w-24 h-24 text-[var(--color-apb-cyan)] mb-6 animate-pulse" />
        <h2 className="text-3xl font-mono tracking-widest text-white uppercase mb-4">
          {existingSubmission.isAutoSubmitted ? "TIME UP — YOUR QUIZ HAS BEEN AUTOMATICALLY SUBMITTED" : "Quiz Submitted"}
        </h2>
        <p className="text-slate-400 max-w-md">
          Your answers have been securely recorded. Please wait for the round to complete. Correct answers will be revealed by the organizer.
        </p>
      </div>
    );
  }`;

file = file.replace(
  /if \(existingSubmission\) \{[\s\S]*?<\p>[\s\S]*?<\/div>\n    \);\n  \}/,
  successReplacement
);

fs.writeFileSync("src/components/apb/QuizWorkspace.tsx", file);
console.log("Updated QuizWorkspace.tsx");

