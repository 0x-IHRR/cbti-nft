import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { mapArchetype } from "@/lib/typeMapper";
import type { ArchetypeName, DimensionScores } from "@/lib/types";

const ALL_ARCHETYPES: ArchetypeName[] = [
  "FOMO King",
  "Chain Hibernator",
  "Bag Artist",
  "Paper Prophet",
  "Mint Monk",
  "Copium Fox",
  "Late Bull",
  "Diamond Mule",
  "Ape Chimp",
  "Reverse Oracle",
  "Stop-Loss Phobia",
  "Airdrop Hunter",
  "Leverage Warrior",
  "Community Evangelist",
  "Chain Archaeologist",
  "Gas Phobia",
  "Narrative Surfer",
  "LP Martyr",
  "Contract Gambler",
  "Zen Holder",
];

/**
 * Generator: random dimension scores (0-16 per dimension)
 */
const dimensionScoresArb: fc.Arbitrary<DimensionScores> = fc.record({
  CV: fc.integer({ min: 0, max: 16 }),
  TM: fc.integer({ min: 0, max: 16 }),
  IM: fc.integer({ min: 0, max: 16 }),
  CP: fc.integer({ min: 0, max: 16 }),
  CU: fc.integer({ min: 0, max: 16 }),
});

describe("Property 6: 原型映射确定性与完备性", () => {
  /**
   * **Validates: Requirements 7.2, 7.3**
   *
   * 随机生成 5 个维度分数（每维度 0–16 范围的非负整数），
   * 断言 mapArchetype 返回值是 20 个预定义原型之一
   */
  it("mapArchetype returns one of the 20 predefined archetypes for any valid scores", () => {
    fc.assert(
      fc.property(dimensionScoresArb, (scores) => {
        const result = mapArchetype(scores);
        expect(ALL_ARCHETYPES).toContain(result);
      }),
      { numRuns: 100 }
    );
  });
});
