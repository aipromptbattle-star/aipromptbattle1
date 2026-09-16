import { EvaluationRule } from "@/lib/firebase/schema";

export interface EvaluationResult {
  ruleId: string;
  description: string;
  pass: boolean;
  pointsEarned: number;
  maxPoints: number;
  actualValue?: string | number;
}

export interface StageEvaluationSummary {
  results: EvaluationResult[];
  totalPointsEarned: number;
  maxPossiblePoints: number;
}

/**
 * Counts words separated by whitespace.
 */
export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Counts numbered items like "1.", "2)", "- ", or lines.
 */
export function countNumberedOrBulletedItems(text: string): number {
  if (!text) return 0;
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const matched = lines.filter(l => /^(?:\d+[\.\)]|[-*•])\s+/.test(l));
  return matched.length > 0 ? matched.length : lines.length;
}

/**
 * Evaluates a single rule against participant text (prompt and/or output).
 */
export function evaluateRule(rule: EvaluationRule, text: string): EvaluationResult {
  const combined = (text || "").trim();
  const wordCount = countWords(combined);
  const charCount = combined.length;
  let pass = false;
  let actualValue: string | number = "";
  const maxPoints = Number(rule.points) || 1;

  switch (rule.rule) {
    case "MIN_WORDS": {
      const min = Number(rule.expectedValue) || 0;
      actualValue = `${wordCount} words`;
      pass = wordCount >= min;
      break;
    }
    case "MAX_WORDS": {
      const max = Number(rule.expectedValue) || 0;
      actualValue = `${wordCount} words`;
      pass = wordCount <= max;
      break;
    }
    case "EXACT_WORDS": {
      const exact = Number(rule.expectedValue) || 0;
      actualValue = `${wordCount} words`;
      pass = wordCount === exact;
      break;
    }
    case "CHAR_COUNT": {
      const target = Number(rule.expectedValue) || 0;
      actualValue = `${charCount} chars`;
      pass = charCount >= target;
      break;
    }
    case "REQUIRED_PHRASE": {
      const phrase = String(rule.expectedValue || "").trim().toLowerCase();
      actualValue = phrase;
      pass = combined.toLowerCase().includes(phrase);
      break;
    }
    case "FORBIDDEN_PHRASE": {
      const phrase = String(rule.expectedValue || "").trim().toLowerCase();
      actualValue = phrase;
      pass = !combined.toLowerCase().includes(phrase);
      break;
    }
    case "ITEM_COUNT": {
      const count = countNumberedOrBulletedItems(combined);
      const minItems = Number(rule.expectedValue) || 0;
      actualValue = `${count} items`;
      pass = count >= minItems;
      break;
    }
    default:
      pass = true;
      actualValue = "N/A";
  }

  return {
    ruleId: rule.id,
    description: rule.description || `${rule.rule}: ${rule.expectedValue}`,
    pass,
    pointsEarned: pass ? maxPoints : 0,
    maxPoints,
    actualValue,
  };
}

/**
 * Evaluates all rules defined for a stage against prompt and output content.
 */
export function evaluateStageRules(
  rules: EvaluationRule[] = [],
  prompt: string = "",
  outputText: string = ""
): StageEvaluationSummary {
  const combinedText = `${prompt}\n\n${outputText}`.trim();
  const results: EvaluationResult[] = rules.map((r) => evaluateRule(r, combinedText));
  const totalPointsEarned = results.reduce((acc, r) => acc + r.pointsEarned, 0);
  const maxPossiblePoints = results.reduce((acc, r) => acc + r.maxPoints, 0);

  return {
    results,
    totalPointsEarned,
    maxPossiblePoints,
  };
}
