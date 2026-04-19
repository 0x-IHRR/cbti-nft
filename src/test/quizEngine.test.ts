import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { selectQuestions } from "@/lib/quizEngine";
import type { Question, QuestionGroup, Dimension } from "@/lib/types";
import questionsData from "@/data/questions.json";

const ALL_GROUPS: QuestionGroup[] = [
  "FOMO_IMPULSE",
  "CONVICTION_DIAMOND",
  "TIMING",
  "COPIUM",
  "CURIOSITY_MINT",
];

const ALL_DIMENSIONS: Dimension[] = ["CV", "TM", "IM", "CP", "CU"];

/**
 * Generator: create a valid question bank with ≥ 30 questions, all 5 groups represented.
 * Each group gets at least 6 questions to ensure a rich pool.
 */
const questionBankArb = fc
  .tuple(
    // For each of the 5 groups, generate 6+ questions
    ...ALL_GROUPS.map((group) =>
      fc
        .array(
          fc.record({
            text: fc.string({ minLength: 1, maxLength: 50 }),
            options: fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 5 }),
                text: fc.string({ minLength: 1, maxLength: 30 }),
              }),
              { minLength: 2, maxLength: 4 }
            ),
            strongMatch: fc.constantFrom(...ALL_DIMENSIONS),
            secondaryMatch: fc.constantFrom(...ALL_DIMENSIONS),
          }),
          { minLength: 6, maxLength: 10 }
        )
        .map((questions) =>
          questions.map((q, i) => ({
            ...q,
            id: `${group}_${i}`,
            group,
          }))
        )
    )
  )
  .map((groupArrays) => groupArrays.flat() as Question[]);

describe("Property 2: 题目选取有效性", () => {
  /**
   * **Validates: Requirements 3.1, 3.2**
   *
   * 随机生成有效题库（≥ 30 题，5 组均有题目），调用 selectQuestions，
   * 断言结果恰好 8 题且覆盖 ≥ 4 个不同的 Question_Group
   */
  it("selectQuestions returns exactly 8 questions covering ≥ 4 distinct groups", () => {
    fc.assert(
      fc.property(questionBankArb, (bank) => {
        const selected = selectQuestions(bank);

        // Exactly 8 questions
        expect(selected).toHaveLength(8);

        // Covers ≥ 4 distinct groups
        const groups = new Set(selected.map((q) => q.group));
        expect(groups.size).toBeGreaterThanOrEqual(4);
      }),
      { numRuns: 100 }
    );
  });
});

describe("Property 3: 题目选取随机性", () => {
  /**
   * **Validates: Requirements 3.3**
   *
   * 使用固定题库运行 selectQuestions 多次（≥ 10 次），断言至少存在两次不同的选取结果
   */
  it("running selectQuestions ≥ 10 times with fixed bank produces at least 2 different results", () => {
    // Use the actual questions.json as a fixed bank
    const bank = questionsData as Question[];

    const results: string[] = [];
    for (let i = 0; i < 10; i++) {
      const selected = selectQuestions(bank);
      const ids = selected
        .map((q) => q.id)
        .sort()
        .join(",");
      results.push(ids);
    }

    const uniqueResults = new Set(results);
    expect(uniqueResults.size).toBeGreaterThanOrEqual(2);
  });
});
