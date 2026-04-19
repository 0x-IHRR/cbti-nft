import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { computeScores } from "@/lib/scoreEngine";
import type {
  Question,
  Answer,
  Dimension,
  DimensionScores,
  QuestionGroup,
} from "@/lib/types";

const ALL_DIMENSIONS: Dimension[] = ["CV", "TM", "IM", "CP", "CU"];
const ALL_GROUPS: QuestionGroup[] = [
  "FOMO_IMPULSE",
  "CONVICTION_DIAMOND",
  "TIMING",
  "COPIUM",
  "CURIOSITY_MINT",
];

/**
 * Generator: create 8 random questions with valid dimensions and corresponding answers.
 */
const questionsAndAnswersArb = fc
  .array(
    fc.record({
      strongMatch: fc.constantFrom(...ALL_DIMENSIONS),
      secondaryMatch: fc.constantFrom(...ALL_DIMENSIONS),
      group: fc.constantFrom(...ALL_GROUPS),
    }),
    { minLength: 8, maxLength: 8 }
  )
  .map((items) => {
    const questions: Question[] = items.map((item, i) => ({
      id: `q${i}`,
      text: `Question ${i}`,
      group: item.group,
      options: [
        { id: "a", text: "Option A" },
        { id: "b", text: "Option B" },
      ],
      strongMatch: item.strongMatch,
      secondaryMatch: item.secondaryMatch,
    }));

    const answers: Answer[] = questions.map((q) => ({
      questionId: q.id,
      optionId: "a",
    }));

    return { questions, answers };
  });

describe("Property 4: 计分正确性", () => {
  /**
   * **Validates: Requirements 5.1, 5.2**
   *
   * 随机生成 8 道题目（含有效维度标注）和对应答案，断言 computeScores 输出
   * 等于手动累加 +2/+1 的期望值，且包含全部 5 个维度
   */
  it("computeScores output equals manual +2/+1 accumulation and includes all 5 dimensions", () => {
    fc.assert(
      fc.property(questionsAndAnswersArb, ({ questions, answers }) => {
        const result = computeScores(questions, answers);

        // Manually compute expected scores
        const expected: DimensionScores = { CV: 0, TM: 0, IM: 0, CP: 0, CU: 0 };
        for (const answer of answers) {
          const question = questions.find((q) => q.id === answer.questionId);
          if (question) {
            expected[question.strongMatch] += 2;
            expected[question.secondaryMatch] += 1;
          }
        }

        // Assert equality
        for (const dim of ALL_DIMENSIONS) {
          expect(result[dim]).toBe(expected[dim]);
        }

        // Assert all 5 dimensions are present
        for (const dim of ALL_DIMENSIONS) {
          expect(result).toHaveProperty(dim);
          expect(typeof result[dim]).toBe("number");
        }
      }),
      { numRuns: 100 }
    );
  });
});
