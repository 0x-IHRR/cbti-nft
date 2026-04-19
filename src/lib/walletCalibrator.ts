import type { DimensionScores, WalletBehavior } from "./types";

/**
 * Calibrate dimension scores based on wallet on-chain behavior.
 *
 * Each boolean flag adds +1 to the corresponding dimension:
 * - hasHighConviction → CV +1
 * - hasGoodTiming → TM +1
 * - hasImpulseBuys → IM +1
 * - hasCopiumHolds → CP +1
 * - hasMintActivity → CU +1
 */
export function calibrateScores(
  scores: DimensionScores,
  walletBehavior: WalletBehavior
): DimensionScores {
  const calibrated = { ...scores };

  if (walletBehavior.hasHighConviction) calibrated.CV += 1;
  if (walletBehavior.hasGoodTiming) calibrated.TM += 1;
  if (walletBehavior.hasImpulseBuys) calibrated.IM += 1;
  if (walletBehavior.hasCopiumHolds) calibrated.CP += 1;
  if (walletBehavior.hasMintActivity) calibrated.CU += 1;

  return calibrated;
}
