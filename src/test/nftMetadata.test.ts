import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { buildNFTMetadata } from "@/components/NFTMintButton";
import archetypesData from "@/data/archetypes.json";
import type { DimensionScores } from "@/lib/types";

/**
 * Property 9: NFT 元数据完整性
 *
 * **Validates: Requirements 10.2**
 *
 * For any archetype result and dimension scores, the constructed NFT metadata
 * must contain all required fields: name, type, cnName, oneLiner, CV, TM, IM,
 * CP, CU, rarity, walletHash, generatedAt, image. All fields must be non-empty.
 */
describe("Property 9: NFT 元数据完整性", () => {
  const archetypeNameArb = fc.constantFrom(
    ...archetypesData.map((a) => a.name)
  );

  const scoresArb = fc.record({
    CV: fc.integer({ min: 0, max: 16 }),
    TM: fc.integer({ min: 0, max: 16 }),
    IM: fc.integer({ min: 0, max: 16 }),
    CP: fc.integer({ min: 0, max: 16 }),
    CU: fc.integer({ min: 0, max: 16 }),
  }) as fc.Arbitrary<DimensionScores>;

  // Generate valid Base58-like wallet addresses
  const base58Chars =
    "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const walletArb = fc
    .array(fc.constantFrom(...base58Chars.split("")), {
      minLength: 32,
      maxLength: 44,
    })
    .map((chars) => chars.join(""));

  it("NFT metadata contains all required fields and they are non-empty", () => {
    fc.assert(
      fc.property(
        archetypeNameArb,
        scoresArb,
        walletArb,
        (archetype, scores, walletAddress) => {
          const metadata = buildNFTMetadata(archetype, scores, walletAddress);

          // String fields must be non-empty
          expect(metadata.name).toBeTruthy();
          expect(metadata.name.length).toBeGreaterThan(0);

          expect(metadata.type).toBeTruthy();
          expect(metadata.type.length).toBeGreaterThan(0);

          expect(metadata.cnName).toBeTruthy();
          expect(metadata.cnName.length).toBeGreaterThan(0);

          expect(metadata.oneLiner).toBeTruthy();
          expect(metadata.oneLiner.length).toBeGreaterThan(0);

          // Dimension scores must be numbers
          expect(typeof metadata.CV).toBe("number");
          expect(typeof metadata.TM).toBe("number");
          expect(typeof metadata.IM).toBe("number");
          expect(typeof metadata.CP).toBe("number");
          expect(typeof metadata.CU).toBe("number");

          // Scores match input
          expect(metadata.CV).toBe(scores.CV);
          expect(metadata.TM).toBe(scores.TM);
          expect(metadata.IM).toBe(scores.IM);
          expect(metadata.CP).toBe(scores.CP);
          expect(metadata.CU).toBe(scores.CU);

          // Rarity must be non-empty
          expect(metadata.rarity).toBeTruthy();
          expect(metadata.rarity.length).toBeGreaterThan(0);
          expect(["Common", "Rare"]).toContain(metadata.rarity);

          // walletHash must be non-empty
          expect(metadata.walletHash).toBeTruthy();
          expect(metadata.walletHash.length).toBeGreaterThan(0);

          // generatedAt must be a valid ISO date string
          expect(metadata.generatedAt).toBeTruthy();
          expect(metadata.generatedAt.length).toBeGreaterThan(0);
          expect(new Date(metadata.generatedAt).toISOString()).toBe(
            metadata.generatedAt
          );

          // image must be non-empty
          expect(metadata.image).toBeTruthy();
          expect(metadata.image.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
