import { describe, it, expect, beforeEach } from "vitest";
import { useCBTIStore } from "@/store/cbtiStore";
import type { Question, Answer, DimensionScores, Archetype } from "@/lib/types";

const mockQuestions: Question[] = [
  {
    id: "q01",
    text: "Test question 1",
    group: "FOMO_IMPULSE",
    options: [
      { id: "a", text: "Option A" },
      { id: "b", text: "Option B" },
    ],
    strongMatch: "IM",
    secondaryMatch: "CU",
  },
  {
    id: "q02",
    text: "Test question 2",
    group: "CONVICTION_DIAMOND",
    options: [
      { id: "a", text: "Option A" },
      { id: "b", text: "Option B" },
    ],
    strongMatch: "CV",
    secondaryMatch: "TM",
  },
];

const mockAnswer: Answer = { questionId: "q01", optionId: "a" };

const mockScores: DimensionScores = { CV: 5, TM: 3, IM: 7, CP: 2, CU: 4 };

const mockArchetype: Archetype = {
  name: "FOMO King",
  cnName: "急急国王",
  oneLiner: "别人还在看K线，你已经All in了三个项目。",
  diagnosis: "Test diagnosis",
  evidence: ["Evidence 1", "Evidence 2", "Evidence 3"],
};

describe("CBTIStore", () => {
  beforeEach(() => {
    useCBTIStore.getState().reset();
  });

  it("initializes with correct default state", () => {
    const state = useCBTIStore.getState();
    expect(state.questions).toEqual([]);
    expect(state.currentIndex).toBe(0);
    expect(state.answers).toEqual([]);
    expect(state.scores).toBeNull();
    expect(state.archetype).toBeNull();
    expect(state.walletAddress).toBeNull();
    expect(state.calibrated).toBe(false);
  });

  it("setQuestions stores questions", () => {
    useCBTIStore.getState().setQuestions(mockQuestions);
    expect(useCBTIStore.getState().questions).toEqual(mockQuestions);
    expect(useCBTIStore.getState().questions).toHaveLength(2);
  });

  it("submitAnswer adds answer to array", () => {
    useCBTIStore.getState().submitAnswer(mockAnswer);
    expect(useCBTIStore.getState().answers).toEqual([mockAnswer]);

    const secondAnswer: Answer = { questionId: "q02", optionId: "b" };
    useCBTIStore.getState().submitAnswer(secondAnswer);
    expect(useCBTIStore.getState().answers).toEqual([mockAnswer, secondAnswer]);
  });

  it("nextQuestion increments currentIndex", () => {
    expect(useCBTIStore.getState().currentIndex).toBe(0);
    useCBTIStore.getState().nextQuestion();
    expect(useCBTIStore.getState().currentIndex).toBe(1);
    useCBTIStore.getState().nextQuestion();
    expect(useCBTIStore.getState().currentIndex).toBe(2);
  });

  it("setScores persists dimension scores", () => {
    useCBTIStore.getState().setScores(mockScores);
    expect(useCBTIStore.getState().scores).toEqual(mockScores);
  });

  it("setArchetype persists archetype data", () => {
    useCBTIStore.getState().setArchetype(mockArchetype);
    expect(useCBTIStore.getState().archetype).toEqual(mockArchetype);
  });

  it("setWallet stores wallet address", () => {
    const address = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
    useCBTIStore.getState().setWallet(address);
    expect(useCBTIStore.getState().walletAddress).toBe(address);
  });

  it("setCalibratedScores updates scores and sets calibrated to true", () => {
    const calibratedScores: DimensionScores = { CV: 6, TM: 4, IM: 8, CP: 2, CU: 5 };
    useCBTIStore.getState().setCalibratedScores(calibratedScores);
    expect(useCBTIStore.getState().scores).toEqual(calibratedScores);
    expect(useCBTIStore.getState().calibrated).toBe(true);
  });

  it("reset clears all state to initial values", () => {
    // Set some state first
    useCBTIStore.getState().setQuestions(mockQuestions);
    useCBTIStore.getState().submitAnswer(mockAnswer);
    useCBTIStore.getState().nextQuestion();
    useCBTIStore.getState().setScores(mockScores);
    useCBTIStore.getState().setArchetype(mockArchetype);
    useCBTIStore.getState().setWallet("someAddress");
    useCBTIStore.getState().setCalibratedScores(mockScores);

    // Reset
    useCBTIStore.getState().reset();

    const state = useCBTIStore.getState();
    expect(state.questions).toEqual([]);
    expect(state.currentIndex).toBe(0);
    expect(state.answers).toEqual([]);
    expect(state.scores).toBeNull();
    expect(state.archetype).toBeNull();
    expect(state.walletAddress).toBeNull();
    expect(state.calibrated).toBe(false);
  });

  it("navigation (nextQuestion) does not make server requests (pure client state)", () => {
    // This test verifies that nextQuestion is a pure state update
    // by checking it works synchronously without any async operations
    useCBTIStore.getState().setQuestions(mockQuestions);

    const indexBefore = useCBTIStore.getState().currentIndex;
    useCBTIStore.getState().nextQuestion();
    const indexAfter = useCBTIStore.getState().currentIndex;

    expect(indexAfter).toBe(indexBefore + 1);
    // Questions remain unchanged — no refetch
    expect(useCBTIStore.getState().questions).toEqual(mockQuestions);
  });
});
