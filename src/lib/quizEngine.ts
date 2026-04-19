import type { Question, QuestionGroup } from "./types";

const ALL_GROUPS: QuestionGroup[] = [
  "FOMO_IMPULSE",
  "CONVICTION_DIAMOND",
  "TIMING",
  "COPIUM",
  "CURIOSITY_MINT",
];

/**
 * Randomly pick one element from an array.
 */
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Fisher-Yates shuffle (in-place).
 */
function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Select 8 questions from the bank:
 * 1. Group questions by QuestionGroup
 * 2. Pick 1 from each of 5 groups (guaranteeing full coverage)
 * 3. Pick 3 more from remaining pool to reach 8 total
 * 4. Shuffle and return
 */
export function selectQuestions(bank: Question[]): Question[] {
  // Group questions by QuestionGroup
  const groups: Record<string, Question[]> = {};
  for (const group of ALL_GROUPS) {
    groups[group] = [];
  }
  for (const q of bank) {
    if (groups[q.group]) {
      groups[q.group].push(q);
    }
  }

  const selected: Question[] = [];
  const selectedIds = new Set<string>();

  // Step 1: Pick 1 from each of 5 groups
  for (const group of ALL_GROUPS) {
    const groupQuestions = groups[group];
    if (groupQuestions.length > 0) {
      const picked = randomPick(groupQuestions);
      selected.push(picked);
      selectedIds.add(picked.id);
    }
  }

  // Step 2: Pick 3 more from remaining pool
  const remaining = bank.filter((q) => !selectedIds.has(q.id));
  const shuffledRemaining = shuffle(remaining);
  const extra = shuffledRemaining.slice(0, 3);
  selected.push(...extra);

  // Step 3: Shuffle and return
  return shuffle(selected);
}
