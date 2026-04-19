import { describe, it, expect } from "vitest";
import fc from "fast-check";
import questions from "@/data/questions.json";
import type { Dimension } from "@/lib/types";

const VALID_DIMENSIONS: Dimension[] = ["CV", "TM", "IM", "CP", "CU"];

describe("Property 1: 题库有效性", () => {
  /**
   * **Validates: Requirements 2.3, 2.4**
   *
   * 遍历题库 JSON 中所有 30 道题目，断言每题有有效的 strongMatch 和 secondaryMatch 维度
   * （∈ {CV, TM, IM, CP, CU}），且 options.length ≥ 2
   */
  it("should have exactly 30 questions", () => {
    expect(questions).toHaveLength(30);
  });

  it("every question has valid strongMatch, secondaryMatch dimensions and ≥ 2 options", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: questions.length - 1 }),
        (index) => {
          const q = questions[index];
          expect(VALID_DIMENSIONS).toContain(q.strongMatch);
          expect(VALID_DIMENSIONS).toContain(q.secondaryMatch);
          expect(q.options.length).toBeGreaterThanOrEqual(2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
