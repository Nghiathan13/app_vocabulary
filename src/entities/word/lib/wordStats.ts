import { WordWithId } from "../model/types";

export const MAX_LEVEL = 6;
export const WRONG_COUNT_THRESHOLD = 5;

export const getLevelDistribution = (words: WordWithId[]) =>
  Array.from({ length: MAX_LEVEL + 1 }, (_, level) => ({
    level,
    count: words.filter((word) =>
      level === MAX_LEVEL ? word.level >= MAX_LEVEL : word.level === level,
    ).length,
  }));

export const getHighWrongCountWords = (words: WordWithId[]) =>
  words
    .filter((word) => word.wrong_count >= WRONG_COUNT_THRESHOLD)
    .sort((a, b) => {
      if (b.wrong_count !== a.wrong_count) {
        return b.wrong_count - a.wrong_count;
      }

      return a.word.localeCompare(b.word);
    })
    .slice(0, 8);

export const getDueCount = (words: WordWithId[], today: string): number =>
  words.filter((word) => word.next_review && word.next_review <= today).length;

export const getMasteredCount = (words: WordWithId[]): number =>
  words.filter((word) => word.level >= MAX_LEVEL).length;

export const getDueReviewWords = (words: WordWithId[], today: string) =>
  words
    .filter((word) => word.next_review && word.next_review <= today)
    .sort((a, b) => (a.next_review ?? "").localeCompare(b.next_review ?? ""));
