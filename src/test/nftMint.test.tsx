import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { DimensionScores } from "@/lib/types";

const mockScores: DimensionScores = { CV: 5, TM: 3, IM: 7, CP: 2, CU: 4 };
const mockWallet = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

vi.mock("@/lib/cbtiContract", () => ({
  mintCbtiNft: vi.fn(),
}));

vi.mock("@solana/web3.js", () => ({
  PublicKey: class MockPublicKey {
    constructor(public key: string) {}
    toBase58() { return this.key; }
    toBuffer() { return Buffer.alloc(32); }
    static findProgramAddressSync() { return [new this("mock"), 0]; }
  },
  Transaction: class {},
}));

describe("NFTMintButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders mint button when wallet is connected", async () => {
    const { default: NFTMintButton } = await import("@/components/NFTMintButton");
    render(<NFTMintButton walletAddress={mockWallet} archetype="FOMO King" scores={mockScores} />);
    expect(screen.getByRole("button", { name: /铸造 NFT/ })).toBeInTheDocument();
  });

  it("shows disabled button when walletAddress is null", async () => {
    const { default: NFTMintButton } = await import("@/components/NFTMintButton");
    render(<NFTMintButton walletAddress={null} archetype="FOMO King" scores={mockScores} />);
    expect(screen.getByRole("button", { name: /连接钱包/ })).toBeDisabled();
  });

  it("shows success link on successful mint", async () => {
    const { mintCbtiNft } = await import("@/lib/cbtiContract");
    (mintCbtiNft as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      txSignature: "sim_tx_abc123_test",
      mintAddress: "sim_mint_abc123_test",
    });
    (window as any).phantom = { solana: { signTransaction: vi.fn() } };

    const { default: NFTMintButton } = await import("@/components/NFTMintButton");
    render(<NFTMintButton walletAddress={mockWallet} archetype="FOMO King" scores={mockScores} />);
    fireEvent.click(screen.getByRole("button", { name: /铸造 NFT/ }));

    await waitFor(() => {
      expect(screen.getByText(/查看 NFT/)).toBeInTheDocument();
    });
  });

  it("shows retry button on failed mint", async () => {
    const { mintCbtiNft } = await import("@/lib/cbtiContract");
    (mintCbtiNft as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Transaction failed"));
    (window as any).phantom = { solana: { signTransaction: vi.fn() } };

    const { default: NFTMintButton } = await import("@/components/NFTMintButton");
    render(<NFTMintButton walletAddress={mockWallet} archetype="FOMO King" scores={mockScores} />);
    fireEvent.click(screen.getByRole("button", { name: /铸造 NFT/ }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /重试铸造/ })).toBeInTheDocument();
    });
  });
});
