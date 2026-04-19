import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { calibrateScores } from "@/lib/walletCalibrator";
import type { Dimension, DimensionScores, WalletBehavior } from "@/lib/types";

const ALL_DIMENSIONS: Dimension[] = ["CV", "TM", "IM", "CP", "CU"];

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

/**
 * Generator: random wallet behavior (5 booleans)
 */
const walletBehaviorArb: fc.Arbitrary<WalletBehavior> = fc.record({
  hasHighConviction: fc.boolean(),
  hasGoodTiming: fc.boolean(),
  hasImpulseBuys: fc.boolean(),
  hasCopiumHolds: fc.boolean(),
  hasMintActivity: fc.boolean(),
});

describe("Property 5: 钱包校准有界调整", () => {
  /**
   * **Validates: Requirements 6.3**
   *
   * 随机生成初始分数（每维度 0–16 范围）和随机钱包行为布尔值（5 个 boolean），
   * 断言对每个维度 d，0 ≤ calibrated[d] - original[d] ≤ 1
   */
  it("calibrated score differs from original by 0 or 1 for each dimension", () => {
    fc.assert(
      fc.property(
        dimensionScoresArb,
        walletBehaviorArb,
        (scores, walletBehavior) => {
          const calibrated = calibrateScores(scores, walletBehavior);

          for (const dim of ALL_DIMENSIONS) {
            const diff = calibrated[dim] - scores[dim];
            expect(diff).toBeGreaterThanOrEqual(0);
            expect(diff).toBeLessThanOrEqual(1);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
