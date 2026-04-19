import type { Question, Answer, DimensionScores } from "./types";

/**
 * Compute dimension scores from questions and answers.
 *
 * For each answer, find the matching question:
 * - Add +2 to the strongMatch dimension
 * - Add +1 to the secondaryMatch dimension
 */
export function computeScores(
  questions: Question[],
  answers: Answer[]
): DimensionScores {
  const scores: DimensionScores = { CV: 0, TM: 0, IM: 0, CP: 0, CU: 0 };

  for (const answer of answers) {
    const question = questions.find((q) => q.id === answer.questionId);
    if (question) {
      scores[question.strongMatch] += 2;
      scores[question.secondaryMatch] += 1;
    }
  }

  return scores;
}
