import type { DimensionScores, ArchetypeName } from "./types";

/**
 * Map dimension scores to one of 20 predefined archetypes using priority-based rules.
 *
 * Priority 1-7: Core 7 archetypes
 * Priority 8-20: Extended 13 archetypes
 * Zen Holder is the default fallback.
 */
export function mapArchetype(scores: DimensionScores): ArchetypeName {
  const { CV, TM, IM, CP, CU } = scores;
  const VERY_HIGH = 6;
  const HIGH = 5;
  const MID_LOW = 3;
  const MID_HIGH = 4;
  const LOW = 2;
  const max = Math.max(CV, TM, IM, CP, CU);

  // 核心 7 型（优先级 1–7）
  if (IM >= VERY_HIGH && IM >= max) return "FOMO King";
  if (CV >= HIGH && IM <= LOW && CU <= LOW) return "Chain Hibernator";
  if (IM >= HIGH && TM <= LOW) return "Bag Artist";
  if (TM >= HIGH && CV <= LOW) return "Paper Prophet";
  if (CU >= VERY_HIGH && CU >= max) return "Mint Monk";
  if (CP >= VERY_HIGH && CP >= max) return "Copium Fox";
  if (TM <= LOW && IM >= MID_LOW && IM <= MID_HIGH && CV >= MID_LOW && CV <= MID_HIGH)
    return "Late Bull";

  // 扩展 13 型（优先级 8–20）
  if (CV >= VERY_HIGH && CP >= HIGH) return "Diamond Mule";
  if (IM >= HIGH && CV <= LOW && TM <= LOW) return "Ape Chimp";
  if (TM >= HIGH && IM >= HIGH) return "Reverse Oracle";
  if (CV >= HIGH && CP >= HIGH && IM <= LOW) return "Stop-Loss Phobia";
  if (CU >= HIGH && IM >= MID_LOW && IM <= MID_HIGH && CV <= LOW)
    return "Airdrop Hunter";
  if (IM >= VERY_HIGH && CV >= HIGH) return "Leverage Warrior";
  if (CP >= HIGH && CU >= HIGH && IM <= LOW) return "Community Evangelist";
  if (TM >= HIGH && CU >= HIGH && IM <= LOW) return "Chain Archaeologist";
  if (CU <= LOW && IM <= LOW && TM <= LOW) return "Gas Phobia";
  if (TM >= MID_LOW && TM <= MID_HIGH && IM >= MID_LOW && IM <= MID_HIGH && CP >= HIGH)
    return "Narrative Surfer";
  if (CU >= HIGH && CV >= HIGH && CP >= HIGH) return "LP Martyr";
  if (IM >= HIGH && TM >= MID_LOW && TM <= MID_HIGH && CP <= LOW)
    return "Contract Gambler";

  // 默认兜底
  return "Zen Holder";
}
