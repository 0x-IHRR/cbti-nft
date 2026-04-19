import { describe, it, expect } from "vitest";
import fc from "fast-check";
import archetypes from "@/data/archetypes.json";

describe("Property 7: 原型元数据完整性", () => {
  /**
   * **Validates: Requirements 7.4**
   *
   * 遍历所有 20 个原型配置条目，断言每条包含 name、cnName、oneLiner、diagnosis
   * （均为非空字符串）、evidence（长度恰好为 3 的非空字符串数组）
   */
  it("should have exactly 20 archetype entries", () => {
    expect(archetypes).toHaveLength(20);
  });

  it("every archetype has valid metadata: name, cnName, oneLiner, diagnosis (non-empty strings) and evidence (array of exactly 3 non-empty strings)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: archetypes.length - 1 }),
        (index) => {
          const archetype = archetypes[index];

          // name is a non-empty string
          expect(typeof archetype.name).toBe("string");
          expect(archetype.name.length).toBeGreaterThan(0);

          // cnName is a non-empty string
          expect(typeof archetype.cnName).toBe("string");
          expect(archetype.cnName.length).toBeGreaterThan(0);

          // oneLiner is a non-empty string
          expect(typeof archetype.oneLiner).toBe("string");
          expect(archetype.oneLiner.length).toBeGreaterThan(0);

          // diagnosis is a non-empty string
          expect(typeof archetype.diagnosis).toBe("string");
          expect(archetype.diagnosis.length).toBeGreaterThan(0);

          // evidence is an array of exactly 3 non-empty strings
          expect(Array.isArray(archetype.evidence)).toBe(true);
          expect(archetype.evidence).toHaveLength(3);
          for (const e of archetype.evidence) {
            expect(typeof e).toBe("string");
            expect(e.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
