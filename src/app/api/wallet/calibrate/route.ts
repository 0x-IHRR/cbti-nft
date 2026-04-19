import { NextResponse } from "next/server";
import { calibrateScores } from "@/lib/walletCalibrator";
import { mapArchetype } from "@/lib/typeMapper";
import type { DimensionScores, WalletBehavior, Archetype } from "@/lib/types";
import archetypesData from "@/data/archetypes.json";

// Base58 character set for Solana addresses
const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
// EVM hex address (MetaMask, Binance Wallet, etc.)
const EVM_REGEX = /^0x[0-9a-fA-F]{40}$/;

/**
 * Validate wallet address: supports both Solana (Base58) and EVM (0x hex).
 */
function isValidWalletAddress(address: string): boolean {
  return BASE58_REGEX.test(address) || EVM_REGEX.test(address);
}

/**
 * Simulate wallet behavior data based on address hash.
 * In production, this would read on-chain data via Solana RPC.
 */
function simulateWalletBehavior(walletAddress: string): WalletBehavior {
  // Simple hash-based simulation: use character codes to derive booleans
  let hash = 0;
  for (let i = 0; i < walletAddress.length; i++) {
    hash = (hash * 31 + walletAddress.charCodeAt(i)) | 0;
  }
  const abs = Math.abs(hash);

  return {
    hasHighConviction: (abs & 1) === 1,
    hasGoodTiming: ((abs >> 1) & 1) === 1,
    hasImpulseBuys: ((abs >> 2) & 1) === 1,
    hasCopiumHolds: ((abs >> 3) & 1) === 1,
    hasMintActivity: ((abs >> 4) & 1) === 1,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress, scores } = body as {
      walletAddress: string;
      scores: DimensionScores;
    };

    // Validate wallet address format (Solana Base58 or EVM 0x hex)
    if (!walletAddress || !isValidWalletAddress(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid wallet address format." },
        { status: 400 }
      );
    }

    // Validate scores
    if (!scores || typeof scores !== "object") {
      return NextResponse.json(
        { error: "Invalid scores object" },
        { status: 400 }
      );
    }

    try {
      // Simulate wallet behavior data (mock: generate based on address hash)
      const walletBehavior = simulateWalletBehavior(walletAddress);

      // Calibrate scores
      const calibratedScores = calibrateScores(scores, walletBehavior);

      // Remap archetype with calibrated scores
      const archetypeName = mapArchetype(calibratedScores);
      const archetypeConfig = (archetypesData as Archetype[]).find(
        (a) => a.name === archetypeName
      );

      return NextResponse.json({
        calibratedScores,
        archetype: archetypeConfig,
      });
    } catch {
      // Simulated RPC failure
      return NextResponse.json(
        { error: "Failed to read on-chain data" },
        { status: 502 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
