"use client";

import { useState } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { mintCbtiNft } from "@/lib/cbtiContract";
import type { DimensionScores, ArchetypeName, NFTMetadata } from "@/lib/types";
import archetypesData from "@/data/archetypes.json";

interface NFTMintButtonProps {
  walletAddress: string | null;
  archetype: string;
  scores: DimensionScores;
}

type MintState = "idle" | "minting" | "success" | "error";

const CORE_TYPES = [
  "FOMO King",
  "Chain Hibernator",
  "Bag Artist",
  "Paper Prophet",
  "Mint Monk",
  "Copium Fox",
  "Late Bull",
];

function hashWallet(address: string): string {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = (hash * 31 + address.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

/**
 * Build NFT metadata from archetype, scores, and wallet address.
 * Exported for property testing.
 */
export function buildNFTMetadata(
  archetype: string,
  scores: DimensionScores,
  walletAddress: string
): NFTMetadata {
  const archetypeConfig = archetypesData.find((a) => a.name === archetype);

  const name = `CBTI: ${archetypeConfig?.name ?? archetype}`;
  const type = (archetypeConfig?.name ?? archetype) as ArchetypeName;
  const cnName = archetypeConfig?.cnName ?? "";
  const oneLiner = archetypeConfig?.oneLiner ?? "";
  const rarity = CORE_TYPES.includes(archetype) ? "Common" : "Rare";
  const walletHash = hashWallet(walletAddress);
  const generatedAt = new Date().toISOString();
  const image = `https://cbti.app/nft/${walletHash}.png`;

  return {
    name,
    type,
    cnName,
    oneLiner,
    CV: scores.CV,
    TM: scores.TM,
    IM: scores.IM,
    CP: scores.CP,
    CU: scores.CU,
    rarity,
    walletHash,
    generatedAt,
    image,
  };
}

/**
 * Sign a Solana transaction using the browser wallet extension.
 * Works with Phantom, Solflare, Backpack.
 */
async function signWithWallet(tx: Transaction): Promise<Transaction> {
  // Try Phantom
  const phantom = (window as any).phantom?.solana ?? (window as any).solana;
  if (phantom?.signTransaction) {
    return phantom.signTransaction(tx);
  }
  // Try Solflare
  const solflare = (window as any).solflare;
  if (solflare?.signTransaction) {
    return solflare.signTransaction(tx);
  }
  // Try Backpack
  const backpack = (window as any).backpack;
  if (backpack?.signTransaction) {
    return backpack.signTransaction(tx);
  }
  throw new Error("未找到 Solana 钱包，请使用 Phantom/Solflare/Backpack");
}

export default function NFTMintButton({
  walletAddress,
  archetype,
  scores,
}: NFTMintButtonProps) {
  const [state, setState] = useState<MintState>("idle");
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [mintAddress, setMintAddress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleMint = async () => {
    if (!walletAddress) return;

    setState("minting");
    setErrorMessage(null);

    try {
      // Check if this is a Solana address (Base58) — EVM addresses can't mint Solana NFTs
      const isBase58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress);
      if (!isBase58) {
        throw new Error("NFT 铸造需要 Solana 钱包（Phantom/Solflare/Backpack），EVM 钱包暂不支持");
      }

      const walletPubkey = new PublicKey(walletAddress);
      const archetypeConfig = archetypesData.find((a) => a.name === archetype);

      const result = await mintCbtiNft(walletPubkey, signWithWallet, {
        name: `CBTI: ${archetypeConfig?.name ?? archetype}`,
        cnName: archetypeConfig?.cnName ?? "",
        oneLiner: (archetypeConfig?.oneLiner ?? "").slice(0, 256),
        cv: scores.CV,
        tm: scores.TM,
        im: scores.IM,
        cp: scores.CP,
        cu: scores.CU,
        rarity: CORE_TYPES.includes(archetype) ? "Common" : "Rare",
        uri: `https://cbti.app/nft/metadata/${hashWallet(walletAddress)}.json`,
      });

      setTxSignature(result.txSignature);
      setMintAddress(result.mintAddress);
      setState("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "铸造失败，请重试";
      // User rejected the transaction
      if (message.includes("User rejected") || message.includes("cancelled")) {
        setErrorMessage("你取消了签名，可以重新铸造");
      } else {
        setErrorMessage(message);
      }
      setState("error");
    }
  };

  if (!walletAddress) {
    return (
      <button disabled className="flex items-center justify-center gap-2 rounded-xl border border-gray-700 bg-gray-800 py-3.5 text-sm font-bold text-gray-500 opacity-60">
        🪙 连接钱包
      </button>
    );
  }

  if (state === "minting") {
    return (
      <button disabled className="flex items-center justify-center gap-2 rounded-xl border border-yellow-500/50 bg-yellow-500/10 py-3.5 font-bold text-yellow-400 opacity-70 animate-pulse">
        ⏳ 铸造中...
      </button>
    );
  }

  if (state === "success") {
    return (
      <a
        href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl border border-green-500/50 bg-green-500/10 py-3.5 font-bold text-green-400 transition hover:bg-green-500/20 hover:scale-[1.02]"
      >
        ✅ 查看 NFT
      </a>
    );
  }

  if (state === "error") {
    return (
      <button
        onClick={handleMint}
        className="flex items-center justify-center gap-2 rounded-xl border border-red-500/50 bg-red-500/10 py-3.5 font-bold text-red-400 transition hover:bg-red-500/20 hover:scale-[1.02] active:scale-[0.98]"
      >
        🔄 重试铸造
      </button>
    );
  }

  return (
    <button
      onClick={handleMint}
      className="flex items-center justify-center gap-2 rounded-xl border border-yellow-500/50 bg-yellow-500/10 py-3.5 font-bold text-yellow-400 transition hover:bg-yellow-500/20 hover:scale-[1.02] active:scale-[0.98]"
    >
      🪙 铸造 NFT
    </button>
  );
}
