import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useCBTIStore } from "@/store/cbtiStore";
import type { Archetype, DimensionScores } from "@/lib/types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const mockArchetype: Archetype = {
  name: "FOMO King",
  cnName: "急急国王",
  oneLiner: "别人还在看K线，你已经All in了三个项目。",
  diagnosis:
    "你的交易风格可以用一个字概括：冲。任何风吹草动都能让你打开DEX。",
  evidence: [
    "你的交易记录显示80%的买入发生在价格ATH之后",
    "你关注了超过200个Alpha猎人但从来没赶上过Alpha",
    "你的Gas费支出比实际投资收益还高",
  ],
};

const mockScores: DimensionScores = { CV: 5, TM: 3, IM: 7, CP: 2, CU: 4 };

describe("ResultPage", () => {
  beforeEach(() => {
    // Seed the store with test data before each test
    useCBTIStore.getState().reset();
    useCBTIStore.getState().setArchetype(mockArchetype);
    useCBTIStore.getState().setScores(mockScores);
    useCBTIStore.getState().setWallet("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");
  });

  async function renderResultPage() {
    const { default: ResultPage } = await import("@/app/result/page");
    return render(<ResultPage />);
  }

  it("renders archetype name", async () => {
    await renderResultPage();
    expect(screen.getByText("FOMO King")).toBeInTheDocument();
  });

  it("renders cnName", async () => {
    await renderResultPage();
    expect(screen.getByText("急急国王")).toBeInTheDocument();
  });

  it("renders oneLiner", async () => {
    await renderResultPage();
    expect(
      screen.getByText(/别人还在看K线/)
    ).toBeInTheDocument();
  });

  it("renders diagnosis", async () => {
    await renderResultPage();
    expect(
      screen.getByText(/你的交易风格可以用一个字概括/)
    ).toBeInTheDocument();
  });

  it("renders 3 evidence items", async () => {
    await renderResultPage();
    for (const evidence of mockArchetype.evidence) {
      expect(screen.getByText(evidence)).toBeInTheDocument();
    }
  });

  it("renders dimension bars for all 5 dimensions", async () => {
    await renderResultPage();
    const dimensions = ["CV", "TM", "IM", "CP", "CU"];
    for (const dim of dimensions) {
      expect(screen.getByTestId(`bar-${dim}`)).toBeInTheDocument();
    }
  });

  it("renders share and mint buttons", async () => {
    await renderResultPage();
    expect(screen.getByRole("button", { name: /^X$/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ins/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /铸造 NFT/ })).toBeInTheDocument();
  });
});
