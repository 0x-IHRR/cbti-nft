import { create } from "zustand";
import type {
  Question,
  Answer,
  DimensionScores,
  Archetype,
} from "@/lib/types";

export interface CBTIStore {
  // 答题状态
  questions: Question[];
  currentIndex: number;
  answers: Answer[];

  // 分数与结果
  scores: DimensionScores | null;
  archetype: Archetype | null;

  // 钱包
  walletAddress: string | null;
  calibrated: boolean;

  // 操作方法
  setQuestions: (questions: Question[]) => void;
  submitAnswer: (answer: Answer) => void;
  nextQuestion: () => void;
  setScores: (scores: DimensionScores) => void;
  setArchetype: (archetype: Archetype) => void;
  setWallet: (address: string) => void;
  setCalibratedScores: (scores: DimensionScores) => void;
  reset: () => void;
}

const initialState = {
  questions: [] as Question[],
  currentIndex: 0,
  answers: [] as Answer[],
  scores: null as DimensionScores | null,
  archetype: null as Archetype | null,
  walletAddress: null as string | null,
  calibrated: false,
};

export const useCBTIStore = create<CBTIStore>((set) => ({
  ...initialState,

  setQuestions: (questions) => set({ questions }),

  submitAnswer: (answer) =>
    set((state) => ({ answers: [...state.answers, answer] })),

  nextQuestion: () =>
    set((state) => ({ currentIndex: state.currentIndex + 1 })),

  setScores: (scores) => set({ scores }),

  setArchetype: (archetype) => set({ archetype }),

  setWallet: (address) => set({ walletAddress: address }),

  setCalibratedScores: (scores) => set({ scores, calibrated: true }),

  reset: () => set({ ...initialState }),
}));
