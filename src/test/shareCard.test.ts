import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { generateShareData } from "@/components/ShareCard";
import archetypesData from "@/data/archetypes.json";
import type { Archetype, DimensionScores, Dimension } from "@/lib/types";

const DIMENSIONS: Dimension[] = ["CV", "TM", "IM", "CP", "CU"];

/**
 * Property 8: 分享输出完整性
 *
 * **Validates: Requirements 9.1, 9.3**
 *
 * For any archetype result and dimension scores, the generated share card data
 * should contain archetype name, cnName, oneLiner, and dimension visualization data;
 * the share text should contain the archetype name.
 */
describe("Property 8: 分享输出完整性", () => {
  const archetypeArb = fc.constantFrom(
    ...(archetypesData as Archetype[])
  );

  const scoresArb = fc.record({
    CV: fc.integer({ min: 0, max: 16 }),
    TM: fc.integer({ min: 0, max: 16 }),
    IM: fc.integer({ min: 0, max: 16 }),
    CP: fc.integer({ min: 0, max: 16 }),
    CU: fc.integer({ min: 0, max: 16 }),
  }) as fc.Arbitrary<DimensionScores>;

  it("share card data contains name, cnName, oneLiner, and dimension data", () => {
    fc.assert(
      fc.property(archetypeArb, scoresArb, (archetype, scores) => {
        const { cardData } = generateShareData(archetype, scores);

        // Card data contains name, cnName, oneLiner
        expect(cardData.name).toBe(archetype.name);
        expect(cardData.name.length).toBeGreaterThan(0);
        expect(cardData.cnName).toBe(archetype.cnName);
        expect(cardData.cnName.length).toBeGreaterThan(0);
        expect(cardData.oneLiner).toBe(archetype.oneLiner);
        expect(cardData.oneLiner.length).toBeGreaterThan(0);

        // Card data contains all 5 dimension scores
        for (const dim of DIMENSIONS) {
          expect(cardData.dimensions[dim]).toBe(scores[dim]);
          expect(typeof cardData.dimensions[dim]).toBe("number");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("share text contains archetype name", () => {
    fc.assert(
      fc.property(archetypeArb, scoresArb, (archetype, scores) => {
        const { shareText } = generateShareData(archetype, scores);

        expect(shareText).toContain(archetype.name);
        expect(shareText.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});
