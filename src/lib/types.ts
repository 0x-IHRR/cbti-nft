/**
 * CBTI (Crypto Bagholder Type Index) — 核心类型定义
 */

// ─── Question（题目）─────────────────────────────────────────

export interface Option {
  id: string;
  text: string;
}

export type QuestionGroup =
  | "FOMO_IMPULSE"
  | "CONVICTION_DIAMOND"
  | "TIMING"
  | "COPIUM"
  | "CURIOSITY_MINT";

export type Dimension = "CV" | "TM" | "IM" | "CP" | "CU";

export interface Question {
  id: string;
  text: string;
  group: QuestionGroup;
  options: Option[];
  strongMatch: Dimension;
  secondaryMatch: Dimension;
}

// ─── Scoring（计分）──────────────────────────────────────────

export interface DimensionScores {
  CV: number;
  TM: number;
  IM: number;
  CP: number;
  CU: number;
}

// ─── Archetype（原型）────────────────────────────────────────

export interface Archetype {
  name: string;
  cnName: string;
  oneLiner: string;
  diagnosis: string;
  evidence: [string, string, string];
}

export type ArchetypeName =
  // 核心 7 型
  | "FOMO King"
  | "Chain Hibernator"
  | "Bag Artist"
  | "Paper Prophet"
  | "Mint Monk"
  | "Copium Fox"
  | "Late Bull"
  // 扩展 13 型
  | "Diamond Mule"
  | "Ape Chimp"
  | "Reverse Oracle"
  | "Stop-Loss Phobia"
  | "Airdrop Hunter"
  | "Leverage Warrior"
  | "Community Evangelist"
  | "Chain Archaeologist"
  | "Gas Phobia"
  | "Narrative Surfer"
  | "LP Martyr"
  | "Contract Gambler"
  | "Zen Holder";

// ─── Answer（答案）───────────────────────────────────────────

export interface Answer {
  questionId: string;
  optionId: string;
}

// ─── Wallet（钱包）───────────────────────────────────────────

export interface WalletBehavior {
  hasHighConviction: boolean;
  hasGoodTiming: boolean;
  hasImpulseBuys: boolean;
  hasCopiumHolds: boolean;
  hasMintActivity: boolean;
}

// ─── NFT ─────────────────────────────────────────────────────

export interface NFTMetadata {
  name: string;
  type: ArchetypeName;
  cnName: string;
  oneLiner: string;
  CV: number;
  TM: number;
  IM: number;
  CP: number;
  CU: number;
  rarity: string;
  walletHash: string;
  generatedAt: string;
  image: string;
}
