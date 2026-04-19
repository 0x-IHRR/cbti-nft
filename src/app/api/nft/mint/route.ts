import { NextResponse } from "next/server";
import type { DimensionScores, ArchetypeName, NFTMetadata } from "@/lib/types";
import archetypesData from "@/data/archetypes.json";

const BASE58_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const EVM_REGEX = /^0x[0-9a-fA-F]{40}$/;

function isValidWalletAddress(address: string): boolean {
  return BASE58_REGEX.test(address) || EVM_REGEX.test(address);
}

/**
 * Simple hash function for wallet address to generate a deterministic hash string.
 */
function hashWallet(address: string): string {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = (hash * 31 + address.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

/**
 * Determine rarity based on archetype.
 * Core 7 types are "Common", extended 13 types are "Rare".
 */
function determineRarity(archetypeName: string): string {
  const coreTypes = [
    "FOMO King",
    "Chain Hibernator",
    "Bag Artist",
    "Paper Prophet",
    "Mint Monk",
    "Copium Fox",
    "Late Bull",
  ];
  return coreTypes.includes(archetypeName) ? "Common" : "Rare";
}

/**
 * Simulate Metaplex minting. Returns mock txSignature and mintAddress.
 */
function simulateMint(walletAddress: string): {
  txSignature: string;
  mintAddress: string;
} {
  const walletHash = hashWallet(walletAddress);
  const txSignature = `sim_tx_${walletHash}_${Date.now().toString(36)}`;
  const mintAddress = `sim_mint_${walletHash}_${Date.now().toString(36)}`;
  return { txSignature, mintAddress };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress, archetype, scores, imageUrl } = body as {
      walletAddress: string;
      archetype: string;
      scores: DimensionScores;
      imageUrl?: string;
    };

    // Validate wallet address
    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: "Wallet not connected" },
        { status: 401 }
      );
    }

    if (!BASE58_REGEX.test(walletAddress) && !EVM_REGEX.test(walletAddress)) {
      return NextResponse.json(
        { success: false, error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    // Validate archetype data
    if (!archetype || !scores) {
      return NextResponse.json(
        { success: false, error: "Missing archetype or scores data" },
        { status: 400 }
      );
    }

    // Find archetype metadata
    const archetypeConfig = archetypesData.find((a) => a.name === archetype);
    if (!archetypeConfig) {
      return NextResponse.json(
        { success: false, error: "Invalid archetype" },
        { status: 400 }
      );
    }

    // Construct NFT metadata
    const metadata: NFTMetadata = {
      name: `CBTI: ${archetypeConfig.name}`,
      type: archetypeConfig.name as ArchetypeName,
      cnName: archetypeConfig.cnName,
      oneLiner: archetypeConfig.oneLiner,
      CV: scores.CV,
      TM: scores.TM,
      IM: scores.IM,
      CP: scores.CP,
      CU: scores.CU,
      rarity: determineRarity(archetypeConfig.name),
      walletHash: hashWallet(walletAddress),
      generatedAt: new Date().toISOString(),
      image: imageUrl || `https://cbti.app/nft/${hashWallet(walletAddress)}.png`,
    };

    // Simulate Metaplex minting
    try {
      const { txSignature, mintAddress } = simulateMint(walletAddress);

      return NextResponse.json({
        success: true,
        txSignature,
        mintAddress,
        metadata,
      });
    } catch {
      return NextResponse.json(
        { success: false, error: "Transaction failed" },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
