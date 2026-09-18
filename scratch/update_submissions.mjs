
import fs from "fs";

let file = fs.readFileSync("src/lib/firebase/submissions.ts", "utf8");

// Add quizAnswers and isAutoSubmitted to FinalSubmissionPayload
const payloadReplacement = `export interface FinalSubmissionPayload {
  eventId: string;
  teamId: string;
  roundId: string;
  prompt: string;
  member1Data?: {
    text?: string;
  };
  member2Data?: {
    text?: string;
    imageUrl?: string;
    fileName?: string;
  };
  quizAnswers?: Record<number, "A" | "B" | "C">;
  isAutoSubmitted?: boolean;
  submittedBy: string;
}`;
file = file.replace(/export interface FinalSubmissionPayload \{[\s\S]*?submittedBy: string;\n\}/, payloadReplacement);

// Inside submitFinalResponse, destructure them
file = file.replace(
  `const { eventId, teamId, roundId, prompt, member1Data, member2Data, submittedBy } = payload;`,
  `const { eventId, teamId, roundId, prompt, member1Data, member2Data, quizAnswers, isAutoSubmitted, submittedBy } = payload;`
);

// Update deadline check to add a grace period (e.g. 60 seconds)
file = file.replace(
  `if (roundData.endsAt && now > roundData.endsAt) {`,
  `if (roundData.endsAt && now > roundData.endsAt + 60000) {`
);

// Auto-evaluate quiz answers
const evaluationBlock = `
    let quizScore: number | undefined;
    if (roundData.quizQuestions && quizAnswers) {
      quizScore = 0;
      for (const q of roundData.quizQuestions) {
        if (q.correctAnswer && quizAnswers[q.id] === q.correctAnswer) {
          quizScore += q.points || 1;
        }
      }
    }
`;

file = file.replace(
  `// 4. Create authoritative final submission document`,
  `// 4. Evaluate Quiz if applicable\n    ${evaluationBlock}\n\n    // 5. Create authoritative final submission document`
);

const newSubmissionReplacement = `const newSubmission: Submission = {
      id: docId,
      eventId,
      teamId,
      roundId,
      prompt: prompt.trim(),
      member1Data: member1Data || { text: "" },
      member2Data: member2Data || { text: "", imageUrl: "", fileName: "" },
      submittedAt: now,
      submittedBy,
      status: "FINAL",
      version: 1,
      ...(quizAnswers ? { quizAnswers, quizScore, isAutoSubmitted } : {}),
    };`;

file = file.replace(
  /const newSubmission: Submission = \{[\s\S]*?version: 1,\n\s*\};/,
  newSubmissionReplacement
);

fs.writeFileSync("src/lib/firebase/submissions.ts", file);
console.log("Updated submissions.ts");

